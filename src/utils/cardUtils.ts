// ==========================================
// Card Utility Functions
// ==========================================

import { GameCard } from '../hooks/useGameLogic';
import { CARD_IMAGES } from '../constants/cardImages';
import { COLORS } from '../constants/theme';

/**
 * Get the image source for a card based on its position or imageUrl
 */
export const getCardImage = (card: GameCard): any => {
    if (card.imageUrl && CARD_IMAGES[card.imageUrl]) {
        return CARD_IMAGES[card.imageUrl];
    }
    switch (card.position) {
        case 'GK': return CARD_IMAGES['GK.png'];
        case 'DF': return CARD_IMAGES['DF.png'];
        case 'MF': return card.defense && card.defense > 3 ? CARD_IMAGES['CDM.png'] : CARD_IMAGES['CAM.png'];
        case 'FW': return CARD_IMAGES['FW.png'];
        default: return null;
    }
};

/**
 * Get color based on player position
 */
export const getPositionColor = (position?: string): string => {
    switch (position) {
        case 'FW': return COLORS.warning;
        case 'MF': return COLORS.primary;
        case 'DF': return '#3b82f6'; // info blue
        case 'GK': return '#F97316'; // ponto orange
        default: return COLORS.primary;
    }
};

/**
 * Format seconds to mm:ss display
 */
export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};
