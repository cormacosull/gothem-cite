import { View, StyleSheet } from 'react-native';
import { PuzzlerScreen } from '../../src/screens/child/puzzler/PuzzlerScreen';
import { colors, spacing } from '../../src/theme/tokens';

export default function PuzzlerRoute() {
  return (
    <View style={styles.screen}>
      <PuzzlerScreen />
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
