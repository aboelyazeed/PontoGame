import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Platform,
    StyleSheet
} from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import Button from '../ui/Button';

interface PasswordModalProps {
    visible: boolean;
    onClose: () => void;
    onJoin: () => void;
    password: string;
    setPassword: (password: string) => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ visible, onClose, onJoin, password, setPassword }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.modalBackdrop} />
                </TouchableWithoutFeedback>

                <View style={styles.modalContent}>
                    <View style={styles.modalIndicator} />
                    <Text style={styles.modalTitle}>غرفة خاصة</Text>
                    <Text style={styles.modalSubtitle}>أدخل كلمة المرور للانضمام</Text>

                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="أدخل كلمة المرور"
                            placeholderTextColor={COLORS.textSecondary + '80'}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            autoFocus
                        />
                    </View>

                    <View style={styles.modalButtons}>
                        <Button
                            title="إلغاء"
                            onPress={onClose}
                            variant="secondary"
                            style={{ flex: 1 }}
                        />
                        <Button
                            title="دخول"
                            onPress={onJoin}
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
    passwordContainer: {
        width: '100%',
        marginBottom: SPACING.xl,
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
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        width: '100%',
    },
});
