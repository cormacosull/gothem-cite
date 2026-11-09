import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/tokens';

interface Props {
  heading: string;
  body: string;
}

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
    fontFamily: 'Bangers_400Regular',
    fontSize: 26,
    color: colors.signal,
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
