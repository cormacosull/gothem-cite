import { View, StyleSheet } from 'react-native';
import { ChaseScreen } from '../../src/screens/child/chase/ChaseScreen';
import { colors, spacing } from '../../src/theme/tokens';

export default function ChaseRoute() {
  return (
    <View style={styles.screen}>
      <ChaseScreen />
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
});