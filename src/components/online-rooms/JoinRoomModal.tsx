import React from 'react';
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

interface JoinRoomModalProps {
    visible: boolean;
    onClose: () => void;
    onJoin: () => void;
    code: string;
    setCode: (code: string) => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ visible, onClose, onJoin, code, setCode }) => {
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
                    <Text style={styles.modalTitle}>الإنضمام لغرفة</Text>
                    <Text style={styles.modalSubtitle}>أدخل رمز الغرفة المكون من 6 أرقام</Text>

                    <TextInput
                        style={styles.codeInput}
                        placeholder="000000"
                        placeholderTextColor={COLORS.textSecondary + '80'}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={code}
                        onChangeText={setCode}
                        textAlign="center"
                        autoFocus
                    />

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
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        width: '100%',
    },
});
