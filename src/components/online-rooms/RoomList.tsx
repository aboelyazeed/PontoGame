import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { Room } from './types';
import { RoomCard } from './RoomCard';

interface RoomListProps {
    rooms: Room[];
    isLoading: boolean;
    isRefreshing: boolean;
    onRefresh: () => void;
    onJoin: (room: Room) => void;
}

export const RoomList: React.FC<RoomListProps> = ({ rooms, isLoading, isRefreshing, onRefresh, onJoin }) => {
    return (
        <View style={styles.container}>
            {/* Rooms List Header */}
            <View style={styles.listHeader}>
                <View style={styles.listTitleRow}>
                    <MaterialIcons name="format-list-bulleted" size={20} color={COLORS.primary} />
                    <Text style={styles.listTitle}>الغرف المتاحة</Text>
                </View>
                <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                    <Ionicons name="refresh" size={16} color={COLORS.primary} />
                    <Text style={styles.refreshText}>تحديث</Text>
                </TouchableOpacity>
            </View>

            {/* Rooms List */}
            {isLoading && !isRefreshing ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={rooms}
                    renderItem={({ item }) => <RoomCard item={item} onJoin={onJoin} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>لا توجد غرف متاحة حالياً</Text>
                            <TouchableOpacity onPress={onRefresh}>
                                <Text style={styles.retryText}>حاول مرة أخرى</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
        paddingHorizontal: 4,
    },
    listTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    refreshText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    listContent: {
        gap: SPACING.md,
        paddingBottom: 100, // Space for bottom button
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    emptyText: {
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    retryText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});
