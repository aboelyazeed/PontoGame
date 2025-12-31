// ==========================================
// Ponto Game - Reusable Button Component
// ==========================================

import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    icon,
    style,
    textStyle,
    fullWidth = false,
}) => {
    const getContainerStyles = () => {
        const stylesList: ViewStyle[] = [styles.container];

        // Size
        switch (size) {
            case 'sm':
                stylesList.push(styles.sizeSm);
                break;
            case 'md':
                stylesList.push(styles.sizeMd);
                break;
            case 'lg':
                stylesList.push(styles.sizeLg);
                break;
        }

        // Width
        if (fullWidth) {
            stylesList.push(styles.fullWidth);
        }

        // Variant (Base styles before gradient/bg)
        if (variant === 'outline') {
            stylesList.push(styles.variantOutline);
        } else if (variant === 'secondary') {
            stylesList.push(styles.variantSecondary);
        } else if (variant === 'danger') {
            stylesList.push(styles.variantDanger);
        }
        // Primary is handled by LinearGradient or default bg if preferred

        // Disabled
        if (disabled || isLoading) {
            stylesList.push(styles.disabled);
        }

        return stylesList;
    };

    const getTextStyles = () => {
        const stylesList: TextStyle[] = [styles.text];

        // Size
        switch (size) {
            case 'sm':
                stylesList.push(styles.textSm);
                break;
            case 'md':
                stylesList.push(styles.textMd);
                break;
            case 'lg':
                stylesList.push(styles.textLg);
                break;
        }

        // Variant
        if (variant === 'outline') {
            stylesList.push(styles.textOutline);
        } else if (variant === 'secondary') {
            stylesList.push(styles.textSecondary);
        }

        return stylesList;
    };

    const renderContent = () => (
        <View style={styles.contentContainer}>
            {isLoading ? (
                <ActivityIndicator color={variant === 'outline' ? COLORS.primary : '#FFF'} />
            ) : (
                <>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <Text style={[getTextStyles(), textStyle]}>{title}</Text>
                </>
            )}
        </View>
    );

    // Primary Variant uses Gradient by default for "Ponto" style, 
    // unless user specifically requested "solid color". 
    // The request said "solid color like the rest of the app buttons".
    // If I look at the OnlineRoomsScreen, many buttons use Gradient. 
    // But the user might perceive it as solid green.
    // However, to be strictly "solid", I should just use backgroundColor.
    // Let's stick to a nice solid color for Primary to match the specific request for "solid color",
    // or maybe the user IS contrasting it with the gradient button I made for "Random Join"?
    // The current "Random Join" button uses a gradient `[COLORS.primary, '#15803d']`.
    // I'll make the Primary variant a SOLID color as requested.

    // Actually, usually "Primary" in this app seems to be Green. 
    // I will use `COLORS.primary` as background.

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
            style={[getContainerStyles(), style]}
        >
            {renderContent()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.primary, // Default Primary Solid
        ...SHADOWS.md,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Sizes
    sizeSm: {
        height: 36,
        paddingHorizontal: SPACING.md,
    },
    sizeMd: {
        height: 48,
        paddingHorizontal: SPACING.lg,
    },
    sizeLg: {
        height: 56,
        paddingHorizontal: SPACING.xl,
    },
    // Width
    fullWidth: {
        width: '100%',
    },
    // Variants
    variantSecondary: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowOpacity: 0,
    },
    variantOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        shadowOpacity: 0,
        elevation: 0,
    },
    variantDanger: {
        backgroundColor: COLORS.error,
    },
    // Disabled
    disabled: {
        opacity: 0.5,
    },
    // Text
    text: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    textSm: {
        fontSize: 12,
    },
    textMd: {
        fontSize: 16,
    },
    textLg: {
        fontSize: 18,
    },
    textOutline: {
        color: COLORS.primary,
    },
    textSecondary: {
        color: COLORS.textSecondary,
    },
    // Icon
    iconContainer: {
        marginRight: SPACING.sm, // RTL Support check? margins flip in RN if I18nManager.isRTL is handled. 
        // Since we forceRTL, right margin separates icon from text (Icon [gap] Text)
        // In RTL: [Text] [gap] [Icon] ??? Usually icon is leading.
        // If row direction is standard (left-to-right), Icon-Text. 
        // If RTL, it renders right-to-left: Icon (rightmost) - Text (left of icon).
        // Let's just use gap in contentContainer instead.
    }
});

export default Button;
