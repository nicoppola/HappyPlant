package com.example.happyplantandroid.ui

data class PlantUiState(
    val plantData: List<PlantData> = listOf(),
    val refreshPlantData: () -> Unit = {},
    val isLoading: Boolean = true,
)