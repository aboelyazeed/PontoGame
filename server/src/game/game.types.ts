// ==========================================
// Ponto Game - Game Types
// ==========================================

// Card Types
export type CardPosition = 'FW' | 'MF' | 'DF' | 'GK';
export type CardType = 'player' | 'action' | 'ponto';
export type ActionEffect = 'swap' | 'shoulder' | 'var' | 'mercato' | 'biter' | 'red_card' | 'yellow_card';

// Legendary Abilities (PRD Section 9)
export type LegendaryAbility =
    | 'ronaldo'   // الدووزن - إلغاء أي أحكام/تأثيرات للخصم
    | 'iniesta'   // الرسام - يمكن قلبه واستخدامه مرة ثانية
    | 'shehata'   // أبو كف - سحب 2 بونطو أو 2 Action
    | 'modric'    // المايسترو - +1 ATK/DEF لكل لاعبيك
    | 'messi'     // المعزة - إلغاء أي تكتيكات للخصم
    | 'yashin';   // أبو ياسين - إزالة نقاط البونطو

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
    isRevealed?: boolean;
    actionEffect?: ActionEffect;
    yellowCards?: number;
    // Legendary fields
    isLegendary?: boolean;
    legendaryAbility?: LegendaryAbility;
    usedAbility?: boolean; // For Iniesta's one-time reuse
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
    movesRemaining: number; // Max 3 per turn (PRD)
    lockedSlots: number[]; // Slots permanently locked by Biter card
    nextAttackCancelled: boolean; // VAR effect - next attack auto-cancelled
}

// Game State
export interface GameState {
    id: string;
    roomName?: string;
    roomCode?: string;
    isPrivate?: boolean;
    hasPassword?: boolean;
    password?: string; // Internal use only
    status: 'waiting' | 'starting' | 'playing' | 'finished';
    currentTurn: string; // odium of player whose turn it is
    turnPhase: 'draw' | 'play' | 'attack' | 'defense' | 'end';
    turnNumber: number;
    turnStartTime: number;
    turnTimeLimit: number; // in seconds

    player1: PlayerState;
    player2: PlayerState | null;

    // Shared decks for the game (cards are removed when drawn)
    decks?: {
        playerDeck: GameCard[];
        actionDeck: GameCard[];
        pontoDeck: GameCard[];
        // Discard piles for reshuffling when decks are empty
        playerDiscard: GameCard[];
        actionDiscard: GameCard[];
        pontoDiscard: GameCard[];
    };

    // Attack/Defense phase tracking
    pendingAttack?: {
        attackerId: string;              // Player who initiated attack
        attackerSlots: number[];         // Slots of revealed attackers (max 2)
        attackSum: number;               // Sum of attacker attacks + Ponto
        pontoCard?: GameCard;            // The drawn Ponto card (visible to both)
        defenseSum: number;              // Accumulated defense from revealed defenders
        defenderSlots: number[];         // Slots of revealed defenders (max 3)
        defenderMovesRemaining?: number; // Moves remaining for defender if phase persists
    };

    // Match timer (PRD: 20 minutes)
    matchStartTime?: number;
    matchTimeLimit: number; // 20 min = 1200 seconds
    isGoldenGoal?: boolean; // Sudden death mode
    winReason?: 'score' | 'timeout' | 'golden_goal' | 'surrender' | 'disconnect';

    // Draw phase tracking - player must draw 2 cards at start of turn
    drawsRemaining?: number; // How many cards left to draw (0-2)

    lastAction?: GameAction;
    winner?: string;
    serverTime?: number; // For clock synchronization
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

    // Room Management
    create_room: (data: { isPrivate: boolean; password?: string; roomName?: string }) => void;
    get_rooms: () => void;
    join_room: (data: { roomId: string; password?: string }) => void;
    join_room_by_code: (data: { roomCode: string; password?: string }) => void;
    leave_room: (data: { roomId: string }) => void;
    kick_player: (data: { roomId: string; playerId: string }) => void;
    transfer_host: (data: { roomId: string; newHostId: string }) => void;
    get_online_count: () => void;

    // Game Actions
    ready: () => void;
    start_game: (data: { roomId: string }) => void;
    draw_from_deck: (data: { deckType: 'player' | 'action' }) => void;
    play_card: (data: { cardId: string; slotIndex: number }) => void;
    draw_cards: (data: { cardType: 'player' | 'action' | 'ponto'; count: number }) => void;

    // New Attack/Defense Flow
    reveal_attacker: (data: { slotIndex: number }) => void;
    draw_ponto: () => void;
    end_attack_phase: () => void;
    reveal_defender: (data: { slotIndex: number }) => void;
    accept_goal: () => void;
    end_defense: () => void;

    flip_card: (data: { slotIndex: number }) => void;
    swap_cards: (data: { handCardId: string; fieldSlotIndex: number }) => void;
    use_action_card: (data: {
        cardId: string;
        slotIndex1?: number;
        slotIndex2?: number;
        isOpponentSlot1?: boolean;
        isOpponentSlot2?: boolean;
    }) => void;
    summon_legendary: (data: {
        legendaryCardId: string;
        discardCardIds: [string, string];
        fieldSlotIndex: number;
    }) => void;
    end_turn: () => void;

    // Chat
    send_message: (message: string) => void;

    // Game Control
    surrender: () => void;
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

    // Room Management
    room_created: (room: GameState) => void;
    rooms_list: (rooms: GameState[]) => void;
    rooms_list_update: (rooms: GameState[]) => void;

    // Room Membership
    join_success: (room: GameState) => void;
    room_update: (room: GameState) => void;
    player_joined: (data: { player: any }) => void;
    player_left: (playerId: string) => void;
    kicked: (data: { playerId: string }) => void;
    host_changed: (data: { newHostId: string }) => void;

    // Game Events
    game_start: (gameState: GameState) => void;
    game_update: (gameState: GameState) => void;
    turn_start: (data: { playerId: string; timeLimit: number; remainingTime: number; turnStartTime: number }) => void;

    // Action Results
    card_played: (data: { playerId: string; card: GameCard; slotIndex: number }) => void;
    cards_drawn: (data: { cardType: 'player' | 'action' | 'ponto'; drawnCards: GameCard[] }) => void;
    card_drawn: (data: { cardType: 'player' | 'action'; drawnCard: GameCard; drawsRemaining: number }) => void;

    // New Attack/Defense Flow Events
    attacker_revealed: (data: { playerId: string; slotIndex: number; pontoCard?: GameCard; attackSum?: number }) => void;
    ponto_drawn: (data: { pontoCard: GameCard; attackSum: number }) => void;
    defense_phase_started: (data: { attackSum: number; defenderId: string }) => void;
    defender_revealed: (data: { playerId: string; slotIndex: number; defenseSum?: number }) => void;
    goal_scored: (data: { scorerId?: string }) => void;
    attack_resolved: (data: { result: 'goal' | 'blocked'; scorerId?: string }) => void;

    action_card_used: (data: { playerId: string; cardId: string; drawnCards?: GameCard[]; varResult?: number }) => void;

    // Game End
    game_end: (data: { winnerId: string; reason: string; winReason?: string }) => void;

    // Errors
    error: (data: { message: string; code: string }) => void;

    // Chat
    message_received: (data: { playerId: string; message: string }) => void;

    // Opponent Events
    opponent_disconnected: () => void;
    opponent_reconnected: () => void;

    // Online Users
    online_users_update: (data: { count: number }) => void;
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
