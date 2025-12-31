import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';

interface RoomActionsProps {
    onCreateRoom: () => void;
    onJoinByCode: () => void;
}

export const RoomActions: React.FC<RoomActionsProps> = ({ onCreateRoom, onJoinByCode }) => {
    return (
        <View style={styles.container}>
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
                    onPress={onCreateRoom}
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
                    onPress={onJoinByCode}
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.xl,
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
    actionsRow: {
        flexDirection: 'row',
        gap: SPACING.md,
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
});
