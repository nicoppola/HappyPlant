#ifndef WIFI_CONTROLLER
#define WIFI_CONTROLLER

#include <ESP8266WiFi.h>

#include <pb_common.h>
#include <pb.h>
#include <pb_encode.h>
#include <pb_decode.h>
#include "proto_bufs.pb.h"
#include "config.h"
#include "secrets.h"

const char* host     = RASPBERRY_PI_IP;
const short port  = 55555;

WiFiClient client;

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
    } else {
      Serial.println("WiFi connection failed, continuing without WiFi");
    }
  }

  boolean isConnected(){
    return WiFi.status() == WL_CONNECTED;
  }

  void sendTemp(pb_TempEvent e) {

    if (!client.connect(host, port)) {
      Serial.println("connection failed");
      Serial.println("wait 5 sec to reconnect...");
      delay(5000);
      return;
    }

    uint8_t buffer[pb_TempEvent_size];
    pb_ostream_t stream = pb_ostream_from_buffer(buffer, sizeof(buffer));
    
    if (!pb_encode(&stream, pb_TempEvent_fields, &e)){
      Serial.println("failed to encode temp proto");
      Serial.println(PB_GET_ERROR(&stream));
      return;
    }
    
    Serial.print("sending temp...");
    Serial.println(e.tempFar);
    client.write(buffer, stream.bytes_written);
  }
};

#endif