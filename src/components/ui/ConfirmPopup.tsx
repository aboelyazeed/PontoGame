import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export interface ConfirmPopupProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmDestructive?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmPopup: React.FC<ConfirmPopupProps> = ({
    visible,
    title,
    message,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    confirmDestructive = false,
    icon = 'alert-circle',
    iconColor,
    onConfirm,
    onCancel,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: `${iconColor || COLORS.error}20` }]}>
                        <Ionicons
                            name={icon}
                            size={32}
                            color={iconColor || COLORS.error}
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelButtonText}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                confirmDestructive && styles.confirmButtonDestructive
                            ]}
                            onPress={onConfirm}
                        >
                            <Text style={[
                                styles.confirmButtonText,
                                confirmDestructive && styles.confirmButtonTextDestructive
                            ]}>
                                {confirmText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        width: width * 0.85,
        backgroundColor: COLORS.surfaceDark,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: COLORS.textSlate,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.lg,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: SPACING.sm,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textSlate,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
    },
    confirmButtonDestructive: {
        backgroundColor: COLORS.error,
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFF',
    },
    confirmButtonTextDestructive: {
        color: '#FFF',
    },
});

export default ConfirmPopup;
