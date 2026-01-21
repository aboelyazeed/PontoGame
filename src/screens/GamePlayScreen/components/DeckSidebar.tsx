// ==========================================
// DeckSidebar Component
// ==========================================

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles, GAME_COLORS } from '../GamePlayScreen.styles';
import { CARD_BACK_IMAGES } from '../../../constants/cardImages';

interface DeckSidebarProps {
    position: 'left' | 'right';
    isMyTurn: boolean;
    turnPhase: string;
    isAttackPontoNeeded?: boolean;
    extraPontoAvailable?: boolean; // Abo Kaaf ability
    movesRemaining?: number;
    onDrawFromDeck?: (deckType: 'player' | 'action') => void;
    onDrawPonto?: () => void;
    onDrawExtraPonto?: () => void; // Abo Kaaf ability
}

const DeckSidebar: React.FC<DeckSidebarProps> = ({
    position,
    isMyTurn,
    turnPhase,
    isAttackPontoNeeded = false,
    extraPontoAvailable = false,
    movesRemaining = 0,
    onDrawFromDeck,
    onDrawPonto,
    onDrawExtraPonto,
}) => {
    if (position === 'left') {
        const isDrawPhase = turnPhase === 'draw';
        const isActive = isDrawPhase && isMyTurn;

        return (
            <View style={styles.deckSidebarLeft}>
                {/* Player Deck */}
                <TouchableOpacity
                    style={[styles.deckCardContainer, isActive && styles.deckCardContainerActive]}
                    onPress={() => onDrawFromDeck?.('player')}
                    disabled={!isMyTurn || turnPhase !== 'draw'}
                >
                    <Image
                        source={CARD_BACK_IMAGES.player}
                        style={styles.deckCardImage}
                        resizeMode="cover"
                    />
                    <Text style={[styles.deckLabel, isActive && styles.deckLabelActive]}>لاعبين</Text>
                </TouchableOpacity>

                {/* Action Deck */}
                <TouchableOpacity
                    style={[styles.deckCardContainer, isActive && styles.deckCardContainerActive]}
                    onPress={() => onDrawFromDeck?.('action')}
                    disabled={!isMyTurn || turnPhase !== 'draw'}
                >
                    <Image
                        source={CARD_BACK_IMAGES.action}
                        style={styles.deckCardImage}
                        resizeMode="cover"
                    />
                    <Text style={[styles.deckLabel, isActive && styles.deckLabelActive]}>أكشن</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Right sidebar - Ponto Deck
    // Can draw during attack phase (normal), or when Abo Kaaf ability is active
    const canDrawNormalPonto = isAttackPontoNeeded;
    const canDrawExtraPonto = extraPontoAvailable && (turnPhase === 'attack' || turnPhase === 'defense') && isMyTurn;
    const isActive = canDrawNormalPonto || canDrawExtraPonto;

    const handlePontoDeckPress = () => {
        if (canDrawNormalPonto) {
            onDrawPonto?.();
        } else if (canDrawExtraPonto) {
            onDrawExtraPonto?.();
        }
    };

    return (
        <View style={styles.deckSidebarRight}>
            <TouchableOpacity
                style={[
                    styles.pontoDeckCard,
                    isActive && styles.pontoDeckCardActive,
                    canDrawExtraPonto && !canDrawNormalPonto && styles.pontoDeckCardLegendary,
                ]}
                onPress={handlePontoDeckPress}
                disabled={!isActive}
            >
                <Image
                    source={CARD_BACK_IMAGES.ponto}
                    style={styles.pontoDeckImage}
                    resizeMode="cover"
                />
                <Text style={[styles.deckLabel, isActive && styles.deckLabelActive]}>
                    {canDrawExtraPonto && !canDrawNormalPonto ? 'أبو كف' : 'بونطو'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default DeckSidebar;

