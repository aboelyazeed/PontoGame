// ==========================================
// Ponto Game - Constants & Data
// ==========================================

import { CardType, CardPosition } from './types';

// Game Rules
export const GAME_RULES = {
    MATCH_DURATION_MINUTES: 20,
    TURN_DURATION_SECONDS: 90,
    MAX_MOVES_PER_TURN: 3,
    WINNING_IS_GOALS: 5,
    INITIAL_HAND_SIZE: 2,
    INITIAL_FIELD_SIZE: 5,
    INITIAL_ACTION_CARDS: 3,
};

// Card Definitions
export interface CardDefinition {
    id: string; // unique template ID
    type: CardType;
    position?: CardPosition;
    name: string;
    description?: string;
    attack?: number;
    defense?: number;
    isLegendary?: boolean;
    costToPlay?: number; // Cards to discard used for Legendaries
}

export const PLAYER_CARDS: CardDefinition[] = [
    // --- DEFENSE ---
    { id: 'gk_basic', type: 'player', position: 'GK', name: 'حارس مرمى', attack: 0, defense: 8 },
    { id: 'df_basic', type: 'player', position: 'DF', name: 'مدافع', attack: 0, defense: 6 },

    // --- MIDFIELD ---
    { id: 'mf_type1', type: 'player', position: 'MF', name: 'وسط ملعب (هجومي)', attack: 3, defense: 2 },
    { id: 'mf_type2', type: 'player', position: 'MF', name: 'وسط ملعب (دفاعي)', attack: 2, defense: 3 },

    // --- ATTACK ---
    { id: 'fw_basic', type: 'player', position: 'FW', name: 'مهاجم', attack: 4, defense: 0 },
    { id: 'st_basic', type: 'player', position: 'FW', name: 'رأس حربة', attack: 6, defense: 0 },
];

export const LEGENDARY_CARDS: CardDefinition[] = [
    { id: 'leg_ronaldo', type: 'player', position: 'FW', name: 'رونالدو – الدووزن', attack: 8, defense: 0, isLegendary: true, description: 'إلغاء أي أحكام/تأثيرات للخصم', costToPlay: 2 },
    { id: 'leg_iniesta', type: 'player', position: 'MF', name: 'إنيستا – الرسام', attack: 6, defense: 6, isLegendary: true, description: 'بعد الاستخدام يمكن قلبه واستخدامه مرة ثانية فقط', costToPlay: 2 },
    { id: 'leg_shehata', type: 'player', position: 'MF', name: 'شحاتة أبو كف', attack: 4, defense: 2, isLegendary: true, description: 'سحب 2 بونطو في الهجوم أو 2 Special دفاعي', costToPlay: 2 },
    { id: 'leg_modric', type: 'player', position: 'MF', name: 'مودريتش – المايسترو', attack: 6, defense: 6, isLegendary: true, description: '+1 Attack & Defense لكل لاعبيك طالما في الملعب', costToPlay: 2 },
    { id: 'leg_messi', type: 'player', position: 'FW', name: 'ميسي – المعزة', attack: 8, defense: 0, isLegendary: true, description: 'إلغاء أي تكتيكات للخصم عند لعبه', costToPlay: 2 },
    { id: 'leg_yashin', type: 'player', position: 'GK', name: 'ليف ياشين – أبو ياسين', attack: 0, defense: 9, isLegendary: true, description: 'إزالة نقاط كارت البونطو أثناء الدفاع', costToPlay: 2 },
];

export const ACTION_CARDS: CardDefinition[] = [
    { id: 'act_swap', type: 'action', name: 'قصب بقصب', description: 'تبادل لاعب بلاعب (تختار أنت)' },
    { id: 'act_shoulder', type: 'action', name: 'كتف قانوني', description: '+2 Defense أثناء الدفاع' },
    { id: 'act_var', type: 'action', name: 'VAR', description: 'اسحب كارت بونطو: إذا ≥ 4 تلغى الهجمة، وإلا هدف' },
    { id: 'act_mercato', type: 'action', name: 'ميركاتو', description: 'سحب 2 لاعبين' },
    { id: 'act_biter', type: 'action', name: 'العضاض', description: '+4 Attack ثم طرد لاعبك' },
    { id: 'act_red_card', type: 'action', name: 'كارت أحمر', description: 'طرد مهاجم من الخصم' },
    { id: 'act_yellow_card', type: 'action', name: 'كارت أصفر', description: '-2 Attack (انذارين = طرد)' },
];

export const PONTO_CARDS: CardDefinition[] = [
    { id: 'ponto_1', type: 'ponto', name: 'بونطو +1', attack: 1 },
    { id: 'ponto_2', type: 'ponto', name: 'بونطو +2', attack: 2 },
    { id: 'ponto_3', type: 'ponto', name: 'بونطو +3', attack: 3 },
    { id: 'ponto_4', type: 'ponto', name: 'بونطو +4', attack: 4 },
    { id: 'ponto_5', type: 'ponto', name: 'بونطو +5', attack: 5 },
];
