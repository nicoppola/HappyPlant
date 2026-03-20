package com.example.happyplantandroid.ui

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.example.happyplantandroid.ui.theme.HappyPlantAndroidTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TopBar() {
    TopAppBar(
        title = { Text("Happy Plant") },
        navigationIcon = {
            IconButton(onClick = {}) {
                Icon(Icons.Filled.Menu, "menuIcon")
            }
        },
        actions = {
            IconButton(onClick = {}) {
                Icon(Icons.Filled.Settings, "settingsIcon")
            }
        },
    )
}

@Preview
@Composable
fun TopBarPreview() {
    HappyPlantAndroidTheme {
        TopBar()
    }
}