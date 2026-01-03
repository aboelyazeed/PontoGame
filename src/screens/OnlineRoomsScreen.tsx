// ==========================================
// Ponto Game - Online Rooms Screen
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    StatusBar,
    I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import { socketService } from '../services/socket';

// Components
import { OnlineRoomsHeader } from '../components/online-rooms/OnlineRoomsHeader';
import { RoomActions } from '../components/online-rooms/RoomActions';
import { RoomList } from '../components/online-rooms/RoomList';
import { CreateRoomModal } from '../components/online-rooms/CreateRoomModal';
import { JoinRoomModal } from '../components/online-rooms/JoinRoomModal';
import { PasswordModal } from '../components/online-rooms/PasswordModal';
import { Room } from '../components/online-rooms/types';

// Force RTL
I18nManager.forceRTL(true);

interface OnlineRoomsScreenProps {
    onBack: () => void;
    onJoinRoom: (roomId: string, roomData?: any) => void;
    onCreateRoom: (roomData: any) => void;
}

const OnlineRoomsScreen: React.FC<OnlineRoomsScreenProps> = ({
    onBack,
    onJoinRoom,
    onCreateRoom,
}) => {
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [onlineUsersCount, setOnlineUsersCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Join by Code State
    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [roomCode, setRoomCode] = useState('');

    // Create Room State
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [isPrivateRoom, setIsPrivateRoom] = useState(false);
    const [roomPassword, setRoomPassword] = useState('');
    const [roomName, setRoomName] = useState('');

    // Password Modal State
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    // Ref to track if we initiated a join
    const isJoiningRef = useRef(false);

    // ==========================================
    // Socket Integration
    // ==========================================

    useEffect(() => {
        setIsLoading(true);
        socketService.emit('get_rooms');
        socketService.emit('get_online_count'); // Fetch count immediately on mount

        const handleRoomsUpdate = (updatedRooms: any[]) => {
            const mappedRooms: Room[] = updatedRooms.map(room => ({
                id: room.id,
                isPrivate: room.isPrivate,
                hasPassword: room.hasPassword,
                roomName: room.roomName,
                roomCode: room.roomCode,
                players: room.player2 ? 2 : 1,
                maxPlayers: 2,
                status: room.status,
                hostName: room.player1?.odiumInfo?.displayName || 'Unknown',
                hostAvatar: undefined,
                player1: room.player1
            }));
            setRooms(mappedRooms);
            setIsLoading(false);
            setIsRefreshing(false);
        };

        const handleOnlineUsersUpdate = (data: { count: number }) => {
            setOnlineUsersCount(data.count);
        };

        const handleRoomCreated = (room: any) => {
            setCreateModalVisible(false);
            showToast('تم إنشاء الغرفة بنجاح', 'success');
            onCreateRoom(room);
        };

        // When joining a room, only the JOINER receives this callback
        // We only navigate if we were the one who initiated the join
        const handleJoinSuccess = (room: any) => {
            isJoiningRef.current = false;
            setJoinModalVisible(false);
            setIsPasswordModalVisible(false);
            showToast('تم الانضمام للغرفة!', 'success');
            onJoinRoom(room.id, room);
        };

        const handleRoomUpdate = (room: any) => {
            // Room updates handled by WaitingRoomScreen after navigation
        };

        const handleGameStart = (room: any) => {
            setJoinModalVisible(false);
            setIsPasswordModalVisible(false);
            showToast('بدأت اللعبة!', 'success');
            // Game start now handled in WaitingRoom
        };

        const handleError = (error: { message: string, code: string }) => {
            showToast(error.message || 'حدث خطأ ما', 'error');
            setIsRefreshing(false);
            setIsLoading(false);
            isJoiningRef.current = false;
        };

        socketService.on('rooms_list_update', handleRoomsUpdate);
        socketService.on('rooms_list', handleRoomsUpdate);
        socketService.on('room_created', handleRoomCreated);
        socketService.on('room_update', handleRoomUpdate);
        socketService.on('join_success', handleJoinSuccess);
        socketService.on('game_start', handleGameStart);
        socketService.on('online_users_update', handleOnlineUsersUpdate);
        socketService.on('error', handleError);

        return () => {
            socketService.off('rooms_list_update');
            socketService.off('rooms_list');
            socketService.off('room_created');
            socketService.off('room_update');
            socketService.off('join_success');
            socketService.off('game_start');
            socketService.off('online_users_update');
            socketService.off('error');
        };
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        socketService.emit('get_rooms');
    };

    // ==========================================
    // Handlers
    // ==========================================

    const handleCreateRoomSubmit = () => {
        if (isPrivateRoom && !roomPassword) {
            // Optional: enforce password for private rooms
        }

        socketService.emit('create_room', {
            isPrivate: isPrivateRoom,
            password: roomPassword || undefined,
            roomName: roomName.trim() || undefined
        });
    };

    const handleJoinRoom = (room: Room) => {
        if (room.isPrivate && room.hasPassword) {
            setSelectedRoomId(room.id);
            setRoomPassword('');
            setIsPasswordModalVisible(true);
        } else {
            showToast('جاري الانضمام...', 'info');
            isJoiningRef.current = true;
            socketService.emit('join_room', { roomId: room.id });
        }
    };

    const handlePasswordSubmit = () => {
        if (!selectedRoomId || !roomPassword) return;
        isJoiningRef.current = true;
        socketService.emit('join_room', {
            roomId: selectedRoomId,
            password: roomPassword
        });
    };

    const handleJoinByCode = () => {
        if (roomCode.length !== 6) {
            showToast('رمز الغرفة يجب أن يكون 6 أرقام', 'error');
            return;
        }
        showToast('جاري البحث...', 'info');
        isJoiningRef.current = true;
        socketService.emit('join_room_by_code', {
            roomCode: roomCode,
        });
    };

    const handleRandomJoin = () => {
        // In future, this should emit 'join_queue' for matchmaking
        // For now, find a public room
        const availableRoom = rooms.find(r => !r.isPrivate && r.players < r.maxPlayers);
        if (availableRoom) {
            handleJoinRoom(availableRoom);
        } else {
            showToast('لا توجد غرف عامة متاحة', 'info');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />
            <SafeAreaView style={styles.safeArea}>
                <OnlineRoomsHeader
                    onBack={onBack}
                    onlineCount={onlineUsersCount}
                />

                <View style={styles.contentContainer}>
                    <RoomActions
                        onCreateRoom={() => setCreateModalVisible(true)}
                        onJoinByCode={() => setJoinModalVisible(true)}
                    />

                    <RoomList
                        rooms={rooms}
                        isLoading={isLoading}
                        isRefreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        onJoin={handleJoinRoom}
                    />
                </View>

                {/* Bottom Random Join Button */}
                <View style={styles.bottomContainer}>
                    <Button
                        title="دخول عشوائي"
                        onPress={handleRandomJoin}
                        size="lg"
                        fullWidth
                    />
                </View>

                {/* Modals */}
                <CreateRoomModal
                    visible={createModalVisible}
                    onClose={() => setCreateModalVisible(false)}
                    onCreate={handleCreateRoomSubmit}
                    isPrivate={isPrivateRoom}
                    setIsPrivate={setIsPrivateRoom}
                    password={roomPassword}
                    setPassword={setRoomPassword}
                    roomName={roomName}
                    setRoomName={setRoomName}
                />

                <JoinRoomModal
                    visible={joinModalVisible}
                    onClose={() => setJoinModalVisible(false)}
                    onJoin={handleJoinByCode}
                    code={roomCode}
                    setCode={setRoomCode}
                />

                <PasswordModal
                    visible={isPasswordModalVisible}
                    onClose={() => setIsPasswordModalVisible(false)}
                    onJoin={handlePasswordSubmit}
                    password={roomPassword}
                    setPassword={setRoomPassword}
                />

            </SafeAreaView>
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
    contentContainer: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.lg,
        paddingTop: 10,
        paddingBottom: SPACING.xl,
    },
});

export default OnlineRoomsScreen;
