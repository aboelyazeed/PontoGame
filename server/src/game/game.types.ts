// ==========================================
// Ponto Game - Game Types
// ==========================================

// Card Types
export type CardPosition = 'FW' | 'MF' | 'DF' | 'GK';
export type CardType = 'player' | 'action' | 'ponto';

export interface GameCard {
    id: string;
    type: CardType;
    name: string;
    nameAr: string;
    position?: CardPosition;
    attack?: number;
    defense?: number;
    description?: string;
    imageUrl?: string;
}

// Player State
export interface PlayerState {
    odium: string;
    odiumInfo: {
        username: string;
        displayName: string;
        level: number;
        rank: string;
    };
    socketId: string;
    hand: GameCard[];
    field: (GameCard | null)[];
    score: number;
    isReady: boolean;
}

// Game State
export interface GameState {
    id: string;
    status: 'waiting' | 'starting' | 'playing' | 'finished';
    currentTurn: string; // odium of player whose turn it is
    turnPhase: 'draw' | 'play' | 'attack' | 'end';
    turnNumber: number;
    turnStartTime: number;
    turnTimeLimit: number; // in seconds

    player1: PlayerState;
    player2: PlayerState | null;

    lastAction?: GameAction;
    winner?: string;
}

// Game Actions
export type GameActionType =
    | 'play_card'
    | 'attack'
    | 'defend'
    | 'use_ability'
    | 'end_turn'
    | 'draw_card';

export interface GameAction {
    type: GameActionType;
    playerId: string;
    data?: {
        cardId?: string;
        slotIndex?: number;
        targetSlotIndex?: number;
        targetPlayerId?: string;
    };
    timestamp: number;
}

// Socket Events - Client to Server
export interface ClientToServerEvents {
    // Matchmaking
    join_queue: () => void;
    leave_queue: () => void;

    // Game Actions
    ready: () => void;
    play_card: (data: { cardId: string; slotIndex: number }) => void;
    attack: (data: { attackerSlotIndex: number; defenderSlotIndex: number }) => void;
    end_turn: () => void;

    // Chat
    send_message: (message: string) => void;

    // Disconnect
    leave_game: () => void;
}

// Socket Events - Server to Client
export interface ServerToClientEvents {
    // Connection
    connected: (data: { playerId: string }) => void;

    // Matchmaking
    queue_joined: (data: { position: number }) => void;
    queue_left: () => void;
    match_found: (data: { opponentName: string }) => void;

    // Game Events
    game_start: (gameState: GameState) => void;
    game_update: (gameState: GameState) => void;
    turn_start: (data: { playerId: string; timeLimit: number }) => void;

    // Action Results
    card_played: (data: { playerId: string; card: GameCard; slotIndex: number }) => void;
    attack_result: (data: {
        attackerId: string;
        defenderId: string;
        attackerCard: GameCard;
        defenderCard: GameCard;
        result: 'win' | 'lose' | 'draw';
        damage: number;
    }) => void;

    // Game End
    game_end: (data: { winnerId: string; reason: string }) => void;

    // Errors
    error: (data: { message: string; code: string }) => void;

    // Chat
    message_received: (data: { playerId: string; message: string }) => void;

    // Opponent Events
    opponent_disconnected: () => void;
    opponent_reconnected: () => void;
}

// Queue Entry
export interface QueueEntry {
    odium: string;
    socketId: string;
    username: string;
    displayName: string;
    level: number;
    rank: string;
    joinedAt: number;
}
