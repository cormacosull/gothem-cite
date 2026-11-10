import answersData from './wordles.json'
import allowedData from './nonwordles.json'

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export const DURATION_MS = 120_000; // 2 minutes to crack the code
export const TICK_MS = 250; // countdown refresh
export const MAX_HINTS = 2;

export type LetterValue = 'correct' | 'present' | 'absent';

export interface Guess {
  word: string;
  result: LetterValue[];
}

export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

function normalize(word: string): string {
  return word.trim().toUpperCase();
}


const ANSWERS: string[] = answersData
  //normalize everything to uppercase for comparison
  .map(normalize)
  .filter((word) => word.length === WORD_LENGTH);

const VALID_GUESSES = new Set<string>([
  //all answers are valid guesses
  ...ANSWERS,
  ...allowedData.map(normalize),
]);

//picks a random word from the answer list
export function pickRandomAnswer(): string {
  const index = Math.floor(Math.random() * ANSWERS.length);
  return ANSWERS[index];
}

//true if the guess is a valid word
export function isValidGuess(guess: string): boolean {
  const word = normalize(guess);
  return word.length === WORD_LENGTH && VALID_GUESSES.has(word);
}

//scores each letter as correct, present or absent
export function scoreGuess(guess: string, answer: string): LetterValue[] {
  const guessLetters = normalize(guess).split('');
  const answerLetters = normalize(answer).split('');
  const result: LetterValue[] = Array(WORD_LENGTH).fill('absent');

  //answer letters not matched exactly
  const leftover: Record<string, number> = {};

  //right letter, right spot
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      result[i] = 'correct';
    } else {
      const letter = answerLetters[i];
      leftover[letter] = (leftover[letter] ?? 0) + 1;
    }
  }

  //right letter, wrong spot
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    const letter = guessLetters[i];
    if ((leftover[letter] ?? 0) > 0) {
      result[i] = 'present';
      leftover[letter] -= 1;
    }
  }

  return result;
}


//true if every letter is correct
export function isAnswer(result: LetterValue[]): boolean {
  return result.every((r) => r === 'correct');
}

//game status from the guesses made and time left
export function getGameStatus(guesses: Guess[], timeLeftMs: number): GameStatus {
  const last = guesses[guesses.length - 1];
  if (last && isAnswer(last.result)) return 'won';
  if (guesses.length >= MAX_GUESSES || timeLeftMs <= 0) return 'lost';
  return 'playing';
}

//best known color for each letter typed so far
const RANK: Record<LetterValue, number> = { absent: 0, present: 1, correct: 2 };
export function getKeyboardColors(guesses: Guess[]): Record<string, LetterValue> {
  const colors: Record<string, LetterValue> = {};
  for (const { word, result } of guesses) {
    word.split('').forEach((letter, i) => {
      const current = colors[letter];
      if (!current || RANK[result[i]] > RANK[current]) {
        colors[letter] = result[i];
      }
    });
  }
  return colors;
}

//next letter position not yet found by a green tile or a hint, null if all are known
export function findHintIndex(guesses: Guess[], hintIndexes: number[]): number | null {
  for (let i = 0; i < WORD_LENGTH; i++) {
    const found = guesses.some((g) => g.result[i] === 'correct');
    if (!found && !hintIndexes.includes(i)) return i;
  }
  return null;
}

