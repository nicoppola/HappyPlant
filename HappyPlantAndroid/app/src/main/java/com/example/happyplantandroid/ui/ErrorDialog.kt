package com.example.happyplantandroid.ui

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import com.example.happyplantandroid.R
import com.example.happyplantandroid.ui.theme.HappyPlantAndroidTheme

@Composable
fun ErrorDialog(message: String) {
    val openDialog = remember { mutableStateOf(true) }
    if (openDialog.value) {
        AlertDialog(onDismissRequest = { openDialog.value = false },
            title = { Text(text = stringResource(R.string.error_dialog_title)) },
            text = { Text(message) },
            confirmButton = { openDialog.value = false })
    }
}

@Preview
@Composable
fun ErrorDialogPreview() {
    HappyPlantAndroidTheme {
        ErrorDialog(message = "This is a test error")
    }
}