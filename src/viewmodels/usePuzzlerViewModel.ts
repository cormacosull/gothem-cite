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
  // Called when the game ends (will send mission_result to the server)
  onFinish?: (success: boolean) => void;
}

export function usePuzzlerViewModel({ onFinish }: Options = {}) {
  // Passing the function (not calling it) so the word is picked only once per game
  const [answer] = useState(pickRandomAnswer);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [errorText, setErrorText] = useState('');

  // Derived from guesses, so they're never out of sync
  const status = getGameStatus(guesses);
  const keyboardColors = getKeyboardColors(guesses);

  // Adds a letter to the current guess if the game is still playing and the guess isn't full
  function addLetter(letter: string) {
    if (status !== 'playing' || currentGuess.length >= WORD_LENGTH) return;
    setErrorText('');
    setCurrentGuess(currentGuess + letter.toUpperCase());
  }

  // Removes the last letter from the current guess if the game is still playing
  function deleteLetter() {
    if (status !== 'playing') return;
    setErrorText('');
    setCurrentGuess(currentGuess.slice(0, -1));
  }

  // Submits the current guess if the game is still playing and the guess is valid
  function submitGuess() {
    if (status !== 'playing') return;
    if (currentGuess.length < WORD_LENGTH) {
      setErrorText('Too short');
      return;
    }
    if (!isValidGuess(currentGuess)) {
      setErrorText('Word not found');
      return;
    }

    const newGuesses = [...guesses, { word: currentGuess, result: scoreGuess(currentGuess, answer) }];
    setGuesses(newGuesses);
    setCurrentGuess('');

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