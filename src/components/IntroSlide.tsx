import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii, inkShadow } from '../theme/tokens';

interface Props {
  heading: string;
  body: string;
}

// Placeholder "slide": a plain rectangle standing in for the real
// illustration Phase 4 will add, plus the slide's heading/body text.
export function IntroSlide({ heading, body }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.artPlaceholder} />
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  artPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.panel,
    borderWidth: 3,
    borderColor: colors.inkLine,
    borderRadius: radii.md,
    ...inkShadow(3),
  },
  heading: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 26,
    color: colors.signal,
    marginTop: spacing.lg,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  body: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textOnInk,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
