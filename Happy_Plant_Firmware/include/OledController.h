#ifndef OLED_CONTROLLER
#define OLED_CONTROLLER

#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <U8x8lib.h>

enum DisplaySize {big, small};

#define OLED_RESET    -1 //Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C

class OledController{
public:
    virtual void initOled() = 0;
    virtual void displayData(float tmp, float humidity) = 0;
};

class OledControllerBig: public OledController{
public:
    U8X8_SH1106_128X64_NONAME_HW_I2C display;

    const uint8_t colLow = 4;
const uint8_t colHigh = 13;
const uint8_t rowCups = 0;
const uint8_t rowState = 2; // Double spacing the Rows
const uint8_t rowTemp = 4; // Double spacing the Rows
const uint8_t rowTime = 6; // Double spacing the Rows

    virtual void initOled(){
        display = U8X8_SH1106_128X64_NONAME_HW_I2C(OLED_RESET);
        display.begin();
        Serial.println("init oled complete");
    }
    
    virtual void displayData(float tmp, float humidity){
        display.setFont(u8x8_font_profont29_2x3_f);
        display.clear();
        display.setCursor(1,0);
        display.printf("%0.2f F\n", tmp);
        display.setCursor(1,4);
        display.printf("%0.2f %%\n", humidity);
    }

};

class OledControllerSmall: public OledController{
public:
    Adafruit_SSD1306 display;

    virtual void initOled(){
        Serial.println("Begin Oled...");
        display = Adafruit_SSD1306(128, 32, &Wire, OLED_RESET);

        if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
            Serial.println(F("SSD1306 allocation failed"));
            return;
        }

        // Show initial display buffer contents on the screen --
        // the library initializes this with an Adafruit splash screen.
        display.display();
        delay(2000);
        // Clear the buffer
        display.clearDisplay();
    }

    virtual void displayData(float tmp, float humidity){
        display.clearDisplay();
        Serial.println("DISPLAY");

        display.setTextSize(2);
        display.setTextColor(SSD1306_WHITE);
        display.setCursor(25,0);
        display.printf("%0.2f F\n", tmp);
        display.setCursor(25,18);
        display.printf("%0.2f %%\n", humidity);
        display.display();
    }
};
#endif