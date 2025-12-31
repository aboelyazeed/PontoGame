// ==========================================
// Ponto Game - Online Rooms Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    I18nManager,
    ScrollView,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Switch,
    LayoutAnimation,
    UIManager,
    Animated,
    Easing,
    Modal,
    TextInput,
    KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
// import { socketService } from '../services/socket'; // Will implement later

// Force RTL
I18nManager.forceRTL(true);

interface Room {
    id: string;
    players: number; // 1 or 2
    maxPlayers: number;
    status: 'waiting' | 'starting' | 'playing';
    hostName: string;
    isPrivate: boolean;
    hasPassword?: boolean;
}

interface OnlineRoomsScreenProps {
    onBack: () => void;
    onJoinRoom: (roomId: string) => void;
    onCreateRoom: (isPrivate: boolean, password?: string) => void; // Updated signature
}

const OnlineRoomsScreen: React.FC<OnlineRoomsScreenProps> = ({
    onBack,
    onJoinRoom,
    onCreateRoom,
}) => {
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Join by Code State
    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [roomCode, setRoomCode] = useState('');

    // Create Room State
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [isPrivateRoom, setIsPrivateRoom] = useState(false);
    const [roomPassword, setRoomPassword] = useState('');

    // Animation Refs
    const slideAnim = React.useRef(new Animated.Value(0)).current;
    const [layoutWidth, setLayoutWidth] = useState(0);

    // Enable LayoutAnimation for Android
    useEffect(() => {
        if (Platform.OS === 'android') {
            if (UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }
        }
    }, []);

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: isPrivateRoom ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        }).start();
    }, [isPrivateRoom]);

    const togglePrivacy = (value: boolean) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsPrivateRoom(value);
    };

    // Mock Data for Design (Replace with Socket Data)
    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = () => {
        setIsLoading(true);
        // Simulate fetch
        setTimeout(() => {
            setRooms([
                {
                    id: '1',
                    players: 1,
                    maxPlayers: 2,
                    status: 'waiting',
                    hostName: 'كابتن ماجد',
                    isPrivate: false,
                },
                {
                    id: '2',
                    players: 1,
                    maxPlayers: 2,
                    status: 'waiting',
                    hostName: 'الحريف',
                    isPrivate: true,
                    hasPassword: true,
                },
                {
                    id: '3',
                    players: 1,
                    maxPlayers: 2,
                    status: 'waiting',
                    hostName: 'زيزو',
                    isPrivate: false,
                },
            ]);
            setIsLoading(false);
            setIsRefreshing(false);
        }, 1000);
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadRooms();
    };

    const handleCreateRoomSubmit = () => {
        if (isPrivateRoom && roomPassword.length < 3) {
            showToast('كلمة المرور يجب أن تكون 3 أحرف على الأقل', 'error');
            return;
        }

        onCreateRoom(isPrivateRoom, isPrivateRoom ? roomPassword : undefined);
        setCreateModalVisible(false);
        setRoomPassword('');
        setIsPrivateRoom(false);
    };

    const handleJoinRoom = (roomId: string, hasPassword?: boolean) => {
        if (hasPassword) {
            // Should prompt for password to join
            showToast('هذه الغرفة محمية بكلمة مرور (قريباً)', 'info');
            // Logic to prompt password would go here
            return;
        }
        onJoinRoom(roomId);
    };

    const handleJoinByCode = () => {
        if (roomCode.length !== 6) {
            showToast('الرجاء إدخال رمز مكون من 6 أرقام', 'error');
            return;
        }

        // Emulate join logic
        // socketService.emit('join_room_by_code', { roomCode });

        setJoinModalVisible(false);
        setRoomCode('');

        // For now mock navigation
        onJoinRoom('mock-room-id');
    };

    const handleRandomJoin = () => {
        // Find first available public room
        const availableRoom = rooms.find(r => !r.isPrivate && r.players < r.maxPlayers);
        if (availableRoom) {
            onJoinRoom(availableRoom.id);
        } else {
            showToast('لا توجد غرف متاحة حالياً', 'info');
        }
    };

    const renderRoomItem = ({ item }: { item: Room }) => {
        if (item.players >= item.maxPlayers) return null;

        const isPrivate = item.isPrivate;

        const cardStyle = isPrivate
            ? { borderColor: 'rgba(249, 115, 22, 0.2)', iconColor: '#F97316', bg: 'rgba(249, 115, 22, 0.1)', icon: 'lock-outline' }
            : { borderColor: 'rgba(59, 130, 246, 0.2)', iconColor: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', icon: 'trophy-outline' };

        return (
            <TouchableOpacity
                style={[styles.roomCard, { borderColor: cardStyle.borderColor }]}
                onPress={() => handleJoinRoom(item.id, item.hasPassword)}
                activeOpacity={0.7}
            >
                <View style={styles.roomInfo}>
                    <View style={[styles.roomIconContainer, { backgroundColor: cardStyle.bg, borderColor: cardStyle.borderColor }]}>
                        <MaterialCommunityIcons name={cardStyle.icon as any} size={24} color={cardStyle.iconColor} />
                    </View>
                    <View>
                        <Text style={styles.roomTitle}>
                            {isPrivate ? 'غرفة سرية' : 'غرفة تحدي'}
                        </Text>
                        <View style={styles.roomMetaRow}>
                            <View style={styles.tagContainer}>
                                <Text style={styles.tagText}>{isPrivate ? 'خاص' : 'عام'}</Text>
                            </View>
                            <Text style={styles.hostText}>بواسطة: {item.hostName}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.roomStatus}>
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>انتظار</Text>
                    </View>
                    <Text style={styles.playersCount}>{item.players}/{item.maxPlayers}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBack}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-forward" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>

                    <View style={styles.onlineBadge}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>1,240 متصل</Text>
                    </View>
                </View>

                <View style={styles.contentContainer}>
                    {/* Title Section */}
                    <View style={styles.titleSection}>
                        <Text style={styles.mainTitle}>غرف اللعب</Text>
                        <Text style={styles.subtitle}>اختر غرفة وانضم للتحدي أو ابدأ غرفتك الخاصة</Text>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.actionsRow}>
                        {/* Create Room Button */}
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => setCreateModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.buttonGradient}
                            />
                            <View style={styles.buttonContent}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="add" size={24} color={COLORS.primary} />
                                </View>
                                <View style={styles.buttonTextContainer}>
                                    <Text style={styles.buttonTitle}>إنشاء</Text>
                                    <Text style={styles.buttonSubtitle}>غرفة جديدة</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Join by Code Button */}
                        <TouchableOpacity
                            style={[styles.createButton, { borderColor: 'rgba(249, 115, 22, 0.3)' }]}
                            onPress={() => setJoinModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['rgba(249, 115, 22, 0.1)', 'rgba(249, 115, 22, 0)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.buttonGradient}
                            />
                            <View style={styles.buttonContent}>
                                <View style={[styles.iconBox, { borderColor: '#F97316' }]}>
                                    <MaterialCommunityIcons name="login" size={24} color="#F97316" />
                                </View>
                                <View style={styles.buttonTextContainer}>
                                    <Text style={styles.buttonTitle}>انضمام</Text>
                                    <Text style={styles.buttonSubtitle}>برمز الغرفة</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Rooms List Header */}
                    <View style={styles.listHeader}>
                        <View style={styles.listTitleRow}>
                            <MaterialIcons name="format-list-bulleted" size={20} color={COLORS.primary} />
                            <Text style={styles.listTitle}>الغرف المتاحة</Text>
                        </View>
                        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                            <Ionicons name="refresh" size={16} color={COLORS.primary} />
                            <Text style={styles.refreshText}>تحديث</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Rooms List */}
                    {isLoading && !isRefreshing ? (
                        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={rooms}
                            renderItem={renderRoomItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>لا توجد غرف متاحة حالياً</Text>
                                    <TouchableOpacity onPress={handleRefresh}>
                                        <Text style={styles.retryText}>حاول مرة أخرى</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    )}
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

                {/* Create Room Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={createModalVisible}
                    onRequestClose={() => setCreateModalVisible(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalOverlay}
                    >
                        <TouchableWithoutFeedback onPress={() => setCreateModalVisible(false)}>
                            <View style={styles.modalBackdrop} />
                        </TouchableWithoutFeedback>

                        <View style={styles.modalContent}>
                            <View style={styles.modalIndicator} />
                            <Text style={styles.modalTitle}>إنشاء غرفة جديدة</Text>
                            <Text style={styles.modalSubtitle}>حدد إعدادات الغرفة الخاصة بك</Text>

                            {/* Toggle Public/Private */}
                            {/* Toggle Public/Private */}
                            {/* Toggle Public/Private */}
                            <View
                                style={styles.toggleContainer}
                                onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
                            >
                                <Animated.View
                                    style={[
                                        styles.activeToggleBackground,
                                        {
                                            width: (layoutWidth - 8) / 2, // 2 items, padding 4 on parent
                                            transform: [{
                                                translateX: slideAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0, -(layoutWidth - 8) / 2] // Negative translation to move Left (from Right/Public to Left/Secret)
                                                })
                                            }]
                                        }
                                    ]}
                                />

                                <TouchableOpacity
                                    style={styles.toggleOption}
                                    onPress={() => togglePrivacy(false)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="earth" size={20} color={!isPrivateRoom ? '#FFF' : COLORS.textSecondary} />
                                    <Text style={[styles.toggleText, !isPrivateRoom && styles.toggleTextActive]}>عام</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.toggleOption}
                                    onPress={() => togglePrivacy(true)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="lock-closed" size={20} color={isPrivateRoom ? '#FFF' : COLORS.textSecondary} />
                                    <Text style={[styles.toggleText, isPrivateRoom && styles.toggleTextActive]}>سري</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Password input (Always visible, disabled if Public) */}
                            <View style={[styles.passwordContainer, !isPrivateRoom && styles.disabledContainer]}>
                                <Text style={styles.inputLabel}>كلمة المرور</Text>
                                <TextInput
                                    style={[styles.passwordInput, !isPrivateRoom && styles.disabledInput]}
                                    placeholder={isPrivateRoom ? "أدخل كلمة مرور الغرفة" : "غير متاحة للغرف العامة"}
                                    placeholderTextColor={COLORS.textSecondary + '80'}
                                    secureTextEntry
                                    value={roomPassword}
                                    onChangeText={setRoomPassword}
                                    editable={isPrivateRoom}
                                />
                            </View>

                            <View style={styles.modalButtons}>
                                <Button
                                    title="إلغاء"
                                    onPress={() => setCreateModalVisible(false)}
                                    variant="secondary"
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title="إنشاء الغرفة"
                                    onPress={handleCreateRoomSubmit}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* Join Code Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={joinModalVisible}
                    onRequestClose={() => setJoinModalVisible(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalOverlay}
                    >
                        <TouchableWithoutFeedback onPress={() => setJoinModalVisible(false)}>
                            <View style={styles.modalBackdrop} />
                        </TouchableWithoutFeedback>

                        <View style={styles.modalContent}>
                            <View style={styles.modalIndicator} />
                            <Text style={styles.modalTitle}>الإنضمام لغرفة</Text>
                            <Text style={styles.modalSubtitle}>أدخل رمز الغرفة المكون من 6 أرقام</Text>

                            <TextInput
                                style={styles.codeInput}
                                placeholder="000000"
                                placeholderTextColor={COLORS.textSecondary + '80'}
                                keyboardType="number-pad"
                                maxLength={6}
                                value={roomCode}
                                onChangeText={setRoomCode}
                                textAlign="center"
                                autoFocus
                            />

                            <View style={styles.modalButtons}>
                                <Button
                                    title="إلغاء"
                                    onPress={() => setJoinModalVisible(false)}
                                    variant="secondary"
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title="دخول"
                                    onPress={handleJoinByCode}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ade80', // accent-green
    },
    onlineText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
    },
    titleSection: {
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.lg,
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4,
        textAlign: 'left',
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'left',
        fontWeight: '500',
    },
    // Actions Row
    actionsRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    createButton: {
        flex: 1,
        borderRadius: 16,
        backgroundColor: '#0d1a0d', // surface-darker
        borderWidth: 2,
        borderColor: 'rgba(34, 197, 94, 0.3)', // primary/30
        overflow: 'hidden',
        height: 70,
        justifyContent: 'center',
    },
    buttonGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.sm,
        gap: SPACING.sm,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    buttonTextContainer: {
        alignItems: 'flex-start',
    },
    buttonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    buttonSubtitle: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: SPACING.xl,
        alignItems: 'center',
        paddingBottom: 40,
    },
    modalIndicator: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.textSecondary,
        borderRadius: 2,
        opacity: 0.3,
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xl,
    },
    codeInput: {
        width: '100%',
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xl,
        letterSpacing: 8,
    },
    // Button styles removed as we utilize the Reusable Button component
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        width: '100%',
    },

    // Create Room Modal Specialized Styles
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 4,
        marginBottom: SPACING.lg,
        width: '100%',
    },
    toggleOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
        borderRadius: 8,
        zIndex: 1, // Ensure text is above background
    },
    // toggleOptionActive removed as it's handled by Animated.View
    activeToggleBackground: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 4, // Start from left
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        zIndex: 0,
    },
    toggleText: {
        color: COLORS.textSecondary,
        fontWeight: 'bold',
    },
    toggleTextActive: {
        color: '#FFF',
    },
    passwordContainer: {
        width: '100%',
        marginBottom: SPACING.xl,
    },
    inputLabel: {
        color: COLORS.textSecondary,
        marginBottom: 8,
        textAlign: 'left',
    },
    passwordInput: {
        width: '100%',
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        paddingHorizontal: SPACING.md,
        color: COLORS.textPrimary,
        textAlign: 'left',
    },
    disabledContainer: {
        opacity: 0.5,
    },
    disabledInput: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderColor: 'transparent',
    },

    // List Header
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
        paddingHorizontal: 4,
    },
    listTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    refreshText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    // List Content
    listContent: {
        gap: SPACING.md,
        paddingBottom: 100, // Space for bottom button
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    emptyText: {
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    retryText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    // Room Card
    roomCard: {
        backgroundColor: '#162b16', // surface-dark
        borderRadius: 12,
        padding: SPACING.md,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    roomInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    roomIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roomTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 2,
        textAlign: 'left',
    },
    roomMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    tagContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
    hostText: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
    roomStatus: {
        alignItems: 'flex-end',
        gap: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(74, 222, 128, 0.1)', // accent-green/10
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4ade80',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4ade80',
    },
    playersCount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
        fontFamily: 'monospace',
    },
    // Bottom Container
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.lg,
        paddingTop: 10,
        paddingBottom: SPACING.xl,
        // Gradient background for fade effect could be added here if needed, 
        // but simple background works for now
    },
});

export default OnlineRoomsScreen;
