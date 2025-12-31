// ==========================================
// Ponto Game - Type Definitions
// ==========================================

// ==========================================
// Enums
// ==========================================

export enum CardType {
    PLAYER = 'PLAYER',
    ACTION = 'ACTION',
    PONTO = 'PONTO',
}

export enum PlayerPosition {
    GOALKEEPER = 'GOALKEEPER',
    DEFENDER = 'DEFENDER',
    MIDFIELDER = 'MIDFIELDER',
    FORWARD = 'FORWARD',
    STRIKER = 'STRIKER',
}

export enum ActionCardEffect {
    SWAP_PLAYERS = 'SWAP_PLAYERS', // قصب بقصب
    DEFENSE_BOOST_2 = 'DEFENSE_BOOST_2', // كتف قانوني
    VAR_CHECK = 'VAR_CHECK', // VAR
    DRAW_2_PLAYERS = 'DRAW_2_PLAYERS', // ميركاتو
    ATTACK_BOOST_THEN_EXPEL = 'ATTACK_BOOST_THEN_EXPEL', // العضاض
    EXPEL_ATTACKER = 'EXPEL_ATTACKER', // كارت أحمر
    ATTACK_PENALTY_2 = 'ATTACK_PENALTY_2', // كارت أصفر
}

export enum LegendaryAbility {
    NULLIFY_EFFECTS = 'NULLIFY_EFFECTS', // رونالدو - إلغاء تأثيرات الخصم
    REUSE_ONCE = 'REUSE_ONCE', // إنيستا - استخدام مرتين
    DRAW_CARDS = 'DRAW_CARDS', // شحاتة - سحب كروت
    BOOST_TEAM = 'BOOST_TEAM', // مودريتش - تعزيز الفريق
    NULLIFY_TACTICS = 'NULLIFY_TACTICS', // ميسي - إلغاء تكتيكات
    NULLIFY_PONTO = 'NULLIFY_PONTO', // ياشين - إلغاء نقاط البونطو
}

export enum GamePhase {
    SETUP = 'SETUP',
    TURN = 'TURN',
    ATTACK = 'ATTACK',
    DEFENSE = 'DEFENSE',
    RESOLUTION = 'RESOLUTION',
    GAME_OVER = 'GAME_OVER',
    GOLDEN_GOAL = 'GOLDEN_GOAL',
}

export enum GameStatus {
    WAITING = 'WAITING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED',
}

// ==========================================
// Card Interfaces
// ==========================================

export interface BaseCard {
    id: string;
    type: CardType;
    name: string;
    nameAr: string;
}

export interface PlayerCard extends BaseCard {
    type: CardType.PLAYER;
    position: PlayerPosition;
    attack: number;
    defense: number;
    isLegendary: boolean;
    legendary?: {
        ability: LegendaryAbility;
        abilityNameAr: string;
        abilityDescription: string;
    };
    isRevealed: boolean;
    yellowCards: number; // 0, 1, or 2 (expelled)
    isExpelled: boolean;
}

export interface ActionCard extends BaseCard {
    type: CardType.ACTION;
    effect: ActionCardEffect;
    effectDescription: string;
    canUseInPhase: GamePhase[];
}

export interface PontoCard extends BaseCard {
    type: CardType.PONTO;
    value: number; // 1-5
}

export type Card = PlayerCard | ActionCard | PontoCard;

// ==========================================
// Player & Game State Interfaces
// ==========================================

export interface PlayerSlot {
    index: number;
    card: PlayerCard | null;
    isLocked: boolean; // Locked when player is expelled with العضاض
}

export interface PlayerState {
    id: string;
    name: string;
    score: number;
    slots: PlayerSlot[];
    hand: Card[];
    isCurrentTurn: boolean;
    movesRemaining: number;
    timeRemaining: number; // seconds
    defenseMoves: number; // During defense phase
}

export interface AttackState {
    attackerId: string;
    defenderId: string;
    attackPoints: number;
    defensePoints: number;
    usedPontoCards: PontoCard[];
    usedActionCards: ActionCard[];
    attackerActionsComplete: boolean;
    defenderMoves: number;
}

export interface GameState {
    id: string;
    status: GameStatus;
    phase: GamePhase;
    players: {
        player1: PlayerState;
        player2: PlayerState;
    };
    currentPlayerId: string;
    currentAttack: AttackState | null;
    matchTimeElapsed: number; // seconds
    maxMatchTime: number; // 1200 seconds (20 minutes)
    winnerId: string | null;
    turnNumber: number;

    // Decks
    playerCardDeck: PlayerCard[];
    actionCardDeck: ActionCard[];
    pontoCardDeck: PontoCard[];
    discardPile: Card[];
}

// ==========================================
// Game Actions
// ==========================================

export enum GameActionType {
    // Turn Actions
    SWAP_CARD = 'SWAP_CARD',
    REVEAL_CARD = 'REVEAL_CARD',
    PLAY_LEGENDARY = 'PLAY_LEGENDARY',
    PLAY_ACTION_CARD = 'PLAY_ACTION_CARD',
    DECLARE_ATTACK = 'DECLARE_ATTACK',
    END_TURN = 'END_TURN',

    // Attack Actions
    PLAY_PONTO_CARD = 'PLAY_PONTO_CARD',
    FINALIZE_ATTACK = 'FINALIZE_ATTACK',

    // Defense Actions
    DEFEND = 'DEFEND',
    USE_DEFENSE_CARD = 'USE_DEFENSE_CARD',
    SKIP_DEFENSE = 'SKIP_DEFENSE',
}

export interface GameAction {
    type: GameActionType;
    playerId: string;
    timestamp: number;
    payload?: Record<string, unknown>;
}

export interface SwapCardAction extends GameAction {
    type: GameActionType.SWAP_CARD;
    payload: {
        handCardId: string;
        slotIndex: number;
    };
}

export interface RevealCardAction extends GameAction {
    type: GameActionType.REVEAL_CARD;
    payload: {
        slotIndex: number;
    };
}

export interface PlayLegendaryAction extends GameAction {
    type: GameActionType.PLAY_LEGENDARY;
    payload: {
        legendaryCardId: string;
        discardCardIds: [string, string]; // Must discard 2 cards
        targetSlotIndex: number;
    };
}

export interface PlayActionCardAction extends GameAction {
    type: GameActionType.PLAY_ACTION_CARD;
    payload: {
        cardId: string;
        targetInfo?: {
            targetPlayerId?: string;
            targetSlotIndex?: number;
            targetCardId?: string;
        };
    };
}

export interface DeclareAttackAction extends GameAction {
    type: GameActionType.DECLARE_ATTACK;
}

export interface PlayPontoCardAction extends GameAction {
    type: GameActionType.PLAY_PONTO_CARD;
    payload: {
        cardId: string;
    };
}

// ==========================================
// UI State
// ==========================================

export interface UIState {
    selectedCard: Card | null;
    selectedSlot: number | null;
    showCardDetail: boolean;
    animatingCard: string | null;
    isLoading: boolean;
    errorMessage: string | null;
}

// ==========================================
// Connection State
// ==========================================

export enum ConnectionStatus {
    DISCONNECTED = 'DISCONNECTED',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    RECONNECTING = 'RECONNECTING',
    ERROR = 'ERROR',
}

export interface ConnectionState {
    status: ConnectionStatus;
    roomId: string | null;
    playerId: string | null;
    opponentId: string | null;
    latency: number;
}

// ==========================================
// User & Auth
// ==========================================

export interface User {
    id: string;
    username: string;
    email: string;
    createdAt: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
