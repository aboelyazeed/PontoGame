// ==========================================
// Ponto Game - Game Socket Gateway
// ==========================================

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { gameService } from './game.service.js';
import {
    ClientToServerEvents,
    ServerToClientEvents,
    QueueEntry
} from './game.types.js';

interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
    userId?: string;
    username?: string;
    displayName?: string;
    level?: number;
    rank?: string;
}

export function setupGameSocket(io: Server) {
    // ========================================
    // Authentication Middleware
    // ========================================
    io.use(async (socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'secret'
            ) as { userId: string; username: string };

            socket.userId = decoded.userId;
            socket.username = decoded.username;

            // Fetch user data from database for accurate displayName
            try {
                const user = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: { displayName: true, level: true, rank: true }
                });

                socket.displayName = user?.displayName || decoded.username;
                socket.level = user?.level || 1;
                socket.rank = user?.rank || 'مبتدئ';
            } catch (dbError) {
                // Fallback if DB fails
                socket.displayName = socket.handshake.auth.displayName || decoded.username;
                socket.level = socket.handshake.auth.level || 1;
                socket.rank = socket.handshake.auth.rank || 'مبتدئ';
            }

            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    // ========================================
    // Connection Handler
    // ========================================
    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`🔌 Player connected: ${socket.username} (${socket.id})`);

        // Send connection confirmation
        socket.emit('connected', { playerId: socket.userId! });

        // Broadcast online users count
        const onlineCount = io.engine.clientsCount;
        io.emit('online_users_update', { count: onlineCount });

        // ========================================
        // Turn Timer Monitoring (Check every second)
        // ========================================
        const turnTimerInterval = setInterval(() => {
            const activeGamesMap = gameService.getActiveGames();
            const now = Date.now();

            activeGamesMap.forEach((game, gameId) => {
                if (game.status !== 'playing') return;
                if (!game.turnStartTime) return;

                const elapsedSeconds = (now - game.turnStartTime) / 1000;

                // Check if turn time has expired (90 seconds)
                if (elapsedSeconds >= game.turnTimeLimit) {
                    console.log(`⏰ Turn timeout for game ${gameId} - Player ${game.currentTurn}`);

                    // Auto-end the turn
                    const success = gameService.endTurn(game, game.currentTurn);
                    if (success) {
                        io.to(`game:${gameId}`).emit('game_update', game);
                        io.to(`game:${gameId}`).emit('turn_start', {
                            playerId: game.currentTurn,
                            timeLimit: game.turnTimeLimit
                        });
                        console.log(`⏰ Turn auto-ended. Now ${game.currentTurn}'s turn.`);
                    }
                }
            });
        }, 1000);

        // Clean up timer on disconnect
        socket.on('disconnect', () => {
            clearInterval(turnTimerInterval);
        });

        // ========================================
        // Room Events
        // ========================================

        socket.on('create_room', async ({ isPrivate, password, roomName }) => {
            console.log(`🏠 ${socket.username} creating room (Private: ${isPrivate}, HasPassword: ${!!password}, Name: ${roomName || 'None'})`);

            const entry: QueueEntry = {
                odium: socket.userId!,
                socketId: socket.id,
                username: socket.username!,
                displayName: socket.displayName!,
                level: socket.level!,
                rank: socket.rank!,
                joinedAt: Date.now(),
            };

            const room = await gameService.createRoom(entry, isPrivate, password, roomName);
            socket.join(`game:${room.id}`);

            // Notify creator with both events for reliability
            socket.emit('room_created', room);
            socket.emit('join_success', room);

            // Broadcast update to all (except creator if private)
            if (!isPrivate) {
                io.emit('rooms_list_update', gameService.getAvailableRooms());
            }
        });

        socket.on('get_rooms', () => {
            socket.emit('rooms_list', gameService.getAvailableRooms());
        });

        socket.on('get_online_count', () => {
            const count = io.engine.clientsCount;
            socket.emit('online_users_update', { count });
        });

        socket.on('join_room', ({ roomId, password }) => {
            console.log(`🚪 ${socket.username} joining room ${roomId}`);

            const entry: QueueEntry = {
                odium: socket.userId!,
                socketId: socket.id,
                username: socket.username!,
                displayName: socket.displayName!,
                level: socket.level!,
                rank: socket.rank!,
                joinedAt: Date.now(),
            };

            const room = gameService.joinRoom(roomId, entry, password);

            if (room) {
                const roomSocketId = `game:${room.id}`;
                socket.join(roomSocketId);

                // Notify host that player joined (don't auto-start game)
                io.to(roomSocketId).emit('player_joined', {
                    player: {
                        odium: entry.odium,
                        displayName: entry.displayName,
                        level: entry.level,
                        rank: entry.rank,
                    }
                });

                // Send room update to all in room
                io.to(roomSocketId).emit('room_update', room);

                // Confirm join to the player (reliable navigation trigger)
                socket.emit('join_success', room);

                // Update rooms list for everyone else
                io.emit('rooms_list_update', gameService.getAvailableRooms());
            } else {
                console.log(`❌ Join failed for ${socket.username}: Room not found, full, or invalid state`);
                socket.emit('error', { message: 'الغرفة ممتلئة أو كلمة المرور غير صحيحة', code: 'ROOM_ERROR' });
            }
        });

        socket.on('join_room_by_code', ({ roomCode, password }) => {
            console.log(`🔑 ${socket.username} joining room with code ${roomCode}`);

            const entry: QueueEntry = {
                odium: socket.userId!,
                socketId: socket.id,
                username: socket.username!,
                displayName: socket.displayName!,
                level: socket.level!,
                rank: socket.rank!,
                joinedAt: Date.now(),
            };

            const room = gameService.joinRoomByCode(roomCode, entry, password);

            if (room) {
                const roomSocketId = `game:${room.id}`;
                socket.join(roomSocketId);

                // Notify host that player joined (don't auto-start game)
                io.to(roomSocketId).emit('player_joined', {
                    player: {
                        odium: entry.odium,
                        displayName: entry.displayName,
                        level: entry.level,
                        rank: entry.rank,
                    }
                });

                // Send room update to all in room
                io.to(roomSocketId).emit('room_update', room);

                // Confirm join to the player (reliable navigation trigger)
                socket.emit('join_success', room);

                // Update rooms list for everyone else
                io.emit('rooms_list_update', gameService.getAvailableRooms());
            } else {
                socket.emit('error', { message: 'رمز الغرفة غير صحيح أو كلمة المرور خطأ', code: 'INVALID_ROOM_CODE' });
            }
        });

        // ========================================
        // Manual Game Start (Host only)
        // ========================================

        socket.on('start_game', ({ roomId }) => {
            console.log(`🎮 ${socket.username} starting game in room ${roomId}`);

            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) {
                socket.emit('error', { message: 'لا توجد غرفة', code: 'NO_ROOM' });
                return;
            }

            // Only host can start
            if (game.player1.odium !== socket.userId) {
                socket.emit('error', { message: 'فقط المضيف يمكنه بدء اللعبة', code: 'NOT_HOST' });
                return;
            }

            // Need both players
            if (!game.player2) {
                socket.emit('error', { message: 'في انتظار لاعب آخر', code: 'WAITING_PLAYER' });
                return;
            }

            // Start the game
            game.status = 'playing';
            game.turnStartTime = Date.now();
            game.turnNumber = 1;

            const roomSocketId = `game:${game.id}`;
            io.to(roomSocketId).emit('game_start', game);
            io.to(roomSocketId).emit('turn_start', {
                playerId: game.currentTurn,
                timeLimit: game.turnTimeLimit,
            });
        });

        // ========================================
        // Leave Room
        // ========================================

        socket.on('leave_room', ({ roomId }) => {
            console.log(`🚪 ${socket.username} leaving room ${roomId}`);

            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) {
                console.log('❌ No game found for player');
                return;
            }

            const roomSocketId = `game:${game.id}`;
            socket.leave(roomSocketId);

            const isHost = game.player1.odium === socket.userId;
            const hasOtherPlayer = game.player2 !== null;

            if (game.status === 'waiting' || game.status === 'starting') {
                if (isHost && hasOtherPlayer) {
                    // Host leaving with another player - transfer host
                    const result = gameService.transferHost(game.id);
                    if (result) {
                        io.to(roomSocketId).emit('room_update', result);
                        io.to(roomSocketId).emit('host_changed', { newHostId: result.player1.odium });
                    }
                } else if (isHost && !hasOtherPlayer) {
                    // Host leaving alone - delete room
                    gameService.deleteRoom(game.id);
                } else if (!isHost) {
                    // Non-host leaving - just remove them
                    gameService.removePlayer2(game.id);
                    io.to(roomSocketId).emit('room_update', gameService.getGameById(game.id));
                    io.to(roomSocketId).emit('player_left', { playerId: socket.userId });
                }

                io.emit('rooms_list_update', gameService.getAvailableRooms());
            } else {
                // Game in progress - handle disconnect/forfeit
                io.to(roomSocketId).emit('player_left', { playerId: socket.userId });
            }
        });

        // ========================================
        // Kick Player (Host only)
        // ========================================

        socket.on('kick_player', ({ roomId, playerId }) => {
            console.log(`👢 ${socket.username} kicking player ${playerId}`);

            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game || game.player1.odium !== socket.userId) {
                socket.emit('error', { message: 'لا يمكنك طرد اللاعب', code: 'NOT_HOST' });
                return;
            }

            if (!game.player2 || game.player2.odium !== playerId) {
                socket.emit('error', { message: 'اللاعب غير موجود', code: 'PLAYER_NOT_FOUND' });
                return;
            }

            const roomSocketId = `game:${game.id}`;
            const kickedPlayerSocketId = game.player2.socketId;

            // Notify ONLY the kicked player (by their socket ID, not room broadcast)
            if (kickedPlayerSocketId) {
                io.to(kickedPlayerSocketId).emit('kicked', { playerId });

                // Force socket to leave room channel
                const kickedSocket = io.sockets.sockets.get(kickedPlayerSocketId);
                if (kickedSocket) {
                    kickedSocket.leave(roomSocketId);
                }
            }

            // Remove player2
            gameService.removePlayer2(game.id);

            // Update room for host
            const updatedRoom = gameService.getGameById(game.id);
            io.to(roomSocketId).emit('room_update', updatedRoom);
            io.emit('rooms_list_update', gameService.getAvailableRooms());
        });

        // ========================================
        // Transfer Host
        // ========================================

        socket.on('transfer_host', ({ roomId, newHostId }) => {
            console.log(`👑 ${socket.username} transferring host to ${newHostId}`);

            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game || game.player1.odium !== socket.userId) {
                socket.emit('error', { message: 'لا يمكنك نقل القيادة', code: 'NOT_HOST' });
                return;
            }

            if (!game.player2 || game.player2.odium !== newHostId) {
                socket.emit('error', { message: 'اللاعب غير موجود', code: 'PLAYER_NOT_FOUND' });
                return;
            }

            const result = gameService.swapHostWithPlayer2(game.id);
            if (result) {
                const roomSocketId = `game:${game.id}`;
                io.to(roomSocketId).emit('room_update', result);
                io.to(roomSocketId).emit('host_changed', { newHostId: result.player1.odium });
            }
        });

        // ========================================
        // Matchmaking Events
        // ========================================

        socket.on('join_queue', async () => {
            console.log(`📋 ${socket.username} joining queue...`);

            const entry: QueueEntry = {
                odium: socket.userId!,
                socketId: socket.id,
                username: socket.username!,
                displayName: socket.displayName!,
                level: socket.level!,
                rank: socket.rank!,
                joinedAt: Date.now(),
            };

            const position = gameService.addToQueue(entry);
            socket.emit('queue_joined', { position });

            // Try to find a match
            const opponent = gameService.findMatch(socket.userId!);

            if (opponent) {
                console.log(`🎮 Match found: ${socket.username} vs ${opponent.username}`);

                // Create game
                const gameState = await gameService.createGame(entry, opponent);

                // Get opponent socket
                const opponentSocket = io.sockets.sockets.get(opponent.socketId);

                // Notify both players
                socket.emit('match_found', { opponentName: opponent.displayName });
                opponentSocket?.emit('match_found', { opponentName: socket.displayName! });

                // Join both to game room
                const roomId = `game:${gameState.id}`;
                socket.join(roomId);
                opponentSocket?.join(roomId);

                // Start game
                setTimeout(() => {
                    gameState.status = 'playing';
                    io.to(roomId).emit('game_start', gameState);

                    // Notify first player it's their turn
                    socket.emit('turn_start', {
                        playerId: gameState.currentTurn,
                        timeLimit: gameState.turnTimeLimit
                    });
                }, 2000); // 2 second delay for UI transition
            }
        });

        socket.on('leave_queue', () => {
            console.log(`📋 ${socket.username} leaving queue`);
            gameService.removeFromQueue(socket.userId!);
            socket.emit('queue_left');
        });

        // ========================================
        // Game Events
        // ========================================

        socket.on('ready', () => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) return;

            const player = game.player1.odium === socket.userId
                ? game.player1
                : game.player2;

            if (player) {
                player.isReady = true;
            }

            // Check if both ready
            if (game.player1.isReady && game.player2?.isReady) {
                game.status = 'playing';
                io.to(`game:${game.id}`).emit('game_update', game);
            }
        });

        socket.on('play_card', ({ cardId, slotIndex }) => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) {
                socket.emit('error', { message: 'لا توجد لعبة نشطة', code: 'NO_GAME' });
                return;
            }

            const success = gameService.playCard(game, socket.userId!, cardId, slotIndex);

            if (success) {
                const player = game.player1.odium === socket.userId
                    ? game.player1
                    : game.player2;

                const playedCard = player?.field[slotIndex];

                io.to(`game:${game.id}`).emit('card_played', {
                    playerId: socket.userId!,
                    card: playedCard!,
                    slotIndex,
                });

                io.to(`game:${game.id}`).emit('game_update', game);

                // Auto-end turn if no moves remaining
                if (player && player.movesRemaining <= 0) {
                    const endSuccess = gameService.endTurn(game, socket.userId!);
                    if (endSuccess) {
                        io.to(`game:${game.id}`).emit('game_update', game);
                        io.to(`game:${game.id}`).emit('turn_start', {
                            playerId: game.currentTurn,
                            timeLimit: game.turnTimeLimit
                        });
                    }
                }
            } else {
                socket.emit('error', { message: 'لا يمكن لعب هذا الكارت', code: 'INVALID_MOVE' });
            }
        });

        // Flip a face-down card to reveal it (costs 1 move)
        socket.on('flip_card', ({ slotIndex }) => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) {
                socket.emit('error', { message: 'لا توجد لعبة نشطة', code: 'NO_GAME' });
                return;
            }

            const success = gameService.flipCard(game, socket.userId!, slotIndex);

            if (success) {
                const player = game.player1.odium === socket.userId
                    ? game.player1
                    : game.player2;

                io.to(`game:${game.id}`).emit('card_flipped', {
                    playerId: socket.userId!,
                    slotIndex,
                    card: player?.field[slotIndex],
                });

                io.to(`game:${game.id}`).emit('game_update', game);

                // Auto-end turn if no moves remaining
                if (player && player.movesRemaining <= 0) {
                    const endSuccess = gameService.endTurn(game, socket.userId!);
                    if (endSuccess) {
                        io.to(`game:${game.id}`).emit('game_update', game);
                        io.to(`game:${game.id}`).emit('turn_start', {
                            playerId: game.currentTurn,
                            timeLimit: game.turnTimeLimit
                        });
                    }
                }
            } else {
                socket.emit('error', { message: 'لا يمكن قلب الكارت', code: 'INVALID_FLIP' });
            }
        });

        // ========================================
        // Draw Phase (mandatory at start of turn - FREE)
        // ========================================

        socket.on('draw_from_deck', ({ deckType }) => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) {
                socket.emit('error', { message: 'لا توجد لعبة نشطة', code: 'NO_GAME' });
                return;
            }

            const result = gameService.drawFromDeck(game, socket.userId!, deckType);

            if (result.success) {
                socket.emit('card_drawn', {
                    cardType: deckType,
                    drawnCard: result.drawnCard!,
                    drawsRemaining: game.drawsRemaining || 0,
                });

                io.to(`game:${game.id}`).emit('game_update', game);
            } else {
                socket.emit('error', { message: result.message || 'خطأ في السحب', code: 'INVALID_DRAW' });
            }
        });

        // Draw cards from deck (costs 1 move)
        socket.on('draw_cards', ({ cardType, count }) => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) {
                socket.emit('error', { message: 'لا توجد لعبة نشطة', code: 'NO_GAME' });
                return;
            }

            const result = gameService.drawCards(game, socket.userId!, cardType, count);

            if (result.success) {
                socket.emit('cards_drawn', {
                    cardType,
                    drawnCards: result.drawnCards,
                });

                io.to(`game:${game.id}`).emit('game_update', game);

                // Auto-end turn if no moves remaining
                const player = game.player1.odium === socket.userId
                    ? game.player1
                    : game.player2;

                if (player && player.movesRemaining <= 0) {
                    const endSuccess = gameService.endTurn(game, socket.userId!);
                    if (endSuccess) {
                        io.to(`game:${game.id}`).emit('game_update', game);
                        io.to(`game:${game.id}`).emit('turn_start', {
                            playerId: game.currentTurn,
                            timeLimit: game.turnTimeLimit
                        });
                    }
                }
            } else {
                socket.emit('error', { message: 'لا يمكن سحب كروت', code: 'INVALID_DRAW' });
            }
        });

        // Swap a card from hand with a card on field (costs 1 move)
        socket.on('swap_cards', ({ handCardId, fieldSlotIndex }) => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) {
                socket.emit('error', { message: 'لا توجد لعبة نشطة', code: 'NO_GAME' });
                return;
            }

            const success = gameService.swapCards(game, socket.userId!, handCardId, fieldSlotIndex);

            if (success) {
                const player = game.player1.odium === socket.userId
                    ? game.player1
                    : game.player2;

                io.to(`game:${game.id}`).emit('cards_swapped', {
                    playerId: socket.userId!,
                    fieldSlotIndex,
                });

                io.to(`game:${game.id}`).emit('game_update', game);

                // Auto-end turn if no moves remaining
                if (player && player.movesRemaining <= 0) {
                    const endSuccess = gameService.endTurn(game, socket.userId!);
                    if (endSuccess) {
                        io.to(`game:${game.id}`).emit('game_update', game);
                        io.to(`game:${game.id}`).emit('turn_start', {
                            playerId: game.currentTurn,
                            timeLimit: game.turnTimeLimit
                        });
                    }
                }
            } else {
                socket.emit('error', { message: 'لا يمكن تبديل الكروت', code: 'INVALID_SWAP' });
            }
        });

        // Use an action card (costs 1 move)
        socket.on('use_action_card', ({ cardId, slotIndex1, slotIndex2, isOpponentSlot1, isOpponentSlot2 }) => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) {
                socket.emit('error', { message: 'لا توجد لعبة نشطة', code: 'NO_GAME' });
                return;
            }

            const result = gameService.useActionCard(game, socket.userId!, cardId, {
                slotIndex1,
                slotIndex2,
                isOpponentSlot1,
                isOpponentSlot2
            });

            if (result.success) {
                io.to(`game:${game.id}`).emit('action_card_used', {
                    playerId: socket.userId!,
                    cardId,
                    drawnCards: result.drawnCards,
                    varResult: result.varResult,
                });

                io.to(`game:${game.id}`).emit('game_update', game);

                // Auto-end turn if no moves remaining
                const player = game.player1.odium === socket.userId
                    ? game.player1
                    : game.player2;

                if (player && player.movesRemaining <= 0 && game.turnPhase !== 'defense') {
                    const endSuccess = gameService.endTurn(game, socket.userId!);
                    if (endSuccess) {
                        io.to(`game:${game.id}`).emit('game_update', game);
                        io.to(`game:${game.id}`).emit('turn_start', {
                            playerId: game.currentTurn,
                            timeLimit: game.turnTimeLimit
                        });
                    }
                }
            } else {
                socket.emit('error', { message: result.message || 'لا يمكن استخدام الكارت', code: 'INVALID_ACTION' });
            }
        });

        // Summon a legendary player (costs 1 move + discard 2 cards)
        socket.on('summon_legendary', ({ legendaryCardId, discardCardIds, fieldSlotIndex }) => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) {
                socket.emit('error', { message: 'لا توجد لعبة نشطة', code: 'NO_GAME' });
                return;
            }

            const result = gameService.summonLegendary(game, socket.userId!, legendaryCardId, discardCardIds, fieldSlotIndex);

            if (result.success) {
                const player = game.player1.odium === socket.userId
                    ? game.player1
                    : game.player2;

                io.to(`game:${game.id}`).emit('legendary_summoned', {
                    playerId: socket.userId!,
                    legendaryCardId,
                    fieldSlotIndex,
                    card: player?.field[fieldSlotIndex],
                });

                io.to(`game:${game.id}`).emit('game_update', game);

                // Auto-end turn if no moves remaining
                if (player && player.movesRemaining <= 0) {
                    const endSuccess = gameService.endTurn(game, socket.userId!);
                    if (endSuccess) {
                        io.to(`game:${game.id}`).emit('game_update', game);
                        io.to(`game:${game.id}`).emit('turn_start', {
                            playerId: game.currentTurn,
                            timeLimit: game.turnTimeLimit
                        });
                    }
                }
            } else {
                socket.emit('error', { message: result.message || 'لا يمكن استدعاء الأسطورة', code: 'INVALID_SUMMON' });
            }
        });

        socket.on('attack', ({ attackerSlotIndex, defenderSlotIndex }) => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) {
                socket.emit('error', { message: 'لا توجد لعبة نشطة', code: 'NO_GAME' });
                return;
            }

            const attacker = game.player1.odium === socket.userId
                ? game.player1
                : game.player2;
            const defender = game.player1.odium === socket.userId
                ? game.player2
                : game.player1;

            const attackerCard = attacker?.field[attackerSlotIndex];
            const defenderCard = defender?.field[defenderSlotIndex];

            const result = gameService.attack(
                game,
                socket.userId!,
                attackerSlotIndex,
                defenderSlotIndex
            );

            if (result.success) {
                io.to(`game:${game.id}`).emit('attack_result', {
                    attackerId: socket.userId!,
                    defenderId: defender!.odium,
                    attackerCard: attackerCard!,
                    defenderCard: defenderCard || {} as any,
                    result: result.result!,
                    damage: result.damage || 0,
                });

                io.to(`game:${game.id}`).emit('game_update', game);

                // Check win condition (e.g., score >= 5)
                const WINNING_SCORE = 5;
                if (attacker!.score >= WINNING_SCORE) {
                    gameService.endGame(game, socket.userId!, 'وصل للنتيجة المطلوبة');
                    io.to(`game:${game.id}`).emit('game_end', {
                        winnerId: socket.userId!,
                        reason: 'فوز بالنقاط',
                    });
                } else {
                    // Auto-end turn if no moves remaining (attack costs 2 so often ends turn)
                    if (attacker!.movesRemaining <= 0) {
                        const endSuccess = gameService.endTurn(game, socket.userId!);
                        if (endSuccess) {
                            io.to(`game:${game.id}`).emit('game_update', game);
                            io.to(`game:${game.id}`).emit('turn_start', {
                                playerId: game.currentTurn,
                                timeLimit: game.turnTimeLimit
                            });
                        }
                    }
                }
            } else {
                socket.emit('error', { message: 'هجوم غير صالح', code: 'INVALID_ATTACK' });
            }
        });

        // Defender ends defense phase - resolves the attack
        socket.on('end_defense', () => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) {
                socket.emit('error', { message: 'لا توجد لعبة نشطة', code: 'NO_GAME' });
                return;
            }

            if (game.turnPhase !== 'defense') {
                socket.emit('error', { message: 'ليس في مرحلة الدفاع', code: 'NOT_DEFENSE_PHASE' });
                return;
            }

            // Capture attacker ID before resolving (resolveAttack clears pendingAttack)
            const attackerId = game.pendingAttack?.attackerId;

            // Resolve the pending attack
            const result = gameService.resolveAttack(game);

            if (result.success) {
                io.to(`game:${game.id}`).emit('attack_result', {
                    result: result.result,
                    damage: result.damage || 0,
                });

                io.to(`game:${game.id}`).emit('game_update', game);

                // Check win condition using captured attacker ID
                const attacker = attackerId
                    ? (game.player1.odium === attackerId ? game.player1 : game.player2)
                    : null;

                const WINNING_SCORE = 5;
                if (attacker && attacker.score >= WINNING_SCORE) {
                    gameService.endGame(game, attacker.odium, 'وصل للنتيجة المطلوبة');
                    io.to(`game:${game.id}`).emit('game_end', {
                        winnerId: attacker.odium,
                        reason: 'فوز بالنقاط',
                    });
                } else {
                    // Notify current player of their turn
                    io.to(`game:${game.id}`).emit('turn_start', {
                        playerId: game.currentTurn,
                        timeLimit: game.turnTimeLimit
                    });
                }
            }
        });

        // Player surrenders
        socket.on('surrender', () => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game || game.status !== 'playing') {
                socket.emit('error', { message: 'لا توجد لعبة نشطة', code: 'NO_GAME' });
                return;
            }

            const opponent = game.player1.odium === socket.userId
                ? game.player2
                : game.player1;

            if (opponent) {
                game.winReason = 'surrender';
                gameService.endGame(game, opponent.odium, 'استسلام');
                io.to(`game:${game.id}`).emit('game_end', {
                    winnerId: opponent.odium,
                    reason: 'استسلام الخصم',
                    winReason: 'surrender',
                });
            }
        });

        socket.on('end_turn', () => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) return;

            const success = gameService.endTurn(game, socket.userId!);

            if (success) {
                io.to(`game:${game.id}`).emit('game_update', game);
                io.to(`game:${game.id}`).emit('turn_start', {
                    playerId: game.currentTurn,
                    timeLimit: game.turnTimeLimit,
                });
            }
        });

        socket.on('leave_game', async () => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) return;

            const opponent = game.player1.odium === socket.userId
                ? game.player2
                : game.player1;

            if (opponent) {
                await gameService.endGame(game, opponent.odium, 'انسحاب الخصم');
                io.to(`game:${game.id}`).emit('game_end', {
                    winnerId: opponent.odium,
                    reason: 'انسحاب الخصم',
                });
            }

            socket.leave(`game:${game.id}`);
        });

        // ========================================
        // Chat
        // ========================================

        socket.on('send_message', (message) => {
            const game = gameService.getGameByPlayer(socket.userId!);
            if (!game) return;

            io.to(`game:${game.id}`).emit('message_received', {
                playerId: socket.userId!,
                message,
            });
        });

        // ========================================
        // Disconnect
        // ========================================

        socket.on('disconnect', () => {
            console.log(`🔌 Player disconnected: ${socket.username}`);

            // Broadcast updated online count
            const onlineCount = io.engine.clientsCount;
            io.emit('online_users_update', { count: onlineCount });

            // Remove from queue
            gameService.removeFromQueue(socket.userId!);

            // Notify opponent if in game
            const game = gameService.getGameByPlayer(socket.userId!);
            if (game) {
                io.to(`game:${game.id}`).emit('opponent_disconnected');

                // Give 30 seconds to reconnect, then end game
                setTimeout(async () => {
                    const currentGame = gameService.getGameByPlayer(socket.userId!);
                    if (currentGame && currentGame.status === 'playing') {
                        const opponent = currentGame.player1.odium === socket.userId
                            ? currentGame.player2
                            : currentGame.player1;

                        if (opponent) {
                            await gameService.endGame(currentGame, opponent.odium, 'انقطاع الاتصال');
                            io.to(`game:${currentGame.id}`).emit('game_end', {
                                winnerId: opponent.odium,
                                reason: 'انقطاع اتصال الخصم',
                            });
                        }
                    }
                }, 30000);
            }
        });
    });

    console.log('🎮 Game socket handlers initialized');
}
