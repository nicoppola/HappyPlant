#include <Arduino.h>
#include <SparkFunHTU21D.h>
#include <ctime>
#include <string>
#include <Wire.h>
#include <I2CScanner.h>
#include "../include/utils.h"
#include "../include/testOled.h"
#include "../include/OledController.h"
#include "../include/WiFiController.h"
#include "../include/influxDbConfig.h"
#include "../include/config.h"

//if you use ESP8266-01 with not default SDA and SCL pins, define these 2 lines, else delete them	
#define SDA_PIN 4	//D2
#define SCL_PIN 5	//D1

#define LED_ON LOW
#define LED_OFF HIGH

HTU21D sensor;
OledController *oled;// = new OledControllerBig();
WifiController wifi;

Point point(MEASUREMENT);

#define ledPin 16

void verifyInfluxDb() {

  point.addTag("location", DEVICE_ID);

  // Accurate time is necessary for certificate validation and writing in batches
  // For the fastest time sync find NTP servers in your area: https://www.pool.ntp.org/zone/
  // Syncing progress and the time will be printed to Serial.
  timeSync(TZ_INFO, "pool.ntp.org", "time.nis.gov");

  // Check server connection
  if (influxClient.validateConnection()) {
      Serial.print("Connected to InfluxDB: ");
      Serial.println(influxClient.getServerUrl());
  } else {
      Serial.print("InfluxDB connection failed: ");
      Serial.println(influxClient.getLastErrorMessage());
  }

}

void setup() {
  Serial.begin(9600);
  Serial.println("Welcome to Happy Plant");
  Wire.begin(SDA_PIN, SCL_PIN);

  pinMode(ledPin, OUTPUT);

  if(currSize == big){
    oled = new OledControllerBig();
  } else {
    oled = new OledControllerSmall();
  }

  Serial.println("Begin Sensor...");

  sensor.begin();
  oled->initOled();
  wifi.initWifi();
  verifyInfluxDb();
}

void loop() {
  
  Serial.println();
  digitalWrite(ledPin, LED_OFF); 
  point.clearFields();

  float humidity = sensor.readHumidity();
  float temperature = sensor.readTemperature();

  float temperatureFarenheit = ToFahrenheit(temperature);
  
  oled->displayData(temperatureFarenheit, humidity);

  point.addField("humidity", humidity);
  point.addField("temperature", temperatureFarenheit);

  Serial.println(influxClient.pointToLineProtocol(point));

  if(!influxClient.writePoint(point)){
    Serial.print("InfluxDB write failed: ");
    Serial.println(influxClient.getLastErrorMessage());
  }

  if(!wifi.isConnected()){
    Serial.println("Lost Wifi Connection... Reconnecting...");
    wifi.initWifi();
  }

  delay(5000);

  // digitalWrite(ledPin, LED_ON);
  delay(300); 

  // digitalWrite(ledPin, LED_OFF); 
}