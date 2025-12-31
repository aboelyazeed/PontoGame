// ==========================================
// Ponto Game - Authentication Screen
// ==========================================

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

interface AuthScreenProps {
    onAuthSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    // Auth mode
    const [isLogin, setIsLogin] = useState(true);

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');

    // UI state
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Store
    const { login, register, isLoading, error, clearError } = useAuthStore();

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!email.trim()) {
            newErrors.email = 'البريد الإلكتروني مطلوب';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'البريد الإلكتروني غير صالح';
        }

        if (!password.trim()) {
            newErrors.password = 'كلمة السر مطلوبة';
        } else if (password.length < 6) {
            newErrors.password = 'كلمة السر يجب أن تكون 6 أحرف على الأقل';
        }

        if (!isLogin) {
            if (!username.trim()) {
                newErrors.username = 'اسم المستخدم مطلوب';
            } else if (username.length < 3) {
                newErrors.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
            }

            if (!displayName.trim()) {
                newErrors.displayName = 'الاسم المعروض مطلوب';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submit
    const handleSubmit = async () => {
        clearError();

        if (!validateForm()) return;

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register({ username, email, password, displayName });
            }
            onAuthSuccess?.();
        } catch (err) {
            // Error is handled by the store
        }
    };

    // Toggle mode
    const toggleMode = () => {
        setIsLogin(!isLogin);
        setErrors({});
        clearError();
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={COLORS.backgroundDark} />

            {/* Background Pattern */}
            <View style={styles.backgroundPattern} />

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Logo Area */}
                        <View style={styles.logoArea}>
                            <View style={styles.logoContainer}>
                                <MaterialCommunityIcons
                                    name="soccer"
                                    size={44}
                                    color="#FFFFFF"
                                />
                            </View>
                            <Text style={styles.headline}>
                                {isLogin ? 'أهلاً بيك يا كابتن' : 'سجل حساب جديد'}
                            </Text>
                            <Text style={styles.subheadline}>
                                {isLogin
                                    ? 'جاهز للماتش؟ سجل دخول ويالا بينا'
                                    : 'انضم للعب واستمتع بالمنافسة'}
                            </Text>
                        </View>

                        {/* Auth Card */}
                        <View style={styles.card}>
                            {/* Top Gradient Bar */}
                            <View style={styles.topBar} />

                            <View style={styles.cardContent}>
                                {/* Global Error */}
                                {error && (
                                    <View style={styles.globalError}>
                                        <Ionicons name="alert-circle" size={16} color="#EF4444" />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                )}

                                {/* Username Field (Register only) */}
                                {!isLogin && (
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>اسم المستخدم</Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                errors.username && styles.inputError
                                            ]}
                                            placeholder="اختر اسم مستخدم"
                                            placeholderTextColor="#9cba9c"
                                            value={username}
                                            onChangeText={setUsername}
                                            autoCapitalize="none"
                                            textAlign="right"
                                        />
                                        {errors.username && (
                                            <View style={styles.errorRow}>
                                                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                                                <Text style={styles.fieldError}>{errors.username}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Display Name Field (Register only) */}
                                {!isLogin && (
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>الاسم المعروض</Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                errors.displayName && styles.inputError
                                            ]}
                                            placeholder="الاسم اللي هيظهر في اللعبة"
                                            placeholderTextColor="#9cba9c"
                                            value={displayName}
                                            onChangeText={setDisplayName}
                                            textAlign="right"
                                        />
                                        {errors.displayName && (
                                            <View style={styles.errorRow}>
                                                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                                                <Text style={styles.fieldError}>{errors.displayName}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Email Field */}
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>البريد الإلكتروني</Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            errors.email && styles.inputError
                                        ]}
                                        placeholder="اكتب إيميلك هنا"
                                        placeholderTextColor="#9cba9c"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        textAlign="right"
                                    />
                                    {errors.email && (
                                        <View style={styles.errorRow}>
                                            <Ionicons name="alert-circle" size={14} color="#EF4444" />
                                            <Text style={styles.fieldError}>{errors.email}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Password Field */}
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>كلمة السر</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                { paddingEnd: 48 },
                                                errors.password && styles.inputError
                                            ]}
                                            placeholder="اكتب كلمة السر"
                                            placeholderTextColor="#9cba9c"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            textAlign="right"
                                        />
                                        <TouchableOpacity
                                            style={styles.eyeButtonInside}
                                            onPress={() => setShowPassword(!showPassword)}
                                        >
                                            <Ionicons
                                                name={showPassword ? 'eye' : 'eye-off'}
                                                size={20}
                                                color="#9cba9c"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    {errors.password && (
                                        <View style={styles.errorRow}>
                                            <Ionicons name="alert-circle" size={14} color="#EF4444" />
                                            <Text style={styles.fieldError}>{errors.password}</Text>
                                        </View>
                                    )}

                                    {/* Forgot Password (Login only) */}
                                    {isLogin && (
                                        <TouchableOpacity style={styles.forgotPassword}>
                                            <Text style={styles.forgotText}>نسيت كلمة السر؟</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Primary Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.primaryButton,
                                        isLoading && styles.buttonDisabled
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                    activeOpacity={0.8}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Text style={styles.primaryButtonText}>
                                                {isLogin ? 'سجل دخول' : 'أنشئ حساب'}
                                            </Text>
                                            <Ionicons
                                                name={isLogin ? 'log-in' : 'person-add'}
                                                size={20}
                                                color="#FFFFFF"
                                            />
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* Divider */}
                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>أو</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                {/* Secondary Button */}
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    onPress={toggleMode}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.secondaryButtonText}>
                                        {isLogin ? 'اعمل حساب جديد' : 'عندي حساب - سجل دخول'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Ponto Cards v1.0.0 © 2024
                            </Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundDark,
    },
    backgroundPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },

    // Logo
    logoArea: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        transform: [{ rotate: '3deg' }],
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    headline: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 4,
    },
    subheadline: {
        fontSize: 14,
        color: '#9cba9c',
        textAlign: 'center',
    },

    // Card
    card: {
        backgroundColor: '#162016',
        borderRadius: 12,
        overflow: 'visible',
        borderWidth: 1,
        borderColor: '#3b543b',
    },
    topBar: {
        height: 8,
        backgroundColor: COLORS.primary,
    },
    cardContent: {
        padding: 24,
        gap: 16,
    },

    // Fields
    fieldContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'right',
    },
    input: {
        height: 48,
        backgroundColor: '#1b271b',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3b543b',
        paddingHorizontal: 16,
        fontSize: 16,
        color: COLORS.textPrimary,
        textAlign: 'right',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    inputWrapper: {
        position: 'relative',
    },
    eyeButtonInside: {
        position: 'absolute',
        end: 8, // Visual left in RTL
        top: 0,
        height: 48,
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Errors
    globalError: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    errorText: {
        flex: 1,
        color: '#EF4444',
        fontSize: 13,
        textAlign: 'right',
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    fieldError: {
        color: '#EF4444',
        fontSize: 12,
    },

    // Forgot password
    forgotPassword: {
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    forgotText: {
        fontSize: 13,
        color: '#9cba9c',
    },

    // Buttons
    primaryButton: {
        height: 48,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#3b543b',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 12,
        color: '#9cba9c',
    },

    // Secondary
    secondaryButton: {
        height: 48,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#3b543b',
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },

    // Footer
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#3b543b',
        opacity: 0.6,
    },
});

export default AuthScreen;
