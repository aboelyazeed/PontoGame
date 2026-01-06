import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    I18nManager,
    ActivityIndicator,
    Dimensions,
    BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Clipboard } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { socketService } from '../services/socket';
import ConfirmPopup from '../components/ui/ConfirmPopup';

I18nManager.forceRTL(true);

const { width } = Dimensions.get('window');

interface Player {
    odium: string;
    displayName: string;
    level: number;
    rank: string;
}

interface RoomState {
    id: string;
    roomCode?: string;
    player1: {
        odium: string;
        odiumInfo: {
            displayName: string;
            level: number;
            rank: string;
        };
    } | null;
    player2: {
        odium: string;
        odiumInfo: {
            displayName: string;
            level: number;
            rank: string;
        };
    } | null;
    status: 'waiting' | 'starting' | 'playing';
}

interface WaitingRoomScreenProps {
    onBack?: () => void;
    onGameStart?: (gameState: any) => void;
    isHost?: boolean;
    initialRoomData?: RoomState;
}

const WaitingRoomScreen: React.FC<WaitingRoomScreenProps> = ({
    onBack,
    onGameStart,
    isHost = false,
    initialRoomData,
}) => {
    const [room, setRoom] = useState<RoomState | null>(initialRoomData || null);
    const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showLeavePopup, setShowLeavePopup] = useState(false);

    useEffect(() => {
        socketService.on('connected', (data: { playerId: string }) => {
            setMyPlayerId(data.playerId);
        });

        socketService.on('room_created', (roomData: RoomState) => {
            console.log('🏠 Room created:', roomData);
            setRoom(roomData);
        });

        socketService.on('room_update', (roomData: RoomState) => {
            console.log('📡 Room update:', roomData);
            setRoom(roomData);
        });

        socketService.on('player_joined', (data: { player: Player }) => {
            console.log('👋 Player joined:', data);
            setRoom(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    player2: {
                        odium: data.player.odium,
                        odiumInfo: {
                            displayName: data.player.displayName,
                            level: data.player.level,
                            rank: data.player.rank,
                        }
                    }
                };
            });
        });

        socketService.on('game_start', (gameState: any) => {
            console.log('🎮 Game starting!', gameState);
            onGameStart?.(gameState);
        });

        // Player left the room
        socketService.on('player_left', (data: { playerId: string }) => {
            console.log('👋 Player left:', data.playerId);
            setRoom(prev => {
                if (!prev) return null;
                return { ...prev, player2: null };
            });
        });

        // We got kicked
        socketService.on('kicked', (data: { playerId: string }) => {
            console.log('👢 Kicked from room');
            onBack?.();
        });

        // Host changed
        socketService.on('host_changed', (data: { newHostId: string }) => {
            console.log('👑 New host:', data.newHostId);
            // Room update will handle the UI update
        });

        return () => {
            socketService.off('connected');
            socketService.off('room_created');
            socketService.off('room_update');
            socketService.off('player_joined');
            socketService.off('game_start');
            socketService.off('player_left');
            socketService.off('kicked');
            socketService.off('host_changed');
        };
    }, [onGameStart, onBack]);

    const handleCopyCode = useCallback(() => {
        if (room?.roomCode) {
            Clipboard.setString(room.roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [room?.roomCode]);

    const handleStartGame = () => {
        if (!room?.player2) return;
        setIsStarting(true);
        socketService.emit('start_game', { roomId: room.id });
    };

    const handleLeaveLobby = () => {
        setShowLeavePopup(true);
    };

    const handleBackPress = () => {
        setShowLeavePopup(true);
    };

    const confirmLeave = () => {
        setShowLeavePopup(false);
        socketService.emit('leave_room', { roomId: room?.id });
        onBack?.();
    };

    const cancelLeave = () => {
        setShowLeavePopup(false);
    };

    const handleKickPlayer = () => {
        if (!room?.id || !room?.player2?.odium) return;
        socketService.emit('kick_player', { roomId: room.id, playerId: room.player2.odium });
    };

    const handleTransferHost = () => {
        if (!room?.id || !room?.player2?.odium) {
            return;
        }
        socketService.emit('transfer_host', { roomId: room.id, newHostId: room.player2.odium });
    };

    // Handle Android hardware back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            setShowLeavePopup(true);
            return true; // Prevent default back behavior
        });

        return () => backHandler.remove();
    }, []);

    // Determine if this user is host - DERIVE from room state
    // Compare by playerId (odium) OR by socketId (from room data)
    const mySocketId = socketService.getSocketId();
    const player1Data = room?.player1 as any;
    const amIPlayer1 = (myPlayerId && room?.player1?.odium === myPlayerId) ||
        (mySocketId && player1Data?.socketId === mySocketId);
    const isActualHost = amIPlayer1 ?? isHost; // fallback to prop if can't determine

    const hostPlayer = room?.player1;
    const opponentPlayer = room?.player2;

    // Simply: host can start when opponent card is visible
    const canStartGame = isActualHost && !!opponentPlayer;



    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <Ionicons name="arrow-forward" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>غرفة الانتظار</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Room Code Section */}
                    <View style={styles.codeSection}>
                        <Text style={styles.shareText}>شارك الكود مع صاحبك</Text>

                        <View style={styles.codeCard}>
                            <View style={styles.codeGlow} />
                            <View style={styles.codeCardInner}>
                                <View style={styles.codeBadge}>
                                    <Text style={styles.codeBadgeText}>كود الغرفة</Text>
                                </View>
                                <Text style={styles.codeText}>{room?.roomCode || '------'}</Text>
                                <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                                    <Ionicons name={copied ? "checkmark" : "copy-outline"} size={18} color={copied ? COLORS.primary : COLORS.textSlate} />
                                    <Text style={[styles.copyText, copied && styles.copyTextSuccess]}>
                                        {copied ? 'تم النسخ!' : 'نسخ الكود'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Players Section */}
                    <View style={styles.playersSection}>
                        {/* Host Card */}
                        <View style={styles.playerCard}>
                            <View style={styles.hostBadge}>
                                <Text style={styles.hostBadgeText}>المضيف {isHost ? '(أنت)' : ''}</Text>
                            </View>
                            <View style={styles.playerCardContent}>
                                <View style={styles.avatarContainer}>
                                    <LinearGradient
                                        colors={['#166534', '#4ade80']}
                                        style={styles.avatar}
                                    >
                                        <Text style={styles.avatarText}>
                                            {hostPlayer?.odiumInfo?.displayName?.[0] || 'A'}
                                        </Text>
                                    </LinearGradient>
                                    <View style={styles.onlineIndicator} />
                                </View>
                                <View style={styles.playerInfo}>
                                    <Text style={styles.playerName} numberOfLines={1}>
                                        {hostPlayer?.odiumInfo?.displayName || 'جاري التحميل...'}
                                    </Text>
                                    <View style={styles.readyStatus}>
                                        <Ionicons name="checkmark-circle" size={14} color={COLORS.accentGreen} />
                                        <Text style={styles.readyText}>جاهز للعب</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* VS Divider */}
                        <View style={styles.vsDivider}>
                            <View style={styles.vsLine} />
                            <View style={styles.vsBadge}>
                                <Text style={styles.vsText}>VS</Text>
                            </View>
                        </View>

                        {/* Opponent Card */}
                        {opponentPlayer ? (
                            <View style={[styles.playerCard, styles.opponentCard]}>
                                <View style={styles.playerCardContent}>
                                    <View style={styles.avatarContainer}>
                                        <LinearGradient
                                            colors={['#7c2d12', '#f97316']}
                                            style={styles.avatar}
                                        >
                                            <Text style={styles.avatarText}>
                                                {opponentPlayer.odiumInfo?.displayName?.[0] || 'B'}
                                            </Text>
                                        </LinearGradient>
                                        <View style={styles.onlineIndicator} />
                                    </View>
                                    <View style={styles.playerInfo}>
                                        <Text style={styles.playerName} numberOfLines={1}>
                                            {opponentPlayer.odiumInfo?.displayName}
                                        </Text>
                                        <View style={styles.readyStatus}>
                                            <Ionicons name="checkmark-circle" size={14} color={COLORS.accentGreen} />
                                            <Text style={styles.readyText}>جاهز للعب</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Host Actions */}
                                {isActualHost && (
                                    <View style={styles.hostActions}>
                                        <TouchableOpacity style={styles.transferButton} onPress={handleTransferHost}>
                                            <Ionicons name="swap-horizontal" size={16} color={COLORS.primary} />
                                            <Text style={styles.transferButtonText}>تسليم القيادة</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.kickButton} onPress={handleKickPlayer}>
                                            <Ionicons name="close-circle" size={16} color={COLORS.error} />
                                            <Text style={styles.kickButtonText}>طرد</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={styles.waitingCard}>
                                <View style={styles.waitingCardContent}>
                                    <View style={styles.waitingAvatar}>
                                        <Ionicons name="person" size={28} color="rgba(255,255,255,0.2)" />
                                    </View>
                                    <View style={styles.playerInfo}>
                                        <Text style={styles.waitingName}>مستني المنافس...</Text>
                                        <View style={styles.waitingStatus}>
                                            <View style={styles.waitingDot} />
                                            <Text style={styles.waitingStatusText} numberOfLines={1}>جاري الانتظار</Text>
                                        </View>
                                    </View>
                                    <ActivityIndicator size="small" color={COLORS.textSlate} />
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Bottom Button */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={[styles.startButton, !canStartGame && styles.startButtonDisabled]}
                        onPress={handleStartGame}
                        disabled={!canStartGame || isStarting}
                    >
                        {canStartGame ? (
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                style={styles.startButtonGradient}
                            >
                                {isStarting ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="play" size={22} color="#FFF" />
                                        <Text style={styles.startButtonText}>ابدأ الماتش</Text>
                                    </>
                                )}
                            </LinearGradient>
                        ) : (
                            <View style={styles.startButtonDisabledInner}>
                                <Ionicons name="lock-closed" size={20} color={COLORS.textSlate} />
                                <Text style={styles.startButtonDisabledText}>ابدأ الماتش</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Leave Lobby Button */}
                    <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveLobby}>
                        <Ionicons name="exit-outline" size={18} color={COLORS.error} />
                        <Text style={styles.leaveButtonText}>مغادرة اللوبي</Text>
                    </TouchableOpacity>

                    {!opponentPlayer && (
                        <Text style={styles.hintText}>لازم منافس ينضم عشان تبدأ اللعبة</Text>
                    )}
                </View>
            </SafeAreaView>

            {/* Leave Confirmation Popup */}
            <ConfirmPopup
                visible={showLeavePopup}
                title="مغادرة اللوبي"
                message="هل أنت متأكد من مغادرة اللوبي؟"
                confirmText="مغادرة"
                cancelText="إلغاء"
                confirmDestructive
                icon="exit-outline"
                onConfirm={confirmLeave}
                onCancel={cancelLeave}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
    },
    safeArea: {
        flex: 1,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },

    // Content
    content: {
        flex: 1,
        paddingHorizontal: SPACING.md,
    },

    // Code Section
    codeSection: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
    },
    shareText: {
        fontSize: 14,
        color: COLORS.textSlate,
        marginBottom: SPACING.md,
    },
    codeCard: {
        width: '100%',
        position: 'relative',
    },
    codeGlow: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.primary,
        opacity: 0.15,
    },
    codeCardInner: {
        backgroundColor: COLORS.surfaceDarker,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    codeBadge: {
        backgroundColor: 'rgba(9, 170, 9, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 4,
        marginBottom: 8,
    },
    codeBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    codeText: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.textPrimary,
        letterSpacing: 4,
        fontFamily: 'monospace',
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: SPACING.md,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    copyText: {
        fontSize: 13,
        color: COLORS.textSlate,
        fontWeight: '600',
    },
    copyTextSuccess: {
        color: COLORS.primary,
    },

    // Players Section
    playersSection: {
        gap: 16,
    },
    playerCard: {
        backgroundColor: COLORS.surfaceDark,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(9, 170, 9, 0.3)',
        position: 'relative',
    },
    opponentCard: {
        borderColor: 'rgba(249, 115, 22, 0.3)',
    },
    hostBadge: {
        position: 'absolute',
        top: -10,
        right: 16,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        zIndex: 1,
    },
    hostBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFF',
    },
    playerCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.accentGreen,
        borderWidth: 2,
        borderColor: COLORS.surfaceDark,
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    readyStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    readyText: {
        fontSize: 12,
        color: COLORS.accentGreen,
        fontWeight: '500',
    },

    // VS Divider
    vsDivider: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: -8,
        zIndex: 0,
    },
    vsLine: {
        position: 'absolute',
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    vsBadge: {
        backgroundColor: COLORS.backgroundDark,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    vsText: {
        fontSize: 12,
        fontWeight: '900',
        color: COLORS.textSlate,
        fontStyle: 'italic',
    },

    // Waiting Card
    waitingCard: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.15)',
    },
    waitingCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    waitingAvatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    waitingName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textSlate,
    },
    waitingStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    waitingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.textSlate,
    },
    waitingStatusText: {
        fontSize: 12,
        color: COLORS.textSlate,
    },

    // Bottom
    bottomContainer: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xl,
        paddingTop: SPACING.md,
        backgroundColor: COLORS.backgroundDark,
    },
    startButton: {
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        height: 54,
    },
    startButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    startButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#FFF',
    },
    startButtonDisabled: {
        backgroundColor: COLORS.surfaceDark,
    },
    startButtonDisabledInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    startButtonDisabledText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: COLORS.textSlate,
    },
    hintText: {
        fontSize: 12,
        color: COLORS.textSlate,
        textAlign: 'center',
        marginTop: SPACING.sm,
    },
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    leaveButtonText: {
        fontSize: 14,
        color: COLORS.error,
        fontWeight: '600',
    },
    hostActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    transferButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: 'rgba(9, 170, 9, 0.1)',
    },
    transferButtonText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
    },
    kickButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    kickButtonText: {
        fontSize: 12,
        color: COLORS.error,
        fontWeight: '600',
    },
});

export default WaitingRoomScreen;
