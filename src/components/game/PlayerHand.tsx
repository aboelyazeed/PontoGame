// ==========================================
// Ponto Game - Player Hand Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, CardType } from '../../types';
import { CardComponent } from '../cards';

interface PlayerHandProps {
    cards: Card[];
    selectedCardId: string | null;
    onCardPress: (card: Card) => void;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
    cards,
    selectedCardId,
    onCardPress,
}) => {
    // Group cards by type
    const playerCards = cards.filter((c) => c.type === CardType.PLAYER);
    const actionCards = cards.filter((c) => c.type === CardType.ACTION);
    const pontoCards = cards.filter((c) => c.type === CardType.PONTO);

    const renderCardSection = (sectionCards: Card[], title: string, icon: string) => {
        if (sectionCards.length === 0) return null;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{icon} {title}</Text>
                    <Text style={styles.cardCount}>{sectionCards.length}</Text>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardsRow}
                >
                    {sectionCards.map((card) => (
                        <View key={card.id} style={styles.cardWrapper}>
                            <CardComponent
                                card={card}
                                isSelected={card.id === selectedCardId}
                                onPress={() => onCardPress(card)}
                                size="medium"
                            />
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>🃏 يدك</Text>
                <Text style={styles.totalCards}>{cards.length} كروت</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {renderCardSection(playerCards, 'لاعبين', '👤')}
                {renderCardSection(actionCards, 'أكشن', '⚡')}
                {renderCardSection(pontoCards, 'بونطو', '🎯')}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        maxHeight: 280,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'right',
    },
    totalCards: {
        fontSize: 14,
        color: '#888',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#aaa',
        textAlign: 'right',
    },
    cardCount: {
        fontSize: 12,
        color: '#666',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    cardsRow: {
        paddingHorizontal: 12,
        paddingBottom: 8,
    },
    cardWrapper: {
        marginHorizontal: 4,
    },
});

export default PlayerHand;
