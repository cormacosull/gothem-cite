import { View, StyleSheet } from 'react-native';
import { useIntroViewModel } from '../viewmodels/useIntroViewModel';
import { IntroSlide } from '../components/IntroSlide';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';
import type { Player } from '../lib/protocol';

interface Props {
  players: Player[];
  // Called once the intro sequence is done (last slide's timer ran out, or
  // this device hit Skip). Shared by both the parent and child screens —
  // each device plays its own copy of the same intro independently.
  onFinish: () => void;
}

export function IntroScreen({ players, onFinish }: Props) {
  const { slide, index, total, skip } = useIntroViewModel({ players, onFinish });

  return (
    <View style={styles.container}>
      <IntroSlide heading={slide.heading} body={slide.body} />

      <View style={styles.dots}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.skipRow}>
        <PrimaryButton label="Skip" onPress={skip} />
      </View>
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
  skipRow: {
    marginTop: spacing.lg,
  },
});
