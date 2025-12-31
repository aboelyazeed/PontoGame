// ==========================================
// Ponto Game - Card Slot Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PlayerSlot, PlayerCard } from '../../types';
import CardComponent from './CardComponent';

interface CardSlotProps {
    slot: PlayerSlot;
    isOwner: boolean; // Is this the local player's slot
    isSelected?: boolean;
    onPress?: () => void;
    onCardPress?: () => void;
}

const CardSlotComponent: React.FC<CardSlotProps> = ({
    slot,
    isOwner,
    isSelected = false,
    onPress,
    onCardPress,
}) => {
    const { card, isLocked, index } = slot;

    if (isLocked) {
        return (
            <View style={[styles.slot, styles.lockedSlot]}>
                <Text style={styles.lockedText}>🔒</Text>
                <Text style={styles.lockedLabel}>مغلق</Text>
            </View>
        );
    }

    if (!card) {
        return (
            <TouchableOpacity
                style={[styles.slot, styles.emptySlot, isSelected && styles.selectedSlot]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <Text style={styles.emptyText}>+</Text>
                <Text style={styles.slotNumber}>{index + 1}</Text>
            </TouchableOpacity>
        );
    }

    // Determine if card should be shown face up or down
    const shouldShowCard = isOwner || card.isRevealed;

    return (
        <TouchableOpacity
            style={[styles.slot, isSelected && styles.selectedSlot]}
            onPress={onCardPress || onPress}
            activeOpacity={0.8}
        >
            <CardComponent
                card={card}
                isHidden={!shouldShowCard}
                isSelected={isSelected}
                size="small"
            />

            {/* Expelled indicator */}
            {card.isExpelled && (
                <View style={styles.expelledOverlay}>
                    <Text style={styles.expelledText}>🚫</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    slot: {
        width: 70,
        height: 94,
        margin: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptySlot: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    lockedSlot: {
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(255, 0, 0, 0.5)',
    },
    selectedSlot: {
        borderColor: '#FFD700',
        borderWidth: 3,
        borderStyle: 'solid',
        borderRadius: 10,
    },
    emptyText: {
        fontSize: 28,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    slotNumber: {
        position: 'absolute',
        bottom: 4,
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.3)',
    },
    lockedText: {
        fontSize: 24,
    },
    lockedLabel: {
        fontSize: 10,
        color: '#ff6666',
        marginTop: 4,
    },
    expelledOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expelledText: {
        fontSize: 32,
    },
});

export default CardSlotComponent;
