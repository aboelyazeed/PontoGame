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
    { id: 'act_swap_1', type: 'action', name: 'Swap', nameAr: 'قصب بقصب', description: 'تبادل لاعب بلاعب (تختار أنت)' },
    { id: 'act_swap_2', type: 'action', name: 'Swap', nameAr: 'قصب بقصب', description: 'تبادل لاعب بلاعب (تختار أنت)' },
    { id: 'act_shoulder_1', type: 'action', name: 'Shoulder', nameAr: 'كتف قانوني', description: '+2 Defense أثناء الدفاع' },
    { id: 'act_shoulder_2', type: 'action', name: 'Shoulder', nameAr: 'كتف قانوني', description: '+2 Defense أثناء الدفاع' },
    { id: 'act_var_1', type: 'action', name: 'VAR', nameAr: 'VAR', description: 'اسحب بونطو: ≥4 تلغى الهجمة، <4 هدف' },
    { id: 'act_var_2', type: 'action', name: 'VAR', nameAr: 'VAR', description: 'اسحب بونطو: ≥4 تلغى الهجمة، <4 هدف' },
    { id: 'act_mercato_1', type: 'action', name: 'Mercato', nameAr: 'ميركاتو', description: 'سحب 2 لاعبين' },
    { id: 'act_mercato_2', type: 'action', name: 'Mercato', nameAr: 'ميركاتو', description: 'سحب 2 لاعبين' },
    { id: 'act_biter_1', type: 'action', name: 'Biter', nameAr: 'العضاض', description: '+4 Attack ثم طرد لاعبك' },
    { id: 'act_biter_2', type: 'action', name: 'Biter', nameAr: 'العضاض', description: '+4 Attack ثم طرد لاعبك' },
    { id: 'act_red_1', type: 'action', name: 'Red Card', nameAr: 'كارت أحمر', description: 'طرد مهاجم من الخصم' },
    { id: 'act_red_2', type: 'action', name: 'Red Card', nameAr: 'كارت أحمر', description: 'طرد مهاجم من الخصم' },
    { id: 'act_yellow_1', type: 'action', name: 'Yellow Card', nameAr: 'كارت أصفر', description: '-2 Attack، بطاقتين = طرد' },
    { id: 'act_yellow_2', type: 'action', name: 'Yellow Card', nameAr: 'كارت أصفر', description: '-2 Attack، بطاقتين = طرد' },
];

// PONTO CARDS (5 of each value)
const PONTO_CARDS: GameCard[] = [
    ...generateCards(5, { type: 'ponto', name: 'Ponto +1', nameAr: 'بونطو +1', attack: 1 }),
    ...generateCards(5, { type: 'ponto', name: 'Ponto +2', nameAr: 'بونطو +2', attack: 2 }),
    ...generateCards(5, { type: 'ponto', name: 'Ponto +3', nameAr: 'بونطو +3', attack: 3 }),
    ...generateCards(5, { type: 'ponto', name: 'Ponto +4', nameAr: 'بونطو +4', attack: 4 }),
    ...generateCards(5, { type: 'ponto', name: 'Ponto +5', nameAr: 'بونطو +5', attack: 5 }),
];

// All player cards combined
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
    actions: ACTION_CARDS,
    pontos: PONTO_CARDS,
};

export class GameService {
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
            turnPhase: 'play',
            turnNumber: 1,
            turnStartTime: Date.now(),
            turnTimeLimit: 60, // 60 seconds per turn

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

    async createRoom(host: QueueEntry, isPrivate: boolean = false, password?: string): Promise<GameState> {
        // Remove from queue if in it
        this.removeFromQueue(host.odium);

        const gameId = uuidv4();
        const roomCode = this.generateRoomCode();

        // Create initial game state (Waiting room)
        const gameState: GameState = {
            id: gameId,
            roomCode,
            status: 'waiting',
            currentTurn: host.odium,
            turnPhase: 'play',
            turnNumber: 0,
            turnStartTime: 0,
            turnTimeLimit: 60,

            player1: this.createPlayerState(host),
            player2: null, // Waiting for second player

            // Custom room properties can be added here
            isPrivate,
            hasPassword: !!password,
            password,
        } as any; // Cast to GameState (we might need to extend GameState type)

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
                const { password, ...safeRoom } = room as any;
                return safeRoom;
            });
    }

    deleteRoom(roomId: string): boolean {
        const room = activeRooms.get(roomId);
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
        const room = activeRooms.get(roomId);
        if (!room || !room.player2) return false;

        // Clean up player2's references
        playerToGame.delete(room.player2.odium);
        room.player2 = null;

        console.log(`👋 Player2 removed from room ${roomId}`);
        return true;
    }

    transferHost(roomId: string): GameState | null {
        const room = activeRooms.get(roomId);
        if (!room || !room.player2) return null;

        // Swap player1 and player2
        const oldHost = room.player1;
        room.player1 = room.player2;
        room.player2 = null;

        // Update playerToGame mapping - remove old host
        playerToGame.delete(oldHost.odium);
        // player1 (new host) already has mapping to this room

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
        return activeGames.get(gameId) || null;
    }

    playCard(gameState: GameState, odium: string, cardId: string, slotIndex: number): boolean {
        const player = this.getPlayer(gameState, odium);
        if (!player) return false;

        // Check if it's player's turn
        if (gameState.currentTurn !== odium) return false;

        // Check if slot is empty
        if (player.field[slotIndex] !== null) return false;

        // Find card in hand
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return false;

        // Move card to field
        const card = player.hand.splice(cardIndex, 1)[0];
        player.field[slotIndex] = card;

        return true;
    }

    attack(
        gameState: GameState,
        attackerOdium: string,
        attackerSlotIndex: number,
        defenderSlotIndex: number
    ): { success: boolean; result?: 'win' | 'lose' | 'draw'; damage?: number } {
        const attacker = this.getPlayer(gameState, attackerOdium);
        const defender = this.getOpponent(gameState, attackerOdium);

        if (!attacker || !defender) return { success: false };
        if (gameState.currentTurn !== attackerOdium) return { success: false };

        const attackerCard = attacker.field[attackerSlotIndex];
        const defenderCard = defender.field[defenderSlotIndex];

        if (!attackerCard) return { success: false };

        const attackValue = attackerCard.attack || 0;
        let defenseValue = 0;

        if (defenderCard) {
            defenseValue = defenderCard.defense || 0;
        }

        // Calculate result
        let result: 'win' | 'lose' | 'draw';
        let damage = 0;

        if (attackValue > defenseValue) {
            result = 'win';
            damage = attackValue - defenseValue;
            attacker.score += damage;

            // Remove defender card if it exists
            if (defenderCard) {
                defender.field[defenderSlotIndex] = null;
            }
        } else if (attackValue < defenseValue) {
            result = 'lose';
            // Attacker card is removed
            attacker.field[attackerSlotIndex] = null;
        } else {
            result = 'draw';
            // Both cards removed
            attacker.field[attackerSlotIndex] = null;
            if (defenderCard) {
                defender.field[defenderSlotIndex] = null;
            }
        }

        return { success: true, result, damage };
    }

    endTurn(gameState: GameState, odium: string): boolean {
        if (gameState.currentTurn !== odium) return false;

        // Switch turn
        const isPlayer1 = gameState.player1.odium === odium;
        gameState.currentTurn = isPlayer1
            ? gameState.player2!.odium
            : gameState.player1.odium;

        gameState.turnNumber++;
        gameState.turnStartTime = Date.now();
        gameState.turnPhase = 'play';

        return true;
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
