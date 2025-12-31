// ==========================================
// Ponto Game - Bottom Navigation Bar
// ==========================================

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    I18nManager,
    Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

// Force RTL
I18nManager.forceRTL(true);

type TabName = 'profile' | 'play' | 'settings';

interface BottomNavBarProps {
    activeTab: TabName;
    onTabPress: (tab: TabName) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
    activeTab,
    onTabPress,
}) => {
    // Animation values for each tab
    const settingsScale = useRef(new Animated.Value(activeTab === 'settings' ? 1.1 : 1)).current;
    const profileScale = useRef(new Animated.Value(activeTab === 'profile' ? 1.1 : 1)).current;
    const playScale = useRef(new Animated.Value(1)).current;

    // Animate on tab change
    useEffect(() => {
        Animated.parallel([
            Animated.spring(settingsScale, {
                toValue: activeTab === 'settings' ? 1.1 : 1,
                useNativeDriver: true,
                friction: 5,
            }),
            Animated.spring(profileScale, {
                toValue: activeTab === 'profile' ? 1.1 : 1,
                useNativeDriver: true,
                friction: 5,
            }),
        ]).start();
    }, [activeTab]);

    const handlePlayPress = () => {
        Animated.sequence([
            Animated.spring(playScale, {
                toValue: 0.9,
                useNativeDriver: true,
                friction: 3,
            }),
            Animated.spring(playScale, {
                toValue: 1,
                useNativeDriver: true,
                friction: 3,
            }),
        ]).start();
        onTabPress('play');
    };

    return (
        <View style={styles.container}>
            <View style={styles.navContent}>
                {/* Profile Tab (Right side in RTL) */}
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => onTabPress('profile')}
                    activeOpacity={0.7}
                >
                    <Animated.View style={[
                        styles.tabIconContainer,
                        activeTab === 'profile' && styles.tabIconContainerActive,
                        { transform: [{ scale: profileScale }] },
                    ]}>
                        <Ionicons
                            name={activeTab === 'profile' ? 'person' : 'person-outline'}
                            size={28}
                            color={activeTab === 'profile' ? COLORS.primary : COLORS.textSlate}
                        />
                    </Animated.View>
                    <Text style={[
                        styles.tabLabel,
                        activeTab === 'profile' && styles.tabLabelActive,
                    ]}>
                        بروفايلي
                    </Text>
                </TouchableOpacity>

                {/* Play Tab (Center - Elevated) */}
                <TouchableOpacity
                    style={styles.centerTabItem}
                    onPress={handlePlayPress}
                    activeOpacity={0.8}
                >
                    <Animated.View style={[
                        styles.centerTabButton,
                        { transform: [{ scale: playScale }] },
                    ]}>
                        <MaterialCommunityIcons
                            name="soccer"
                            size={32}
                            color={COLORS.textPrimary}
                        />
                    </Animated.View>
                    <Text style={styles.centerTabLabel}>العب</Text>
                </TouchableOpacity>

                {/* Settings Tab (Left side in RTL) */}
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => onTabPress('settings')}
                    activeOpacity={0.7}
                >
                    <Animated.View style={[
                        styles.tabIconContainer,
                        activeTab === 'settings' && styles.tabIconContainerActive,
                        { transform: [{ scale: settingsScale }] },
                    ]}>
                        <Ionicons
                            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
                            size={28}
                            color={activeTab === 'settings' ? COLORS.primary : COLORS.textSlate}
                        />
                    </Animated.View>
                    <Text style={[
                        styles.tabLabel,
                        activeTab === 'settings' && styles.tabLabelActive,
                    ]}>
                        الإعدادات
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: `${COLORS.backgroundDark}F2`,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    navContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.sm,
    },
    tabItem: {
        width: 64,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    tabIconContainer: {
        width: 48,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIconContainerActive: {
        backgroundColor: `${COLORS.primary}30`,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textSlate,
    },
    tabLabelActive: {
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    centerTabItem: {
        alignItems: 'center',
        marginTop: -32,
    },
    centerTabButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primary,
        borderWidth: 4,
        borderColor: COLORS.backgroundDark,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.lg,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.5,
    },
    centerTabLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textSlate,
        marginTop: 4,
    },
});

export default BottomNavBar;
