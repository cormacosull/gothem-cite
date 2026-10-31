import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { useChaseMissionViewModel } from '../../../viewmodels/useChaseMissionViewModel';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { colors, spacing, radii, inkShadow } from '../../../theme/tokens';

const SWIPE_THRESHOLD = 40;
const BOARD_HEIGHT = 420;

interface Props {
  // Called once the moment the game ends
  onFinish: (success: boolean) => void;
  // Called when the player taps the win/lose screen
  onContinue: () => void;
}

// Placeholder art throughout: plain colored rectangles
export function ChaseScreen({ onFinish, onContinue }: Props) {
  const { laneCount, playerLane, obstacles, elapsedMs, survivalMs, status, moveLeft, moveRight } =
    useChaseMissionViewModel({ onFinish });

  // PanResponder is created once and reads the latest handlers through refs
  const moveLeftRef = useRef(moveLeft);
  const moveRightRef = useRef(moveRight);
  useEffect(() => {
    moveLeftRef.current = moveLeft;
    moveRightRef.current = moveRight;
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) moveRightRef.current();
        else if (gesture.dx < -SWIPE_THRESHOLD) moveLeftRef.current();
      },
    })
  ).current;

  const progress = Math.min(1, elapsedMs / survivalMs);
  const secondsLeft = Math.max(0, Math.ceil((survivalMs - elapsedMs) / 1000));

  return (
    <View style={styles.container}>
      <Text style={styles.wordmark}>The Pidgeon</Text>
      <Text style={styles.tagline}>Shake the chase before time runs out</Text>

      <View style={styles.timerTrack}>
        <View style={[styles.timerFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.hint}>
        {status === 'playing'
          ? `Hold out ${secondsLeft}s more`
          : status === 'won'
            ? 'You shook them off!'
            : 'Busted!'}
      </Text>

      <View style={styles.board} {...panResponder.panHandlers}>
        {Array.from({ length: laneCount }, (_, lane) => (
          <View key={lane} style={styles.lane}>
            {obstacles
              .filter((o) => o.lane === lane)
              .map((o) => (
                <View
                  key={o.id}
                  style={[styles.obstacle, { top: `${Math.min(o.progress, 1) * 90}%` }]}
                />
              ))}
            {lane === playerLane && <View style={styles.player} />}
          </View>
        ))}
      </View>

      <Text style={styles.controlHint}>Swipe left/right (or tilt your phone) to switch lanes</Text>

      {status !== 'playing' && (
        <View style={styles.ctaRow}>
          <PrimaryButton label="Continue" onPress={onContinue} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 32,
    color: colors.signal,
    letterSpacing: 1,
    textShadowColor: colors.inkLine,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: colors.textOnInk,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  timerTrack: {
    width: '100%',
    height: 10,
    backgroundColor: colors.panel,
    borderWidth: 2,
    borderColor: colors.inkLine,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: colors.signal,
  },
  hint: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: colors.textOnInk,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  board: {
    width: '100%',
    height: BOARD_HEIGHT,
    flexDirection: 'row',
    backgroundColor: colors.panel,
    borderWidth: 3,
    borderColor: colors.inkLine,
    borderRadius: radii.md,
    overflow: 'hidden',
    ...inkShadow(3),
  },
  lane: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: colors.inkLine,
    position: 'relative',
  },
  obstacle: {
    position: 'absolute',
    left: '15%',
    width: '70%',
    aspectRatio: 1,
    backgroundColor: colors.alarm,
    borderWidth: 2,
    borderColor: colors.inkLine,
    borderRadius: radii.sm,
  },
  player: {
    position: 'absolute',
    bottom: 10,
    left: '15%',
    width: '70%',
    aspectRatio: 1,
    backgroundColor: colors.signal,
    borderWidth: 2,
    borderColor: colors.inkLine,
    borderRadius: radii.sm,
    ...inkShadow(2),
  },
  controlHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  ctaRow: {
    marginTop: spacing.lg,
  },
});
