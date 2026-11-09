import { Pressable, Text, StyleSheet, GestureResponderEvent } from 'react-native';
import { colors, spacing, radii, inkShadow, fonts } from '../theme/tokens';

interface Props {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.signal,
    borderWidth: 3,
    borderColor: colors.inkLine,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    ...inkShadow(4),
  },
  pressed: {
    //pressed state pushes the button into its shadow
    transform: [{ translateX: 3 }, { translateY: 3 }],
    shadowOffset: { width: 1, height: 1 },
  },
  disabled: {
    backgroundColor: colors.signalDim,
    opacity: 0.7,
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 18,
    color: colors.inkLine,
    letterSpacing: 0.3,
  },
});
