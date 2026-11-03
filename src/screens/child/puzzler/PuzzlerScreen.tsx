import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { scale } from 'react-native-size-matters';
import { usePuzzlerViewModel } from '../../../viewmodels/usePuzzlerViewModel';
import { WORD_LENGTH, MAX_GUESSES, type LetterValue } from './logic';
import { colors, spacing, radii, inkShadow, fonts } from '../../../theme/tokens';
import bomb from '../../../../assets/puzzler-bomb.png';

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

const OVERLAY_COPY = {
  ready: { title: 'Bomb alert!', button: 'START' },
  playing: { title: '', button: '' },
  won: { title: 'Bomb defused!', button: 'PLAY AGAIN' },
  lost: { title: 'BOOM!', button: 'TRY AGAIN' },
} as const;

function formatTime(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

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
  onFinish?: (success: boolean) => void;
  onContinue?: () => void;
}

export function PuzzlerScreen({ onFinish, onContinue }: Props = {}) {
  const {
    answer,
    guesses,
    currentGuess,
    status,
    errorText,
    keyboardColors,
    timeLeftMs,
    hintLetters,
    hintsLeft,
    canHint,
    start,
    revealHint,
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
      <Image source={bomb} style={styles.backgroundImage} resizeMode="cover" />
      <View style={styles.textInformation}>
        <Text style={styles.title}>The Puzzler</Text>
        <Text style={styles.subtitle}>Crack the 5-letter code to defuse the bomb</Text>
      </View>

      <View style={styles.hud}>
        <View style={styles.hudItem}>
          <Text style={styles.hudTitles}>Time</Text>
          <View style={styles.timer}>
            <Text style={styles.hudItemText}>{formatTime(timeLeftMs)}</Text>
          </View>
        </View>
        <View style={styles.hudItem}>
          <Text style={styles.hudTitles}>Hints</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!canHint}
            onPress={revealHint}
            style={({ pressed }) => [styles.hintButton, !canHint && styles.hintButtonDisabled, pressed && styles.hintButtonPressed]}
          >
            <Text style={styles.hudItemText}>{hintsLeft} left</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.board}>
        {rows.map((row, r) => (
          <View key={r} style={styles.row}>
            {Array.from({ length: WORD_LENGTH }, (_, i) => (
              <Tile key={i} letter={row.word[i]} result={row.result?.[i]} />
            ))}
          </View>
        ))}
      </View>

      {hintLetters.some((letter) => letter !== null) && (
        <Text style={styles.hintText}>Hint: {hintLetters.map((letter) => letter ?? '_').join(' ')}</Text>
      )}

      <View style={styles.messageArea}>
        {errorText !== '' && <Text style={styles.error}>{errorText}</Text>}
      </View>

      <View style={styles.keyboard}>
        {KEYBOARD_ROWS.map((keys, r) => (
          <View key={r} style={styles.keyRow}>
            {keys.map((key) => (
              <Key key={key} label={key} result={keyboardColors[key]} onPress={() => handleKey(key)} />
            ))}
          </View>
        ))}
      </View>

      {/*overlays / modals*/}
      {status !== 'playing' && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>{OVERLAY_COPY[status].title}</Text>
            <Text style={styles.overlayBody}>
              {status === 'ready' &&
                `Crack the ${WORD_LENGTH}-letter code in ${MAX_GUESSES} tries and ${formatTime(timeLeftMs)} to defuse the bomb. You get 2 hints.`}
              {status === 'won' &&
                `Victory, you cracked the code in ${guesses.length} tries!`}
              {status === 'lost' &&
                (timeLeftMs <= 0
                  ? `Time's up! The code was ${answer}.`
                  : `The code was ${answer}.`)}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={status === 'ready' || !onContinue ? start : onContinue}
              style={({ pressed }) => [styles.overlayButton, pressed && styles.overlayButtonPressed]}
            >
              <Text style={styles.overlayButtonText}>
                {status !== 'ready' && onContinue ? 'CONTINUE' : OVERLAY_COPY[status].button}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    fontFamily: fonts.titles,
    fontSize: scale(18),
    color: colors.signal,
    letterSpacing: 1,
    textShadowColor: colors.inkLine,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontFamily: fonts.bodyBold,
    fontSize: scale(6),
    color: colors.textOnInk,
    textAlign: 'center',
  },
  board: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 3,
    borderColor: colors.inkLine,
    backgroundColor: 'rgba(11, 18, 32, 0.8)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  textInformation: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    borderWidth: 3,
    borderColor: colors.inkLine,
    backgroundColor: 'rgba(11, 18, 32, 0.8)',
    ...inkShadow(3),
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
    width: "100%",
    height: "100%",
    textAlign: "center",
    textAlignVertical: "center",
    fontFamily: fonts.titles,
    fontSize: scale(12),
    color: colors.textOnInk,
  },
  messageArea: {
    minHeight: 32,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  error: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.alarm,
  },
  keyboard: {
    width: '100%',
    maxWidth: 500,
    marginBottom: 20
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
    fontFamily: fonts.bodyExtraBold,
    fontSize: scale(6),
    color: colors.inkLine,
  },
  keyTextSmall: {
    fontSize: scale(5),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 14, 32, 0.55)',
  },
  overlayCard: {
    maxWidth: '80%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 3,
    borderColor: colors.inkLine,
    backgroundColor: colors.panel,
    alignItems: 'center',
  },
  overlayTitle: {
    fontFamily: fonts.titles,
    fontSize: scale(12),
    letterSpacing: 1,
    color: colors.signal,
    textAlign: 'center',
  },
  overlayBody: {
    fontFamily: fonts.bodyBold,
    fontSize: scale(6),
    color: colors.textOnInk,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  overlayButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md * 2,
    borderRadius: 100,
    backgroundColor: colors.signal,
    borderWidth: 3,
    borderColor: colors.inkLine,
  },
  overlayButtonPressed: {
    opacity: 0.8,
  },
  overlayButtonText: {
    fontFamily: fonts.titles,
    fontSize: scale(8),
    letterSpacing: 1,
    color: colors.ink,
  },
    hud: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  hudItem: {
    alignItems: 'center',
  },
  hudTitles: {
    fontFamily: fonts.bodyBold,
    fontSize: scale(5),
    textAlign: 'center',
    color: colors.textOnInk,
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
  timer: {
    width: 90,
    height: 32,
    borderRadius: 7,
    backgroundColor: 'silver',
    justifyContent: 'center',
  },
  hudItemText: {
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontStyle: 'italic',
    fontSize: scale(7),
  },
  hintButton: {
    width: 90,
    height: 32,
    borderRadius: 7,
    backgroundColor: colors.signal,
    borderWidth: 2,
    borderColor: colors.inkLine,
    justifyContent: 'center',
  },
  hintButtonDisabled: {
    opacity: 0.4,
  },
  hintButtonPressed: {
    opacity: 0.8,
  },
  hintText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: scale(7),
    letterSpacing: 2,
    color: colors.signal,
  },
    backgroundImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
});