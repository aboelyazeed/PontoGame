// ==========================================
// Card Images Mapping
// ==========================================

// Player Card Images
export const PLAYER_CARD_IMAGES: Record<string, any> = {
    'GK.png': require('../../assets/Cards/GK.png'),
    'DF.png': require('../../assets/Cards/DF.png'),
    'CDM.png': require('../../assets/Cards/CDM.png'),
    'CAM.png': require('../../assets/Cards/CAM.png'),
    'FW.png': require('../../assets/Cards/FW.png'),
    'ST.png': require('../../assets/Cards/ST.png'),
};

// Ponto Card Images
export const PONTO_CARD_IMAGES: Record<number, any> = {
    1: require('../../assets/Cards/Ponto Cards/Ponto +1.png'),
    2: require('../../assets/Cards/Ponto Cards/Ponto +2.png'),
    3: require('../../assets/Cards/Ponto Cards/Ponto +3.png'),
    4: require('../../assets/Cards/Ponto Cards/Ponto +4.png'),
    5: require('../../assets/Cards/Ponto Cards/Ponto +5.png'),
};

// Card Back Images
export const CARD_BACK_IMAGES = {
    ponto: require('../../assets/Cards/Cards Back/Ponto Back.png'),
    player: require('../../assets/Cards/Cards Back/PlayerCard Back.png'),
    action: require('../../assets/Cards/Cards Back/ActionCard Back.png'),
};

// Legacy export for backwards compatibility
export const CARD_IMAGES = PLAYER_CARD_IMAGES;
