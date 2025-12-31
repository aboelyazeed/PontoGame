// ==========================================
// Ponto Game - Game Over Screen
// ==========================================

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Force RTL
I18nManager.forceRTL(true);

interface GameOverScreenProps {
    winnerName: string;
    player1Name: string;
    player1Score: number;
    player2Name: string;
    player2Score: number;
    isLocalPlayerWinner: boolean;
    onPlayAgain: () => void;
    onMainMenu: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
    winnerName,
    player1Name,
    player1Score,
    player2Name,
    player2Score,
    isLocalPlayerWinner,
    onPlayAgain,
    onMainMenu,
}) => {
    return (
        <SafeAreaView style={styles.container}>
            {/* Result Banner */}
            <View style={[
                styles.resultBanner,
                isLocalPlayerWinner ? styles.winBanner : styles.loseBanner
            ]}>
                <Text style={styles.resultEmoji}>
                    {isLocalPlayerWinner ? '🏆' : '😢'}
                </Text>
                <Text style={styles.resultText}>
                    {isLocalPlayerWinner ? 'فوز!' : 'خسارة'}
                </Text>
            </View>

            {/* Winner Name */}
            <View style={styles.winnerSection}>
                <Text style={styles.winnerLabel}>الفائز</Text>
                <Text style={styles.winnerName}>{winnerName}</Text>
            </View>

            {/* Final Score */}
            <View style={styles.scoreSection}>
                <Text style={styles.scoreSectionTitle}>النتيجة النهائية</Text>

                <View style={styles.scoreDisplay}>
                    <View style={styles.playerScoreBox}>
                        <Text style={styles.playerName}>{player1Name}</Text>
                        <Text style={styles.playerScore}>{player1Score}</Text>
                    </View>

                    <Text style={styles.vsText}>-</Text>

                    <View style={styles.playerScoreBox}>
                        <Text style={styles.playerName}>{player2Name}</Text>
                        <Text style={styles.playerScore}>{player2Score}</Text>
                    </View>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.playAgainButton]}
                    onPress={onPlayAgain}
                >
                    <Text style={styles.buttonIcon}>🔄</Text>
                    <Text style={styles.buttonText}>لعب مرة أخرى</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.menuButton]}
                    onPress={onMainMenu}
                >
                    <Text style={styles.buttonIcon}>🏠</Text>
                    <Text style={styles.buttonText}>القائمة الرئيسية</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d1a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    resultBanner: {
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 32,
        width: '100%',
    },
    winBanner: {
        backgroundColor: 'rgba(39, 174, 96, 0.3)',
        borderWidth: 2,
        borderColor: '#27ae60',
    },
    loseBanner: {
        backgroundColor: 'rgba(192, 57, 43, 0.3)',
        borderWidth: 2,
        borderColor: '#c0392b',
    },
    resultEmoji: {
        fontSize: 64,
        marginBottom: 8,
    },
    resultText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    winnerSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    winnerLabel: {
        fontSize: 16,
        color: '#888',
        marginBottom: 8,
    },
    winnerName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    scoreSection: {
        alignItems: 'center',
        marginBottom: 48,
        width: '100%',
    },
    scoreSectionTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    scoreDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerScoreBox: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    playerName: {
        fontSize: 14,
        color: '#888',
        marginBottom: 8,
    },
    playerScore: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
    },
    vsText: {
        fontSize: 24,
        color: '#555',
        marginHorizontal: 16,
    },
    actionsContainer: {
        width: '100%',
        gap: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    playAgainButton: {
        backgroundColor: '#27ae60',
    },
    menuButton: {
        backgroundColor: '#2c3e50',
    },
    buttonIcon: {
        fontSize: 24,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default GameOverScreen;
