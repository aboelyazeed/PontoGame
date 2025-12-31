// ==========================================
// Ponto Game - Game Board Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PlayerState } from '../../types';
import { CardSlotComponent } from '../cards';

interface PlayerFieldProps {
    player: PlayerState;
    isOwner: boolean;
    selectedSlotIndex: number | null;
    onSlotPress: (index: number) => void;
}

const PlayerField: React.FC<PlayerFieldProps> = ({
    player,
    isOwner,
    selectedSlotIndex,
    onSlotPress,
}) => {
    return (
        <View style={[styles.playerField, !isOwner && styles.opponentField]}>
            {/* Player Info */}
            <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreText}>⚽ {player.score}</Text>
                </View>
            </View>

            {/* Slots */}
            <View style={styles.slotsContainer}>
                {player.slots.map((slot) => (
                    <CardSlotComponent
                        key={slot.index}
                        slot={slot}
                        isOwner={isOwner}
                        isSelected={selectedSlotIndex === slot.index}
                        onPress={() => onSlotPress(slot.index)}
                        onCardPress={() => onSlotPress(slot.index)}
                    />
                ))}
            </View>
        </View>
    );
};

interface GameBoardProps {
    player1: PlayerState;
    player2: PlayerState;
    localPlayerId: string;
    selectedSlotIndex: number | null;
    onSlotPress: (playerId: string, slotIndex: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
    player1,
    player2,
    localPlayerId,
    selectedSlotIndex,
    onSlotPress,
}) => {
    const isPlayer1Local = player1.id === localPlayerId;
    const localPlayer = isPlayer1Local ? player1 : player2;
    const opponent = isPlayer1Local ? player2 : player1;

    return (
        <View style={styles.gameBoard}>
            {/* Opponent's Field (Top) */}
            <PlayerField
                player={opponent}
                isOwner={false}
                selectedSlotIndex={null}
                onSlotPress={(index) => onSlotPress(opponent.id, index)}
            />

            {/* Center Field Divider */}
            <View style={styles.centerLine}>
                <View style={styles.centerCircle}>
                    <Text style={styles.centerText}>⚽</Text>
                </View>
            </View>

            {/* Local Player's Field (Bottom) */}
            <PlayerField
                player={localPlayer}
                isOwner={true}
                selectedSlotIndex={selectedSlotIndex}
                onSlotPress={(index) => onSlotPress(localPlayer.id, index)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    gameBoard: {
        flex: 1,
        backgroundColor: '#2d5016', // Football field green
        paddingVertical: 10,
    },
    playerField: {
        flex: 1,
        padding: 10,
    },
    opponentField: {
        transform: [{ rotate: '180deg' }],
    },
    playerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    playerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'right',
    },
    scoreContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    scoreText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    slotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    centerLine: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2d5016',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerText: {
        fontSize: 20,
    },
});

export default GameBoard;
