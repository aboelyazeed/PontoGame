// ==========================================
// Ponto Game - Card Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, I18nManager, Image } from 'react-native';
import { Card, CardType, PlayerCard, ActionCard, PontoCard } from '../../types';
import { POSITION_COLORS } from '../../constants/cards';
import { PONTO_CARD_IMAGES, CARD_BACK_IMAGES } from '../../constants/cardImages';

// Enable RTL
I18nManager.forceRTL(true);

interface CardComponentProps {
    card: Card;
    isHidden?: boolean;
    isSelected?: boolean;
    onPress?: () => void;
    size?: 'small' | 'medium' | 'large';
}

const CardComponent: React.FC<CardComponentProps> = ({
    card,
    isHidden = false,
    isSelected = false,
    onPress,
    size = 'medium',
}) => {
    const dimensions = {
        small: { width: 60, height: 84 },
        medium: { width: 80, height: 112 },
        large: { width: 100, height: 140 },
    };

    const { width, height } = dimensions[size];

    // Get the appropriate card back image based on card type
    const getCardBackImage = () => {
        switch (card.type) {
            case CardType.PONTO:
                return CARD_BACK_IMAGES.ponto;
            case CardType.ACTION:
                return CARD_BACK_IMAGES.action;
            case CardType.PLAYER:
            default:
                return CARD_BACK_IMAGES.player;
        }
    };

    if (isHidden) {
        return (
            <TouchableOpacity
                style={[
                    styles.cardBack,
                    { width, height },
                    isSelected && styles.selected,
                ]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <Image
                    source={getCardBackImage()}
                    style={styles.cardBackImage}
                    resizeMode="cover"
                />
            </TouchableOpacity>
        );
    }

    const renderCardContent = () => {
        switch (card.type) {
            case CardType.PLAYER:
                return renderPlayerCard(card as PlayerCard);
            case CardType.ACTION:
                return renderActionCard(card as ActionCard);
            case CardType.PONTO:
                return renderPontoCard(card as PontoCard);
            default:
                return null;
        }
    };

    const renderPlayerCard = (playerCard: PlayerCard) => {
        const positionColor = POSITION_COLORS[playerCard.position] || '#666';

        return (
            <View style={styles.cardContent}>
                {/* Header with position badge */}
                <View style={[styles.positionBadge, { backgroundColor: positionColor }]}>
                    <Text style={styles.positionText}>
                        {playerCard.isLegendary ? '⭐' : playerCard.position.charAt(0)}
                    </Text>
                </View>

                {/* Name */}
                <Text style={styles.cardNameAr} numberOfLines={2}>
                    {playerCard.nameAr}
                </Text>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>⚔️</Text>
                        <Text style={styles.statValue}>{playerCard.attack}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>🛡️</Text>
                        <Text style={styles.statValue}>{playerCard.defense}</Text>
                    </View>
                </View>

                {/* Legendary ability */}
                {playerCard.isLegendary && playerCard.legendary && (
                    <Text style={styles.abilityText} numberOfLines={2}>
                        {playerCard.legendary.abilityNameAr}
                    </Text>
                )}

                {/* Yellow cards */}
                {playerCard.yellowCards > 0 && (
                    <View style={styles.yellowCardBadge}>
                        <Text style={styles.yellowCardText}>
                            {'🟨'.repeat(playerCard.yellowCards)}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const renderActionCard = (actionCard: ActionCard) => {
        return (
            <View style={[styles.cardContent, styles.actionCardContent]}>
                <Text style={styles.actionIcon}>⚡</Text>
                <Text style={styles.cardNameAr} numberOfLines={2}>
                    {actionCard.nameAr}
                </Text>
                <Text style={styles.effectText} numberOfLines={3}>
                    {actionCard.effectDescription}
                </Text>
            </View>
        );
    };

    const renderPontoCard = (pontoCard: PontoCard) => {
        const pontoImage = PONTO_CARD_IMAGES[pontoCard.value];
        
        if (pontoImage) {
            return (
                <Image
                    source={pontoImage}
                    style={styles.pontoCardImage}
                    resizeMode="cover"
                />
            );
        }
        
        // Fallback to styled text if image not found
        return (
            <View style={[styles.cardContent, styles.pontoCardContent]}>
                <Text style={styles.pontoValue}>+{pontoCard.value}</Text>
                <Text style={styles.cardNameAr}>{pontoCard.nameAr}</Text>
            </View>
        );
    };

    const getCardStyle = () => {
        switch (card.type) {
            case CardType.PLAYER:
                return styles.playerCard;
            case CardType.ACTION:
                return styles.actionCard;
            case CardType.PONTO:
                return styles.pontoCard;
            default:
                return {};
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.card,
                { width, height },
                getCardStyle(),
                isSelected && styles.selected,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {renderCardContent()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#333',
        backgroundColor: '#fff',
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    cardBack: {
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#333',
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    cardBackText: {
        fontSize: 32,
    },
    cardBackImage: {
        width: '100%',
        height: '100%',
        borderRadius: 6,
    },
    selected: {
        borderColor: '#FFD700',
        borderWidth: 3,
        transform: [{ scale: 1.05 }],
    },
    cardContent: {
        flex: 1,
        padding: 6,
        justifyContent: 'space-between',
    },
    positionBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    positionText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardNameAr: {
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'right',
        color: '#333',
        marginTop: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 4,
    },
    statBox: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    abilityText: {
        fontSize: 8,
        textAlign: 'right',
        color: '#666',
        marginTop: 4,
    },
    yellowCardBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
    },
    yellowCardText: {
        fontSize: 10,
    },
    // Card type specific styles
    playerCard: {
        backgroundColor: '#f5f5f5',
    },
    actionCardContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionCard: {
        backgroundColor: '#e8f5e9',
        borderColor: '#4CAF50',
    },
    actionIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    effectText: {
        fontSize: 8,
        textAlign: 'center',
        color: '#666',
        marginTop: 4,
    },
    pontoCardContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    pontoCard: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
    },
    pontoValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF9800',
    },
    pontoCardImage: {
        width: '100%',
        height: '100%',
        borderRadius: 6,
    },
});

export default CardComponent;
