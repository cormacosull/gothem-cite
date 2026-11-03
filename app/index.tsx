import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { colors, spacing, fonts } from '../src/theme/tokens';

export default function RoleSelectScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.wordmark}>Gothem Cité</Text>
      <Text style={styles.tagline}>Who's on this device?</Text>

      <View style={styles.buttons}>
        <PrimaryButton label="Mission control" onPress={() => router.push('/parent')} />
        <View style={{ height: spacing.md }} />
        <PrimaryButton label="I'm a hero" onPress={() => router.push('/child/puzzler')} />
      </View>
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
    fontFamily: fonts.titles,
    fontSize: 48,
    color: colors.signal,
    letterSpacing: 1,
    textShadowColor: colors.inkLine,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  tagline: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textOnInk,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  buttons: {
    width: '100%',
    maxWidth: 280,
  },
});