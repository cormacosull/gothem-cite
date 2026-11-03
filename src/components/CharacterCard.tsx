import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radii, inkShadow, fonts } from '../theme/tokens';
import type { CharacterOption } from '../lib/characters';

interface Props {
  character: CharacterOption;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

// Placeholder hero card: a plain colored rectangle + label, standing in for
// the real character art Phase 4 will add.
export function CharacterCard({ character, selected, disabled, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: character.color },
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !selected && styles.pressed,
      ]}
    >
      <Text style={styles.label}>{character.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    height: 120,
    borderWidth: 3,
    borderColor: colors.inkLine,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...inkShadow(3),
  },
  selected: {
    borderColor: colors.signal,
    borderWidth: 5,
  },
  disabled: {
    opacity: 0.3,
  },
  pressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOffset: { width: 1, height: 1 },
  },
  label: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.inkLine,
  },
});
