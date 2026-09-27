import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../src/theme/tokens';

export default function ParentDashboardRoute() {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Mission control dashboard — coming soon.</Text>
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
  text: {
    fontFamily: 'Nunito_700Bold',
    color: colors.textOnInk,
    fontSize: 16,
    textAlign: 'center',
  },
});
