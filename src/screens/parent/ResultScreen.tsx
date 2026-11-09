import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { scale } from '../../lib/scale';
import { colors } from '../../theme/tokens';
import type { GameState } from '../../lib/protocol';
import wonBackground from '../../../assets/result-won.png';
import lostBackground from '../../../assets/result-lost.png';

interface Props {
    state: GameState;
    //opens a new lobby with a new code
    onPlayAgain: () => void;
}

//end of the game on mission control: final health and team results
export default function ResultScreen({ state, onPlayAgain }: Props) {
    const won = state.status === 'won';
    const played = state.missions.filter((m) => m.status !== 'active');
    const succeeded = played.filter((m) => m.status === 'success').length;

    return (
        <View style={styles.layout}>
            <Image source={won ? wonBackground : lostBackground} style={styles.backgroundImage} resizeMode="cover" />
            <View style={styles.main}>
                <Text style={styles.eyebrow}>MISSION CONTROL</Text>
                <Text style={[styles.title, !won && styles.titleLost]}>
                    {won ? 'Gothem is saved!' : 'Gothem has fallen…'}
                </Text>
                <Text style={styles.subtitle}>
                    Final city health: {Math.round(state.cityHealth)}%
                </Text>
                <Text style={styles.subtitle}>
                    The team won {succeeded} of {played.length} missions.
                </Text>
                {won && <Text style={styles.subtitle}>WE GOTHEM!!!</Text>}
                <View style={styles.actions}>
                    <Pressable style={styles.primaryButton} onPress={onPlayAgain}>
                        <Text style={styles.primaryButtonText}>Play again</Text>
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
    backgroundImage: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.6,
    },
    main: {
        width: '100%',
        maxWidth: scale(520),
        backgroundColor: 'rgba(11, 18, 32, 0.8)',
        padding: scale(24),
        borderRadius: scale(8),
        borderColor: colors.inkLine,
        borderWidth: scale(3),
        alignItems: 'center',
    },
    eyebrow: {
        color: colors.signal,
        fontSize: scale(12),
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: scale(12),
    },
    title: {
        fontFamily: 'Bangers_400Regular',
        fontSize: scale(40),
        color: colors.resolved,
        letterSpacing: 1,
        textAlign: 'center',
        textShadowColor: colors.inkLine,
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 0,
        marginBottom: scale(16),
    },
    titleLost: {
        color: colors.alarm,
    },
    subtitle: {
        fontFamily: 'Nunito_700Bold',
        color: colors.textOnInk,
        fontSize: scale(16),
        lineHeight: scale(24),
        textAlign: 'center',
        marginBottom: scale(6),
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
        fontWeight: '700',
    },
});