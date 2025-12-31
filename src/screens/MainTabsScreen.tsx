// ==========================================
// Ponto Game - Main Tabs Screen (Swipeable)
// ==========================================

import React, { useRef, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import PagerView from 'react-native-pager-view';
import { BottomNavBar } from '../components/ui';
import { COLORS } from '../constants/theme';

// Import screen content components
import SettingsScreen from './SettingsScreen';
import MainMenuScreen from './MainMenuScreen';
import ProfileScreen from './ProfileScreen';

interface MainTabsScreenProps {
    onPlayGame: () => void;
    onLogout: () => void;
}

const MainTabsScreen: React.FC<MainTabsScreenProps> = ({
    onPlayGame,
    onLogout,
}) => {
    const pagerRef = useRef<PagerView>(null);
    const [currentPage, setCurrentPage] = useState(1); // Start on MainMenu (center)

    // Map page index to tab name
    const getTabName = (index: number): 'settings' | 'play' | 'profile' => {
        switch (index) {
            case 0: return 'settings';
            case 1: return 'play';
            case 2: return 'profile';
            default: return 'play';
        }
    };

    // Map tab name to page index
    const getPageIndex = (tab: 'settings' | 'play' | 'profile'): number => {
        switch (tab) {
            case 'settings': return 0;
            case 'play': return 1;
            case 'profile': return 2;
            default: return 1;
        }
    };

    const handleTabPress = (tab: 'settings' | 'play' | 'profile') => {
        const pageIndex = getPageIndex(tab);
        pagerRef.current?.setPage(pageIndex);
    };

    const handlePageSelected = (event: { nativeEvent: { position: number } }) => {
        setCurrentPage(event.nativeEvent.position);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />

            <PagerView
                ref={pagerRef}
                style={styles.pagerView}
                initialPage={1}
                onPageSelected={handlePageSelected}
            >
                {/* Page 0: Settings */}
                <View key="settings" style={styles.page}>
                    <SettingsScreen
                        onBack={() => pagerRef.current?.setPage(1)}
                        onNavigate={(screen) => {
                            if (screen === 'play') {
                                pagerRef.current?.setPage(1);
                            } else if (screen === 'profile') {
                                pagerRef.current?.setPage(2);
                            }
                        }}
                        hideBottomNav={true}
                    />
                </View>

                {/* Page 1: Main Menu (Play) */}
                <View key="play" style={styles.page}>
                    <MainMenuScreen
                        onPlayLocal={onPlayGame}
                        onProfile={() => pagerRef.current?.setPage(2)}
                        onSettings={() => pagerRef.current?.setPage(0)}
                        hideBottomNav={true}
                    />
                </View>

                {/* Page 2: Profile */}
                <View key="profile" style={styles.page}>
                    <ProfileScreen
                        onBack={() => pagerRef.current?.setPage(1)}
                        onLogout={onLogout}
                        onNavigate={(screen) => {
                            if (screen === 'play') {
                                pagerRef.current?.setPage(1);
                            } else if (screen === 'settings') {
                                pagerRef.current?.setPage(0);
                            }
                        }}
                        hideBottomNav={true}
                    />
                </View>
            </PagerView>

            {/* Shared Bottom Navigation */}
            <BottomNavBar
                activeTab={getTabName(currentPage)}
                onTabPress={handleTabPress}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
    },
    pagerView: {
        flex: 1,
    },
    page: {
        flex: 1,
    },
});

export default MainTabsScreen;
