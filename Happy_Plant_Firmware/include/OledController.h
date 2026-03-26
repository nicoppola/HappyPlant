#ifndef OLED_CONTROLLER
#define OLED_CONTROLLER

#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <U8g2lib.h>

enum DisplaySize {big, small};

#define OLED_RESET    -1 //Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C

class OledController{
public:
    virtual void initOled() = 0;
    virtual void displayData(float tmp, float humidity, bool wifiConnected) = 0;
};

class OledControllerBig: public OledController{
public:
    U8G2_SH1106_128X64_NONAME_F_HW_I2C display;

    OledControllerBig() : display(U8G2_R0, U8X8_PIN_NONE) {}

    virtual void initOled(){
        display.begin();
        Serial.println("init oled complete");
    }

    void drawWifiIcon(int cx, int cy, bool slash){
        for(int a = -45; a <= 45; a += 3){
            float rad = a * 3.14159f / 180.0f;
            int px = cx + (int)(10 * sinf(rad));
            int py = cy - (int)(10 * cosf(rad));
            display.drawPixel(px, py);
        }
        for(int a = -45; a <= 45; a += 4){
            float rad = a * 3.14159f / 180.0f;
            int px = cx + (int)(6 * sinf(rad));
            int py = cy - (int)(6 * cosf(rad));
            display.drawPixel(px, py);
        }
        display.drawDisc(cx, cy, 1);
        if(slash){
            display.drawLine(cx - 7, cy - 10, cx + 7, cy + 2);
        }
    }

    virtual void displayData(float tmp, float humidity, bool wifiConnected){
        display.clearBuffer();
        display.setFont(u8g2_font_profont22_tr);

        char buf[16];
        snprintf(buf, sizeof(buf), "%0.2f F", tmp);
        display.drawStr(8, 22, buf);

        snprintf(buf, sizeof(buf), "%0.2f %%", humidity);
        display.drawStr(8, 54, buf);

        drawWifiIcon(116, 14, !wifiConnected);

        display.sendBuffer();
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

    void drawWifiIcon(int cx, int cy, bool slash){
        display.drawCircle(cx, cy, 7, SSD1306_WHITE);
        display.drawCircle(cx, cy, 4, SSD1306_WHITE);
        display.fillRect(cx - 8, cy + 1, 17, 8, SSD1306_BLACK);
        display.fillCircle(cx, cy, 1, SSD1306_WHITE);
        if(slash){
            display.drawLine(cx - 5, cy - 8, cx + 5, cy + 2, SSD1306_WHITE);
        }
    }

    virtual void displayData(float tmp, float humidity, bool wifiConnected){
        display.clearDisplay();
        Serial.println("DISPLAY");

        display.setTextSize(2);
        display.setTextColor(SSD1306_WHITE);
        display.setCursor(25,0);
        display.printf("%0.2f F\n", tmp);
        display.setCursor(25,18);
        display.printf("%0.2f %%\n", humidity);

        drawWifiIcon(120, 9, !wifiConnected);

        display.display();
    }
};
#endif
