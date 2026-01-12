// ==========================================
// DeckSidebar Component
// ==========================================

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { styles, GAME_COLORS } from '../GamePlayScreen.styles';
import { CARD_BACK_IMAGES } from '../../../constants/cardImages';

interface DeckSidebarProps {
    position: 'left' | 'right';
    isMyTurn: boolean;
    turnPhase: string;
    isAttackPontoNeeded?: boolean;
    movesRemaining?: number;
    onDrawFromDeck?: (deckType: 'player' | 'action') => void;
    onDrawPonto?: () => void;
}

const DeckSidebar: React.FC<DeckSidebarProps> = ({
    position,
    isMyTurn,
    turnPhase,
    isAttackPontoNeeded = false,
    movesRemaining = 0,
    onDrawFromDeck,
    onDrawPonto,
}) => {
    if (position === 'left') {
        const isDrawPhase = turnPhase === 'draw';
        const isActive = isDrawPhase && isMyTurn;

        return (
            <View style={styles.deckSidebarLeft}>
                {/* Player Deck */}
                <TouchableOpacity
                    style={[styles.deckCard, isActive && styles.deckCardActive]}
                    onPress={() => onDrawFromDeck?.('player')}
                    disabled={!isMyTurn || turnPhase !== 'draw'}
                >
                    <Ionicons
                        name="people"
                        size={20}
                        color={isActive ? GAME_COLORS.primary : 'rgba(255,255,255,0.2)'}
                    />
                    <Text style={[styles.deckLabel, isActive && styles.deckLabelActive]}>لاعبين</Text>
                </TouchableOpacity>

                {/* Action Deck */}
                <TouchableOpacity
                    style={[styles.deckCard, isActive && styles.deckCardActive]}
                    onPress={() => onDrawFromDeck?.('action')}
                    disabled={!isMyTurn || turnPhase !== 'draw'}
                >
                    <MaterialIcons
                        name="flash-on"
                        size={20}
                        color={isActive ? GAME_COLORS.warning : 'rgba(255,255,255,0.2)'}
                    />
                    <Text style={[styles.deckLabel, isActive && styles.deckLabelActive]}>أكشن</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Right sidebar - Ponto Deck
    return (
        <View style={styles.deckSidebarRight}>
            <TouchableOpacity
                style={[
                    styles.pontoDeckCard,
                    isAttackPontoNeeded && styles.pontoDeckCardActive,
                ]}
                onPress={() => onDrawPonto?.()}
                disabled={!isAttackPontoNeeded}
            >
                <Image
                    source={CARD_BACK_IMAGES.ponto}
                    style={styles.pontoDeckImage}
                    resizeMode="cover"
                />
                <Text style={[styles.deckLabel, isAttackPontoNeeded && styles.deckLabelActive]}>بونطو</Text>
            </TouchableOpacity>
        </View>
    );
};

export default DeckSidebar;
