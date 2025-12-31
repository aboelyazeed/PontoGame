// ==========================================
// Ponto Game - Bottom Navigation Bar
// ==========================================

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    I18nManager,
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
    return (
        <View style={styles.container}>
            <View style={styles.navContent}>
                {/* Profile Tab */}
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => onTabPress('profile')}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.tabIconContainer,
                        activeTab === 'profile' && styles.tabIconContainerActive,
                    ]}>
                        <Ionicons
                            name={activeTab === 'profile' ? 'person' : 'person-outline'}
                            size={28}
                            color={activeTab === 'profile' ? COLORS.primary : COLORS.textSlate}
                        />
                    </View>
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
                    onPress={() => onTabPress('play')}
                    activeOpacity={0.8}
                >
                    <View style={styles.centerTabButton}>
                        <MaterialCommunityIcons
                            name="soccer"
                            size={32}
                            color={COLORS.textPrimary}
                        />
                    </View>
                    <Text style={styles.centerTabLabel}>العب</Text>
                </TouchableOpacity>

                {/* Settings Tab */}
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => onTabPress('settings')}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.tabIconContainer,
                        activeTab === 'settings' && styles.tabIconContainerActive,
                    ]}>
                        <Ionicons
                            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
                            size={28}
                            color={activeTab === 'settings' ? COLORS.primary : COLORS.textSlate}
                        />
                    </View>
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
