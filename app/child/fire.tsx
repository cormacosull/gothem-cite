import { View, StyleSheet } from 'react-native';
import { FireScreen } from '../../src/screens/child/fire/FireScreen';
import { colors, spacing } from '../../src/theme/tokens';

export default function FireRoute() {
  return (
    <View style={styles.screen}>
      <FireScreen />
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
