// ==========================================
// Ponto Game - Timer Component
// ==========================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface TimerProps {
    timeRemaining: number; // in seconds
    isActive: boolean;
    onTimeUp?: () => void;
}

const Timer: React.FC<TimerProps> = ({
    timeRemaining,
    isActive,
    onTimeUp,
}) => {
    const [pulseAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        if (timeRemaining <= 10 && isActive) {
            // Pulse animation when time is running low
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [timeRemaining, isActive]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerColor = (): string => {
        if (timeRemaining <= 10) return '#ff4444';
        if (timeRemaining <= 30) return '#ffaa00';
        return '#44ff44';
    };

    const progressPercentage = (timeRemaining / 90) * 100; // 90 seconds = 100%

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ scale: pulseAnim }] },
            ]}
        >
            {/* Progress bar */}
            <View style={styles.progressBackground}>
                <View
                    style={[
                        styles.progressFill,
                        {
                            width: `${progressPercentage}%`,
                            backgroundColor: getTimerColor(),
                        },
                    ]}
                />
            </View>

            {/* Time display */}
            <View style={[styles.timeContainer, { borderColor: getTimerColor() }]}>
                <Text style={styles.timerIcon}>⏱️</Text>
                <Text style={[styles.timeText, { color: getTimerColor() }]}>
                    {formatTime(timeRemaining)}
                </Text>
            </View>

            {/* Active indicator */}
            {isActive && (
                <View style={styles.activeIndicator}>
                    <Text style={styles.activeText}>دورك</Text>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 8,
    },
    progressBackground: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
    },
    timerIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    timeText: {
        fontSize: 24,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    activeIndicator: {
        marginTop: 4,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    activeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default Timer;
