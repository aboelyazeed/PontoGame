// ==========================================
// GameHeader Component
// ==========================================

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, GAME_COLORS } from '../GamePlayScreen.styles';
import { formatTime } from '../../../utils/cardUtils';

interface PlayerInfo {
    odium: string;
    score: number;
    odiumInfo: {
        level: number;
    };
}

interface GameHeaderProps {
    myPlayer: PlayerInfo | null;
    opponent: PlayerInfo | null;
    timerSeconds: number;
    matchTimerSeconds: number;
    isMyTurn: boolean;
}

const GameHeader: React.FC<GameHeaderProps> = ({
    myPlayer,
    opponent,
    timerSeconds,
    matchTimerSeconds,
    isMyTurn,
}) => {
    return (
        <View style={styles.header}>
            <View style={styles.scoreboardContainer}>
                {/* My Player */}
                <View style={styles.playerSection}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, styles.avatarMe]}>
                            <Ionicons name="person" size={18} color={GAME_COLORS.textSecondary} />
                        </View>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>{myPlayer?.odiumInfo.level || 1}</Text>
                        </View>
                    </View>
                    <Text style={styles.scoreText}>{myPlayer?.score || 0}</Text>
                </View>

                {/* Timer Section */}
                <View style={styles.timerSection}>
                    <View style={styles.timerBlock}>
                        <Text style={styles.timerLabel}>الدور</Text>
                        <Text style={[styles.timerValue, isMyTurn && styles.timerValueActive]}>
                            {formatTime(timerSeconds)}
                        </Text>
                    </View>
                    <View style={styles.timerDivider} />
                    <View style={styles.timerBlock}>
                        <Text style={styles.timerLabelGray}>المباراة</Text>
                        <Text style={styles.timerValueGray}>{formatTime(matchTimerSeconds)}</Text>
                    </View>
                </View>

                {/* Opponent */}
                <View style={[styles.playerSection, styles.playerSectionReverse]}>
                    <Text style={styles.scoreText}>{opponent?.score || 0}</Text>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, styles.avatarOpponent]}>
                            <Ionicons name="person" size={18} color={GAME_COLORS.textSlate} />
                        </View>
                        <View style={styles.levelBadgeOpponent}>
                            <Text style={styles.levelText}>{opponent?.odiumInfo.level || 1}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default GameHeader;
