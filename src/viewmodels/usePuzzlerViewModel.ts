import { useEffect, useRef, useState } from 'react';
import {
  WORD_LENGTH,
  DURATION_MS,
  TICK_MS,
  MAX_HINTS,
  pickRandomAnswer,
  isValidGuess,
  scoreGuess,
  getGameStatus,
  getKeyboardColors,
  findHintIndex,
  type Guess,
  type GameStatus,
} from '../screens/child/puzzler/logic';

interface Options {
  //called when the game ends, sends mission_result to the server
  onFinish?: (success: boolean) => void;
}

export function usePuzzlerViewModel({ onFinish }: Options = {}) {
  //passing the function, not calling it, so the word is only picked once
  const [answer, setAnswer] = useState(pickRandomAnswer);
  const reportedResultRef = useRef(false);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [errorText, setErrorText] = useState('');
  const [started, setStarted] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(DURATION_MS);
  const [hintIndexes, setHintIndexes] = useState<number[]>([]);

  //derived from guesses and the timer so they're never out of sync, ready until start is pressed
  const status: GameStatus = started ? getGameStatus(guesses, timeLeftMs) : 'ready';
  const keyboardColors = getKeyboardColors(guesses);
  const nextHintIndex = findHintIndex(guesses, hintIndexes);

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  //reports the result once, win or lose from a guess or the timer
  useEffect(() => {
    if ((status !== 'won' && status !== 'lost') || reportedResultRef.current) return;
    reportedResultRef.current = true;
    onFinishRef.current?.(status === 'won');
  }, [status]);

  //countdown like the fire game's loop, only runs while playing
  useEffect(() => {
    if (status !== 'playing') return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = now - last;
      last = now;
      setTimeLeftMs((t) => Math.max(0, t - dt));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [status]);

  //starts the game, or restarts with a new word after a win or a loss
  function start() {
    if (status === 'playing') return;
    if (status !== 'ready') setAnswer(pickRandomAnswer());
    reportedResultRef.current = false;
    setGuesses([]);
    setCurrentGuess('');
    setErrorText('');
    setTimeLeftMs(DURATION_MS);
    setHintIndexes([]);
    setStarted(true);
  }

  //adds a letter if still playing and the guess isn't full
  function addLetter(letter: string) {
    if (status !== 'playing' || currentGuess.length >= WORD_LENGTH) return;
    setErrorText('');
    setCurrentGuess(currentGuess + letter.toUpperCase());
  }

  //removes the last letter if still playing
  function deleteLetter() {
    if (status !== 'playing') return;
    setErrorText('');
    setCurrentGuess(currentGuess.slice(0, -1));
  }

  //submits the guess if still playing and valid
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

    setGuesses([...guesses, { word: currentGuess, result: scoreGuess(currentGuess, answer) }]);
    setCurrentGuess('');
  }

  //reveals the next letter that hasn't been found
  function revealHint() {
    if (status !== 'playing' || hintIndexes.length >= MAX_HINTS || nextHintIndex === null) return;
    setHintIndexes([...hintIndexes, nextHintIndex]);
  }

  return {
    answer,
    guesses,
    currentGuess,
    status,
    errorText,
    keyboardColors,
    timeLeftMs,
    //letters given by hints, null where nothing was revealed
    hintLetters: Array.from({ length: WORD_LENGTH }, (_, i) => (hintIndexes.includes(i) ? answer[i] : null)),
    hintsLeft: MAX_HINTS - hintIndexes.length,
    canHint: status === 'playing' && hintIndexes.length < MAX_HINTS && nextHintIndex !== null,
    start,
    revealHint,
    addLetter,
    deleteLetter,
    submitGuess,
  };
}