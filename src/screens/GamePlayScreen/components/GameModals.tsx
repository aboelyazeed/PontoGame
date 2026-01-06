// ==========================================
// GameModals Component
// ==========================================

import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { styles, GAME_COLORS } from '../GamePlayScreen.styles';
import { AlertPopup, ConfirmPopup } from '../../../components/ui';
import { GameCard } from '../../../hooks/useGameLogic';

interface AlertConfig {
    visible: boolean;
    title: string;
    message: string;
}

interface ConfirmConfig {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

interface GameEndInfo {
    winnerId: string;
    reason: string;
}

interface GameModalsProps {
    // Menu Modal
    showMenu: boolean;
    onMenuClose: () => void;
    onSurrender: () => void;

    // Action Card Modal
    selectedActionCard: GameCard | null;
    actionTargetMode: string;
    onActionUse: (card: GameCard) => void;
    onActionCancel: () => void;

    // Game End Modal
    gameEndInfo: GameEndInfo | null;
    myPlayerId: string | null;
    onBack?: () => void;

    // Alert/Confirm Popups
    alertConfig: AlertConfig;
    onAlertHide: () => void;
    confirmConfig: ConfirmConfig;
    onConfirmCancel: () => void;
}

const GameModals: React.FC<GameModalsProps> = ({
    showMenu,
    onMenuClose,
    onSurrender,
    selectedActionCard,
    actionTargetMode,
    onActionUse,
    onActionCancel,
    gameEndInfo,
    myPlayerId,
    onBack,
    alertConfig,
    onAlertHide,
    confirmConfig,
    onConfirmCancel,
}) => {
    return (
        <>
            {/* Menu Modal */}
            <Modal visible={showMenu} transparent animationType="fade" onRequestClose={onMenuClose}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onMenuClose}>
                    <View style={styles.menuModal}>
                        <TouchableOpacity style={styles.menuItem} onPress={onSurrender}>
                            <Ionicons name="flag" size={24} color={GAME_COLORS.error} />
                            <Text style={styles.menuItemDanger}>استسلام</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={onMenuClose}>
                            <Ionicons name="close" size={24} color={GAME_COLORS.textSecondary} />
                            <Text style={styles.menuItemText}>إغلاق</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Action Card Modal */}
            <Modal
                visible={!!selectedActionCard && actionTargetMode === 'none'}
                transparent
                animationType="fade"
                onRequestClose={onActionCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.actionModalContent}>
                        <Text style={styles.actionModalTitle}>{selectedActionCard?.nameAr || 'أكشن'}</Text>

                        <View style={styles.actionCardPreview}>
                            <MaterialIcons name="flash-on" size={48} color={GAME_COLORS.warning} />
                            <Text style={styles.actionCardPreviewName}>{selectedActionCard?.name}</Text>
                        </View>

                        <Text style={styles.actionModalDesc}>{selectedActionCard?.description}</Text>

                        <View style={styles.actionModalButtons}>
                            <TouchableOpacity
                                style={styles.actionUseButton}
                                onPress={() => selectedActionCard && onActionUse(selectedActionCard)}
                            >
                                <Text style={styles.actionButtonText}>استخدام</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionCancelButton}
                                onPress={onActionCancel}
                            >
                                <Text style={styles.actionButtonText}>إلغاء</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Game End Modal */}
            <Modal visible={!!gameEndInfo} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.gameEndModal}>
                        <MaterialCommunityIcons
                            name={gameEndInfo?.winnerId === myPlayerId ? 'trophy' : 'emoticon-sad'}
                            size={64}
                            color={gameEndInfo?.winnerId === myPlayerId ? '#FFD700' : GAME_COLORS.error}
                        />
                        <Text style={styles.gameEndTitle}>
                            {gameEndInfo?.winnerId === myPlayerId ? 'فوز!' : 'خسارة'}
                        </Text>
                        <Text style={styles.gameEndReason}>{gameEndInfo?.reason}</Text>
                        <TouchableOpacity style={styles.gameEndButton} onPress={onBack}>
                            <Text style={styles.gameEndButtonText}>خروج</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Custom Alert Popup */}
            <AlertPopup
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                onPress={onAlertHide}
            />

            {/* Custom Confirm Popup */}
            <ConfirmPopup
                visible={confirmConfig.visible}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={onConfirmCancel}
                confirmText="استسلام"
                cancelText="إلغاء"
                confirmDestructive
            />
        </>
    );
};

export default GameModals;
