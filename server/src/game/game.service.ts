// ==========================================
// Ponto Game - Game Service
// ==========================================

import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.js';
import {
    GameState,
    PlayerState,
    GameCard,
    QueueEntry,
    CardPosition
} from './game.types.js';

// ==========================================
// In-Memory Stores
// ==========================================
const matchmakingQueue: QueueEntry[] = [];
const activeGames: Map<string, GameState> = new Map();
const activeRooms: Map<string, GameState> = new Map(); // gameId -> GameState (Waiting rooms)
const roomCodes: Map<string, string> = new Map(); // roomCode -> gameId
const playerToGame: Map<string, string> = new Map(); // odium -> gameId

// ==========================================
// Full Card Deck (PRD Compliant)
// ==========================================

// Helper to generate multiple cards
function generateCards(count: number, template: Omit<GameCard, 'id'>): GameCard[] {
    return Array.from({ length: count }, (_, i) => ({
        ...template,
        id: `${template.position || template.type}_${i + 1}`,
    }));
}

// PLAYER CARDS - 30 total
// Distribution: 4 GK, 7 CB, 4 CDM, 4 CAM, 7 FW, 4 ST
const GOALKEEPER_CARDS: GameCard[] = generateCards(4, {
    type: 'player',
    name: 'Goalkeeper',
    nameAr: 'حارس المرمى',
    position: 'GK',
    attack: 0,
    defense: 8,
    description: 'حارس مرمى متمكن، يصد أقوى الضربات.',
    imageUrl: 'GK',
});

const DEFENDER_CARDS: GameCard[] = generateCards(7, {
    type: 'player',
    name: 'Center Back',
    nameAr: 'مدافع',
    position: 'DF',
    attack: 0,
    defense: 6,
    description: 'تصدّي قوي، يُوقف الهجمات ببراعة، درع صلب.',
    imageUrl: 'CB',
});

const MIDFIELDER_DEF_CARDS: GameCard[] = generateCards(4, {
    type: 'player',
    name: 'Central Defensive Midfielder',
    nameAr: 'لاعب وسط دفاعي',
    position: 'MF',
    attack: 2,
    defense: 3,
    description: 'تحكم بالوسط، يوزع اللعب ويساعد في الدفاع والهجوم ببراعة.',
    imageUrl: 'CDM',
});

const MIDFIELDER_ATK_CARDS: GameCard[] = generateCards(4, {
    type: 'player',
    name: 'Central Attacking Midfielder',
    nameAr: 'لاعب وسط هجومي',
    position: 'MF',
    attack: 3,
    defense: 2,
    description: 'صانع ألعاب ماهر، يخترق الدفاعات ويصنع فرصاً خطيرة.',
    imageUrl: 'CAM',
});

const FORWARD_CARDS: GameCard[] = generateCards(7, {
    type: 'player',
    name: 'Forward',
    nameAr: 'مهاجم',
    position: 'FW',
    attack: 4,
    defense: 0,
    description: 'مهاجم قناص، يمزق الشباك بضرباته القوية.',
    imageUrl: 'FW',
});

const STRIKER_CARDS: GameCard[] = generateCards(4, {
    type: 'player',
    name: 'Striker',
    nameAr: 'رأس حربة',
    position: 'FW',
    attack: 6,
    defense: 0,
    description: 'رأس حربة شرس، ينهي الهجمات بضربات مباشرة قوية.',
    imageUrl: 'ST',
});

// ACTION CARDS
// Rules = referee decisions (VAR, red_card, yellow_card)
// Tactics = strategic plays (swap, shoulder, mercato, biter)
const ACTION_CARDS: GameCard[] = [
    // Tactics cards
    { id: 'act_swap_1', type: 'action', name: 'Swap', nameAr: 'قصب بقصب', description: 'تبادل لاعب بلاعب (تختار أنت)', actionEffect: 'swap', actionSubtype: 'tactics' },
    { id: 'act_swap_2', type: 'action', name: 'Swap', nameAr: 'قصب بقصب', description: 'تبادل لاعب بلاعب (تختار أنت)', actionEffect: 'swap', actionSubtype: 'tactics' },
    { id: 'act_shoulder_1', type: 'action', name: 'Shoulder', nameAr: 'كتف قانوني', description: '+2 Defense أثناء الدفاع', actionEffect: 'shoulder', actionSubtype: 'tactics' },
    { id: 'act_shoulder_2', type: 'action', name: 'Shoulder', nameAr: 'كتف قانوني', description: '+2 Defense أثناء الدفاع', actionEffect: 'shoulder', actionSubtype: 'tactics' },
    { id: 'act_mercato_1', type: 'action', name: 'Mercato', nameAr: 'ميركاتو', description: 'سحب 2 لاعبين', actionEffect: 'mercato', actionSubtype: 'tactics' },
    { id: 'act_mercato_2', type: 'action', name: 'Mercato', nameAr: 'ميركاتو', description: 'سحب 2 لاعبين', actionEffect: 'mercato', actionSubtype: 'tactics' },
    { id: 'act_biter_1', type: 'action', name: 'Biter', nameAr: 'العضاض', description: '+4 Attack ثم طرد لاعبك', actionEffect: 'biter', actionSubtype: 'tactics' },
    { id: 'act_biter_2', type: 'action', name: 'Biter', nameAr: 'العضاض', description: '+4 Attack ثم طرد لاعبك', actionEffect: 'biter', actionSubtype: 'tactics' },
    // Rules cards (referee decisions)
    { id: 'act_var_1', type: 'action', name: 'VAR', nameAr: 'VAR', description: 'اسحب بونطو: ≥4 تلغى الهجمة، <4 هدف', actionEffect: 'var', actionSubtype: 'rules' },
    { id: 'act_var_2', type: 'action', name: 'VAR', nameAr: 'VAR', description: 'اسحب بونطو: ≥4 تلغى الهجمة، <4 هدف', actionEffect: 'var', actionSubtype: 'rules' },
    { id: 'act_red_1', type: 'action', name: 'Red Card', nameAr: 'كارت أحمر', description: 'طرد مهاجم من الخصم', actionEffect: 'red_card', actionSubtype: 'rules' },
    { id: 'act_red_2', type: 'action', name: 'Red Card', nameAr: 'كارت أحمر', description: 'طرد مهاجم من الخصم', actionEffect: 'red_card', actionSubtype: 'rules' },
    { id: 'act_yellow_1', type: 'action', name: 'Yellow Card', nameAr: 'كارت أصفر', description: '-2 Attack، بطاقتين = طرد', actionEffect: 'yellow_card', actionSubtype: 'rules' },
    { id: 'act_yellow_2', type: 'action', name: 'Yellow Card', nameAr: 'كارت أصفر', description: '-2 Attack، بطاقتين = طرد', actionEffect: 'yellow_card', actionSubtype: 'rules' },
];

// PONTO CARDS - 8 total cards
// Distribution: 2x +5, 2x +4, 2x +3, 1x +2, 1x +1
const PONTO_CARDS: GameCard[] = [
    // +5 (2 cards)
    { id: 'ponto_5_1', type: 'ponto', name: 'Ponto +5', nameAr: 'بونطو +5', attack: 5, imageUrl: 'Ponto +5.png' },
    { id: 'ponto_5_2', type: 'ponto', name: 'Ponto +5', nameAr: 'بونطو +5', attack: 5, imageUrl: 'Ponto +5.png' },
    // +4 (2 cards)
    { id: 'ponto_4_1', type: 'ponto', name: 'Ponto +4', nameAr: 'بونطو +4', attack: 4, imageUrl: 'Ponto +4.png' },
    { id: 'ponto_4_2', type: 'ponto', name: 'Ponto +4', nameAr: 'بونطو +4', attack: 4, imageUrl: 'Ponto +4.png' },
    // +3 (2 cards)
    { id: 'ponto_3_1', type: 'ponto', name: 'Ponto +3', nameAr: 'بونطو +3', attack: 3, imageUrl: 'Ponto +3.png' },
    { id: 'ponto_3_2', type: 'ponto', name: 'Ponto +3', nameAr: 'بونطو +3', attack: 3, imageUrl: 'Ponto +3.png' },
    // +2 (1 card)
    { id: 'ponto_2_1', type: 'ponto', name: 'Ponto +2', nameAr: 'بونطو +2', attack: 2, imageUrl: 'Ponto +2.png' },
    // +1 (1 card)
    { id: 'ponto_1_1', type: 'ponto', name: 'Ponto +1', nameAr: 'بونطو +1', attack: 1, imageUrl: 'Ponto +1.png' },
];

// LEGENDARY PLAYER CARDS - Only one of each hero exists
const LEGENDARY_CARDS: GameCard[] = [
    {
        id: 'leg_ronaldo',
        type: 'player',
        name: 'Ronaldo - El Duzen',
        nameAr: 'رونالدو – الدووزن',
        position: 'FW',
        attack: 8,
        defense: 0,
        description: 'يمنع الخصم من لعب كروت الأحكام (VAR، الكروت الملونة)',
        imageUrl: 'Ronaldo',
        isLegendary: true,
        legendaryAbility: 'ronaldo',
    },
    {
        id: 'leg_messi',
        type: 'player',
        name: 'Messi - The Goat',
        nameAr: 'ميسي – المعزة',
        position: 'FW',
        attack: 8,
        defense: 0,
        description: 'يمنع الخصم من لعب كروت التكتيكات',
        imageUrl: 'Messi',
        isLegendary: true,
        legendaryAbility: 'messi',
    },
    {
        id: 'leg_shehata',
        type: 'player',
        name: 'Abo Kaaf',
        nameAr: 'أبو كف',
        position: 'MF',
        attack: 4,
        defense: 2,
        description: 'يسمح بسحب بونطو إضافي في الهجوم أو الدفاع',
        imageUrl: 'AboKaf',
        isLegendary: true,
        legendaryAbility: 'shehata',
    },
];

// All player cards combined (non-legendary for field setup)
const PLAYER_CARDS: GameCard[] = [
    ...GOALKEEPER_CARDS,
    ...DEFENDER_CARDS,
    ...MIDFIELDER_DEF_CARDS,
    ...MIDFIELDER_ATK_CARDS,
    ...FORWARD_CARDS,
    ...STRIKER_CARDS,
];

// Full deck
const FULL_DECK = {
    players: PLAYER_CARDS,
    legendaryPlayers: LEGENDARY_CARDS,
    actions: ACTION_CARDS,
    pontos: PONTO_CARDS,
};

// Shuffle helper function
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Create a fresh shuffled copy of all decks for a new game
function createShuffledDecks() {
    // Combine regular players with legendary cards
    const allPlayerCards = [...PLAYER_CARDS, ...LEGENDARY_CARDS];
    
    // Create deep copies with unique IDs
    const playerDeck = shuffleArray(allPlayerCards.map((card, i) => ({
        ...card,
        id: `${card.id}_${Date.now()}_${i}`,
    })));
    const actionDeck = shuffleArray(ACTION_CARDS.map((card, i) => ({
        ...card,
        id: `${card.id}_${Date.now()}_${i}`,
    })));
    const pontoDeck = shuffleArray(PONTO_CARDS.map((card, i) => ({
        ...card,
        id: `${card.id}_${Date.now()}_${i}`,
    })));
    
    console.log(`🃏 Deck created: ${playerDeck.length} players (${LEGENDARY_CARDS.length} legends), ${actionDeck.length} actions, ${pontoDeck.length} pontos`);
    
    return { 
        playerDeck, 
        actionDeck, 
        pontoDeck,
        // Empty discard piles - cards go here when used/discarded
        playerDiscard: [] as GameCard[],
        actionDiscard: [] as GameCard[],
        pontoDiscard: [] as GameCard[],
    };
}

/**
 * Reshuffle discard pile back into deck when deck is empty
 */
function reshuffleDeck(deck: GameCard[], discardPile: GameCard[]): void {
    if (discardPile.length === 0) return;
    
    // Move all cards from discard pile to deck
    const reshuffled = shuffleArray([...discardPile]);
    deck.push(...reshuffled);
    discardPile.length = 0; // Clear discard pile
    
    console.log(`🔄 Reshuffled ${reshuffled.length} cards from discard pile into deck`);
}

export class GameService {
    // ========================================
    // Active Games Access (for timer monitoring)
    // ========================================

    getActiveGames(): Map<string, GameState> {
        return activeGames;
    }

    // ========================================
    // Queue Management
    // ========================================

    addToQueue(entry: QueueEntry): number {
        // Remove if already in queue
        this.removeFromQueue(entry.odium);

        matchmakingQueue.push(entry);
        return matchmakingQueue.length;
    }

    removeFromQueue(odium: string): boolean {
        const index = matchmakingQueue.findIndex(e => e.odium === odium);
        if (index !== -1) {
            matchmakingQueue.splice(index, 1);
            return true;
        }
        return false;
    }

    findMatch(odium: string): QueueEntry | null {
        // Simple FIFO matching - will be replaced with skill-based matching
        const opponent = matchmakingQueue.find(e => e.odium !== odium);
        return opponent || null;
    }

    getQueuePosition(odium: string): number {
        return matchmakingQueue.findIndex(e => e.odium === odium) + 1;
    }

    // ========================================
    // Game Creation & Management
    // ========================================

    async createGame(player1: QueueEntry, player2: QueueEntry): Promise<GameState> {
        // Remove both from queue
        this.removeFromQueue(player1.odium);
        this.removeFromQueue(player2.odium);

        const gameId = uuidv4();

        // Create shuffled decks for this game
        const decks = createShuffledDecks();

        // Create initial game state
        const gameState: GameState = {
            id: gameId,
            status: 'starting',
            currentTurn: player1.odium, // Player 1 starts
            turnPhase: 'draw', // Player 1 must draw first (mandatory, free)
            turnNumber: 1,
            turnStartTime: Date.now(),
            turnTimeLimit: 90, // 90 seconds per turn (PRD: 1.5 min)
            matchStartTime: Date.now(),
            matchTimeLimit: 1200, // 20 minutes per PRD
            drawsRemaining: 2, // Player 1 must draw 2 cards

            player1: this.createPlayerState(player1),
            player2: this.createPlayerState(player2),
            
            // Shared decks for the game
            decks,
        };

        // Deal initial hands from the shared decks
        this.dealCardsFromDeck(gameState, gameState.player1);
        if (gameState.player2) {
            this.dealCardsFromDeck(gameState, gameState.player2);
        }

        // Store game
        activeGames.set(gameId, gameState);
        playerToGame.set(player1.odium, gameId);
        playerToGame.set(player2.odium, gameId);

        // Save to database
        await prisma.game.create({
            data: {
                id: gameId,
                status: 'IN_PROGRESS',
                player1Id: player1.odium,
                player2Id: player2.odium,
                startedAt: new Date(),
                gameState: gameState as any,
            },
        });

        return gameState;
    }

    private createPlayerState(entry: QueueEntry): PlayerState {
        return {
            odium: entry.odium,
            socketId: entry.socketId,
            odiumInfo: {
                username: entry.username,
                displayName: entry.displayName,
                level: entry.level,
                rank: entry.rank,
            },
            hand: [],
            field: [null, null, null, null, null], // 5 slots
            score: 0,
            isReady: false,
            movesRemaining: 3, // PRD: Max 3 moves per turn
            lockedSlots: [], // Slots locked by Biter
            nextAttackCancelled: false, // VAR effect
            // Legendary effects (set when opponent reveals legendary)
            rulesBlocked: false,
            tacticsBlocked: false,
            extraPontoAvailable: false,
        };
    }

    /**
     * Apply legendary ability when a legendary card is revealed
     * @returns message describing the ability activated
     */
    private applyLegendaryAbility(gameState: GameState, card: GameCard, owner: PlayerState): string | null {
        if (!card.isLegendary || !card.legendaryAbility) return null;
        
        const opponent = this.getOpponent(gameState, owner.odium);
        if (!opponent) return null;

        switch (card.legendaryAbility) {
            case 'ronaldo':
                // Block opponent from using rules cards (VAR, red card, yellow card)
                opponent.rulesBlocked = true;
                console.log(`🌟 LEGENDARY: Ronaldo activated - ${opponent.odiumInfo.displayName} cannot use rules cards!`);
                return 'الدووزن! الخصم لا يستطيع استخدام كروت الأحكام';
            
            case 'messi':
                // Block opponent from using tactics cards (swap, shoulder, mercato, biter)
                opponent.tacticsBlocked = true;
                console.log(`🌟 LEGENDARY: Messi activated - ${opponent.odiumInfo.displayName} cannot use tactics cards!`);
                return 'المعزة! الخصم لا يستطيع استخدام كروت التكتيكات';
            
            case 'shehata':
                // Allow owner to draw extra ponto in attack or defense
                owner.extraPontoAvailable = true;
                console.log(`🌟 LEGENDARY: Abo Kaaf activated - ${owner.odiumInfo.displayName} can draw extra ponto!`);
                return 'أبو كف! يمكنك سحب بونطو إضافي';
            
            default:
                return null;
        }
    }

    /**
     * Deal initial cards to a player from the shared decks (5 field cards + 2 hand + 3 actions)
     */
    private dealCardsFromDeck(gameState: GameState, player: PlayerState): void {
        if (!gameState.decks) return;

        // Draw 5 player cards for field (face down)
        for (let i = 0; i < 5 && gameState.decks.playerDeck.length > 0; i++) {
            const card = gameState.decks.playerDeck.pop()!;
            card.isRevealed = false;
            player.field[i] = card;
        }

        // Draw 2 player cards for hand
        for (let i = 0; i < 2 && gameState.decks.playerDeck.length > 0; i++) {
            const card = gameState.decks.playerDeck.pop()!;
            player.hand.push(card);
        }

        // Draw 3 action cards for hand
        for (let i = 0; i < 3 && gameState.decks.actionDeck.length > 0; i++) {
            const card = gameState.decks.actionDeck.pop()!;
            player.hand.push(card);
        }
    }

    // ========================================
    // Room Management (New)
    // ========================================

    async createRoom(host: QueueEntry, isPrivate: boolean = false, password?: string, roomName?: string): Promise<GameState> {
        // Remove from queue if in it
        this.removeFromQueue(host.odium);

        const gameId = uuidv4();
        const roomCode = this.generateRoomCode();

        // Create initial game state (Waiting room)
        const gameState: GameState = {
            id: gameId,
            roomName: roomName || `غرفة ${host.displayName}`,
            roomCode,
            status: 'waiting',
            currentTurn: host.odium,
            turnPhase: 'play',
            turnNumber: 0,
            turnStartTime: 0,
            turnTimeLimit: 90,
            matchTimeLimit: 1200, // 20 minutes per PRD

            player1: this.createPlayerState(host),
            player2: null, // Waiting for second player

            // Custom room properties can be added here
            isPrivate,
            hasPassword: !!password,
            password,
        };

        // Store room
        activeRooms.set(gameId, gameState);
        roomCodes.set(roomCode, gameId);
        playerToGame.set(host.odium, gameId);

        return gameState;
    }

    getAvailableRooms(): GameState[] {
        return Array.from(activeRooms.values())
            .filter(room => room.status === 'waiting' && !room.player2)
            .map(room => {
                // Remove sensitive data from public listing
                const { password, roomCode, ...safeRoom } = room as any;
                return safeRoom;
            });
    }

    deleteRoom(roomId: string): boolean {
        // Check both activeRooms and activeGames
        const room = activeRooms.get(roomId) || activeGames.get(roomId);
        if (!room) return false;

        // Clean up all references
        if (room.player1) {
            playerToGame.delete(room.player1.odium);
        }
        if (room.player2) {
            playerToGame.delete(room.player2.odium);
        }
        if (room.roomCode) {
            roomCodes.delete(room.roomCode);
        }
        activeRooms.delete(roomId);
        activeGames.delete(roomId);

        console.log(`🗑️ Room ${roomId} deleted`);
        return true;
    }

    getGameById(gameId: string): GameState | null {
        return activeRooms.get(gameId) || activeGames.get(gameId) || null;
    }

    removePlayer2(roomId: string): boolean {
        // Check both activeRooms and activeGames
        const room = activeRooms.get(roomId) || activeGames.get(roomId);
        if (!room || !room.player2) return false;

        // Clean up player2's references
        playerToGame.delete(room.player2.odium);
        room.player2 = null;

        // If game was "starting" (in activeGames), revert to "waiting" and move back to activeRooms
        if (room.status === 'starting') {
            room.status = 'waiting';
            activeGames.delete(roomId);
            activeRooms.set(roomId, room);
        }

        console.log(`👋 Player2 removed from room ${roomId}`);
        return true;
    }

    transferHost(roomId: string): GameState | null {
        // Check both activeRooms and activeGames
        const room = activeRooms.get(roomId) || activeGames.get(roomId);
        if (!room || !room.player2) return null;

        // Swap player1 and player2
        const oldHost = room.player1;
        room.player1 = room.player2;
        room.player2 = null;

        // Update playerToGame mapping - remove old host
        playerToGame.delete(oldHost.odium);
        // player1 (new host) already has mapping to this room

        // If game was "starting" (in activeGames), revert to "waiting" and move back to activeRooms
        if (room.status === 'starting') {
            room.status = 'waiting';
            activeGames.delete(roomId);
            activeRooms.set(roomId, room);
        }

        console.log(`👑 Host transferred from ${oldHost.odiumInfo.displayName} to ${room.player1.odiumInfo.displayName}`);
        return room;
    }

    // Manual swap - BOTH players stay, just swap positions
    swapHostWithPlayer2(roomId: string): GameState | null {
        const room = activeRooms.get(roomId) || activeGames.get(roomId);
        if (!room || !room.player2) return null;

        // Swap player1 and player2
        const oldHost = room.player1;
        room.player1 = room.player2;
        room.player2 = oldHost;

        console.log(`🔄 Host swapped: ${room.player1.odiumInfo.displayName} is now host`);
        return room;
    }

    joinRoom(gameId: string, player: QueueEntry, password?: string): GameState | null {
        const room = activeRooms.get(gameId);
        if (!room || room.status !== 'waiting' || room.player2) {
            return null;
        }

        // Check password if private
        if ((room as any).isPrivate && (room as any).password) {
            if ((room as any).password !== password) {
                // Or return a specific error code? For now simplify to returning null
                return null;
            }
        }

        // Add player 2
        room.player2 = this.createPlayerState(player);
        
        // Initialize shared decks for the game
        room.decks = createShuffledDecks();
        
        // Deal initial hands from the shared decks
        this.dealCardsFromDeck(room, room.player1);
        this.dealCardsFromDeck(room, room.player2);

        // Move from rooms to active games
        activeRooms.delete(gameId);
        activeGames.set(gameId, room);

        // Update mappings
        playerToGame.set(player.odium, gameId);

        // Initialize game start
        room.status = 'starting';
        room.turnStartTime = Date.now();
        room.matchStartTime = Date.now();
        room.turnNumber = 1;

        return room;
    }

    joinRoomByCode(roomCode: string, player: QueueEntry, password?: string): GameState | null {
        const gameId = roomCodes.get(roomCode);
        if (!gameId) return null;

        return this.joinRoom(gameId, player, password);
    }

    private generateRoomCode(): string {
        // Generate random 6-digit number string
        let code = '';
        do {
            code = Math.floor(100000 + Math.random() * 900000).toString();
        } while (roomCodes.has(code)); // Ensure uniqueness
        return code;
    }

    // ========================================
    // Game Actions
    // ========================================

    getGameByPlayer(odium: string): GameState | null {
        const gameId = playerToGame.get(odium);
        if (!gameId) return null;
        return activeRooms.get(gameId) || activeGames.get(gameId) || null;
    }

    playCard(gameState: GameState, odium: string, cardId: string, slotIndex: number): boolean {
        const player = this.getPlayer(gameState, odium);
        if (!player) return false;

        // Check if it's player's turn
        if (gameState.currentTurn !== odium) return false;

        // NEW RULE: If attacking and Ponto not drawn, block other moves
        if (gameState.turnPhase === 'attack' && gameState.pendingAttack && !gameState.pendingAttack.pontoCard) {
            return false;
        }

        // Check if player has moves remaining (costs 1 move)
        if (player.movesRemaining < 1) return false;

        // Check if slot is empty
        if (player.field[slotIndex] !== null) return false;

        // Check if slot is locked (by Biter card)
        if (player.lockedSlots.includes(slotIndex)) return false;

        // Find card in hand
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return false;

        // Move card to field (face-down by default)
        const card = player.hand.splice(cardIndex, 1)[0];
        card.isRevealed = false; // Cards placed face-down
        player.field[slotIndex] = card;

        // Deduct move
        player.movesRemaining -= 1;

        return true;
    }

    /**
     * Draw cards from deck (costs 1 move per draw)
     * PRD: Player can draw 2 player cards or 1 ponto card per turn
     */
    drawCards(
        gameState: GameState,
        odium: string,
        cardType: 'player' | 'action' | 'ponto',
        count: number
    ): { success: boolean; drawnCards: GameCard[] } {
        const player = this.getPlayer(gameState, odium);
        if (!player) return { success: false, drawnCards: [] };
        if (gameState.currentTurn !== odium) return { success: false, drawnCards: [] };
        // NEW RULE: If attacking and Ponto not drawn, block
        if (gameState.turnPhase === 'attack' && gameState.pendingAttack && !gameState.pendingAttack.pontoCard) {
            return { success: false, drawnCards: [] };
        }
        if (player.movesRemaining < 1) return { success: false, drawnCards: [] };

        // Ensure decks exist
        if (!gameState.decks) {
            // Fallback: create decks if they don't exist (legacy games)
            gameState.decks = createShuffledDecks();
        }

        const drawnCards: GameCard[] = [];
        let deck: GameCard[];
        let discardPile: GameCard[];

        switch (cardType) {
            case 'player':
                deck = gameState.decks.playerDeck;
                discardPile = gameState.decks.playerDiscard;
                break;
            case 'action':
                deck = gameState.decks.actionDeck;
                discardPile = gameState.decks.actionDiscard;
                break;
            case 'ponto':
                // RESTRICTION: Ponto cards cannot be drawn manually using generic drawCards.
                // They are only drawn during attack phase specific step (via drawPonto) or via Action Cards effects.
                return { success: false, drawnCards: [] };
            default:
                return { success: false, drawnCards: [] };
        }

        // Draw cards from the shared deck
        for (let i = 0; i < count; i++) {
            // Reshuffle if deck is empty
            if (deck.length === 0) {
                reshuffleDeck(deck, discardPile);
                if (deck.length === 0) {
                    // No cards available even after reshuffle
                    break;
                }
            }
            
            const card = deck.pop()!;
            player.hand.push(card);
            drawnCards.push(card);
        }

        // Deduct move (1 move for drawing)
        player.movesRemaining -= 1;

        return { success: true, drawnCards };
    }

    /**
     * Flip a face-down card on your field to reveal it (costs 1 move)
     */
    flipCard(gameState: GameState, odium: string, slotIndex: number): { success: boolean; legendaryMessage?: string } {
        const player = this.getPlayer(gameState, odium);
        if (!player) return { success: false };
        if (gameState.currentTurn !== odium) return { success: false };

        // NEW RULE: If attacking and Ponto not drawn, block
        if (gameState.turnPhase === 'attack' && gameState.pendingAttack && !gameState.pendingAttack.pontoCard) {
            return { success: false };
        }

        if (player.movesRemaining < 1) return { success: false };

        const card = player.field[slotIndex];
        if (!card) return { success: false };
        if (card.isRevealed) return { success: false }; // Already revealed

        card.isRevealed = true;
        player.movesRemaining -= 1;

        // Apply legendary ability if this is a legendary card
        let legendaryMessage: string | undefined;
        if (card.isLegendary) {
            legendaryMessage = this.applyLegendaryAbility(gameState, card, player) || undefined;
        }

        return { success: true, legendaryMessage };
    }

    /**
     * Swap a card from hand with a card on field (costs 1 move)
     * PRD: "تبديل لاعب من اليد بلاعب من الملعب"
     */
    swapCards(gameState: GameState, odium: string, handCardId: string, fieldSlotIndex: number): boolean {
        const player = this.getPlayer(gameState, odium);
        if (!player) return false;
        if (gameState.currentTurn !== odium) return false;

        // NEW RULE: If attacking and Ponto not drawn, block
        if (gameState.turnPhase === 'attack' && gameState.pendingAttack && !gameState.pendingAttack.pontoCard) {
            return false;
        }

        if (player.movesRemaining < 1) return false;

        // Find card in hand
        const handCardIndex = player.hand.findIndex(c => c.id === handCardId);
        if (handCardIndex === -1) return false;

        // Get field card (can be null for empty slot, but swap requires card)
        const fieldCard = player.field[fieldSlotIndex];
        if (!fieldCard) return false; // Must swap with existing card

        const handCard = player.hand[handCardIndex];
        handCard.isRevealed = false; // Placed face-down on field

        // Check conditions: If field card is revealed, it goes to discard pile
        if (fieldCard.isRevealed) {
            // Move Hand Card to Field
            player.field[fieldSlotIndex] = handCard;
            // Remove Hand Card from Hand (it moved to field)
            player.hand.splice(handCardIndex, 1);
            
            // Add revealed field card to discard pile (for reshuffling)
            if (gameState.decks && fieldCard.type === 'player') {
                gameState.decks.playerDiscard.push(fieldCard);
                console.log(`♻️ Player card "${fieldCard.nameAr}" added to discard pile (swap)`);
            }
        } else {
            // Normal Swap for unrevealed cards
            fieldCard.isRevealed = false;
            player.field[fieldSlotIndex] = handCard;
            player.hand[handCardIndex] = fieldCard;
        }

        player.movesRemaining -= 1;

        return true;
    }

    /**
     * Summon a legendary player (costs 1 move + discard 2 cards from hand)
     * PRD: "إنزال لاعب أسطوري (مع التخلص من كارتين)"
     */
    summonLegendary(
        gameState: GameState,
        odium: string,
        legendaryCardId: string,
        discardCardIds: [string, string],
        fieldSlotIndex: number
    ): { success: boolean; message?: string } {
        const player = this.getPlayer(gameState, odium);
        if (!player) return { success: false, message: 'لاعب غير موجود' };
        if (gameState.currentTurn !== odium) return { success: false, message: 'ليس دورك' };

        // NEW RULE: If attacking and Ponto not drawn, block
        if (gameState.turnPhase === 'attack' && gameState.pendingAttack && !gameState.pendingAttack.pontoCard) {
            return { success: false, message: 'يجب سحب كارت بونطو أولاً' };
        }

        if (player.movesRemaining < 1) return { success: false, message: 'لا توجد حركات كافية' };

        // Find legendary card in hand
        const legendaryIndex = player.hand.findIndex(c => c.id === legendaryCardId);
        if (legendaryIndex === -1) return { success: false, message: 'الكارت الأسطوري غير موجود' };

        const legendaryCard = player.hand[legendaryIndex];
        if (!legendaryCard.isLegendary) return { success: false, message: 'ليس كارت أسطوري' };

        // Find cards to discard (must be 2 different cards, not the legendary)
        const discardIndices: number[] = [];
        for (const discardId of discardCardIds) {
            if (discardId === legendaryCardId) {
                return { success: false, message: 'لا يمكن التخلص من الكارت الأسطوري' };
            }
            const idx = player.hand.findIndex((c, i) => c.id === discardId && !discardIndices.includes(i));
            if (idx === -1) return { success: false, message: 'كروت التخلص غير موجودة' };
            discardIndices.push(idx);
        }

        if (discardIndices.length < 2) return { success: false, message: 'يجب التخلص من كارتين' };

        // Check field slot
        if (player.field[fieldSlotIndex] !== null) {
            return { success: false, message: 'المكان مشغول' };
        }

        // Remove discard cards (in reverse order to maintain indices) and add to discard piles
        discardIndices.sort((a, b) => b - a);
        for (const idx of discardIndices) {
            const discardedCard = player.hand.splice(idx, 1)[0];
            // Add to appropriate discard pile
            if (gameState.decks && discardedCard) {
                if (discardedCard.type === 'player') {
                    gameState.decks.playerDiscard.push(discardedCard);
                } else if (discardedCard.type === 'action') {
                    gameState.decks.actionDiscard.push(discardedCard);
                }
                console.log(`♻️ Discarded "${discardedCard.nameAr}" for legendary summon`);
            }
        }

        // Remove legendary from hand and place on field
        const newLegIndex = player.hand.findIndex(c => c.id === legendaryCardId);
        const legend = player.hand.splice(newLegIndex, 1)[0];
        legend.isRevealed = true; // Legends are played face-up
        player.field[fieldSlotIndex] = legend;

        player.movesRemaining -= 1;

        return { success: true };
    }

    /**
         * Use an action card from hand (costs 1 move)
         * Each action card has a different effect
         * 
         * Action Card Rules:
         * - Defensive cards (shoulder, var, red_card, yellow_card): defense phase only
         * - Offensive cards (biter): attack phase only  
         * - Utility cards (swap, mercato): play phase only (not during defense)
         */
    useActionCard(
        gameState: GameState,
        odium: string,
        cardId: string,
        targetData?: {
            slotIndex1?: number;      // For swap (player's card), biter, shoulder, red_card, yellow_card
            slotIndex2?: number;      // For swap (opponent's card)
            isOpponentSlot1?: boolean; // Legacy - not used for new logic
            isOpponentSlot2?: boolean; // Legacy - not used for new logic
        }
    ): { success: boolean; message?: string; drawnCards?: GameCard[]; varResult?: number; biterSlot?: number } {
        const player = this.getPlayer(gameState, odium);
        const opponent = this.getOpponent(gameState, odium);
        if (!player || !opponent) return { success: false, message: 'لاعب غير موجود' };

        // Find action card in hand first to determine its type
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return { success: false, message: 'الكارت غير موجود' };

        const card = player.hand[cardIndex];
        if (card.type !== 'action') return { success: false, message: 'ليس كارت أكشن' };

        const effect = card.actionEffect;
        const subtype = card.actionSubtype;

        // LEGENDARY BLOCKING: Check if opponent's legendary blocks this card type
        if (subtype === 'rules' && player.rulesBlocked) {
            return { success: false, message: 'الدووزن (رونالدو) يمنعك من استخدام كروت الأحكام!' };
        }
        if (subtype === 'tactics' && player.tacticsBlocked) {
            return { success: false, message: 'المعزة (ميسي) يمنعك من استخدام كروت التكتيكات!' };
        }

        // Phase validation based on card type
        const isDefensiveCard = ['shoulder', 'var', 'red_card', 'yellow_card'].includes(effect || '');
        const isOffensiveCard = ['biter'].includes(effect || '');
        const isUtilityCard = ['swap', 'mercato'].includes(effect || '');

        if (isDefensiveCard) {
            // Defensive cards: Only during defense phase, must be defender
            if (gameState.turnPhase !== 'defense') {
                return { success: false, message: 'يستخدم فقط في الدفاع' };
            }
            if (gameState.currentTurn !== odium) {
                return { success: false, message: 'ليس دورك للدفاع' };
            }
        } else if (isOffensiveCard) {
            // Offensive cards: Only during attack phase, must be attacker
            if (gameState.turnPhase !== 'attack') {
                return { success: false, message: 'يستخدم فقط في الهجوم' };
            }
            if (gameState.currentTurn !== odium) {
                return { success: false, message: 'ليس دورك' };
            }
            // Must have pending attack
            if (!gameState.pendingAttack) {
                return { success: false, message: 'لا يوجد هجوم نشط' };
            }
        } else if (isUtilityCard) {
            // Utility cards: Only during your turn (play phase), not during defense
            if (gameState.turnPhase === 'defense') {
                return { success: false, message: 'لا يمكن استخدامه أثناء الدفاع' };
            }
            if (gameState.currentTurn !== odium) {
                return { success: false, message: 'ليس دورك' };
            }
        }

        // If attacking and Ponto not drawn, block non-defensive cards
        if (gameState.turnPhase === 'attack' && gameState.pendingAttack && !gameState.pendingAttack.pontoCard) {
            if (!isDefensiveCard) {
                return { success: false, message: 'يجب سحب كارت بونطو أولاً' };
            }
        }

        if (player.movesRemaining < 1) return { success: false, message: 'لا توجد حركات كافية' };

        let drawnCards: GameCard[] = [];
        let varResult: number | undefined;
        let biterSlot: number | undefined;

        switch (effect) {
            case 'shoulder': // كتف قانوني: +2 Defense to a specific defender
                if (!gameState.pendingAttack) {
                    return { success: false, message: 'لا يوجد هجوم للدفاع ضده' };
                }
                // Add +2 to overall defense sum (simpler approach - card bonus)
                // The spec says "temporarily increases defense of one defending player"
                // We add to defenseSum which represents total defense power
                gameState.pendingAttack.defenseSum += 2;
                break;

            case 'mercato': // ميركاتو: Draw 2 player cards
                const playerCards = PLAYER_CARDS.slice();
                for (let i = 0; i < 2 && playerCards.length > 0; i++) {
                    const idx = Math.floor(Math.random() * playerCards.length);
                    const drawn = { ...playerCards.splice(idx, 1)[0] };
                    drawn.id = `${drawn.id}_drawn_${Date.now()}_${i}`;
                    player.hand.push(drawn);
                    drawnCards.push(drawn);
                }
                break;

            case 'biter': // العضاض: +4 Attack, then slot is locked after attack
                if (!gameState.pendingAttack) {
                    return { success: false, message: 'لا يوجد هجوم نشط' };
                }
                if (targetData?.slotIndex1 === undefined) {
                    return { success: false, message: 'يجب تحديد اللاعب المهاجم' };
                }
                const biterCard = player.field[targetData.slotIndex1];
                if (!biterCard) {
                    return { success: false, message: 'لا يوجد لاعب في هذا المكان' };
                }
                // Verify the card is part of the attack
                if (!gameState.pendingAttack.attackerSlots.includes(targetData.slotIndex1)) {
                    return { success: false, message: 'يجب أن يكون اللاعب مهاجماً' };
                }
                // Add +4 to attack sum
                gameState.pendingAttack.attackSum += 4;
                // Store slot for locking after attack resolves
                biterSlot = targetData.slotIndex1;
                // Remove the card and lock the slot immediately
                const removedBiterCard = player.field[targetData.slotIndex1];
                player.field[targetData.slotIndex1] = null;
                player.lockedSlots.push(targetData.slotIndex1);
                // Add to discard pile
                if (removedBiterCard && gameState.decks) {
                    gameState.decks.playerDiscard.push(removedBiterCard);
                    console.log(`♻️ Biter card discarded`);
                }
                break;

            case 'red_card': // كارت أحمر: Eject any attacking player from opponent
                if (!gameState.pendingAttack) {
                    return { success: false, message: 'لا يوجد هجوم للدفاع ضده' };
                }
                if (targetData?.slotIndex1 === undefined) {
                    return { success: false, message: 'يجب تحديد الهدف' };
                }
                // Must target an attacker slot
                if (!gameState.pendingAttack.attackerSlots.includes(targetData.slotIndex1)) {
                    return { success: false, message: 'يجب اختيار لاعب مهاجم' };
                }
                const targetCard = opponent.field[targetData.slotIndex1];
                if (!targetCard) {
                    return { success: false, message: 'لا يوجد لاعب في هذا المكان' };
                }
                // Subtract card's attack from attack sum
                gameState.pendingAttack.attackSum -= (targetCard.attack || 0);
                // Remove the attacker slot from the attack
                gameState.pendingAttack.attackerSlots = gameState.pendingAttack.attackerSlots.filter(
                    s => s !== targetData.slotIndex1
                );
                // Remove the card from field (slot remains open/usable)
                opponent.field[targetData.slotIndex1] = null;
                // Add to discard pile
                if (gameState.decks) {
                    gameState.decks.playerDiscard.push(targetCard);
                    console.log(`♻️ Red card: "${targetCard.nameAr}" ejected to discard pile`);
                }
                break;

            case 'yellow_card': // كارت أصفر: -2 Attack for current attack, 2 yellows = eject
                if (!gameState.pendingAttack) {
                    return { success: false, message: 'لا يوجد هجوم للدفاع ضده' };
                }
                if (targetData?.slotIndex1 === undefined) {
                    return { success: false, message: 'يجب تحديد الهدف' };
                }
                // Must target an attacker slot
                if (!gameState.pendingAttack.attackerSlots.includes(targetData.slotIndex1)) {
                    return { success: false, message: 'يجب اختيار لاعب مهاجم' };
                }
                const yellowTargetCard = opponent.field[targetData.slotIndex1];
                if (!yellowTargetCard) {
                    return { success: false, message: 'لا يوجد لاعب في هذا المكان' };
                }
                // Reduce attack sum for this attack only (not permanent card stat)
                gameState.pendingAttack.attackSum = Math.max(0, gameState.pendingAttack.attackSum - 2);
                // Track yellow cards on the card (persists across turns)
                yellowTargetCard.yellowCards = (yellowTargetCard.yellowCards || 0) + 1;
                // Two yellows = send off
                if (yellowTargetCard.yellowCards >= 2) {
                    // Remove attack from sum
                    gameState.pendingAttack.attackSum -= (yellowTargetCard.attack || 0);
                    // Remove from attackerSlots
                    gameState.pendingAttack.attackerSlots = gameState.pendingAttack.attackerSlots.filter(
                        s => s !== targetData.slotIndex1
                    );
                    // Remove card from field (slot remains open)
                    opponent.field[targetData.slotIndex1] = null;
                    // Add to discard pile
                    if (gameState.decks) {
                        gameState.decks.playerDiscard.push(yellowTargetCard);
                        console.log(`♻️ 2nd Yellow: "${yellowTargetCard.nameAr}" ejected to discard pile`);
                    }
                }
                break;

            case 'var': // VAR: Draw ponto value, ≥4 cancels attack + next attack, <4 = goal
                if (!gameState.pendingAttack) {
                    return { success: false, message: 'لا يوجد هجوم للدفاع ضده' };
                }
                // Draw random Ponto value (1-5)
                varResult = Math.ceil(Math.random() * 5);
                if (varResult >= 4) {
                    // Cancel the current attack
                    gameState.pendingAttack.attackSum = 0;
                    // Next attack against this player is also cancelled
                    player.nextAttackCancelled = true;
                } else {
                    // Defense fails - attacker scores
                    gameState.pendingAttack.defenseSum = 0;
                }
                break;

            case 'swap': // قصب بقصب: Swap YOUR card with OPPONENT's card
                if (targetData?.slotIndex1 === undefined || targetData?.slotIndex2 === undefined) {
                    return { success: false, message: 'يجب تحديد كارتين' };
                }
                // slotIndex1 = player's card, slotIndex2 = opponent's card
                const myCard = player.field[targetData.slotIndex1];
                const oppCard = opponent.field[targetData.slotIndex2];
                if (!myCard || !oppCard) {
                    return { success: false, message: 'يجب أن يكون هناك لاعبين في كلا المكانين' };
                }
                // Check locked slots
                if (player.lockedSlots.includes(targetData.slotIndex1)) {
                    return { success: false, message: 'هذا المكان مقفل' };
                }
                if (opponent.lockedSlots.includes(targetData.slotIndex2)) {
                    return { success: false, message: 'مكان الخصم مقفل' };
                }
                // Perform swap - card orientation (revealed/hidden) stays the same
                player.field[targetData.slotIndex1] = oppCard;
                opponent.field[targetData.slotIndex2] = myCard;
                break;

            default:
                return { success: false, message: 'تأثير غير معروف' };
        }

        // Remove card from hand and add to discard pile
        const usedCard = player.hand.splice(cardIndex, 1)[0];
        if (gameState.decks && usedCard.type === 'action') {
            gameState.decks.actionDiscard.push(usedCard);
        }

        // Deduct move (all action cards cost 1 move)
        player.movesRemaining -= 1;

        return { success: true, drawnCards, varResult, biterSlot };
    }

    /**
     * Draw a random Ponto card from the shared deck
     */
    drawPontoCard(gameState: GameState): GameCard {
        // Ensure decks exist
        if (!gameState.decks) {
            gameState.decks = createShuffledDecks();
        }
        
        // Reshuffle if ponto deck is empty
        if (gameState.decks.pontoDeck.length === 0) {
            reshuffleDeck(gameState.decks.pontoDeck, gameState.decks.pontoDiscard);
        }
        
        // Draw from the shared ponto deck
        if (gameState.decks.pontoDeck.length > 0) {
            return gameState.decks.pontoDeck.pop()!;
        }
        
        // Fallback: if deck is still empty (shouldn't happen), create a temporary card
        console.warn('⚠️ Ponto deck empty even after reshuffle - creating fallback card');
        const template = PONTO_CARDS[Math.floor(Math.random() * PONTO_CARDS.length)];
        return {
            ...template,
            id: `${template.id}_fallback_${Date.now()}`,
        };
    }

    // ========================================
    // NEW ATTACK/DEFENSE SYSTEM
    // ========================================

    /**
     * Reveal a face-down attacker on your field to start/continue an attack
     * First reveal: auto-draws Ponto card
     * Costs 1 move per attacker (max 2 attackers with 3 moves)
     */
    revealAttacker(
        gameState: GameState,
        odium: string,
        slotIndex: number
    ): { success: boolean; message?: string; pontoCard?: GameCard; attackSum?: number; legendaryMessage?: string } {
        const player = this.getPlayer(gameState, odium);
        if (!player) return { success: false, message: 'لاعب غير موجود' };
        if (gameState.currentTurn !== odium) return { success: false, message: 'ليس دورك' };
        if (gameState.turnPhase === 'defense') return { success: false, message: 'أنت في مرحلة الدفاع' };
        if (gameState.turnPhase === 'draw') return { success: false, message: 'يجب سحب الكروت أولاً' };

        // VAR EFFECT: Check if opponent's VAR cancelled this attack
        const opponent = this.getOpponent(gameState, odium);
        if (opponent && opponent.nextAttackCancelled) {
            // Clear the flag and cancel this attack attempt
            opponent.nextAttackCancelled = false;
            return { success: false, message: 'الهجوم ملغي بسبب VAR السابق!' };
        }

        // NEW RULE: If ALREADY have pending attack (meaning this is 2nd attacker), MUST have drawn Ponto first
        if (gameState.pendingAttack && !gameState.pendingAttack.pontoCard) {
            return { success: false, message: 'يجب سحب كارت بونطو قبل كشف مهاجم آخر' };
        }

        // Cost: 1 to reveal. If first attacker, reserve +1 for Ponto = 2 total
        const minMoves = (!gameState.pendingAttack) ? 2 : 1;
        if (player.movesRemaining < minMoves) {
            return { success: false, message: minMoves === 2 ? 'تحتاج حركتين (كشف + بونطو)' : 'لا توجد حركات كافية' };
        }

        const card = player.field[slotIndex];
        if (!card) return { success: false, message: 'لا يوجد كرت في هذا المكان' };
        if (card.isRevealed) return { success: false, message: 'الكرت مكشوف بالفعل' };
        if (card.position !== 'FW' && card.position !== 'MF') {
            return { success: false, message: 'يجب أن يكون الكرت مهاجم (FW أو MF)' };
        }

        // Reveal the card
        card.isRevealed = true;
        player.movesRemaining -= 1;

        // Apply legendary ability if this is a legendary card
        let legendaryMessage: string | undefined;
        if (card.isLegendary) {
            legendaryMessage = this.applyLegendaryAbility(gameState, card, player) || undefined;
        }

        // Set phase to attack
        gameState.turnPhase = 'attack';

        // First attacker - create pending attack (Ponto drawn manually later)
        if (!gameState.pendingAttack) {
            gameState.pendingAttack = {
                attackerId: odium,
                attackerSlots: [slotIndex],
                attackSum: (card.attack || 0),
                defenseSum: 0,
                defenderSlots: [],
                pontoCards: [],
                defensePontoCards: [],
            };

            return {
                success: true,
                pontoCard: undefined,
                attackSum: gameState.pendingAttack.attackSum,
                legendaryMessage
            };
        }

        // Additional attacker - just add to attack sum
        if (gameState.pendingAttack.attackerSlots.length >= 2) {
            return { success: false, message: 'حد أقصى مهاجمين اثنين' };
        }

        gameState.pendingAttack.attackerSlots.push(slotIndex);
        gameState.pendingAttack.attackSum += (card.attack || 0);

        // Check for Auto-Transition (if 2nd attacker revealed and no moves left, and Ponto already drawn)
        // Note: Ponto MUST be drawn to end attack. If 2nd attacker revealed but somehow Ponto missing (shouldn't happen with flow), don't end.
        if (gameState.pendingAttack.pontoCard && player.movesRemaining === 0) {
            this.endAttackPhase(gameState, odium);
        }

        return {
            success: true,
            attackSum: gameState.pendingAttack.attackSum,
            legendaryMessage
        };
    }

    /**
     * Draw random Ponto card for the attack (called manually by attacker)
     */
    drawAttackPonto(
        gameState: GameState,
        odium: string
    ): { success: boolean; message?: string; pontoCard?: GameCard; attackSum?: number } {
        if (gameState.currentTurn !== odium) return { success: false, message: 'ليس دورك' };
        if (gameState.turnPhase !== 'attack') return { success: false, message: 'لست في مرحلة الهجوم' };
        if (!gameState.pendingAttack) return { success: false, message: 'لم يتم الكشف عن مهاجم' };
        if (gameState.pendingAttack.pontoCard) return { success: false, message: 'تم سحب بونطو بالفعل' };

        // Deduct move cost (1 move)
        const player = odium === gameState.player1.odium ? gameState.player1 : gameState.player2!;
        if (player.movesRemaining < 1) {
            return { success: false, message: 'لا يوجد حركات كافية لسحب البونطو' };
        }
        player.movesRemaining -= 1;

        const pontoCard = this.drawPontoCard(gameState);
        gameState.pendingAttack.pontoCard = pontoCard;
        gameState.pendingAttack.pontoCards.push(pontoCard);
        gameState.pendingAttack.attackSum += (pontoCard.attack || 0);

        // Auto-end attack if moves exhausted
        if (player.movesRemaining === 0) {
            this.endAttackPhase(gameState, odium);
        }

        return {
            success: true,
            pontoCard,
            attackSum: gameState.pendingAttack.attackSum
        };
    }

    /**
     * End attack phase and switch to defense phase (FREE - no move cost)
     * Defender will get 3 moves to respond
     */
    endAttackPhase(
        gameState: GameState,
        odium: string
    ): { success: boolean; message?: string } {
        if (gameState.currentTurn !== odium) return { success: false, message: 'ليس دورك' };
        if (gameState.turnPhase !== 'attack') return { success: false, message: 'لست في مرحلة الهجوم' };
        if (!gameState.pendingAttack) return { success: false, message: 'لم يتم الكشف عن مهاجم' };

        const defender = this.getOpponent(gameState, odium);
        if (!defender) return { success: false, message: 'لا يوجد خصم' };

        // Switch to defense phase
        gameState.turnPhase = 'defense';
        gameState.currentTurn = defender.odium;

        // Restore defender moves if persisting, otherwise reset to 3
        if (gameState.pendingAttack.defenderMovesRemaining !== undefined) {
            defender.movesRemaining = gameState.pendingAttack.defenderMovesRemaining;
            // Clear it after using so it doesn't get used again incorrectly (though resolved updates it)
            gameState.pendingAttack.defenderMovesRemaining = undefined;
        } else {
            defender.movesRemaining = 3; // New defense sequence gets 3 moves
        }

        gameState.turnStartTime = Date.now();

        return { success: true };
    }

    /**
     * Draw extra Ponto card (Abo Kaaf ability) - FREE, no move cost
     * Works in attack phase (adds to attack sum) or defense phase (adds to defense sum)
     */
    drawExtraPonto(
        gameState: GameState,
        odium: string
    ): { success: boolean; message?: string; pontoCard?: GameCard; newSum?: number; isDefense?: boolean } {
        const player = this.getPlayer(gameState, odium);
        if (!player) return { success: false, message: 'لاعب غير موجود' };
        if (gameState.currentTurn !== odium) return { success: false, message: 'ليس دورك' };
        
        // Check if Abo Kaaf ability is active
        if (!player.extraPontoAvailable) {
            return { success: false, message: 'ليس لديك قدرة سحب بونطو إضافي' };
        }

        // Must be in attack or defense phase
        if (gameState.turnPhase !== 'attack' && gameState.turnPhase !== 'defense') {
            return { success: false, message: 'يجب أن تكون في مرحلة الهجوم أو الدفاع' };
        }

        if (!gameState.pendingAttack) {
            return { success: false, message: 'لا يوجد هجوم نشط' };
        }

        // Draw the ponto card (no move cost!)
        const pontoCard = this.drawPontoCard(gameState);
        
        // Use the ability (one-time use per reveal)
        player.extraPontoAvailable = false;

        if (gameState.turnPhase === 'attack') {
            // Add to attack sum and arrays
            gameState.pendingAttack.pontoCards.push(pontoCard);
            gameState.pendingAttack.attackSum += (pontoCard.attack || 0);
            console.log(`🌟 Abo Kaaf extra ponto: +${pontoCard.attack} to attack (total: ${gameState.pendingAttack.attackSum})`);
            return {
                success: true,
                pontoCard,
                newSum: gameState.pendingAttack.attackSum,
                isDefense: false,
                message: `أبو كف! بونطو إضافي +${pontoCard.attack}`
            };
        } else {
            // Add to defense sum and arrays
            gameState.pendingAttack.defensePontoCard = pontoCard;
            gameState.pendingAttack.defensePontoCards.push(pontoCard);
            gameState.pendingAttack.defenseSum += (pontoCard.attack || 0);
            console.log(`🌟 Abo Kaaf extra ponto: +${pontoCard.attack} to defense (total: ${gameState.pendingAttack.defenseSum})`);
            return {
                success: true,
                pontoCard,
                newSum: gameState.pendingAttack.defenseSum,
                isDefense: true,
                message: `أبو كف! بونطو دفاعي إضافي +${pontoCard.attack}`
            };
        }
    }

    /**
     * Reveal a face-down defender on your field to add to defense
     * Costs 1 move (max 3 defenders with 3 moves)
     */
    revealDefender(
        gameState: GameState,
        odium: string,
        slotIndex: number
    ): { success: boolean; message?: string; defenseSum?: number; legendaryMessage?: string } {
        const player = this.getPlayer(gameState, odium);
        if (!player) return { success: false, message: 'لاعب غير موجود' };
        if (gameState.currentTurn !== odium) return { success: false, message: 'ليس دورك' };
        if (gameState.turnPhase !== 'defense') return { success: false, message: 'لست في مرحلة الدفاع' };
        if (!gameState.pendingAttack) return { success: false, message: 'لا يوجد هجوم معلق' };
        if (player.movesRemaining < 1) return { success: false, message: 'لا توجد حركات كافية' };

        const card = player.field[slotIndex];
        if (!card) return { success: false, message: 'لا يوجد كرت في هذا المكان' };
        if (card.isRevealed) return { success: false, message: 'الكرت مكشوف بالفعل' };
        if (card.position !== 'DF' && card.position !== 'GK' && card.position !== 'MF') {
            return { success: false, message: 'يجب أن يكون الكرت مدافع (DF, GK, MF)' };
        }

        // Reveal the card
        card.isRevealed = true;
        player.movesRemaining -= 1;

        // Apply legendary ability if this is a legendary card
        let legendaryMessage: string | undefined;
        if (card.isLegendary) {
            legendaryMessage = this.applyLegendaryAbility(gameState, card, player) || undefined;
        }

        // Add to defense sum
        gameState.pendingAttack.defenderSlots.push(slotIndex);
        gameState.pendingAttack.defenseSum += (card.defense || 0);

        return {
            success: true,
            defenseSum: gameState.pendingAttack.defenseSum,
            legendaryMessage
        };
    }

    /**
     * Defender accepts the goal (can't or won't defend)
     * Attacker scores +1 goal, turn ends
     */
    acceptGoal(
        gameState: GameState,
        odium: string
    ): { success: boolean; message?: string; scorerId?: string } {
        if (gameState.currentTurn !== odium) return { success: false, message: 'ليس دورك' };
        if (gameState.turnPhase !== 'defense') return { success: false, message: 'لست في مرحلة الدفاع' };
        if (!gameState.pendingAttack) return { success: false, message: 'لا يوجد هجوم معلق' };

        const attacker = this.getPlayer(gameState, gameState.pendingAttack.attackerId);
        if (!attacker) return { success: false, message: 'خطأ في اللاعب المهاجم' };

        // Attacker scores +1 goal
        attacker.score += 1;

        // Add ponto card to discard pile
        const pontoCard = gameState.pendingAttack.pontoCard;
        if (pontoCard && gameState.decks) {
            gameState.decks.pontoDiscard.push(pontoCard);
            console.log(`🎴 Ponto +${pontoCard.attack} added to discard pile (goal accepted)`);
        }

        // Clear pending attack
        const attackerId = gameState.pendingAttack.attackerId;
        gameState.pendingAttack = undefined;

        // Check if attacker has moves remaining
        if (attacker.movesRemaining > 0) {
            // Return control to attacker
            gameState.currentTurn = attackerId;
            gameState.turnPhase = 'play';
            // We usually don't reset turnStartTime here to keep the pressure on
        } else {
            // End turn - switch to defender (who now starts their draw phase)
            this.startTurn(gameState, odium);
        }

        return { success: true, scorerId: attackerId };
    }

    /**
     * Resolve the attack (called when defender ends defense)
     * Compare attackSum vs defenseSum
     */
    resolveAttack(
        gameState: GameState,
        odium: string
    ): { success: boolean; result?: 'goal' | 'blocked'; scorerId?: string } {
        if (gameState.currentTurn !== odium) return { success: false };
        if (gameState.turnPhase !== 'defense') return { success: false };
        if (!gameState.pendingAttack) return { success: false };

        const { attackerId, attackSum, defenseSum, pontoCard } = gameState.pendingAttack;
        const attacker = this.getPlayer(gameState, attackerId);
        if (!attacker) return { success: false };

        let result: 'goal' | 'blocked';

        if (attackSum > defenseSum) {
            // Attack succeeds - goal!
            result = 'goal';
            attacker.score += 1;
        } else {
            // Defense successful - blocked
            result = 'blocked';
        }

        // Helper to discard the ponto card
        const discardPontoCard = () => {
            if (pontoCard && gameState.decks) {
                gameState.decks.pontoDiscard.push(pontoCard);
                console.log(`🎴 Ponto +${pontoCard.attack} added to discard pile`);
            }
        };

        // Check if attacker has moves remaining
        if (attacker.movesRemaining > 0) {
            // Return control to attacker
            gameState.currentTurn = attackerId;
            gameState.turnPhase = 'play';

            // NEW: If blocked (not a goal), PERSIST the pending attack
            // This allows attacker to add more power to the existing clash
            if (result === 'goal') {
                discardPontoCard();
                gameState.pendingAttack = undefined;
            } else {
                // Keep pendingAttack (attackSum and defenseSum remain)
                // We might want to clear defenderSlots/attackerSlots if we wanted fresh cards, 
                // but user said "points added", so we keep everything.

                // SAVE DEFENDER MOVES (so they don't reset to 3 next time)
                const defender = this.getPlayer(gameState, odium);
                if (defender && gameState.pendingAttack) {
                    gameState.pendingAttack.defenderMovesRemaining = defender.movesRemaining;
                }
            }
        } else {
            // No moves left for attacker - turn ends
            discardPontoCard();
            gameState.pendingAttack = undefined; // Always clear at end of turn
            // End turn - switch to defender
            this.startTurn(gameState, odium);
        }

        return { success: true, result, scorerId: result === 'goal' ? attackerId : undefined };
    }

    endTurn(gameState: GameState, odium: string): boolean {
        if (gameState.currentTurn !== odium) return false;

        // Switch turn logic
        const isPlayer1 = gameState.player1.odium === odium;
        const nextPlayer = isPlayer1 ? gameState.player2! : gameState.player1;

        return this.startTurn(gameState, nextPlayer.odium);
    }

    /**
     * EXTRACTED: Explicitly start a turn for a specific player ID
     * This allows us to force the turn to the defender after an attack resolution
     */
    startTurn(gameState: GameState, nextPlayerId: string): boolean {
        const nextPlayer = this.getPlayer(gameState, nextPlayerId);
        if (!nextPlayer) return false;

        gameState.currentTurn = nextPlayer.odium;

        // Reset next player's moves to 3
        nextPlayer.movesRemaining = 3;

        gameState.turnNumber++;
        gameState.turnStartTime = Date.now();

        // Turn starts with mandatory draw phase (FREE - doesn't cost moves)
        gameState.turnPhase = 'draw';
        gameState.drawsRemaining = 2; // Must draw 2 cards

        return true;
    }

    /**
     * Draw a single card from a deck (during draw phase)
     * Player must draw 2 cards total, can mix player/action decks
     */
    drawFromDeck(
        gameState: GameState,
        odium: string,
        deckType: 'player' | 'action'
    ): { success: boolean; message?: string; drawnCard?: GameCard } {
        if (gameState.currentTurn !== odium) return { success: false, message: 'ليس دورك' };
        if (gameState.turnPhase !== 'draw') return { success: false, message: 'لست في مرحلة السحب' };
        if (!gameState.drawsRemaining || gameState.drawsRemaining <= 0) return { success: false, message: 'انتهيت من السحب' };

        const player = this.getPlayer(gameState, odium);
        if (!player) return { success: false, message: 'لاعب غير موجود' };

        // Ensure decks exist
        if (!gameState.decks) {
            gameState.decks = createShuffledDecks();
        }

        // Get the appropriate deck and discard pile
        const deck = deckType === 'player' ? gameState.decks.playerDeck : gameState.decks.actionDeck;
        const discardPile = deckType === 'player' ? gameState.decks.playerDiscard : gameState.decks.actionDiscard;
        
        // Reshuffle if deck is empty
        if (deck.length === 0) {
            reshuffleDeck(deck, discardPile);
            if (deck.length === 0) {
                return { success: false, message: 'الكومة فارغة ولا توجد كروت في المرتجعات' };
            }
        }

        const drawnCard = deck.pop()!;
        player.hand.push(drawnCard);
        gameState.drawsRemaining -= 1;

        // If drew both cards, transition to play phase
        if (gameState.drawsRemaining <= 0) {
            gameState.turnPhase = 'play';
        }

        return { success: true, drawnCard };
    }

    // ========================================
    // Game End
    // ========================================

    async endGame(gameState: GameState, winnerId: string, reason: string): Promise<void> {
        gameState.status = 'finished';
        gameState.winner = winnerId;

        // Update database (wrapped in try-catch since game might not be in DB)
        try {
            await prisma.game.update({
                where: { id: gameState.id },
                data: {
                    status: 'COMPLETED',
                    winnerId,
                    player1Score: gameState.player1.score,
                    player2Score: gameState.player2?.score || 0,
                    endedAt: new Date(),
                    gameState: gameState as any,
                },
            });
        } catch (error) {
            console.warn('⚠️ Could not update game in database (may not exist):', error);
        }

        // Update player stats
        const loserId = gameState.player1.odium === winnerId
            ? gameState.player2?.odium
            : gameState.player1.odium;

        try {
            if (winnerId) {
                await prisma.user.update({
                    where: { id: winnerId },
                    data: {
                        wins: { increment: 1 },
                        xp: { increment: 50 },
                        coins: { increment: 100 },
                        winStreak: { increment: 1 },
                    },
                });
            }

            if (loserId) {
                await prisma.user.update({
                    where: { id: loserId },
                    data: {
                        losses: { increment: 1 },
                        xp: { increment: 10 },
                        winStreak: 0,
                    },
                });
            }
        } catch (error) {
            console.warn('⚠️ Could not update player stats:', error);
        }

        // Cleanup
        activeGames.delete(gameState.id);
        playerToGame.delete(gameState.player1.odium);
        if (gameState.player2) {
            playerToGame.delete(gameState.player2.odium);
        }
        if (gameState.roomCode) {
            roomCodes.delete(gameState.roomCode);
        }
    }

    // ========================================
    // Helpers
    // ========================================

    private getPlayer(gameState: GameState, odium: string): PlayerState | null {
        if (gameState.player1.odium === odium) return gameState.player1;
        if (gameState.player2?.odium === odium) return gameState.player2;
        return null;
    }

    private getOpponent(gameState: GameState, odium: string): PlayerState | null {
        if (gameState.player1.odium === odium) return gameState.player2;
        if (gameState.player2?.odium === odium) return gameState.player1;
        return null;
    }

    private dealCards(player: PlayerState): GameCard {
        // Shuffle each deck separately
        const shuffledPlayers = [...PLAYER_CARDS].sort(() => Math.random() - 0.5);
        const shuffledActions = [...ACTION_CARDS].sort(() => Math.random() - 0.5);
        const shuffledPontos = [...PONTO_CARDS].sort(() => Math.random() - 0.5);

        // PRD: 5 random players on field (face-down to opponent)
        for (let i = 0; i < 5; i++) {
            const card = shuffledPlayers.pop();
            if (card) {
                player.field[i] = {
                    ...card,
                    id: uuidv4(),
                    isRevealed: false, // Cards start face-down
                };
            }
        }

        // PRD: 2 player cards in hand
        for (let i = 0; i < 2; i++) {
            const card = shuffledPlayers.pop();
            if (card) {
                player.hand.push({
                    ...card,
                    id: uuidv4(),
                });
            }
        }

        // PRD: 3 action cards in hand
        for (let i = 0; i < 3; i++) {
            const card = shuffledActions.pop();
            if (card) {
                player.hand.push({
                    ...card,
                    id: uuidv4(),
                });
            }
        }

        // PRD: Draw 1 ponto card (used for turn order)
        const pontoCard = shuffledPontos.pop();
        return pontoCard ? { ...pontoCard, id: uuidv4() } : { id: uuidv4(), type: 'ponto', name: 'Ponto', nameAr: 'بونطو', attack: 1 };
    }
}

export const gameService = new GameService();
