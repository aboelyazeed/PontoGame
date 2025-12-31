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
const playerToGame: Map<string, string> = new Map(); // odium -> gameId

// ==========================================
// Sample Cards (will be replaced by database)
// ==========================================
const SAMPLE_CARDS: GameCard[] = [
    // Attackers (Red cards)
    { id: 'c1', type: 'player', name: 'Striker', nameAr: 'رأس حربة', position: 'FW', attack: 6, defense: 0, description: 'رأس حربة شرس، ينهي الهجمات بضربات مباشرة قوية.' },
    { id: 'c2', type: 'player', name: 'Forward', nameAr: 'مهاجم', position: 'FW', attack: 4, defense: 0, description: 'مهاجم قناص، يمزق الشباك بضرباته القوية.' },

    // Midfielders (Orange/Green cards)
    { id: 'c3', type: 'player', name: 'Midfielder A', nameAr: 'لاعب وسط', position: 'MF', attack: 3, defense: 2, description: 'صانع ألعاب ماهر، يخترق الدفاعات ويصنع فرصاً خطيرة.' },
    { id: 'c4', type: 'player', name: 'Midfielder B', nameAr: 'لاعب وسط', position: 'MF', attack: 2, defense: 3, description: 'تحكم بالوسط، يوزع اللعب ويساعد في الدفاع والهجوم ببراعة.' },

    // Defenders (Blue cards)
    { id: 'c5', type: 'player', name: 'Defender', nameAr: 'مدافع', position: 'DF', attack: 0, defense: 6, description: 'تصدّي قوي، يُوقف الهجمات ببراعة، درع صلب.' },

    // Action cards
    { id: 'c6', type: 'action', name: 'Power Boost', nameAr: 'بطاقة قوة', description: '+2 لأي كارت في هذا الدور' },

    // Ponto cards
    { id: 'c7', type: 'ponto', name: 'Ponto', nameAr: 'بونتو', description: 'كارت خاص' },
];

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
        };
    }

    private dealCards(player: PlayerState) {
        // Shuffle and deal 7 cards
        const shuffled = [...SAMPLE_CARDS].sort(() => Math.random() - 0.5);
        player.hand = shuffled.slice(0, 7).map(card => ({
            ...card,
            id: uuidv4(), // Give each instance a unique ID
        }));
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

        // Update database
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

        // Update player stats
        const loserId = gameState.player1.odium === winnerId
            ? gameState.player2?.odium
            : gameState.player1.odium;

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

        // Cleanup
        activeGames.delete(gameState.id);
        playerToGame.delete(gameState.player1.odium);
        if (gameState.player2) {
            playerToGame.delete(gameState.player2.odium);
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
}

export const gameService = new GameService();
