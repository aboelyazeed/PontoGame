// ==========================================
// FieldSlot Component
// ==========================================

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { styles, GAME_COLORS } from '../GamePlayScreen.styles';
import { GameCard } from '../../../hooks/useGameLogic';
import { getCardImage } from '../../../utils/cardUtils';
import { CARD_BACK_IMAGES } from '../../../constants/cardImages';

interface FieldSlotProps {
    card: GameCard | null;
    index: number;
    isOpponent: boolean;
    isSelected?: boolean;
    isAttacker?: boolean;
    isTarget?: boolean;
    onPress: (card: GameCard | null, index: number, isOpponent: boolean) => void;
    disabled?: boolean;
}

const FieldSlot: React.FC<FieldSlotProps> = ({
    card,
    index,
    isOpponent,
    isSelected = false,
    isAttacker = false,
    isTarget = false,
    onPress,
    disabled = false,
}) => {
    const handlePress = () => {
        onPress(card, index, isOpponent);
    };

    // Empty slot
    if (!card) {
        return (
            <TouchableOpacity
                key={index}
                style={styles.fieldSlot}
                onPress={handlePress}
                disabled={disabled}
            >
                <View style={styles.emptySlotCircle} />
            </TouchableOpacity>
        );
    }

    // Opponent's face-down card - show player card back image
    if (isOpponent && card.isRevealed === false) {
        return (
            <TouchableOpacity
                key={index}
                style={[styles.fieldSlot, isTarget && styles.fieldSlotTarget]}
                onPress={handlePress}
                disabled={disabled}
            >
                <Image
                    source={CARD_BACK_IMAGES.player}
                    style={styles.opponentCardBackImage}
                    resizeMode="cover"
                />
            </TouchableOpacity>
        );
    }

    // Revealed card (opponent or player)
    const cardImage = getCardImage(card);

    return (
        <TouchableOpacity
            key={index}
            style={[
                styles.fieldSlot,
                !isOpponent && isSelected && styles.fieldSlotSelected,
                !isOpponent && isAttacker && styles.fieldSlotAttacker,
                isTarget && styles.fieldSlotTarget,
            ]}
            onPress={handlePress}
            disabled={disabled}
        >
            <View style={[styles.slotCardFilled, card.isRevealed && { opacity: 0.35 }]}>
                {cardImage && (
                    <Image source={cardImage} style={styles.slotCardImage} resizeMode="cover" />
                )}
            </View>
        </TouchableOpacity>
    );
};

export default FieldSlot;
