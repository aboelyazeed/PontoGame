// ==========================================
// CenterZone Component
// ==========================================

import React from 'react';
import { View, Text, Image } from 'react-native';
import { styles, GAME_COLORS } from '../GamePlayScreen.styles';
import { CARD_IMAGES } from '../../../constants/cardImages';

interface PendingAttack {
    attackerId: string;
    attackerSlots: number[];
    attackSum: number;
    defenseSum: number;
    defenderSlots: number[];
    pontoCard?: {
        id: string;
        attack?: number;
        imageUrl?: string;
    };
}

interface AttackResult {
    result: string;
    damage?: number;
}

interface CenterZoneProps {
    phaseText: string;
    movesRemaining: number;
    isMyTurn: boolean;
    pendingAttack?: PendingAttack;
    lastAttackResult?: AttackResult | null;
}

const CenterZone: React.FC<CenterZoneProps> = ({
    phaseText,
    movesRemaining,
    isMyTurn,
    pendingAttack,
    lastAttackResult,
}) => {
    return (
        <View style={styles.centerContent}>
            {/* Phase Badge */}
            <View style={styles.phaseBadge}>
                <Text style={styles.phaseBadgeText}>{phaseText}</Text>
            </View>

            {/* Field Circle */}
            <View style={styles.fieldCircle}>
                <View style={styles.fieldCircleInner}>
                    <View style={styles.fieldLine} />
                    <View style={styles.fieldDot} />
                </View>
            </View>

            {/* Moves Indicator */}
            {isMyTurn && (
                <View style={styles.movesIndicator}>
                    {[1, 2, 3].map(i => (
                        <View
                            key={i}
                            style={[
                                styles.moveDot,
                                i <= movesRemaining && styles.moveDotActive
                            ]}
                        />
                    ))}
                </View>
            )}

            {/* Battle Display */}
            {pendingAttack && (
                <View style={styles.battleDisplay}>
                    {/* Ponto Card Display */}
                    {pendingAttack.pontoCard && (
                        <View style={styles.pontoCardDisplay}>
                            <Image
                                source={
                                    pendingAttack.pontoCard.imageUrl && CARD_IMAGES[pendingAttack.pontoCard.imageUrl]
                                        ? CARD_IMAGES[pendingAttack.pontoCard.imageUrl]
                                        : CARD_IMAGES['FW.png']
                                }
                                style={styles.pontoCardImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.pontoCardValue}>+{pendingAttack.pontoCard.attack}</Text>
                        </View>
                    )}

                    <View style={styles.battleSide}>
                        <Text style={styles.battleLabel}>هجوم</Text>
                        <Text style={styles.battleValue}>{pendingAttack.attackSum}</Text>
                    </View>
                    <Text style={styles.battleVs}>VS</Text>
                    <View style={styles.battleSide}>
                        <Text style={styles.battleLabel}>دفاع</Text>
                        <Text style={styles.battleValue}>{pendingAttack.defenseSum}</Text>
                    </View>
                </View>
            )}

            {/* Attack Result */}
            {lastAttackResult && (
                <View style={[
                    styles.attackResult,
                    lastAttackResult.result === 'goal' && styles.attackResultGoal,
                ]}>
                    <Text style={styles.attackResultText}>
                        {lastAttackResult.result === 'goal'
                            ? `هدف! +${lastAttackResult.damage}`
                            : 'تصدي!'}
                    </Text>
                </View>
            )}
        </View>
    );
};

export default CenterZone;
