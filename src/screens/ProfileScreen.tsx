// ==========================================
// Ponto Game - Profile Screen
// ==========================================

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    I18nManager,
    ScrollView,
    Modal,
    Pressable,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { BottomNavBar } from '../components/ui';
import { useAuthStore } from '../store/authStore';

// Force RTL
I18nManager.forceRTL(true);

interface ProfileScreenProps {
    onBack: () => void;
    onEditProfile?: () => void;
    onNavigate: (screen: 'profile' | 'play' | 'settings') => void;
    onLogout?: () => void;
    playerData?: {
        name: string;
        title: string;
        country: string;
        level: number;
        matches: number;
        wins: number;
        losses: number;
        playerId: string;
    };
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
    onBack,
    onEditProfile,
    onNavigate,
    onLogout,
}) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { logout, user, updateDisplayName, deleteAccount } = useAuthStore();

    // Show success toast for 3 seconds
    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    // Use auth store data with fallback defaults
    const playerData = {
        name: user?.displayName || 'لاعب',
        title: user?.rank || 'مبتدئ',
        country: 'مصر',
        level: user?.level || 1,
        matches: (user?.wins || 0) + (user?.losses || 0),
        wins: user?.wins || 0,
        losses: user?.losses || 0,
        playerId: user?.id?.slice(0, 6) || '000000',
    };

    const handleLogout = async () => {
        setMenuVisible(false);
        await logout();
        onLogout?.();
    };

    const openEditModal = () => {
        setNewDisplayName(user?.displayName || '');
        setEditModalVisible(true);
    };

    const handleSaveDisplayName = async () => {
        if (!newDisplayName.trim()) {
            Alert.alert('خطأ', 'الاسم المعروض مطلوب');
            return;
        }
        setIsSaving(true);
        try {
            await updateDisplayName(newDisplayName.trim());
            setEditModalVisible(false);
            showSuccess('تم تحديث الاسم بنجاح ✓');
        } catch (error: any) {
            Alert.alert('خطأ', error.message || 'فشل تحديث الاسم');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'حذف الحساب',
            'هل أنت متأكد من حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء!',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAccount();
                            onLogout?.();
                        } catch (error: any) {
                            Alert.alert('خطأ', error.message || 'فشل حذف الحساب');
                        }
                    },
                },
            ]
        );
    };
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />

            {/* Success Toast */}
            {successMessage && (
                <View style={styles.successToast}>
                    <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
                    <Text style={styles.successToastText}>{successMessage}</Text>
                </View>
            )}

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={onBack}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-forward" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>بروفايلي</Text>

                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setMenuVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="ellipsis-vertical" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Dropdown Menu */}
                <Modal
                    visible={menuVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setMenuVisible(false)}
                >
                    <Pressable
                        style={styles.menuOverlay}
                        onPress={() => setMenuVisible(false)}
                    >
                        <View style={styles.menuContainer}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={handleLogout}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                <Text style={styles.menuItemTextDanger}>تسجيل الخروج</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Modal>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            {/* Glow effect */}
                            <View style={styles.avatarGlow} />

                            {/* Avatar ring */}
                            <View style={styles.avatarRing}>
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={56} color={COLORS.textSecondary} />
                                </View>
                            </View>

                            {/* Level badge */}
                            <View style={styles.levelBadge}>
                                <Ionicons name="star" size={12} color={COLORS.primary} />
                                <Text style={styles.levelText}>مستوى {playerData.level}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Player Info */}
                    <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>كابتن {playerData.name}</Text>
                        <Text style={styles.playerTitle}>
                            {playerData.title}
                        </Text>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        {/* Matches */}
                        <View style={styles.statCard}>
                            <View style={styles.statIconContainer}>
                                <MaterialCommunityIcons
                                    name="soccer"
                                    size={18}
                                    color={COLORS.textSlate}
                                />
                            </View>
                            <Text style={styles.statValue}>{playerData.matches}</Text>
                            <Text style={styles.statLabel}>مباريات</Text>
                        </View>

                        {/* Wins (Primary/Highlighted) */}
                        <View style={[styles.statCard, styles.statCardPrimary]}>
                            <View style={styles.statCardPrimaryBg} />
                            <View style={[styles.statIconContainer, styles.statIconPrimary]}>
                                <Ionicons name="trophy" size={18} color={COLORS.primary} />
                            </View>
                            <Text style={[styles.statValue, styles.statValuePrimary]}>
                                {playerData.wins}
                            </Text>
                            <Text style={[styles.statLabel, styles.statLabelPrimary]}>فوز</Text>
                        </View>

                        {/* Losses */}
                        <View style={styles.statCard}>
                            <View style={[styles.statIconContainer, styles.statIconDanger]}>
                                <Ionicons name="close" size={18} color="#f87171" />
                            </View>
                            <Text style={[styles.statValue, styles.statValueDanger]}>
                                {playerData.losses}
                            </Text>
                            <Text style={styles.statLabel}>خسارة</Text>
                        </View>
                    </View>

                    {/* Edit Profile Button */}
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={openEditModal}
                        activeOpacity={0.9}
                    >
                        <Ionicons name="create-outline" size={24} color={COLORS.textPrimary} />
                        <Text style={styles.editButtonText}>تعديل البروفايل</Text>
                    </TouchableOpacity>

                    {/* Player ID */}
                    <Text style={styles.playerIdText}>
                        ID: {playerData.playerId} • v2.4.0
                    </Text>
                </ScrollView>
            </SafeAreaView>

            {/* Edit Profile Modal */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setEditModalVisible(false)}
                >
                    <Pressable style={styles.modalContainer} onPress={() => { }}>
                        <Text style={styles.modalTitle}>تعديل البروفايل</Text>

                        {/* Display Name Input */}
                        <View style={styles.modalFieldContainer}>
                            <Text style={styles.modalLabel}>الاسم المعروض</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={newDisplayName}
                                onChangeText={setNewDisplayName}
                                placeholder="اكتب اسمك الجديد"
                                placeholderTextColor="#9cba9c"
                                textAlign="right"
                            />
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={styles.modalSaveButton}
                            onPress={handleSaveDisplayName}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.modalSaveButtonText}>حفظ التغييرات</Text>
                            )}
                        </TouchableOpacity>

                        {/* Delete Account Button */}
                        <TouchableOpacity
                            style={styles.modalDeleteButton}
                            onPress={handleDeleteAccount}
                        >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            <Text style={styles.modalDeleteButtonText}>حذف الحساب</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Bottom Navigation */}
            <BottomNavBar
                activeTab="profile"
                onTabPress={(tab) => onNavigate(tab)}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: `${COLORS.primary}30`,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xl,
        paddingBottom: 120, // Space for bottom nav
        alignItems: 'center',
    },
    avatarSection: {
        marginBottom: SPACING.lg,
    },
    avatarContainer: {
        position: 'relative',
        alignItems: 'center',
    },
    avatarGlow: {
        position: 'absolute',
        top: -8,
        left: -8,
        right: -8,
        bottom: -8,
        borderRadius: 80,
        backgroundColor: COLORS.primary,
        opacity: 0.4,
    },
    avatarRing: {
        width: 144,
        height: 144,
        borderRadius: 72,
        padding: 6,
        backgroundColor: COLORS.backgroundDark,
        borderWidth: 4,
        borderColor: COLORS.surfaceDark,
    },
    avatarPlaceholder: {
        flex: 1,
        borderRadius: 66,
        backgroundColor: COLORS.surfaceDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelBadge: {
        position: 'absolute',
        bottom: -8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.surfaceDark,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.primary,
        ...SHADOWS.sm,
    },
    levelText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    playerInfo: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    playerName: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    playerTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textSlate,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: SPACING.sm,
        width: '100%',
        marginBottom: SPACING.xl + SPACING.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.surfaceDark,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        alignItems: 'center',
        gap: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        ...SHADOWS.md,
    },
    statCardPrimary: {
        borderColor: `${COLORS.primary}30`,
        overflow: 'hidden',
    },
    statCardPrimaryBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.primary,
        opacity: 0.05,
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.cardBackground,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statIconPrimary: {
        backgroundColor: `${COLORS.primary}30`,
    },
    statIconDanger: {
        backgroundColor: 'rgba(248, 113, 113, 0.1)',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.textPrimary,
    },
    statValuePrimary: {
        color: COLORS.primary,
    },
    statValueDanger: {
        color: '#f87171',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textSlate,
    },
    statLabelPrimary: {
        color: `${COLORS.primary}CC`,
    },
    editButton: {
        width: '100%',
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
        ...SHADOWS.lg,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.4,
    },
    editButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    playerIdText: {
        fontSize: 10,
        color: COLORS.textMuted,
        opacity: 0.6,
    },
    // Menu styles
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    menuContainer: {
        position: 'absolute',
        top: 60,
        right: 16,
        backgroundColor: COLORS.surfaceDark,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        overflow: 'hidden',
        minWidth: 160,
        ...SHADOWS.lg,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    menuItemTextDanger: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
    },
    // Edit Profile Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalContainer: {
        backgroundColor: COLORS.surfaceDark,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 400,
        ...SHADOWS.lg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    modalFieldContainer: {
        marginBottom: SPACING.lg,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'right',
        marginBottom: SPACING.sm,
    },
    modalInput: {
        height: 48,
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        paddingHorizontal: SPACING.md,
        fontSize: 16,
        color: COLORS.textPrimary,
        textAlign: 'right',
    },
    modalSaveButton: {
        height: 48,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
        ...SHADOWS.md,
    },
    modalSaveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    modalDeleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    modalDeleteButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
    },
    // Success Toast
    successToast: {
        position: 'absolute',
        top: 60,
        left: SPACING.lg,
        right: SPACING.lg,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.4)',
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        ...SHADOWS.lg,
    },
    successToastText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#22C55E',
    },
});

export default ProfileScreen;
