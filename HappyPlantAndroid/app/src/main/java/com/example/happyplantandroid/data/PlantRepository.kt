package com.example.happyplantandroid.data

import com.example.happyplantandroid.ui.HistoricalDataUiState
import com.example.happyplantandroid.ui.PlantData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.invoke

class PlantRepository(private val influxDbService: InfluxDbService) {

    private val _conditions: MutableStateFlow<DataStatus<List<PlantData>>> = MutableStateFlow(
        DataStatus.Success(
            listOf(PlantData())
        )
    )
    val conditions: StateFlow<DataStatus<List<PlantData>>> = _conditions.asStateFlow()

    suspend fun fetchConditions(): DataStatus<List<PlantData>> {
        return (Dispatchers.IO){
            _conditions.emit(DataStatus.Loading())
            _conditions.emit(DataStatus.Success(influxDbService.getLatest()))
            conditions.value
        }
//        return (Dispatchers.IO) {
//            listOf(
//                PlantUiModel("Bedroom", "40%", "74°"),
//                PlantUiModel("Office", "32%", "68°"),
//                PlantUiModel("Kitchen", "38%", "71°")
//            )
//        }
    }

    suspend fun fetchHistoricalConditions(): HistoricalDataUiState {
        return HistoricalDataUiState()
    }
}