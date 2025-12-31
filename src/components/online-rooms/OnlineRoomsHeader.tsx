import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';

interface OnlineRoomsHeaderProps {
    onBack: () => void;
    onlineCount: number;
}

export const OnlineRoomsHeader: React.FC<OnlineRoomsHeaderProps> = ({ onBack, onlineCount }) => {
    return (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-forward" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>{onlineCount} متصل</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ade80', // accent-green
    },
    onlineText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
});
