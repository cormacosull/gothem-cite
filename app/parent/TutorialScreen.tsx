import { View, Text, StyleSheet, Pressable } from 'react-native';
import { scale } from '../../src/lib/scale';
import { colors, fonts } from '../../src/theme/tokens';

interface Props {
    onFinished: () => void;
    onSkip: () => void;
}

export default function TutorialDemo({ onFinished, onSkip }: Props) {
    return (
        <View style={styles.layout}>
            <View style={styles.main}>
                <Text style={styles.eyebrow}>MISSION CONTROL</Text>
                <Text style={styles.title}>Before the city needs you</Text>
                <Text style={styles.body}>
                    Your heroes are joining the field. When you continue, each hero receives a mission and the city clock begins.
                </Text>
                <Text style={styles.body}>
                    Watch the city health and mission board. Heroes report back when their assignments are complete.
                </Text>
                <View style={styles.actions}>
                    <Pressable style={styles.primaryButton} onPress={onFinished}>
                        <Text style={styles.primaryButtonText}>Begin the mission</Text>
                    </Pressable>
                    <Pressable style={styles.skipButton} onPress={onSkip}>
                        <Text style={styles.skipButtonText}>Skip briefing</Text>
                    </Pressable>
                </View>

            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    layout: {
        flex: 1,
        width: '100%',
        backgroundColor: colors.ink,
        justifyContent: 'center',
        alignItems: 'center',
        padding: scale(24),
    },
    main: {
        width: '100%',
        maxWidth: scale(520),
        backgroundColor: colors.panel,
        padding: scale(24),
        borderRadius: scale(8),
        borderColor: colors.inkLine,
        borderWidth: scale(3),
        alignItems: 'flex-start',
    },
    eyebrow: {
        color: colors.signal,
        fontSize: scale(12),
        fontFamily: fonts.bodyBold,
        letterSpacing: 1,
        marginBottom: scale(12),
    },
    title: {
        color: colors.textOnInk,
        fontSize: scale(30),
        fontFamily: fonts.bodyBold,
        marginBottom: scale(16),
    },
    body: {
        color: colors.textOnInk,
        fontSize: scale(16),
        lineHeight: scale(24),
        marginBottom: scale(12),
    },
    actions: {
        width: '100%',
        marginTop: scale(16),
        alignItems: 'stretch',
    },
    primaryButton: {
        minHeight: scale(48),
        backgroundColor: colors.signal,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: scale(16),
        borderRadius: scale(4),
    },
    primaryButtonText: {
        color: colors.ink,
        fontSize: scale(16),
        fontFamily: fonts.bodyBold,
    },
    skipButton: {
        minHeight: scale(44),
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: scale(8),
    },
    skipButtonText: {
        color: colors.textMuted,
        fontSize: scale(14),
        fontFamily: fonts.bodyBold,
    }
});