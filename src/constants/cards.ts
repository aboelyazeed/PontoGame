// ==========================================
// Ponto Game - Card Definitions
// ==========================================

import {
    CardType,
    PlayerPosition,
    ActionCardEffect,
    LegendaryAbility,
    GamePhase,
    PlayerCard,
    ActionCard,
    PontoCard,
} from '../types';

// Simple ID generator that works without crypto
let idCounter = 0;
function generateId(): string {
    return `card_${Date.now()}_${++idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

// ==========================================
// Player Card Templates
// ==========================================

interface PlayerCardTemplate {
    position: PlayerPosition;
    attack: number;
    defense: number;
    count: number;
    name: string;
    nameAr: string;
}

export const PLAYER_CARD_TEMPLATES: PlayerCardTemplate[] = [
    // Defense
    {
        position: PlayerPosition.GOALKEEPER,
        attack: 0,
        defense: 8,
        count: 8,
        name: 'Goalkeeper',
        nameAr: 'حارس مرمى',
    },
    {
        position: PlayerPosition.DEFENDER,
        attack: 0,
        defense: 6,
        count: 8,
        name: 'Defender',
        nameAr: 'مدافع',
    },
    // Midfield
    {
        position: PlayerPosition.MIDFIELDER,
        attack: 2,
        defense: 3,
        count: 12,
        name: 'Defensive Midfielder',
        nameAr: 'لاعب وسط دفاعي',
    },
    {
        position: PlayerPosition.MIDFIELDER,
        attack: 3,
        defense: 2,
        count: 12,
        name: 'Attacking Midfielder',
        nameAr: 'لاعب وسط هجومي',
    },
    // Attack
    {
        position: PlayerPosition.FORWARD,
        attack: 4,
        defense: 0,
        count: 8,
        name: 'Forward',
        nameAr: 'مهاجم',
    },
    {
        position: PlayerPosition.STRIKER,
        attack: 6,
        defense: 0,
        count: 4,
        name: 'Striker',
        nameAr: 'هداف',
    },
];

// ==========================================
// Legendary Player Definitions
// ==========================================

interface LegendaryPlayerTemplate {
    name: string;
    nameAr: string;
    attack: number;
    defense: number;
    ability: LegendaryAbility;
    abilityNameAr: string;
    abilityDescription: string;
}

export const LEGENDARY_PLAYERS: LegendaryPlayerTemplate[] = [
    {
        name: 'Ronaldo - The Dozen',
        nameAr: 'رونالدو - الدووزن',
        attack: 8,
        defense: 0,
        ability: LegendaryAbility.NULLIFY_EFFECTS,
        abilityNameAr: 'إلغاء التأثيرات',
        abilityDescription: 'إلغاء أي أحكام/تأثيرات للخصم',
    },
    {
        name: 'Iniesta - The Artist',
        nameAr: 'إنيستا - الرسام',
        attack: 6,
        defense: 6,
        ability: LegendaryAbility.REUSE_ONCE,
        abilityNameAr: 'إعادة الاستخدام',
        abilityDescription: 'بعد الاستخدام يمكن قلبه واستخدامه مرة ثانية فقط',
    },
    {
        name: 'Shehata - Abu Kaff',
        nameAr: 'شحاتة أبو كف',
        attack: 4,
        defense: 2,
        ability: LegendaryAbility.DRAW_CARDS,
        abilityNameAr: 'سحب الكروت',
        abilityDescription: 'سحب 2 بونطو في الهجوم أو 2 Special دفاعي',
    },
    {
        name: 'Modric - The Maestro',
        nameAr: 'مودريتش - المايسترو',
        attack: 6,
        defense: 6,
        ability: LegendaryAbility.BOOST_TEAM,
        abilityNameAr: 'تعزيز الفريق',
        abilityDescription: '+1 Attack & Defense لكل لاعبيك طالما في الملعب',
    },
    {
        name: 'Messi - The Goat',
        nameAr: 'ميسي - المعزة',
        attack: 8,
        defense: 0,
        ability: LegendaryAbility.NULLIFY_TACTICS,
        abilityNameAr: 'إلغاء التكتيكات',
        abilityDescription: 'إلغاء أي تكتيكات للخصم عند لعبه',
    },
    {
        name: 'Lev Yashin - Abu Yassin',
        nameAr: 'ليف ياشين - أبو ياسين',
        attack: 0,
        defense: 9,
        ability: LegendaryAbility.NULLIFY_PONTO,
        abilityNameAr: 'إلغاء البونطو',
        abilityDescription: 'إزالة نقاط كارت البونطو أثناء الدفاع',
    },
];

// ==========================================
// Action Card Definitions
// ==========================================

interface ActionCardTemplate {
    name: string;
    nameAr: string;
    effect: ActionCardEffect;
    effectDescription: string;
    canUseInPhase: GamePhase[];
    count: number;
}

export const ACTION_CARD_TEMPLATES: ActionCardTemplate[] = [
    {
        name: 'Swap',
        nameAr: 'قصب بقصب',
        effect: ActionCardEffect.SWAP_PLAYERS,
        effectDescription: 'تبادل لاعب بلاعب (تختار أنت)',
        canUseInPhase: [GamePhase.TURN],
        count: 4,
    },
    {
        name: 'Legal Shoulder',
        nameAr: 'كتف قانوني',
        effect: ActionCardEffect.DEFENSE_BOOST_2,
        effectDescription: '+2 Defense أثناء الدفاع',
        canUseInPhase: [GamePhase.DEFENSE],
        count: 4,
    },
    {
        name: 'VAR',
        nameAr: 'VAR',
        effect: ActionCardEffect.VAR_CHECK,
        effectDescription: 'تسحب كارت بونطو - ≥4 إلغاء الهجمة، <4 استقبال هدف',
        canUseInPhase: [GamePhase.DEFENSE],
        count: 4,
    },
    {
        name: 'Mercato',
        nameAr: 'ميركاتو',
        effect: ActionCardEffect.DRAW_2_PLAYERS,
        effectDescription: 'سحب 2 لاعبين',
        canUseInPhase: [GamePhase.TURN],
        count: 4,
    },
    {
        name: 'The Biter',
        nameAr: 'العضاض',
        effect: ActionCardEffect.ATTACK_BOOST_THEN_EXPEL,
        effectDescription: '+4 Attack ثم طرد اللاعب وإغلاق Slot',
        canUseInPhase: [GamePhase.ATTACK],
        count: 4,
    },
    {
        name: 'Red Card',
        nameAr: 'كارت أحمر',
        effect: ActionCardEffect.EXPEL_ATTACKER,
        effectDescription: 'طرد مهاجم من الخصم',
        canUseInPhase: [GamePhase.DEFENSE],
        count: 4,
    },
    {
        name: 'Yellow Card',
        nameAr: 'كارت أصفر',
        effect: ActionCardEffect.ATTACK_PENALTY_2,
        effectDescription: '-2 Attack، بطاقتين = طرد',
        canUseInPhase: [GamePhase.DEFENSE],
        count: 4,
    },
];

// ==========================================
// Ponto Card Values
// ==========================================

export const PONTO_VALUES = [1, 2, 3, 4, 5] as const;
export const PONTO_CARDS_PER_VALUE = 5;

// ==========================================
// Deck Generation Functions
// ==========================================

export function generatePlayerCardDeck(): PlayerCard[] {
    const deck: PlayerCard[] = [];

    // Generate normal player cards
    PLAYER_CARD_TEMPLATES.forEach((template) => {
        for (let i = 0; i < template.count; i++) {
            deck.push({
                id: generateId(),
                type: CardType.PLAYER,
                name: template.name,
                nameAr: template.nameAr,
                position: template.position,
                attack: template.attack,
                defense: template.defense,
                isLegendary: false,
                isRevealed: false,
                yellowCards: 0,
                isExpelled: false,
            });
        }
    });

    // Generate legendary player cards
    LEGENDARY_PLAYERS.forEach((legendary) => {
        deck.push({
            id: generateId(),
            type: CardType.PLAYER,
            name: legendary.name,
            nameAr: legendary.nameAr,
            position: PlayerPosition.FORWARD, // Legendaries can play any position
            attack: legendary.attack,
            defense: legendary.defense,
            isLegendary: true,
            legendary: {
                ability: legendary.ability,
                abilityNameAr: legendary.abilityNameAr,
                abilityDescription: legendary.abilityDescription,
            },
            isRevealed: false,
            yellowCards: 0,
            isExpelled: false,
        });
    });

    return deck;
}

export function generateActionCardDeck(): ActionCard[] {
    const deck: ActionCard[] = [];

    ACTION_CARD_TEMPLATES.forEach((template) => {
        for (let i = 0; i < template.count; i++) {
            deck.push({
                id: generateId(),
                type: CardType.ACTION,
                name: template.name,
                nameAr: template.nameAr,
                effect: template.effect,
                effectDescription: template.effectDescription,
                canUseInPhase: template.canUseInPhase,
            });
        }
    });

    return deck;
}

export function generatePontoCardDeck(): PontoCard[] {
    const deck: PontoCard[] = [];

    PONTO_VALUES.forEach((value) => {
        for (let i = 0; i < PONTO_CARDS_PER_VALUE; i++) {
            deck.push({
                id: generateId(),
                type: CardType.PONTO,
                name: `Ponto ${value}`,
                nameAr: `بونطو ${value}`,
                value,
            });
        }
    });

    return deck;
}

// ==========================================
// Utility Functions
// ==========================================

export function shuffleDeck<T>(deck: T[]): T[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function drawCards<T>(deck: T[], count: number): { cards: T[]; remainingDeck: T[] } {
    const cards = deck.slice(0, count);
    const remainingDeck = deck.slice(count);
    return { cards, remainingDeck };
}

// ==========================================
// Game Constants
// ==========================================

export const GAME_CONSTANTS = {
    // Match settings
    MAX_MATCH_TIME: 1200, // 20 minutes in seconds
    WINNING_SCORE: 5,

    // Turn settings
    TURN_TIME: 90, // 1.5 minutes per turn
    MAX_MOVES_PER_TURN: 3,
    ATTACK_MOVE_COST: 2,
    DEFENSE_MOVES: 3,
    EXTRA_TIME_FOR_LAST_MOVE: 60, // 1 minute

    // Card settings
    INITIAL_SLOT_COUNT: 5,
    INITIAL_HAND_PLAYERS: 2,
    INITIAL_ACTION_CARDS: 3,
    LEGENDARY_DISCARD_COST: 2,

    // Yellow card settings
    YELLOW_CARD_ATTACK_PENALTY: 2,
    YELLOW_CARDS_FOR_EXPEL: 2,

    // Action card effects
    SHOULDER_DEFENSE_BOOST: 2,
    BITER_ATTACK_BOOST: 4,
    VAR_THRESHOLD: 4,
};

// ==========================================
// Position Colors (for UI)
// ==========================================

export const POSITION_COLORS = {
    [PlayerPosition.GOALKEEPER]: '#FFD700', // Gold
    [PlayerPosition.DEFENDER]: '#4169E1', // Royal Blue
    [PlayerPosition.MIDFIELDER]: '#32CD32', // Lime Green
    [PlayerPosition.FORWARD]: '#FF6347', // Tomato
    [PlayerPosition.STRIKER]: '#DC143C', // Crimson
};
