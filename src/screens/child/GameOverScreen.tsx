import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fonts } from '../../theme/tokens';

interface Props {
  result: 'won' | 'lost';
  cityHealth: number;
}

// End of the whole game, shown on every hero's device at the same time.
export function GameOverScreen({ result, cityHealth }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.heading, result === 'lost' && styles.headingLost]}>
        {result === 'won' ? 'Gothem is saved!' : 'Gothem has fallen…'}
      </Text>
      <Text style={styles.body}>
        {result === 'won'
          ? `The team kept the city at ${Math.round(cityHealth)}%. WE GOTHEM!!!`
          : `The city can't reach 75% anymore. The villains win this time.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  heading: {
    fontFamily: fonts.bodyBold,
    fontSize: 36,
    color: colors.signal,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headingLost: {
    color: colors.alarm,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textOnInk,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});