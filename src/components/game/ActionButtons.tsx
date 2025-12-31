// ==========================================
// Ponto Game - Action Buttons Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GamePhase } from '../../types';

interface ActionButtonsProps {
    phase: GamePhase;
    movesRemaining: number;
    canAttack: boolean;
    isCurrentTurn: boolean;
    onAttack: () => void;
    onEndTurn: () => void;
    onFinalizeAttack: () => void;
    onSkipDefense: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    phase,
    movesRemaining,
    canAttack,
    isCurrentTurn,
    onAttack,
    onEndTurn,
    onFinalizeAttack,
    onSkipDefense,
}) => {
    if (!isCurrentTurn) {
        return (
            <View style={styles.container}>
                <View style={styles.waitingIndicator}>
                    <Text style={styles.waitingText}>⏳ انتظر دورك...</Text>
                </View>
            </View>
        );
    }

    const renderTurnButtons = () => (
        <>
            <View style={styles.movesIndicator}>
                <Text style={styles.movesText}>
                    الحركات المتبقية: {movesRemaining}
                </Text>
            </View>

            <View style={styles.buttonsRow}>
                <TouchableOpacity
                    style={[
                        styles.button,
                        styles.attackButton,
                        !canAttack && styles.disabledButton,
                    ]}
                    onPress={onAttack}
                    disabled={!canAttack}
                >
                    <Text style={styles.buttonIcon}>⚔️</Text>
                    <Text style={styles.buttonText}>هجوم</Text>
                    <Text style={styles.buttonCost}>-2 حركة</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.endTurnButton]}
                    onPress={onEndTurn}
                >
                    <Text style={styles.buttonIcon}>⏭️</Text>
                    <Text style={styles.buttonText}>إنهاء الدور</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    const renderAttackButtons = () => (
        <>
            <View style={styles.phaseIndicator}>
                <Text style={styles.phaseText}>🎯 مرحلة الهجوم</Text>
                <Text style={styles.phaseHint}>العب كروت البونطو لزيادة قوة الهجوم</Text>
            </View>

            <TouchableOpacity
                style={[styles.button, styles.finalizeButton]}
                onPress={onFinalizeAttack}
            >
                <Text style={styles.buttonIcon}>✅</Text>
                <Text style={styles.buttonText}>تأكيد الهجوم</Text>
            </TouchableOpacity>
        </>
    );

    const renderDefenseButtons = () => (
        <>
            <View style={styles.phaseIndicator}>
                <Text style={styles.phaseText}>🛡️ مرحلة الدفاع</Text>
                <Text style={styles.phaseHint}>استخدم كروت الدفاع أو تخطى</Text>
            </View>

            <View style={styles.buttonsRow}>
                <TouchableOpacity
                    style={[styles.button, styles.skipButton]}
                    onPress={onSkipDefense}
                >
                    <Text style={styles.buttonIcon}>⏩</Text>
                    <Text style={styles.buttonText}>تخطي الدفاع</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <View style={styles.container}>
            {phase === GamePhase.TURN && renderTurnButtons()}
            {phase === GamePhase.ATTACK && renderAttackButtons()}
            {phase === GamePhase.DEFENSE && renderDefenseButtons()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    waitingIndicator: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    waitingText: {
        fontSize: 16,
        color: '#888',
    },
    movesIndicator: {
        alignItems: 'center',
        marginBottom: 12,
    },
    movesText: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: 'bold',
    },
    phaseIndicator: {
        alignItems: 'center',
        marginBottom: 12,
    },
    phaseText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    phaseHint: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    button: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 120,
    },
    attackButton: {
        backgroundColor: '#c0392b',
    },
    endTurnButton: {
        backgroundColor: '#2980b9',
    },
    finalizeButton: {
        backgroundColor: '#27ae60',
        alignSelf: 'center',
    },
    skipButton: {
        backgroundColor: '#7f8c8d',
    },
    disabledButton: {
        backgroundColor: '#555',
        opacity: 0.5,
    },
    buttonIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    buttonCost: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 10,
        marginTop: 2,
    },
});

export default ActionButtons;
