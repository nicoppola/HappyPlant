#ifndef WIFI_CONTROLLER
#define WIFI_CONTROLLER

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266mDNS.h>

#include "config.h"
#include "secrets.h"

class WifiController{

  public:
  void initWifi(){
    Serial.println("Begin Wifi...");
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      Serial.println("WIFI connecting...");
      delay(500);
      attempts++;
    }

    if(WiFi.status() == WL_CONNECTED){
      Serial.println("");
      Serial.print("WiFi connected, ");
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
      MDNS.begin("happyplant");
    } else {
      Serial.println("WiFi connection failed, continuing without WiFi");
    }
  }

  boolean isConnected(){
    return WiFi.status() == WL_CONNECTED;
  }

  bool sendReading(float temperature, float humidity, const char* location) {
    WiFiClient wifiClient;
    HTTPClient http;

    http.begin(wifiClient, String(SERVER_URL) + "/api/readings");
    http.addHeader("Content-Type", "application/json");

    String body = "{\"location\":\"" + String(location) +
                  "\",\"temperature\":" + String(temperature, 1) +
                  ",\"humidity\":" + String(humidity, 1) + "}";

    int code = http.POST(body);
    http.end();

    if(code == 204){
      Serial.println("Reading sent successfully");
      return true;
    } else {
      Serial.print("Failed to send reading, HTTP code: ");
      Serial.println(code);
      return false;
    }
  }
};

#endif
