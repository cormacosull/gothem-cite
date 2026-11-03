import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii, inkShadow, fonts } from '../../theme/tokens';


// Placeholder "holding" screen between the intro and an actual mission:
// nothing to do yet but wait. Stands in for whatever Phase 3's mission
// assignment eventually drives this screen to show/navigate to.
export function StandbyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.badge} />
      <Text style={styles.heading}>Standing By</Text>
      <Text style={styles.body}>
        Mission control is sizing up the situation. You'll be called into action the moment
        Gothem needs you.
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
  badge: {
    width: 96,
    height: 96,
    borderWidth: 3,
    borderColor: colors.inkLine,
    borderRadius: radii.md,
    backgroundColor: colors.panel,
    ...inkShadow(3),
  },
  heading: {
    fontFamily: fonts.titles,
    fontSize: 26,
    color: colors.signal,
    marginTop: spacing.lg,
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
