// ==========================================
// HandCard Component
// ==========================================

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { styles, GAME_COLORS } from '../GamePlayScreen.styles';
import { GameCard } from '../../../hooks/useGameLogic';
import { getCardImage, getPositionColor } from '../../../utils/cardUtils';

interface HandCardProps {
    card: GameCard;
    isSelected: boolean;
    onPress: (card: GameCard) => void;
    disabled?: boolean;
}

const HandCard: React.FC<HandCardProps> = ({
    card,
    isSelected,
    onPress,
    disabled = false,
}) => {
    const cardImage = getCardImage(card);
    const isLegendary = card.isLegendary;

    return (
        <TouchableOpacity
            key={card.id}
            style={[
                styles.handCard, 
                isSelected && styles.handCardSelected,
                isLegendary && styles.handCardLegendary,
            ]}
            onPress={() => onPress(card)}
            disabled={disabled}
        >
            {cardImage ? (
                <Image source={cardImage} style={styles.handCardImage} resizeMode="cover" />
            ) : (
                <View style={styles.handCardPlaceholder}>
                    {card.type === 'action' ? (
                        <MaterialIcons name="flash-on" size={32} color={GAME_COLORS.warning} />
                    ) : card.type === 'ponto' ? (
                        <Text style={styles.pontoCardValue}>+{card.attack}</Text>
                    ) : (
                        <Ionicons name="person" size={32} color={GAME_COLORS.textSecondary} />
                    )}
                </View>
            )}
            <View style={styles.handCardGradient} />

            {card.type === 'action' && (
                <Text style={styles.handCardActionLabel}>أكشن</Text>
            )}

            {card.type === 'ponto' && (
                <Text style={styles.handCardPontoLabel}>بونتو</Text>
            )}
        </TouchableOpacity>
    );
};

export default HandCard;
