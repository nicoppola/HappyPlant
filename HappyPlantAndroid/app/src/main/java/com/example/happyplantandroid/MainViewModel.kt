package com.example.happyplantandroid

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.happyplantandroid.data.DataStatus
import com.example.happyplantandroid.data.PlantRepository
import com.example.happyplantandroid.ui.PlantData
import com.example.happyplantandroid.ui.PlantUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class MainViewModel(private val repository: PlantRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(PlantUiState())
    val uiState: StateFlow<PlantUiState> = _uiState.asStateFlow()

    init {
        fetchConditions()
        _uiState.update {
            it.copy(refreshPlantData = ::fetchConditions)
        }

        viewModelScope.launch {
            repository.conditions.collect { data: DataStatus<List<PlantData>> ->
                when (data) {
                    is DataStatus.Loading -> {
                        _uiState.update {
                            it.copy(isLoading = true)
                        }
                    }
                    is DataStatus.Success -> {
                        _uiState.update {
                            it.copy(isLoading = false,
                                plantData = data.data)
                        }
                    }
                    is DataStatus.Error -> {
                        _uiState.update {
                            it.copy(isLoading = false)
                            //todo error dialog
                        }
                    }
                }
            }
        }
    }

    private fun fetchConditions() {
        viewModelScope.launch {
            repository.fetchConditions()
        }
    }
}