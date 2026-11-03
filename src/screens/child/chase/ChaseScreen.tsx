import { useEffect, useRef } from 'react';
import { View, Image, Text, Pressable, StyleSheet, PanResponder } from 'react-native';
import { useChaseMissionViewModel } from '../../../viewmodels/useChaseMissionViewModel';
import { colors, spacing, radii, inkShadow } from '../../../theme/tokens';
import { ChaseBackground } from './ChaseArt';
import chasePlayerCar from '../../../../assets/chase-player-car.png';
import chaseObstacleCar1 from '../../../../assets/chase-obstacle-car1.png';
import chaseObstacleCar2 from '../../../../assets/chase-obstacle-car2.png';

const OBSTACLE_CARS = [chaseObstacleCar1, chaseObstacleCar2];

// Deterministic pick per obstacle id, so a car keeps the same look for its lifetime.
function obstacleCarImage(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return OBSTACLE_CARS[Math.abs(hash) % OBSTACLE_CARS.length];
}

const SWIPE_THRESHOLD = 40;
const BOARD_HEIGHT = 420;

const OVERLAY_COPY = {
  ready: { title: 'Chase alert!', button: 'START' },
  playing: { title: '', button: '' },
  won: { title: 'BUSTED!', button: 'PLAY AGAIN' },
  lost: { title: 'Crashed!', button: 'TRY AGAIN' },
} as const;

interface Props {
  // Called once the moment the game ends
  onFinish?: (success: boolean) => void;
  // Called when the player taps the win/lose screen
  onContinue?: () => void;
}

// Placeholder art throughout: plain colored rectangles
export function ChaseScreen({ onFinish, onContinue }: Props = {}) {
  const { laneCount, playerLane, obstacles, elapsedMs, survivalMs, status, start, moveLeft, moveRight } =
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
      <Text style={styles.tagline}>Catch The Pidgeon before time runs out</Text>
      
      <View style={styles.timerTrack}>
        <View style={[styles.timerFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.hint}>{`Hold out ${secondsLeft}s more`}</Text>

      <View style={styles.board} {...panResponder.panHandlers}>
        <ChaseBackground />
        {Array.from({ length: laneCount }, (_, lane) => (
          <View key={lane} style={styles.lane}>
            {obstacles
              .filter((o) => o.lane === lane)
              .map((o) => (
                <View
                  key={o.id}
                  style={[styles.obstacle, { top: `${Math.min(o.progress, 1) * 90}%` }]}
                >
                  <Image source={obstacleCarImage(o.id)} style={styles.carImage} resizeMode="contain" />
                </View>
              ))}
            {lane === playerLane && (
              <View style={styles.player}>
                <Image source={chasePlayerCar} style={styles.carImage} resizeMode="contain" />
              </View>
            )}
          </View>
        ))}

        {/*overlays / modals*/}
        {status !== 'playing' && (
          <View style={styles.overlay}>
            <View style={styles.overlayCard}>
              <Text style={styles.overlayTitle}>{OVERLAY_COPY[status].title}</Text>
              <Text style={styles.overlayBody}>
                {status === 'ready' &&
                  `Dodge the traffic for ${Math.round(survivalMs / 1000)}s. Swipe left/right (or tilt your phone) to switch lanes.`}
                {status === 'won' &&
                  `Victory, you caught The Pidgeon!`}
                {status === 'lost' &&
                  `You crashed with ${secondsLeft}s left.`}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={status === 'ready' || !onContinue ? start : onContinue}
                style={({ pressed }) => [styles.overlayButton, pressed && styles.overlayButtonPressed]}
              >
                <Text style={styles.overlayButtonText}>
                  {status !== 'ready' && onContinue ? 'CONTINUE' : OVERLAY_COPY[status].button}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.controlHint}>Swipe left/right (or tilt your phone) to switch lanes</Text>
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
    borderWidth: 3,
    borderColor: colors.inkLine,
    borderRadius: radii.md,
    overflow: 'hidden',
    ...inkShadow(3),
  },
  lane: {
    flex: 1,
    position: 'relative',
  },
  obstacle: {
    position: 'absolute',
    left: '27%',
    width: '46%',
    aspectRatio: 0.93,
  },
  player: {
    position: 'absolute',
    bottom: 10,
    left: '33%',
    width: '34%',
    aspectRatio: 0.56,
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  controlHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 14, 32, 0.55)',
  },
  overlayCard: {
    maxWidth: '80%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 3,
    borderColor: colors.inkLine,
    backgroundColor: colors.panel,
    alignItems: 'center',
  },
  overlayTitle: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 28,
    letterSpacing: 1,
    color: colors.signal,
    textAlign: 'center',
  },
  overlayBody: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: colors.textOnInk,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  overlayButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md * 2,
    borderRadius: 100,
    backgroundColor: colors.signal,
    borderWidth: 3,
    borderColor: colors.inkLine,
  },
  overlayButtonPressed: {
    opacity: 0.8,
  },
  overlayButtonText: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 18,
    letterSpacing: 1,
    color: colors.ink,
  },
});