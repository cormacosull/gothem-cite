import { useState } from 'react';
import {
  WORD_LENGTH,
  pickRandomAnswer,
  isValidGuess,
  scoreGuess,
  getGameStatus,
  getKeyboardColors,
  type Guess,
} from '../screens/child/puzzler/logic';

interface Options {
  // Called once when the game ends. Later this will send mission_result.
  onFinish?: (success: boolean) => void;
}

export function usePuzzlerViewModel({ onFinish }: Options = {}) {
  // Passing the function (not calling it) so the word is picked only once
  const [answer] = useState(pickRandomAnswer);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [errorText, setErrorText] = useState('');

  // Derived from guesses, so they're never out of sync
  const status = getGameStatus(guesses);
  const keyboardColors = getKeyboardColors(guesses);

  function addLetter(letter: string) {
    if (status !== 'playing' || currentGuess.length >= WORD_LENGTH) return;
    setErrorText('');
    setCurrentGuess(currentGuess + letter.toUpperCase());
  }

  function deleteLetter() {
    if (status !== 'playing') return;
    setErrorText('');
    setCurrentGuess(currentGuess.slice(0, -1));
  }

  function submitGuess() {
    if (status !== 'playing') return;
    if (currentGuess.length < WORD_LENGTH) {
      setErrorText('Not enough letters');
      return;
    }
    if (!isValidGuess(currentGuess)) {
      setErrorText('Not in word list');
      return;
    }

    const newGuesses = [...guesses, { word: currentGuess, result: scoreGuess(currentGuess, answer) }];
    setGuesses(newGuesses);
    setCurrentGuess('');

    // `guesses` still holds the old list until the next render, so use newGuesses
    const newStatus = getGameStatus(newGuesses);
    if (newStatus !== 'playing') onFinish?.(newStatus === 'won');
  }

  return {
    answer,
    guesses,
    currentGuess,
    status,
    errorText,
    keyboardColors,
    addLetter,
    deleteLetter,
    submitGuess,
  };
}