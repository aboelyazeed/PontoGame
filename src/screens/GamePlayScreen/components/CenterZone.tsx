// ==========================================
// CenterZone Component
// ==========================================

import React from 'react';
import { View, Text, Image } from 'react-native';
import { styles, GAME_COLORS } from '../GamePlayScreen.styles';
import { PONTO_CARD_IMAGES } from '../../../constants/cardImages';

interface PontoCard {
    id: string;
    attack?: number;
    imageUrl?: string;
}

interface PendingAttack {
    attackerId: string;
    attackerSlots: number[];
    attackSum: number;
    defenseSum: number;
    defenderSlots: number[];
    pontoCard?: PontoCard;
    pontoCards?: PontoCard[];
    defensePontoCard?: PontoCard;
    defensePontoCards?: PontoCard[];
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
    // Get attack ponto cards (use array if available, fallback to single card)
    const attackPontoCards = pendingAttack?.pontoCards?.length 
        ? pendingAttack.pontoCards 
        : (pendingAttack?.pontoCard ? [pendingAttack.pontoCard] : []);
    
    // Get defense ponto cards
    const defensePontoCards = pendingAttack?.defensePontoCards?.length
        ? pendingAttack.defensePontoCards
        : (pendingAttack?.defensePontoCard ? [pendingAttack.defensePontoCard] : []);

    // Calculate totals
    const attackPontoTotal = attackPontoCards.reduce((sum, c) => sum + (c.attack || 0), 0);
    const defensePontoTotal = defensePontoCards.reduce((sum, c) => sum + (c.attack || 0), 0);

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
                    {/* Defense Ponto Cards - OUTSIDE, positioned to the LEFT above container */}
                    {defensePontoCards.length > 0 && (
                        <View style={styles.defensePontoFloat}>
                            <View style={styles.pontoCardsRow}>
                                {defensePontoCards.map((card, index) => (
                                    <Image
                                        key={card.id}
                                        source={
                                            card.attack
                                                ? PONTO_CARD_IMAGES[card.attack]
                                                : PONTO_CARD_IMAGES[1]
                                        }
                                        style={[
                                            styles.floatPontoImage,
                                            index > 0 && { marginLeft: 4 }
                                        ]}
                                        resizeMode="contain"
                                    />
                                ))}
                            </View>
                            {/* Total box absolute on LEFT */}
                            {defensePontoCards.length >= 1 && (
                                <View style={[styles.pontoTotalBox, styles.pontoTotalBoxDefense]}>
                                    <Text style={styles.pontoTotalText}>+{defensePontoTotal}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Attack Ponto Cards - OUTSIDE, positioned to the RIGHT above container */}
                    {attackPontoCards.length > 0 && (
                        <View style={styles.attackPontoFloat}>
                            <View style={styles.pontoCardsRow}>
                                {attackPontoCards.map((card, index) => (
                                    <Image
                                        key={card.id}
                                        source={
                                            card.attack
                                                ? PONTO_CARD_IMAGES[card.attack]
                                                : PONTO_CARD_IMAGES[1]
                                        }
                                        style={[
                                            styles.floatPontoImage,
                                            index > 0 && { marginLeft: 12 }
                                        ]}
                                        resizeMode="contain"
                                    />
                                ))}
                            </View>
                            {/* Total box absolute on RIGHT */}
                            {attackPontoCards.length >= 1 && (
                                <View style={[styles.pontoTotalBox, styles.pontoTotalBoxAttack]}>
                                    <Text style={styles.pontoTotalText}>+{attackPontoTotal}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Score Display */}
                    <View style={styles.battleSide}>
                        <Text style={styles.battleLabel}>دفاع</Text>
                        <Text style={styles.battleValue}>{pendingAttack.defenseSum}</Text>
                    </View>

                    <Text style={styles.battleVs}>VS</Text>

                    <View style={styles.battleSide}>
                        <Text style={styles.battleLabel}>هجوم</Text>
                        <Text style={styles.battleValue}>{pendingAttack.attackSum}</Text>
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
