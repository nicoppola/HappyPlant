#!/usr/bin/env bash
set -euo pipefail

# HappyPlant Pi Setup Script
# Run on a fresh Raspberry Pi 4 (64-bit) with: sudo bash setup/pi-setup.sh
# Assumes the repo is already cloned and this script is at <repo>/setup/pi-setup.sh

INSTALL_DIR="/opt/happyplant"
ENV_FILE="/etc/happyplant.env"
SERVICE_FILE="/etc/systemd/system/happyplant.service"
SERVICE_USER="happyplant"
GO_VERSION="1.22.5"

# --- Helpers ---

info()  { echo -e "\n\033[1;34m==>\033[0m \033[1m$*\033[0m"; }
ok()    { echo -e "\033[1;32m  ✓\033[0m $*"; }
fail()  { echo -e "\033[1;31m  ✗ $*\033[0m" >&2; exit 1; }

# Must run as root
[[ $EUID -eq 0 ]] || fail "This script must be run as root (sudo bash $0)"

# Find repo root (parent of setup/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

[[ -f "$REPO_DIR/Happy_Plant_Server/main.go" ]] || fail "Cannot find repo. Expected main.go at $REPO_DIR/Happy_Plant_Server/main.go"

# ============================================================
# 1. System updates
# ============================================================
# Clean up any leftover InfluxData apt repo from a previous run
rm -f /etc/apt/sources.list.d/influxdata.list /etc/apt/trusted.gpg.d/influxdata.gpg

info "Updating system packages"
apt update && apt upgrade -y
ok "System updated"

# ============================================================
# 2. Install InfluxDB 2.x
# ============================================================
info "Installing InfluxDB 2"

INFLUX_VERSION="2.7.11"
INFLUX_CLI_VERSION="2.7.5"

if command -v influxd &>/dev/null; then
    ok "InfluxDB server already installed, skipping"
else
    INFLUX_DEB="influxdb2_${INFLUX_VERSION}-1_arm64.deb"
    curl -sfLO "https://dl.influxdata.com/influxdb/releases/${INFLUX_DEB}"
    [[ -s "$INFLUX_DEB" ]] || fail "Failed to download InfluxDB server .deb"
    dpkg -i "$INFLUX_DEB" || apt install -f -y
    rm -f "$INFLUX_DEB"
    ok "InfluxDB server $INFLUX_VERSION installed"
fi

if command -v influx &>/dev/null; then
    ok "InfluxDB CLI already installed, skipping"
else
    INFLUX_CLI_TAR="influxdb2-client-${INFLUX_CLI_VERSION}-linux-arm64.tar.gz"
    curl -sfLO "https://dl.influxdata.com/influxdb/releases/${INFLUX_CLI_TAR}"
    [[ -s "$INFLUX_CLI_TAR" ]] || fail "Failed to download InfluxDB CLI"
    tar -xzf "$INFLUX_CLI_TAR"
    mv influx /usr/local/bin/
    rm -f "$INFLUX_CLI_TAR"
    ok "InfluxDB CLI $INFLUX_CLI_VERSION installed"
fi

systemctl enable --now influxdb
ok "InfluxDB service enabled"

# Wait for InfluxDB to be ready
for i in $(seq 1 10); do
    curl -sf http://localhost:8086/health &>/dev/null && break
    sleep 1
done
curl -sf http://localhost:8086/health &>/dev/null || fail "InfluxDB did not start"
ok "InfluxDB is healthy"

# Initial setup — use the HTTP API to check if already set up
SETUP_CHECK=$(curl -sf http://localhost:8086/api/v2/setup || echo '{}')
ALREADY_SETUP=$(echo "$SETUP_CHECK" | grep -o '"allowed":false' || true)

if [[ -n "$ALREADY_SETUP" ]]; then
    ok "InfluxDB already configured, skipping setup"
    INFLUX_TOKEN=$(influx auth list --json 2>/dev/null | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    if [[ -z "$INFLUX_TOKEN" ]]; then
        echo "  Could not auto-detect existing token."
        read -rp "  Enter your InfluxDB API token: " INFLUX_TOKEN
    fi
else
    info "Setting up InfluxDB"
    echo "Choose a password for the InfluxDB admin user (username: happyplant):"
    read -rsp "  Password: " INFLUX_PASSWORD
    echo
    read -rsp "  Confirm:  " INFLUX_PASSWORD_CONFIRM
    echo

    [[ "$INFLUX_PASSWORD" == "$INFLUX_PASSWORD_CONFIRM" ]] || fail "Passwords do not match"
    [[ ${#INFLUX_PASSWORD} -ge 8 ]] || fail "Password must be at least 8 characters"

    # Use the HTTP API for initial setup
    SETUP_RESPONSE=$(curl -sf -X POST http://localhost:8086/api/v2/setup \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"happyplant\",
            \"password\": \"$INFLUX_PASSWORD\",
            \"org\": \"Home\",
            \"bucket\": \"happyplant\",
            \"retentionPeriodSeconds\": 0
        }") || fail "InfluxDB setup API call failed"

    ok "InfluxDB configured (user: happyplant, org: Home, bucket: happyplant)"

    # Extract token from the setup response
    INFLUX_TOKEN=$(echo "$SETUP_RESPONSE" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

    if [[ -z "$INFLUX_TOKEN" ]]; then
        echo "  Could not extract token from setup response."
        echo "  Run 'influx auth list' to find it, then update $ENV_FILE"
        INFLUX_TOKEN="REPLACE_ME"
    fi
fi

ok "InfluxDB token captured"

# ============================================================
# 3. Install Go
# ============================================================
info "Installing Go $GO_VERSION"

if command -v /usr/local/go/bin/go &>/dev/null; then
    INSTALLED_GO=$(/usr/local/go/bin/go version | awk '{print $3}' | sed 's/go//')
    ok "Go already installed (v$INSTALLED_GO), skipping"
else
    GO_TAR="go${GO_VERSION}.linux-arm64.tar.gz"
    curl -sLO "https://go.dev/dl/$GO_TAR"
    rm -rf /usr/local/go
    tar -C /usr/local -xzf "$GO_TAR"
    rm -f "$GO_TAR"
    ok "Go $GO_VERSION installed"
fi

export PATH="/usr/local/go/bin:$PATH"

# ============================================================
# 4. Install Node.js 20 LTS
# ============================================================
info "Installing Node.js 20"

if command -v node &>/dev/null; then
    NODE_VER=$(node --version)
    ok "Node.js already installed ($NODE_VER), skipping"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    ok "Node.js $(node --version) installed"
fi

# ============================================================
# 5. Build from repo
# ============================================================
info "Building Go server"
cd "$REPO_DIR/Happy_Plant_Server"
/usr/local/go/bin/go mod tidy
/usr/local/go/bin/go build -o happyplant-server .
ok "Go server built"

info "Building dashboard"
cd "$REPO_DIR/Happy_Plant_Dashboard"
npm install --production=false
npm run build
ok "Dashboard built"

# ============================================================
# 6. Install to /opt/happyplant
# ============================================================
info "Installing to $INSTALL_DIR"

mkdir -p "$INSTALL_DIR/static"

cp "$REPO_DIR/Happy_Plant_Server/happyplant-server" "$INSTALL_DIR/"
cp -r "$REPO_DIR/Happy_Plant_Dashboard/out/." "$INSTALL_DIR/static/"

ok "Binary and dashboard installed"

# ============================================================
# 7. Create system user
# ============================================================
info "Creating system user '$SERVICE_USER'"

if id "$SERVICE_USER" &>/dev/null; then
    ok "User '$SERVICE_USER' already exists"
else
    useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_USER"
    ok "User '$SERVICE_USER' created"
fi

chown -R "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR"

# ============================================================
# 8. Create environment file
# ============================================================
info "Writing $ENV_FILE"

cat > "$ENV_FILE" <<EOF
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=$INFLUX_TOKEN
INFLUXDB_ORG=Home
INFLUXDB_BUCKET=happyplant
PORT=8080
STATIC_DIR=$INSTALL_DIR/static
EOF

chmod 640 "$ENV_FILE"
chown root:"$SERVICE_USER" "$ENV_FILE"
ok "Environment file created"

# ============================================================
# 9. Create systemd service
# ============================================================
info "Creating systemd service"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=HappyPlant Server
After=network.target influxdb.service
Requires=influxdb.service

[Service]
Type=simple
EnvironmentFile=$ENV_FILE
ExecStart=$INSTALL_DIR/happyplant-server
WorkingDirectory=$INSTALL_DIR
Restart=on-failure
RestartSec=5
User=$SERVICE_USER

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now happyplant
ok "Service created and started"

# ============================================================
# Done!
# ============================================================
PI_IP=$(hostname -I | awk '{print $1}')

echo
echo "============================================"
echo "  HappyPlant setup complete!"
echo "============================================"
echo
echo "  Dashboard:  http://$PI_IP:8080"
echo "  InfluxDB:   http://$PI_IP:8086"
echo
echo "  Services:"
echo "    systemctl status happyplant"
echo "    systemctl status influxdb"
echo
echo "  Logs:"
echo "    journalctl -u happyplant -f"
echo
echo "  Next step:"
echo "    Update SERVER_URL in your firmware's influxDbConfig.h to:"
echo "    #define SERVER_URL \"http://$PI_IP:8080\""
echo
