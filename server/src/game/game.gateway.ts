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
        // Room Events
        // ========================================

        socket.on('create_room', async ({ isPrivate, password }) => {
            console.log(`🏠 ${socket.username} creating room (Private: ${isPrivate}, HasPassword: ${!!password})`);

            const entry: QueueEntry = {
                odium: socket.userId!,
                socketId: socket.id,
                username: socket.username!,
                displayName: socket.displayName!,
                level: socket.level!,
                rank: socket.rank!,
                joinedAt: Date.now(),
            };

            const room = await gameService.createRoom(entry, isPrivate, password);
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
            } else {
                socket.emit('error', { message: 'لا يمكن لعب هذا الكارت', code: 'INVALID_MOVE' });
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
                }
            } else {
                socket.emit('error', { message: 'هجوم غير صالح', code: 'INVALID_ATTACK' });
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
