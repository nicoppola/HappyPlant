#ifndef WIFI_CONTROLLER
#define WIFI_CONTROLLER

#include <ESP8266WiFi.h>

#include <pb_common.h>
#include <pb.h>
#include <pb_encode.h>
#include <pb_decode.h>
#include "proto_bufs.pb.h"
#include "config.h"

const char* ssid     = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";
const char* host     = RASPBERRY_PI_IP;
const short port  = 55555;

WiFiClient client;

class WifiController{

  public:
  void initWifi(){
    Serial.println("Begin Wifi...");
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
  
    while (WiFi.status() != WL_CONNECTED) {
      Serial.println("WIFI connection failed, reconnecting...");
      delay(5000);
    }

    Serial.println("");
    Serial.print("WiFi connected, ");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
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