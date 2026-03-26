#include <Arduino.h>
#include <SparkFunHTU21D.h>
#include <Wire.h>
#include <I2CScanner.h>
#include "../include/utils.h"
#include "../include/testOled.h"
#include "../include/OledController.h"
#include "../include/influxDbConfig.h"
#include "../include/WiFiController.h"
#include "../include/config.h"

//if you use ESP8266-01 with not default SDA and SCL pins, define these 2 lines, else delete them
#define SDA_PIN 4	//D2
#define SCL_PIN 5	//D1

#define LED_ON LOW
#define LED_OFF HIGH

HTU21D sensor;
OledController *oled;
WifiController wifi;

#define ledPin 16
#define WIFI_RETRY_INTERVAL 20000

unsigned long lastWifiAttempt = 0;

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
}

void loop() {

  Serial.println();
  digitalWrite(ledPin, LED_OFF);

  float humidity = sensor.readHumidity();
  float temperature = sensor.readTemperature();

  float temperatureFarenheit = ToFahrenheit(temperature);
  bool connected = wifi.isConnected();

  oled->displayData(temperatureFarenheit, humidity, connected);

  if(connected){
    wifi.sendReading(temperatureFarenheit, humidity, DEVICE_ID);
  } else {
    Serial.println("No WiFi - skipping data send");
    if(millis() - lastWifiAttempt >= WIFI_RETRY_INTERVAL){
      Serial.println("Retrying WiFi...");
      lastWifiAttempt = millis();
      wifi.initWifi();
    }
  }

  delay(5000);

  // digitalWrite(ledPin, LED_ON);
  delay(300);

  // digitalWrite(ledPin, LED_OFF);
}
