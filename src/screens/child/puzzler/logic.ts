import answersData from './wordles.json'
import allowedData from './nonwordles.json'

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export type LetterValue = 'correct' | 'present' | 'absent';

export interface Guess {
  word: string;
  result: LetterValue[];
}

export type GameStatus = 'playing' | 'won' | 'lost';

function normalize(word: string): string {
  return word.trim().toUpperCase();
}


const ANSWERS: string[] = answersData
  // To compare every word in uppercase
  .map(normalize)                                   
  .filter((word) => word.length === WORD_LENGTH);

const VALID_GUESSES = new Set<string>([
  // all answers are valid guesses
  ...ANSWERS,                                       
  ...allowedData.map(normalize),
]);

// Returns a random word to guess from the list of possible answers
export function pickRandomAnswer(): string {
  const index = Math.floor(Math.random() * ANSWERS.length);
  return ANSWERS[index];
}

// Returns true if the guess is valid 
export function isValidGuess(guess: string): boolean {
  const word = normalize(guess);
  return word.length === WORD_LENGTH && VALID_GUESSES.has(word);
}


// Returns an array of LetterValue indicating whether each letter is correct, present or absent
export function scoreGuess(guess: string, answer: string): LetterValue[] {
  const guessLetters = normalize(guess).split('');
  const answerLetters = normalize(answer).split('');
  const result: LetterValue[] = Array(WORD_LENGTH).fill('absent');

  // Answer letters not matched exactly
  const leftover: Record<string, number> = {};

  // Right letters in the correct position
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      result[i] = 'correct';
    } else {
      const letter = answerLetters[i];
      leftover[letter] = (leftover[letter] ?? 0) + 1;
    }
  }

  // Right letter in the wrong position
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


// Returns true if the guess is correct
export function isAnswer(result: LetterValue[]): boolean {
  return result.every((r) => r === 'correct');
}

// Returns the current game status based on the guesses made
export function getGameStatus(guesses: Guess[]): GameStatus {
  const last = guesses[guesses.length - 1];
  if (last && isAnswer(last.result)) return 'won';
  if (guesses.length >= MAX_GUESSES) return 'lost';
  return 'playing';
}

// Returns a mapping of letters to their highest LetterValue based on the guesses made
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









