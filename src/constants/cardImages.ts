// ==========================================
// Card Images Mapping
// ==========================================

// Player Card Images (Common players from Players/Commen folder)
export const PLAYER_CARD_IMAGES: Record<string, any> = {
    'GK': require('../../assets/Cards/Players/Commen/GK.png'),
    'CB': require('../../assets/Cards/Players/Commen/CB.png'),
    'CAM': require('../../assets/Cards/Players/Commen/CAM.png'),
    'CDM': require('../../assets/Cards/Players/Commen/CDM.png'),
    'FW': require('../../assets/Cards/Players/Commen/FW.png'),
    'ST': require('../../assets/Cards/Players/Commen/ST.png'),
    // Legacy mappings for backwards compatibility
    'GK.png': require('../../assets/Cards/Players/Commen/GK.png'),
    'DF.png': require('../../assets/Cards/Players/Commen/CB.png'),
    'CB.png': require('../../assets/Cards/Players/Commen/CB.png'),
    'CDM.png': require('../../assets/Cards/Players/Commen/CDM.png'),
    'CAM.png': require('../../assets/Cards/Players/Commen/CAM.png'),
    'FW.png': require('../../assets/Cards/Players/Commen/FW.png'),
    'ST.png': require('../../assets/Cards/Players/Commen/ST.png'),
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
