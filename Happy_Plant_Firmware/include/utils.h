#ifndef MAIN_UTILS
#define MAIN_UTILS

float ToFahrenheit(float celsius){
    return celsius * 1.8 + 32;
}

String ToCString(int integer){
    return std::to_string(integer).c_str();
}

String ToCString(float floatNum){
    return std::to_string(floatNum).c_str();
}

#endif