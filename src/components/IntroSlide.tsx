import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fonts } from '../theme/tokens';

interface Props {
  heading: string;
  body: string;
}

// Placeholder "slide": a plain rectangle standing in for the real
// illustration Phase 4 will add, plus the slide's heading/body text.
export function IntroSlide({ heading, body }: Props) {
  return (
    <View style={styles.container}>
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
  heading: {
    fontFamily: fonts.titles,
    fontSize: 26,
    color: colors.signal,
    textAlign: 'center',
    letterSpacing: 0.5,
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
