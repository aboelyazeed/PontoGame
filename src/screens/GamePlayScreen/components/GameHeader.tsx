// ==========================================
// GameHeader Component
// ==========================================

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { styles, GAME_COLORS } from '../GamePlayScreen.styles';
import { formatTime } from '../../../utils/cardUtils';

// ==========================================
// Types
// ==========================================

interface PlayerInfo {
    odium: string;
    score: number;
    odiumInfo: {
        level: number;
        username?: string;
        displayName?: string;
    };
}

interface GameHeaderProps {
    myPlayer: PlayerInfo | null;
    opponent: PlayerInfo | null;
    timerSeconds: number;
    matchTimerSeconds: number;
    isMyTurn: boolean;
    turnTimeLimit?: number;
}

// ==========================================
// Constants
// ==========================================

const AVATAR_SIZE = 48;
const STROKE_WIDTH = 3;
const RADIUS = (AVATAR_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ==========================================
// Helper Functions
// ==========================================

const truncateName = (name?: string, maxLength: number = 15): string => {
    if (!name) return 'لاعب';
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
};

// ==========================================
// Component
// ==========================================

const GameHeader: React.FC<GameHeaderProps> = ({
    myPlayer,
    opponent,
    timerSeconds,
    matchTimerSeconds,
    isMyTurn,
    turnTimeLimit = 60,
}) => {
    // Calculate timer progress (0 to 1)
    const timerProgress = Math.max(0, Math.min(1, timerSeconds / turnTimeLimit));
    const strokeDashoffset = CIRCUMFERENCE * (1 - timerProgress);

    const myName = truncateName(myPlayer?.odiumInfo?.displayName || myPlayer?.odiumInfo?.username);
    const oppName = truncateName(opponent?.odiumInfo?.displayName || opponent?.odiumInfo?.username);

    return (
        <View style={styles.header}>
            <View style={styles.scoreboardContainer}>
                {/* My Player - Left */}
                <View style={styles.playerSection}>
                    {/* Avatar with Timer Ring */}
                    <View style={styles.avatarTimerWrapper}>
                        <Svg width={AVATAR_SIZE} height={AVATAR_SIZE} style={styles.timerRingSvg}>
                            {/* Background Circle */}
                            <Circle
                                cx={AVATAR_SIZE / 2}
                                cy={AVATAR_SIZE / 2}
                                r={RADIUS}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth={STROKE_WIDTH}
                                fill="transparent"
                            />
                            {/* Progress Circle - Only show if my turn */}
                            {isMyTurn && (
                                <Circle
                                    cx={AVATAR_SIZE / 2}
                                    cy={AVATAR_SIZE / 2}
                                    r={RADIUS}
                                    stroke={GAME_COLORS.primary}
                                    strokeWidth={STROKE_WIDTH}
                                    fill="transparent"
                                    strokeDasharray={`${CIRCUMFERENCE}`}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    rotation={-90}
                                    origin={`${AVATAR_SIZE / 2}, ${AVATAR_SIZE / 2}`}
                                />
                            )}
                        </Svg>
                        <View style={[styles.avatar, styles.avatarMe]}>
                            <Ionicons name="person" size={18} color={GAME_COLORS.textSecondary} />
                        </View>
                    </View>

                    {/* Name & Score */}
                    <View style={styles.playerInfo}>
                        <Text style={styles.playerName} numberOfLines={1}>{myName}</Text>
                        <Text style={styles.scoreText}>{myPlayer?.score || 0}</Text>
                    </View>
                </View>

                {/* Center - Match Timer */}
                <View style={styles.timerSection}>
                    <Text style={styles.matchTimerText}>{formatTime(matchTimerSeconds)}</Text>
                </View>

                {/* Opponent - Right */}
                <View style={[styles.playerSection, styles.playerSectionRight]}>
                    {/* Name + Score column */}
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.playerName} numberOfLines={1}>{oppName}</Text>
                        <Text style={styles.scoreText}>{opponent?.score || 0}</Text>
                    </View>

                    {/* Avatar with Timer Ring */}
                    <View style={styles.avatarTimerWrapper}>
                        <Svg width={AVATAR_SIZE} height={AVATAR_SIZE} style={styles.timerRingSvg}>
                            {/* Background Circle */}
                            <Circle
                                cx={AVATAR_SIZE / 2}
                                cy={AVATAR_SIZE / 2}
                                r={RADIUS}
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth={STROKE_WIDTH}
                                fill="transparent"
                            />
                            {/* Progress Circle - Only show if opponent's turn */}
                            {!isMyTurn && (
                                <Circle
                                    cx={AVATAR_SIZE / 2}
                                    cy={AVATAR_SIZE / 2}
                                    r={RADIUS}
                                    stroke={GAME_COLORS.error}
                                    strokeWidth={STROKE_WIDTH}
                                    fill="transparent"
                                    strokeDasharray={`${CIRCUMFERENCE}`}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    rotation={-90}
                                    origin={`${AVATAR_SIZE / 2}, ${AVATAR_SIZE / 2}`}
                                />
                            )}
                        </Svg>
                        <View style={[styles.avatar, styles.avatarOpponent]}>
                            <Ionicons name="person" size={18} color={GAME_COLORS.textSlate} />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default GameHeader;
