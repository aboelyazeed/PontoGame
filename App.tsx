// ==========================================
// Ponto Game - Main App
// ==========================================

import React, { useState, useCallback } from 'react';
import { I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import {
    SplashScreen,
    AuthScreen,
    MainMenuScreen,
    ProfileScreen,
    SettingsScreen,
    GameModeScreen,
    GamePlayScreen,
    GameOverScreen,
} from './src/screens';
import { COLORS } from './src/constants/theme';
import { useAuthStore } from './src/store/authStore';

// Force RTL for Arabic
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

// Navigation types
type RootStackParamList = {
    Splash: undefined;
    Auth: undefined;
    MainMenu: undefined;
    Profile: undefined;
    Settings: undefined;
    GameMode: undefined;
    GamePlay: undefined;
    GameOver: {
        winnerName: string;
        player1Name: string;
        player1Score: number;
        player2Name: string;
        player2Score: number;
        isLocalPlayerWinner: boolean;
    };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
    const [showSplash, setShowSplash] = useState(true);
    const { isAuthenticated, isLoading, loadUser } = useAuthStore();

    // Load user on app start
    React.useEffect(() => {
        loadUser();
    }, []);

    const handleSplashFinish = useCallback(() => {
        setShowSplash(false);
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                {showSplash ? (
                    <SplashScreen onFinish={handleSplashFinish} />
                ) : (
                    <NavigationContainer>
                        <Stack.Navigator
                            initialRouteName={isAuthenticated ? "MainMenu" : "Auth"}
                            screenOptions={{
                                headerShown: false,
                                cardStyle: { backgroundColor: COLORS.backgroundDark },
                            }}
                        >
                            {/* Auth Screen */}
                            <Stack.Screen name="Auth">
                                {({ navigation }) => (
                                    <AuthScreen
                                        onAuthSuccess={() => navigation.reset({
                                            index: 0,
                                            routes: [{ name: 'MainMenu' }],
                                        })}
                                    />
                                )}
                            </Stack.Screen>

                            <Stack.Screen name="MainMenu">
                                {({ navigation }) => (
                                    <MainMenuScreen
                                        onPlayLocal={() => navigation.navigate('GameMode')}
                                        onProfile={() => navigation.navigate('Profile')}
                                        onSettings={() => navigation.navigate('Settings')}
                                    />
                                )}
                            </Stack.Screen>

                            <Stack.Screen name="Profile">
                                {({ navigation }) => (
                                    <ProfileScreen
                                        onBack={() => navigation.goBack()}
                                        onLogout={() => navigation.reset({
                                            index: 0,
                                            routes: [{ name: 'Auth' }],
                                        })}
                                        onNavigate={(screen) => {
                                            if (screen === 'play') {
                                                navigation.navigate('GameMode');
                                            } else if (screen === 'settings') {
                                                navigation.navigate('Settings');
                                            }
                                        }}
                                    />
                                )}
                            </Stack.Screen>

                            <Stack.Screen name="Settings">
                                {({ navigation }) => (
                                    <SettingsScreen
                                        onBack={() => navigation.goBack()}
                                        onNavigate={(screen) => {
                                            if (screen === 'play') {
                                                navigation.navigate('GameMode');
                                            } else if (screen === 'profile') {
                                                navigation.navigate('Profile');
                                            }
                                        }}
                                    />
                                )}
                            </Stack.Screen>

                            <Stack.Screen name="GameMode">
                                {({ navigation }) => (
                                    <GameModeScreen
                                        onBack={() => navigation.goBack()}
                                        onStartGame={(mode) => {
                                            navigation.navigate('GamePlay');
                                        }}
                                    />
                                )}
                            </Stack.Screen>

                            <Stack.Screen name="GamePlay">
                                {({ navigation }) => (
                                    <GamePlayScreen
                                        onBack={() => navigation.goBack()}
                                        onEndTurn={() => {
                                            // TODO: Handle end turn
                                        }}
                                        onAttack={() => {
                                            // TODO: Handle attack
                                        }}
                                    />
                                )}
                            </Stack.Screen>

                            <Stack.Screen name="GameOver">
                                {({ navigation, route }) => (
                                    <GameOverScreen
                                        {...route.params}
                                        onPlayAgain={() => navigation.replace('GamePlay')}
                                        onMainMenu={() => navigation.navigate('MainMenu')}
                                    />
                                )}
                            </Stack.Screen>
                        </Stack.Navigator>
                    </NavigationContainer>
                )}
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
