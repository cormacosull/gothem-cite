import { View, Text, Pressable, StyleSheet } from 'react-native';
import { usePuzzlerViewModel } from '../../../viewmodels/usePuzzlerViewModel';
import { WORD_LENGTH, MAX_GUESSES, type LetterValue } from './logic';
import { colors, spacing, radii } from '../../../theme/tokens';
import { PrimaryButton } from '../../../components/PrimaryButton';


const RESULT_COLORS: Record<LetterValue, string> = {
  correct: colors.resolved,
  present: colors.signal,
  absent: '#3A4256',
};

const ENTER = 'ENTER';
const DELETE = '⌫';

const KEYBOARD_ROWS = [
  'QWERTYUIOP'.split(''),
  'ASDFGHJKL'.split(''),
  [ENTER, ...'ZXCVBNM'.split(''), DELETE],
];

// One square of the grid
function Tile({ letter, result }: { letter?: string; result?: LetterValue }) {
  const darkText = result === 'correct' || result === 'present';
  return (
    <View
      style={[
        styles.tile,
        !!letter && !result && styles.tileTyped,
        result && { backgroundColor: RESULT_COLORS[result] },
      ]}
    >
      <Text style={[styles.tileText, darkText && { color: colors.inkLine }]}>{letter ?? ''}</Text>
    </View>
  );
}

// One key of the on-screen keyboard
function Key({ label, result, onPress }: { label: string; result?: LetterValue; onPress: () => void }) {
  const isWide = label === ENTER || label === DELETE;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        isWide && styles.keyWide,
        result && { backgroundColor: RESULT_COLORS[result] },
        pressed && styles.keyPressed,
      ]}
    >
      <Text
        style={[
          styles.keyText,
          isWide && styles.keyTextSmall,
          result === 'absent' && { color: colors.textOnInk },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface Props {
  // Called once when the game ends
  onFinish?: (success: boolean) => void;
  // Called when the player dismisses the result screen
  onContinue?: () => void;
}

export function PuzzlerScreen({ onFinish, onContinue }: Props) {
  const {
    answer,
    guesses,
    currentGuess,
    status,
    errorText,
    keyboardColors,
    addLetter,
    deleteLetter,
    submitGuess,
  } = usePuzzlerViewModel({ onFinish });

  // Always 6 rows: submitted guesses, then the row being typed, then empty rows
  const rows = Array.from({ length: MAX_GUESSES }, (_, r) => {
    if (r < guesses.length) return guesses[r];
    if (r === guesses.length) return { word: currentGuess, result: undefined };
    return { word: '', result: undefined };
  });

  function handleKey(key: string) {
    if (key === ENTER) submitGuess();
    else if (key === DELETE) deleteLetter();
    else addLetter(key);
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>The Puzzler</Text>
      <Text style={styles.subtitle}>Crack the 5-letter code to defuse the bomb</Text>

      <View style={styles.board}>
        {rows.map((row, r) => (
          <View key={r} style={styles.row}>
            {Array.from({ length: WORD_LENGTH }, (_, i) => (
              <Tile key={i} letter={row.word[i]} result={row.result?.[i]} />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.messageArea}>
        {errorText !== '' && <Text style={styles.error}>{errorText}</Text>}
        {status === 'won' && <Text style={styles.win}>Bomb defused!</Text>}
        {status === 'lost' && <Text style={styles.lose}>BOOM! The code was {answer}</Text>}
      </View>

      {status === 'playing' ? (
        <View style={styles.keyboard}>
          {KEYBOARD_ROWS.map((keys, r) => (
            <View key={r} style={styles.keyRow}>
              {keys.map((key) => (
                <Key key={key} label={key} result={keyboardColors[key]} onPress={() => handleKey(key)} />
              ))}
            </View>
          ))}
        </View>
      ) : (
        onContinue && (
          <View style={styles.ctaRow}>
            <PrimaryButton label="Continue" onPress={onContinue} />
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 40,
    color: colors.signal,
    letterSpacing: 1,
    textShadowColor: colors.inkLine,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: colors.textOnInk,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  board: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tile: {
    width: 52,
    height: 52,
    margin: 3,
    backgroundColor: colors.panel,
    borderWidth: 3,
    borderColor: colors.inkLine,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTyped: {
    borderColor: colors.signal,
  },
  tileText: {
    fontFamily: 'Bangers_400Regular',
    fontSize: 28,
    color: colors.textOnInk,
  },
  messageArea: {
    minHeight: 32,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  error: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: colors.alarm,
  },
  win: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
    color: colors.resolved,
  },
  lose: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
    color: colors.alarm,
  },
  keyboard: {
    width: '100%',
    maxWidth: 500,
  },
  ctaRow: {
    marginTop: spacing.md,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  key: {
    flex: 1,
    height: 52,
    marginHorizontal: 3,
    backgroundColor: colors.textMuted,
    borderWidth: 2,
    borderColor: colors.inkLine,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyWide: {
    flex: 1.6,
  },
  keyPressed: {
    opacity: 0.6,
  },
  keyText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
    color: colors.inkLine,
  },
  keyTextSmall: {
    fontSize: 12,
  },
});