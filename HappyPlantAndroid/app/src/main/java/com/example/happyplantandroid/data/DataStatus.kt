package com.example.happyplantandroid.data

sealed class DataStatus<T> {
    class Loading<T>: DataStatus<T>()
    class Error<T>: DataStatus<T>()
    class Success<T>(val data: T): DataStatus<T>()
}