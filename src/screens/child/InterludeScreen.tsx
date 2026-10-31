import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii, inkShadow } from '../../theme/tokens';
import { VILLAINS } from '../../lib/villains';
import type { Mission } from '../../lib/protocol';

interface Props {
  cityHealth: number;
  // How much the city moved since this player's last mission started
  healthChange: number;
  // null once the player has played all of their missions
  nextMission: Mission | null;
  secondsLeft: number;
}

// Breather between two missions: how the city is doing, then a countdown
// to the next game.
export function InterludeScreen({ cityHealth, healthChange, nextMission, secondsLeft }: Props) {
  const villain = VILLAINS.find((v) => v.id === nextMission?.type);
  const change = Math.round(healthChange);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>City Integrity</Text>
      <View style={styles.healthBadge}>
        <Text style={styles.healthText}>{Math.round(cityHealth)}%</Text>
      </View>
      <Text style={[styles.change, change > 0 && styles.changeUp, change < 0 && styles.changeDown]}>
        {change > 0 ? `▲ Up ${change}%` : change < 0 ? `▼ Down ${-change}%` : 'No change'}
      </Text>

      {villain ? (
        <Text style={styles.body}>
          {`Next up: ${villain.name}, ${villain.crime}.\nYour next mission starts in ${secondsLeft}s…`}
        </Text>
      ) : (
        <Text style={styles.body}>All your missions are done! Waiting for the rest of the team…</Text>
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
  heading: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 26,
    color: colors.signal,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  healthBadge: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 3,
    borderColor: colors.inkLine,
    borderRadius: radii.md,
    backgroundColor: colors.panel,
    ...inkShadow(3),
  },
  healthText: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 48,
    color: colors.signal,
    letterSpacing: 1,
  },
  change: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
    color: colors.textOnInk,
    marginTop: spacing.md,
  },
  changeUp: {
    color: colors.resolved,
  },
  changeDown: {
    color: colors.alarm,
  },
  body: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textOnInk,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});