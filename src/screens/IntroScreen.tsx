import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useIntroViewModel } from '../viewmodels/useIntroViewModel';
import { IntroSlide } from '../components/IntroSlide';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing, fonts } from '../theme/tokens';
import type { Player } from '../lib/protocol';
import { scale } from '../lib/scale';

interface Props {
  players: Player[];
  // Called once the intro sequence is done (last slide's timer ran out, or
  // this device hit Skip). Shared by both the parent and child screens —
  // each device plays its own copy of the same intro independently.
  onFinish: () => void;
}

export function IntroScreen({ players, onFinish }: Props) {
  const { slide, index, total, isFirst, isLast, next, back, skip } = useIntroViewModel({ players, onFinish });

  return (
    <View style={styles.container}>
      <IntroSlide heading={slide.heading} body={slide.body} />

      <View style={styles.dots}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.buttonRow}>
        {!isFirst && <PrimaryButton label="Back" onPress={back} />}
        {!isLast && <PrimaryButton label="Next" onPress={next} />}
      </View>

      <Pressable style={styles.skipButton} onPress={skip}>
        <Text style={styles.skipButtonText}>Skip briefing</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.inkLine,
  },
  dotActive: {
    backgroundColor: colors.signal,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
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
  },
});
