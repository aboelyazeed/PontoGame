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

export interface AlertPopupProps {
    visible: boolean;
    title: string;
    message: string;
    buttonText?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    onPress: () => void;
}

const AlertPopup: React.FC<AlertPopupProps> = ({
    visible,
    title,
    message,
    buttonText = 'حسناً',
    icon = 'alert-circle',
    iconColor,
    onPress,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onPress}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: `${iconColor || COLORS.warning}20` }]}>
                        <Ionicons
                            name={icon}
                            size={32}
                            color={iconColor || COLORS.warning}
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Button */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={onPress}
                        >
                            <Text style={styles.confirmButtonText}>
                                {buttonText}
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
        padding: SPACING.lg,
    },
    container: {
        width: Math.min(width - SPACING.xl * 2, 340),
        backgroundColor: COLORS.surfaceDark,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    confirmButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
});

export default AlertPopup;
