// ==========================================
// HandArea Component
// ==========================================

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, GAME_COLORS } from '../GamePlayScreen.styles';
import { GameCard } from '../../../hooks/useGameLogic';
import HandCard from './HandCard';

interface HandAreaProps {
    cards: GameCard[];
    selectedCardId: string | null;
    onCardPress: (card: GameCard) => void;
    onMenuPress: () => void;
    disabled?: boolean;
}

const HandArea: React.FC<HandAreaProps> = ({
    cards,
    selectedCardId,
    onCardPress,
    onMenuPress,
    disabled = false,
}) => {
    return (
        <View style={styles.handArea}>
            <View style={styles.handDragIndicator} />
            <View style={styles.handHeader}>
                <Text style={styles.handCount}>كروتك ({cards.length})</Text>
                <TouchableOpacity onPress={onMenuPress}>
                    <Ionicons name="menu" size={20} color={GAME_COLORS.primary} />
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.handScroll}>
                {cards.map(card => (
                    <HandCard
                        key={card.id}
                        card={card}
                        isSelected={card.id === selectedCardId}
                        onPress={onCardPress}
                        disabled={disabled}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

export default HandArea;
