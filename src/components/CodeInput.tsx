import { useRef } from 'react';
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { colors, spacing, radii, inkShadow } from '../theme/tokens';

const LENGTH = 4;

interface Props {
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
}

export function CodeInput({ value, onChange, editable = true }: Props) {
  const inputs = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '');

  function handleChangeDigit(text: string, index: number) {
    const clean = text.replace(/[^0-9]/g, '');
    if (!clean) {
      onChange(value.slice(0, index) + value.slice(index + 1));
      return;
    }
    const digit = clean[clean.length - 1];
    const next = (value.slice(0, index) + digit + value.slice(index + 1)).slice(0, LENGTH);
    onChange(next);
    if (index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handleKeyPress(e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  return (
    <View style={styles.row}>
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          style={styles.box}
          value={digit}
          onChangeText={(t) => handleChangeDigit(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          editable={editable}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: "center",
    gap: spacing.sm,
  },
  box: {
    width: 56,
    height: 64,
    backgroundColor: colors.paper,
    borderWidth: 3,
    borderColor: colors.inkLine,
    borderRadius: radii.md,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    color: colors.inkLine,
    ...inkShadow(3),
  },
});
