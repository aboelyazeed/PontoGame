// ==========================================
// Ponto Game - Score Display Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ScoreDisplayProps {
    player1Name: string;
    player1Score: number;
    player2Name: string;
    player2Score: number;
    matchTimeElapsed: number; // in seconds
    maxMatchTime: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
    player1Name,
    player1Score,
    player2Name,
    player2Score,
    matchTimeElapsed,
    maxMatchTime,
}) => {
    const formatMatchTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const remainingTime = maxMatchTime - matchTimeElapsed;

    return (
        <View style={styles.container}>
            {/* Player 1 */}
            <View style={styles.playerScore}>
                <Text style={styles.playerName} numberOfLines={1}>
                    {player1Name}
                </Text>
                <Text style={styles.score}>{player1Score}</Text>
            </View>

            {/* Center - Match Time */}
            <View style={styles.centerSection}>
                <Text style={styles.vsText}>VS</Text>
                <View style={styles.matchTimeContainer}>
                    <Text style={styles.matchTimeLabel}>وقت المباراة</Text>
                    <Text style={styles.matchTime}>
                        {formatMatchTime(remainingTime)}
                    </Text>
                </View>
            </View>

            {/* Player 2 */}
            <View style={styles.playerScore}>
                <Text style={styles.playerName} numberOfLines={1}>
                    {player2Name}
                </Text>
                <Text style={styles.score}>{player2Score}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    playerScore: {
        flex: 1,
        alignItems: 'center',
    },
    playerName: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
        maxWidth: 80,
        textAlign: 'center',
    },
    score: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    centerSection: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    vsText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 4,
    },
    matchTimeContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    matchTimeLabel: {
        fontSize: 8,
        color: '#666',
    },
    matchTime: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFD700',
        fontVariant: ['tabular-nums'],
    },
});

export default ScoreDisplay;
