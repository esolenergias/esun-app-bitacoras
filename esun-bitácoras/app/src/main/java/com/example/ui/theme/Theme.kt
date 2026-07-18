package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val HighContrastLightColorScheme = lightColorScheme(
    primary = ConnectedBlue,
    onPrimary = PureWhite,
    primaryContainer = PrimaryContainerBlue,
    onPrimaryContainer = PureWhite,
    secondary = SolarAmber,
    onSecondary = SlateDeep,
    tertiary = EsolOrange,
    background = SlateBg,
    onBackground = SlateDeep,
    surface = PureWhite,
    onSurface = SlateDeep,
    surfaceVariant = LightGrayBg,
    onSurfaceVariant = OnSurfaceVariant,
    outline = SubtleOutline
)

private val DarkColorScheme = darkColorScheme(
    primary = SolarAmber,
    onPrimary = SlateDeep,
    primaryContainer = DarkSlateAccent,
    onPrimaryContainer = PureWhite,
    secondary = ConnectedBlue,
    onSecondary = PureWhite,
    background = SlateDeep,
    onBackground = PureWhite,
    surface = DarkSlateAccent,
    onSurface = PureWhite,
    surfaceVariant = DarkSlateAccent,
    onSurfaceVariant = LightGrayBg,
    outline = ConnectedBlue
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    // We prioritize High Contrast Light Theme for direct sunlight,
    // but fall back to a robust dark theme if the user explicitly prefers dark.
    val colorScheme = if (darkTheme) {
        DarkColorScheme
    } else {
        HighContrastLightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
