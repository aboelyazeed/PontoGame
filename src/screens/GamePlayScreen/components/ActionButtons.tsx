// ==========================================
// ActionButtons Component
// ==========================================

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles, GAME_COLORS } from '../GamePlayScreen.styles';
import { GameCard } from '../../../hooks/useGameLogic';

interface PlayerState {
    odium: string;
    field: (GameCard | null)[];
    movesRemaining: number;
}

interface ActionButtonsProps {
    selectedCardId: string | null;
    myPlayer: PlayerState | null;
    turnPhase: string;
    isMyTurn: boolean;
    isDefensePhase: boolean;
    isAttackPontoNeeded: boolean;
    pendingAttack?: {
        pontoCard?: any;
        attackerSlots?: number[];
    };
    onRevealAttacker: (index: number) => void;
    onRevealDefender: (index: number) => void;
    onEndAttackPhase: () => void;
    onAcceptGoal: () => void;
    onEndDefense: () => void;
    onEndTurn: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    selectedCardId,
    myPlayer,
    turnPhase,
    isMyTurn,
    isDefensePhase,
    isAttackPontoNeeded,
    pendingAttack,
    onRevealAttacker,
    onRevealDefender,
    onEndAttackPhase,
    onAcceptGoal,
    onEndDefense,
    onEndTurn,
}) => {
    // Find selected card info for reveal button
    const getRevealButton = () => {
        if (!selectedCardId || !myPlayer) return null;
        const index = myPlayer.field.findIndex(c => c?.id === selectedCardId);
        if (index === -1) return null;
        const card = myPlayer.field[index];
        if (!card || card.isRevealed) return null;

        const isAttack = (turnPhase === 'play' || turnPhase === 'attack');
        const isDefense = isDefensePhase;

        const isValidAttackReveal = isAttack && isMyTurn && (card.position === 'FW' || card.position === 'MF');
        // Hide reveal button during defense if no moves remaining
        const hasMovesForDefense = myPlayer.movesRemaining > 0;
        const isValidDefenseReveal = isDefense && hasMovesForDefense && (card.position === 'DF' || card.position === 'GK' || card.position === 'MF');

        // Hide reveal button if Ponto needed
        if ((isValidAttackReveal || isValidDefenseReveal) && !isAttackPontoNeeded) {
            return (
                <TouchableOpacity
                    style={styles.revealButton}
                    onPress={() => {
                        if (isValidAttackReveal) onRevealAttacker(index);
                        else onRevealDefender(index);
                    }}
                >
                    <Ionicons name="eye" size={18} color="#FFF" />
                    <Text style={styles.revealButtonText} numberOfLines={1}>كشف الكرت</Text>
                </TouchableOpacity>
            );
        }
        return null;
    };

    return (
        <View style={styles.actionButtons}>
            {/* Reveal Button (Contextual) */}
            {getRevealButton()}

            {/* Defense Phase Buttons */}
            {isDefensePhase && (
                <>
                    <TouchableOpacity
                        style={styles.acceptGoalButton}
                        onPress={onAcceptGoal}
                    >
                        <Ionicons name="football-outline" size={18} color="#FFF" />
                        <Text style={styles.acceptGoalText} numberOfLines={1}>قبول الهدف</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.defenseButton}
                        onPress={onEndDefense}
                    >
                        <Ionicons name="shield" size={18} color="#FFF" />
                        <Text style={styles.defenseButtonText} numberOfLines={1}>إنهاء الدفاع</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* Attack Phase Buttons */}
            {turnPhase === 'attack' && isMyTurn && pendingAttack?.pontoCard && (
                <TouchableOpacity
                    style={styles.endAttackButton}
                    onPress={onEndAttackPhase}
                >
                    <MaterialCommunityIcons name="sword-cross" size={18} color="#FFF" />
                    <Text style={styles.endAttackText} numberOfLines={1}>إنهاء الهجوم</Text>
                </TouchableOpacity>
            )}

            {/* End Turn Button (Play Phase) */}
            {turnPhase === 'play' && isMyTurn && (
                <TouchableOpacity
                    style={styles.endTurnButton}
                    onPress={onEndTurn}
                >
                    <Text style={styles.endTurnText} numberOfLines={1}>إنهاء الدور</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default ActionButtons;
