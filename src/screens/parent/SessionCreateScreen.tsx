import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, spacing, radii, inkShadow } from '../../theme/tokens';
import type { Player } from '../../lib/protocol';

interface Props {
  code?: string;
  players?: Player[];
  error?: string | null;
  onStart?: () => void;
}

export function SessionCreateScreen({ code = '', players = [], error, onStart }: Props) {
  const hasSession = code.length > 0;

  return (
    <View style={styles.screen}>
      <Text style={styles.wordmark}>Gothem Cité</Text>
      <Text style={styles.tagline}>Mission control</Text>

      {!hasSession && (
        <View style={styles.form}>
          <ActivityIndicator color={colors.signal} />
          <Text style={styles.hint}>Opening a session...</Text>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      )}

      {hasSession && (
        <View style={styles.form}>
          <Text style={styles.label}>Have heroes join with this code</Text>
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>{code}</Text>
          </View>

          <Text style={styles.subheading}>On the roster ({players.length})</Text>
          {players.length === 0 ? (
            <Text style={styles.hint}>Waiting for heroes to join...</Text>
          ) : (
            players.map((player) => (
              <Text key={player.id} style={styles.playerRow}>
                - {player.name}
              </Text>
            ))
          )}

          <View style={styles.ctaRow}>
            <PrimaryButton label="Start the briefing" onPress={onStart ?? (() => {})} disabled={!onStart || players.length === 0} />
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  wordmark: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 48,
    color: colors.signal,
    letterSpacing: 1,
    textShadowColor: colors.inkLine,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  tagline: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: colors.textOnInk,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: colors.textOnInk,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  ctaRow: {
    marginTop: spacing.lg,
  },
  hint: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: 13,
  },
  error: {
    fontFamily: 'Nunito_700Bold',
    color: colors.alarm,
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: 13,
  },
  subheading: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textOnInk,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  playerRow: {
    fontFamily: 'Nunito_400Regular',
    color: colors.textOnInk,
    fontSize: 16,
  },
  codeBadge: {
    backgroundColor: colors.panel,
    borderWidth: 3,
    borderColor: colors.inkLine,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...inkShadow(3),
  },
  codeBadgeText: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 28,
    color: colors.signal,
    letterSpacing: 4,
  },
});
