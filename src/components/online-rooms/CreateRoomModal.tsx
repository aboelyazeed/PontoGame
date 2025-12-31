import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Platform,
    StyleSheet,
    Animated,
    LayoutAnimation
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import Button from '../ui/Button';

interface CreateRoomModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: () => void;
    isPrivate: boolean;
    setIsPrivate: (value: boolean) => void;
    password: string;
    setPassword: (value: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
    visible,
    onClose,
    onCreate,
    isPrivate,
    setIsPrivate,
    password,
    setPassword
}) => {
    const slideAnim = useRef(new Animated.Value(0)).current;
    const [layoutWidth, setLayoutWidth] = useState(0);

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: isPrivate ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
            easing: ((t) => t), // Simple easing usually works, or import Easing
        }).start();
    }, [isPrivate]);

    const togglePrivacy = (value: boolean) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsPrivate(value);
    };

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
                    <Text style={styles.modalTitle}>إنشاء غرفة جديدة</Text>
                    <Text style={styles.modalSubtitle}>حدد إعدادات الغرفة الخاصة بك</Text>

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
                                            outputRange: [0, -(layoutWidth - 8) / 2]
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
                            <Ionicons name="earth" size={20} color={!isPrivate ? '#FFF' : COLORS.textSecondary} />
                            <Text style={[styles.toggleText, !isPrivate && styles.toggleTextActive]}>عام</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.toggleOption}
                            onPress={() => togglePrivacy(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="lock-closed" size={20} color={isPrivate ? '#FFF' : COLORS.textSecondary} />
                            <Text style={[styles.toggleText, isPrivate && styles.toggleTextActive]}>سري</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.passwordContainer, !isPrivate && styles.disabledContainer]}>
                        <Text style={styles.inputLabel}>كلمة المرور</Text>
                        <TextInput
                            style={[styles.passwordInput, !isPrivate && styles.disabledInput]}
                            placeholder={isPrivate ? "أدخل كلمة مرور الغرفة" : "غير متاحة للغرف العامة"}
                            placeholderTextColor={COLORS.textSecondary + '80'}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={isPrivate}
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
                            title="إنشاء الغرفة"
                            onPress={onCreate}
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
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        width: '100%',
    },
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
        zIndex: 1,
    },
    activeToggleBackground: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 4,
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
});
