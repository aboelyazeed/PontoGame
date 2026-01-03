import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { Room } from './types';

interface RoomCardProps {
    item: Room;
    onJoin: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ item, onJoin }) => {
    if (item.players >= item.maxPlayers) return null;

    const isPrivate = item.isPrivate;
    const cardStyle = isPrivate
        ? { borderColor: 'rgba(249, 115, 22, 0.2)', iconColor: '#F97316', bg: 'rgba(249, 115, 22, 0.1)', icon: 'lock-outline' }
        : { borderColor: 'rgba(59, 130, 246, 0.2)', iconColor: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', icon: 'trophy-outline' };

    return (
        <TouchableOpacity
            style={[styles.roomCard, { borderColor: cardStyle.borderColor }]}
            onPress={() => onJoin(item)}
            activeOpacity={0.7}
        >
            <View style={styles.roomInfo}>
                <View style={[styles.roomIconContainer, { backgroundColor: cardStyle.bg, borderColor: cardStyle.borderColor }]}>
                    <MaterialCommunityIcons name={cardStyle.icon as any} size={24} color={cardStyle.iconColor} />
                </View>
                <View>
                    <Text style={styles.roomTitle}>
                        {item.roomName || 'غرفة تحدي'}
                    </Text>
                    <View style={styles.roomMetaRow}>
                        <View style={styles.tagContainer}>
                            <Text style={styles.tagText}>{isPrivate ? 'خاص' : 'عام'}</Text>
                        </View>
                        <Text style={styles.hostText}>بواسطة: {item.hostName}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.roomStatus}>
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>انتظار</Text>
                </View>
                <Text style={styles.playersCount}>{item.players}/{item.maxPlayers}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    roomCard: {
        backgroundColor: '#162b16', // surface-dark
        borderRadius: 12,
        padding: SPACING.md,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    roomInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    roomIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roomTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 2,
        textAlign: 'left',
    },
    roomMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    tagContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
    hostText: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
    roomStatus: {
        alignItems: 'flex-end',
        gap: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(74, 222, 128, 0.1)', // accent-green/10
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4ade80',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4ade80',
    },
    playersCount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
        fontFamily: 'monospace',
    },
});
