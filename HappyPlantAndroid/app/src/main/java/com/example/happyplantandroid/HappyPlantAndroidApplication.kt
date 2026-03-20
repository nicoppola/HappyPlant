package com.example.happyplantandroid

import android.app.Application
import timber.log.Timber

class HappyPlantAndroidApplication: Application() {
    override fun onCreate() {
        super.onCreate()

        if(BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }
    }
}