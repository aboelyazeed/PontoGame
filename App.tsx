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
    MainTabsScreen,
    GameModeScreen,
    OnlineRoomsScreen,
    GamePlayScreen,
    GameOverScreen,
} from './src/screens';
import { COLORS } from './src/constants/theme';
import { useAuthStore } from './src/store/authStore';
import { ToastProvider } from './src/context/ToastContext';

// Force RTL for Arabic
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

// Navigation types
type RootStackParamList = {
    Splash: undefined;
    Auth: undefined;
    MainTabs: undefined;
    GameMode: undefined;
    OnlineRooms: undefined;
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
                <ToastProvider>
                    {showSplash ? (
                        <SplashScreen onFinish={handleSplashFinish} />
                    ) : (
                        <NavigationContainer>
                            <Stack.Navigator
                                initialRouteName={isAuthenticated ? "MainTabs" : "Auth"}
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
                                                routes: [{ name: 'MainTabs' }],
                                            })}
                                        />
                                    )}
                                </Stack.Screen>

                                <Stack.Screen name="MainTabs">
                                    {({ navigation }) => (
                                        <MainTabsScreen
                                            onPlayGame={() => navigation.navigate('GameMode')}
                                            onLogout={() => navigation.reset({
                                                index: 0,
                                                routes: [{ name: 'Auth' }],
                                            })}
                                        />
                                    )}
                                </Stack.Screen>

                                <Stack.Screen name="GameMode">
                                    {({ navigation }) => (
                                        <GameModeScreen
                                            onBack={() => navigation.goBack()}
                                            onStartGame={(mode) => {
                                                if (mode === 'online') {
                                                    navigation.navigate('OnlineRooms');
                                                } else {
                                                    // Local game logic (future)
                                                    navigation.navigate('GamePlay');
                                                }
                                            }}
                                        />
                                    )}
                                </Stack.Screen>

                                <Stack.Screen name="OnlineRooms">
                                    {({ navigation }) => (
                                        <OnlineRoomsScreen
                                            onBack={() => navigation.goBack()}
                                            onJoinRoom={(roomId) => {
                                                navigation.navigate('GamePlay');
                                            }}
                                            onCreateRoom={(isPrivate) => {
                                                // Should eventually navigate to waiting room
                                                // For now, go to GamePlay as mock
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
                                            onMainMenu={() => navigation.navigate('MainTabs')}
                                        />
                                    )}
                                </Stack.Screen>
                            </Stack.Navigator>
                        </NavigationContainer>
                    )}
                </ToastProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
