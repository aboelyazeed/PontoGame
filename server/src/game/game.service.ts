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

// PLAYER CARDS
const GOALKEEPER_CARDS: GameCard[] = generateCards(8, {
    type: 'player',
    name: 'Goalkeeper',
    nameAr: 'حارس مرمى',
    position: 'GK',
    attack: 0,
    defense: 8,
    description: 'حارس مرمى متمكن، يصد أقوى الضربات.',
    imageUrl: 'GK.png',
});

const DEFENDER_CARDS: GameCard[] = generateCards(8, {
    type: 'player',
    name: 'Defender',
    nameAr: 'مدافع',
    position: 'DF',
    attack: 0,
    defense: 6,
    description: 'تصدّي قوي، يُوقف الهجمات ببراعة، درع صلب.',
    imageUrl: 'DF.png',
});

const MIDFIELDER_DEF_CARDS: GameCard[] = generateCards(12, {
    type: 'player',
    name: 'Midfielder (Defensive)',
    nameAr: 'لاعب وسط',
    position: 'MF',
    attack: 2,
    defense: 3,
    description: 'تحكم بالوسط، يوزع اللعب ويساعد في الدفاع والهجوم ببراعة.',
    imageUrl: 'CDM.png',
});

const MIDFIELDER_ATK_CARDS: GameCard[] = generateCards(12, {
    type: 'player',
    name: 'Midfielder (Attacking)',
    nameAr: 'لاعب وسط',
    position: 'MF',
    attack: 3,
    defense: 2,
    description: 'صانع ألعاب ماهر، يخترق الدفاعات ويصنع فرصاً خطيرة.',
    imageUrl: 'CAM.png',
});

const FORWARD_CARDS: GameCard[] = generateCards(8, {
    type: 'player',
    name: 'Forward',
    nameAr: 'مهاجم',
    position: 'FW',
    attack: 4,
    defense: 0,
    description: 'مهاجم قناص، يمزق الشباك بضرباته القوية.',
    imageUrl: 'FW.png',
});

const STRIKER_CARDS: GameCard[] = generateCards(4, {
    type: 'player',
    name: 'Striker',
    nameAr: 'رأس حربة',
    position: 'FW',
    attack: 6,
    defense: 0,
    description: 'رأس حربة شرس، ينهي الهجمات بضربات مباشرة قوية.',
    imageUrl: 'ST.png',
});

// ACTION CARDS
const ACTION_CARDS: GameCard[] = [
    { id: 'act_swap_1', type: 'action', name: 'Swap', nameAr: 'قصب بقصب', description: 'تبادل لاعب بلاعب (تختار أنت)', actionEffect: 'swap' },
    { id: 'act_swap_2', type: 'action', name: 'Swap', nameAr: 'قصب بقصب', description: 'تبادل لاعب بلاعب (تختار أنت)', actionEffect: 'swap' },
    { id: 'act_shoulder_1', type: 'action', name: 'Shoulder', nameAr: 'كتف قانوني', description: '+2 Defense أثناء الدفاع', actionEffect: 'shoulder' },
    { id: 'act_shoulder_2', type: 'action', name: 'Shoulder', nameAr: 'كتف قانوني', description: '+2 Defense أثناء الدفاع', actionEffect: 'shoulder' },
    { id: 'act_var_1', type: 'action', name: 'VAR', nameAr: 'VAR', description: 'اسحب بونطو: ≥4 تلغى الهجمة، <4 هدف', actionEffect: 'var' },
    { id: 'act_var_2', type: 'action', name: 'VAR', nameAr: 'VAR', description: 'اسحب بونطو: ≥4 تلغى الهجمة، <4 هدف', actionEffect: 'var' },
    { id: 'act_mercato_1', type: 'action', name: 'Mercato', nameAr: 'ميركاتو', description: 'سحب 2 لاعبين', actionEffect: 'mercato' },
    { id: 'act_mercato_2', type: 'action', name: 'Mercato', nameAr: 'ميركاتو', description: 'سحب 2 لاعبين', actionEffect: 'mercato' },
    { id: 'act_biter_1', type: 'action', name: 'Biter', nameAr: 'العضاض', description: '+4 Attack ثم طرد لاعبك', actionEffect: 'biter' },
    { id: 'act_biter_2', type: 'action', name: 'Biter', nameAr: 'العضاض', description: '+4 Attack ثم طرد لاعبك', actionEffect: 'biter' },
    { id: 'act_red_1', type: 'action', name: 'Red Card', nameAr: 'كارت أحمر', description: 'طرد مهاجم من الخصم', actionEffect: 'red_card' },
    { id: 'act_red_2', type: 'action', name: 'Red Card', nameAr: 'كارت أحمر', description: 'طرد مهاجم من الخصم', actionEffect: 'red_card' },
    { id: 'act_yellow_1', type: 'action', name: 'Yellow Card', nameAr: 'كارت أصفر', description: '-2 Attack، بطاقتين = طرد', actionEffect: 'yellow_card' },
    { id: 'act_yellow_2', type: 'action', name: 'Yellow Card', nameAr: 'كارت أصفر', description: '-2 Attack، بطاقتين = طرد', actionEffect: 'yellow_card' },
];

// PONTO CARDS (5 of each value)
const PONTO_CARDS: GameCard[] = [
    ...generateCards(5, { type: 'ponto', name: 'Ponto +1', nameAr: 'بونطو +1', attack: 1 }),
    ...generateCards(5, { type: 'ponto', name: 'Ponto +2', nameAr: 'بونطو +2', attack: 2 }),
    ...generateCards(5, { type: 'ponto', name: 'Ponto +3', nameAr: 'بونطو +3', attack: 3 }),
    ...generateCards(5, { type: 'ponto', name: 'Ponto +4', nameAr: 'بونطو +4', attack: 4 }),
    ...generateCards(5, { type: 'ponto', name: 'Ponto +5', nameAr: 'بونطو +5', attack: 5 }),
];

// LEGENDARY PLAYER CARDS (PRD Section 9) - 1 of each
const LEGENDARY_CARDS: GameCard[] = [
    {
        id: 'leg_ronaldo',
        type: 'player',
        name: 'Ronaldo - El Duzen',
        nameAr: 'رونالدو – الدووزن',
        position: 'FW',
        attack: 8,
        defense: 0,
        description: 'إلغاء أي أحكام/تأثيرات للخصم',
        isLegendary: true,
        legendaryAbility: 'ronaldo',
    },
    {
        id: 'leg_iniesta',
        type: 'player',
        name: 'Iniesta - The Artist',
        nameAr: 'إنيستا – الرسام',
        position: 'MF',
        attack: 6,
        defense: 6,
        description: 'بعد الاستخدام يمكن قلبه واستخدامه مرة ثانية فقط',
        isLegendary: true,
        legendaryAbility: 'iniesta',
    },
    {
        id: 'leg_shehata',
        type: 'player',
        name: 'Shehata - Abu Kaff',
        nameAr: 'شحاتة أبو كف',
        position: 'MF',
        attack: 4,
        defense: 2,
        description: 'سحب 2 بونطو في الهجوم أو 2 Special دفاعي',
        isLegendary: true,
        legendaryAbility: 'shehata',
    },
    {
        id: 'leg_modric',
        type: 'player',
        name: 'Modric - The Maestro',
        nameAr: 'مودريتش – المايسترو',
        position: 'MF',
        attack: 6,
        defense: 6,
        description: '+1 Attack & Defense لكل لاعبيك طالما في الملعب',
        isLegendary: true,
        legendaryAbility: 'modric',
    },
    {
        id: 'leg_messi',
        type: 'player',
        name: 'Messi - The Goat',
        nameAr: 'ميسي – المعزة',
        position: 'FW',
        attack: 8,
        defense: 0,
        description: 'إلغاء أي تكتيكات للخصم عند لعبه',
        isLegendary: true,
        legendaryAbility: 'messi',
    },
    {
        id: 'leg_yashin',
        type: 'player',
        name: 'Lev Yashin - Abu Yaseen',
        nameAr: 'ليف ياشين – أبو ياسين',
        position: 'GK',
        attack: 0,
        defense: 9,
        description: 'إزالة نقاط كارت البونطو أثناء الدفاع',
        isLegendary: true,
        legendaryAbility: 'yashin',
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
        };

        // Deal initial hands
        this.dealCards(gameState.player1);
        if (gameState.player2) {
            this.dealCards(gameState.player2);
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
        };
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
        this.dealCards(room.player1);
        this.dealCards(room.player2);

        // Move from rooms to active games
        activeRooms.delete(gameId);
        activeGames.set(gameId, room);

        // Update mappings
        playerToGame.set(player.odium, gameId);

        // Initialize game start
        room.status = 'starting';
        room.turnStartTime = Date.now();
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

        // Check if player has moves remaining (costs 1 move)
        if (player.movesRemaining < 1) return false;

        // Check if slot is empty
        if (player.field[slotIndex] !== null) return false;

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
        if (player.movesRemaining < 1) return { success: false, drawnCards: [] };

        const drawnCards: GameCard[] = [];
        let sourcePool: GameCard[] = [];

        switch (cardType) {
            case 'player':
                sourcePool = [...PLAYER_CARDS];
                break;
            case 'action':
                sourcePool = [...ACTION_CARDS];
                break;
            case 'ponto':
                sourcePool = [...PONTO_CARDS];
                break;
        }

        for (let i = 0; i < count && sourcePool.length > 0; i++) {
            const idx = Math.floor(Math.random() * sourcePool.length);
            const drawn = { ...sourcePool.splice(idx, 1)[0] };
            drawn.id = `${drawn.id}_drawn_${Date.now()}_${i}`;
            player.hand.push(drawn);
            drawnCards.push(drawn);
        }

        // Deduct move (1 move for drawing)
        player.movesRemaining -= 1;

        return { success: true, drawnCards };
    }

    /**
     * Flip a face-down card on your field to reveal it (costs 1 move)
     */
    flipCard(gameState: GameState, odium: string, slotIndex: number): boolean {
        const player = this.getPlayer(gameState, odium);
        if (!player) return false;
        if (gameState.currentTurn !== odium) return false;
        if (player.movesRemaining < 1) return false;

        const card = player.field[slotIndex];
        if (!card) return false;
        if (card.isRevealed) return false; // Already revealed

        card.isRevealed = true;
        player.movesRemaining -= 1;

        return true;
    }

    /**
     * Swap a card from hand with a card on field (costs 1 move)
     * PRD: "تبديل لاعب من اليد بلاعب من الملعب"
     */
    swapCards(gameState: GameState, odium: string, handCardId: string, fieldSlotIndex: number): boolean {
        const player = this.getPlayer(gameState, odium);
        if (!player) return false;
        if (gameState.currentTurn !== odium) return false;
        if (player.movesRemaining < 1) return false;

        // Find card in hand
        const handCardIndex = player.hand.findIndex(c => c.id === handCardId);
        if (handCardIndex === -1) return false;

        // Get field card (can be null for empty slot, but swap requires card)
        const fieldCard = player.field[fieldSlotIndex];
        if (!fieldCard) return false; // Must swap with existing card

        const handCard = player.hand[handCardIndex];
        handCard.isRevealed = false; // Placed face-down on field

        // Check conditions: If field card is revealed, it goes back to "deck" (discarded)
        if (fieldCard.isRevealed) {
            // Move Hand Card to Field
            player.field[fieldSlotIndex] = handCard;
            // Remove Hand Card from Hand (it moved to field) and discard Field Card (don't put in hand)
            player.hand.splice(handCardIndex, 1);
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

        // Remove discard cards (in reverse order to maintain indices)
        discardIndices.sort((a, b) => b - a);
        for (const idx of discardIndices) {
            player.hand.splice(idx, 1);
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
     */
    useActionCard(
        gameState: GameState,
        odium: string,
        cardId: string,
        targetData?: {
            slotIndex1?: number;      // For swap, biter, yellow
            slotIndex2?: number;      // For swap (second card)
            isOpponentSlot1?: boolean; // For swap, red, yellow
            isOpponentSlot2?: boolean; // For swap
        }
    ): { success: boolean; message?: string; drawnCards?: GameCard[]; varResult?: number } {
        const player = this.getPlayer(gameState, odium);
        const opponent = this.getOpponent(gameState, odium);
        if (!player || !opponent) return { success: false, message: 'لاعب غير موجود' };
        if (gameState.currentTurn !== odium && gameState.turnPhase !== 'defense') {
            return { success: false, message: 'ليس دورك' };
        }
        if (player.movesRemaining < 1) return { success: false, message: 'لا توجد حركات كافية' };

        // Find action card in hand
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return { success: false, message: 'الكارت غير موجود' };

        const card = player.hand[cardIndex];
        if (card.type !== 'action') return { success: false, message: 'ليس كارت أكشن' };

        const effect = card.actionEffect;
        let drawnCards: GameCard[] = [];
        let varResult: number | undefined;

        switch (effect) {
            case 'shoulder': // كتف قانوني: +2 Defense during defense
                if (gameState.turnPhase !== 'defense' || !gameState.pendingAttack) {
                    return { success: false, message: 'يستخدم فقط في الدفاع' };
                }
                gameState.pendingAttack.defenseSum += 2;
                player.movesRemaining -= 1;
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

            case 'biter': // العضاض: +4 Attack, then eject your card
                // Used during attack phase - boost attack sum
                if (gameState.pendingAttack) {
                    gameState.pendingAttack.attackSum += 4;
                }
                // Eject own card from specified slot
                if (targetData?.slotIndex1 !== undefined) {
                    player.field[targetData.slotIndex1] = null;
                }
                break;

            case 'red_card': // كارت أحمر: Eject opponent's FW
                if (targetData?.slotIndex1 !== undefined) {
                    const targetCard = opponent.field[targetData.slotIndex1];
                    if (targetCard && targetCard.position === 'FW') {
                        opponent.field[targetData.slotIndex1] = null;
                    } else {
                        return { success: false, message: 'يجب اختيار مهاجم' };
                    }
                } else {
                    return { success: false, message: 'يجب تحديد الهدف' };
                }
                break;

            case 'yellow_card': // كارت أصفر: -2 Attack, 2 yellows = eject
                if (targetData?.slotIndex1 !== undefined) {
                    const targetPlayer = targetData.isOpponentSlot1 ? opponent : player;
                    const targetCard = targetPlayer.field[targetData.slotIndex1];
                    if (targetCard) {
                        targetCard.attack = Math.max(0, (targetCard.attack || 0) - 2);
                        targetCard.yellowCards = (targetCard.yellowCards || 0) + 1;
                        if (targetCard.yellowCards >= 2) {
                            targetPlayer.field[targetData.slotIndex1] = null; // Ejected
                        }
                    }
                } else {
                    return { success: false, message: 'يجب تحديد الهدف' };
                }
                break;

            case 'var': // VAR: Draw ponto, ≥4 cancels attack, <4 = goal
                if (gameState.turnPhase !== 'defense' || !gameState.pendingAttack) {
                    return { success: false, message: 'يستخدم فقط في الدفاع' };
                }
                // Draw random Ponto value (1-5)
                varResult = Math.ceil(Math.random() * 5);
                if (varResult >= 4) {
                    // Cancel the attack
                    gameState.pendingAttack.attackSum = 0; // Nullify attack
                } else {
                    // Attack succeeds with extra damage
                    gameState.pendingAttack.defenseSum = 0; // Defense fails
                }
                break;

            case 'swap': // قصب بقصب: Swap any 2 cards
                if (targetData?.slotIndex1 === undefined || targetData?.slotIndex2 === undefined) {
                    return { success: false, message: 'يجب تحديد كارتين' };
                }
                const player1 = targetData.isOpponentSlot1 ? opponent : player;
                const player2 = targetData.isOpponentSlot2 ? opponent : player;
                const card1 = player1.field[targetData.slotIndex1];
                const card2 = player2.field[targetData.slotIndex2];
                if (!card1 || !card2) return { success: false, message: 'لا يوجد كروت' };
                player1.field[targetData.slotIndex1] = card2;
                player2.field[targetData.slotIndex2] = card1;
                break;

            default:
                return { success: false, message: 'تأثير غير معروف' };
        }

        // Remove card from hand
        player.hand.splice(cardIndex, 1);

        // Deduct move (except shoulder which uses defense moves)
        if (effect !== 'shoulder') {
            player.movesRemaining -= 1;
        }

        return { success: true, drawnCards, varResult };
    }

    /**
     * Draw a random Ponto card
     */
    drawPontoCard(): GameCard {
        const template = PONTO_CARDS[Math.floor(Math.random() * PONTO_CARDS.length)];
        return {
            ...template,
            id: uuidv4(),
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
    ): { success: boolean; message?: string; pontoCard?: GameCard; attackSum?: number } {
        const player = this.getPlayer(gameState, odium);
        if (!player) return { success: false, message: 'لاعب غير موجود' };
        if (gameState.currentTurn !== odium) return { success: false, message: 'ليس دورك' };
        if (gameState.turnPhase === 'defense') return { success: false, message: 'أنت في مرحلة الدفاع' };
        if (gameState.turnPhase === 'draw') return { success: false, message: 'يجب سحب الكروت أولاً' };

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
            };

            return {
                success: true,
                pontoCard: undefined,
                attackSum: gameState.pendingAttack.attackSum
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
            attackSum: gameState.pendingAttack.attackSum
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

        const pontoCard = this.drawPontoCard();
        gameState.pendingAttack.pontoCard = pontoCard;
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
        defender.movesRemaining = 3; // Defender gets 3 moves
        gameState.turnStartTime = Date.now();

        return { success: true };
    }

    /**
     * Reveal a face-down defender on your field to add to defense
     * Costs 1 move (max 3 defenders with 3 moves)
     */
    revealDefender(
        gameState: GameState,
        odium: string,
        slotIndex: number
    ): { success: boolean; message?: string; defenseSum?: number } {
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

        // Add to defense sum
        gameState.pendingAttack.defenderSlots.push(slotIndex);
        gameState.pendingAttack.defenseSum += (card.defense || 0);

        return {
            success: true,
            defenseSum: gameState.pendingAttack.defenseSum
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

        // Clear pending attack
        const attackerId = gameState.pendingAttack.attackerId;
        gameState.pendingAttack = undefined;

        // End turn - switch to defender (who now starts their draw phase)
        this.endTurn(gameState, odium);

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

        const { attackerId, attackSum, defenseSum } = gameState.pendingAttack;
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

        // Clear pending attack
        gameState.pendingAttack = undefined;

        // End turn - switch to defender (who now starts their draw phase)
        this.endTurn(gameState, odium);

        return { success: true, result, scorerId: result === 'goal' ? attackerId : undefined };
    }

    endTurn(gameState: GameState, odium: string): boolean {
        if (gameState.currentTurn !== odium) return false;

        // Switch turn
        const isPlayer1 = gameState.player1.odium === odium;
        const nextPlayer = isPlayer1 ? gameState.player2! : gameState.player1;

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

        const deck = deckType === 'player' ? PLAYER_CARDS : ACTION_CARDS;
        const template = deck[Math.floor(Math.random() * deck.length)];
        const drawnCard: GameCard = {
            ...template,
            id: uuidv4(),
        };

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
