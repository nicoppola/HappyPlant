package com.example.happyplantandroid

import android.annotation.SuppressLint
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import com.example.happyplantandroid.data.InfluxDbService
import com.example.happyplantandroid.data.PlantRepository
import com.example.happyplantandroid.ui.PlantData
import com.example.happyplantandroid.ui.PlantUiState
import com.example.happyplantandroid.ui.TopBar
import com.example.happyplantandroid.ui.theme.HappyPlantAndroidTheme
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val mainViewModel = MainViewModel(PlantRepository(InfluxDbService()))
        setContent {
            HappyPlantAndroidTheme {
                PlantApp(mainViewModel)
            }
        }
    }
}

@SuppressLint("UnusedMaterial3ScaffoldPaddingParameter")
@Composable
fun PlantApp(viewModel: MainViewModel) {

    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = { TopBar() },
        content = {
            Box(
                modifier = Modifier.padding(it)
            ) {
                HomePageContent(uiState)
            }
        },
    )
}


@OptIn(ExperimentalMaterialApi::class)
@Composable
fun HomePageContent(
    uiState: PlantUiState
) {
    val pullRefreshState =
        rememberPullRefreshState(refreshing = uiState.isLoading,
            onRefresh = { uiState.refreshPlantData() })

    Box(
        Modifier
            .pullRefresh(pullRefreshState)
            .padding(top = 4.dp)
    ) {
        PullRefreshIndicator(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .zIndex(1F),
            refreshing = uiState.isLoading,
            state = pullRefreshState,
        )

        LazyColumn(
            state = rememberLazyListState()
        )
        {
            items(items = uiState.plantData) { condition ->
                ConditionCard(condition = condition)
            }
        }
    }
}

@Composable
fun ConditionCard(condition: PlantData) {
    Card(
        modifier = Modifier.padding(vertical = 4.dp, horizontal = 8.dp)
            .widthIn(max = 300.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(12.dp)
        ) {
            //Label
            Text(text = condition.location, style = MaterialTheme.typography.headlineSmall)

            Spacer(modifier = Modifier.weight(1F))

            //Temp & Humidity
            Column(
                modifier = Modifier
                    .padding(horizontal = 12.dp)
            ) {
                Text(
                    text = condition.temperature,
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = condition.humidity,
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        }
    }
}


@Composable
fun LoadingContent() {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator()
    }
}

@Preview
@Composable
fun PlantContentPreview() {
    HappyPlantAndroidTheme {
        Surface(modifier = Modifier.height(600.dp)) {
            HomePageContent(
                PlantUiState(
                    plantData = listOf(
                        PlantData("Bedroom", "45%", "75°"),
                        PlantData("Office", "30%", "66°"),
                        PlantData("Kitchen", "36%", "68°")
                    ),
                    refreshPlantData = {},
                    isLoading = false
                )
            )
        }
    }
}