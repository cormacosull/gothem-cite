// ViewModel for the post-character-select intro sequence: a handful of
// lore slides (the villains, the team, the city meter, the mission types)
// that auto-advance, with the option to go back and forward, and can be skipped. 
// Owns the slide index and the advance timer; the View (IntroScreen) just 
// renders whatever slide this returns and calls `skip()` on user input.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Player } from '../lib/protocol';
import { VILLAINS } from '../lib/villains';

const SLIDE_DURATION_MS = 6000;

export interface IntroSlideContent {
  key: string;
  heading: string;
  body: string;
}

function formatPlayerNames(players: Player[]): string {
  const names = players.map((p) => p.name);
  if (names.length === 0) return 'the heroes of Gothem';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function buildSlides(players: Player[]): IntroSlideContent[] {
  const villainLines = VILLAINS.map((v) => `• ${v.name} — ${v.crime}`).join('\n');

  return [
    {
      key: 'fugitives',
      heading: 'Gothem Cité Under Siege',
      body: `Three fugitives have broken loose and chaos is spreading through the city:\n\n${villainLines}\n\nSomeone has to stop them.`,
    },
    {
      key: 'heroes',
      heading: 'Ratman Needs Backup',
      body: `Tonight, Ratman is counting on ${formatPlayerNames(players)} to answer the call.`,
    },
    {
      key: 'city-meter',
      heading: 'Keep Gothem Standing',
      body: "Every attack chips away at the city's strength. Watch the City Integrity meter on mission control's screen — it drains over time, drops further if a mission fails, and climbs back up every time your team succeeds.\n\nIf it hits zero before the crooks are stopped, Gothem falls.",
    },
    {
      key: 'threats',
      heading: 'Your Mission, Should You Accept It',
      body: "When an alarm goes off, you'll be dispatched to handle one of three kinds of trouble:\n\n🔥 Fire — put it out before it spreads\n🚓 Chase — catch the one who's running\n💣 Bomb — defuse it before time runs out\n\nSolve yours fast — the whole team is counting on it.",
    },
  ];
}

interface Options {
  players: Player[];
  // Called once the last slide's timer runs out, or Skip is pressed.
  onFinish: () => void;
}

export function useIntroViewModel({ players, onFinish }: Options) {
  const slides = useMemo(() => buildSlides(players), [players]);
  const [index, setIndex] = useState(0);

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  // Skip and "the last slide's timer ran out" are two separate paths to
  // the same finish — without this guard, pressing Skip doesn't stop the
  // still-running timer underneath it, which fires onFinish a second time
  // once it later reaches the end on its own.
  const finishedRef = useRef(false);
  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinishRef.current();
  }

  useEffect(() => {
    if (finishedRef.current) return;
    const timer = setTimeout(() => {
      if (index < slides.length - 1) {
        setIndex((i) => i + 1);
      } else {
        finish();
      }
    }, SLIDE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [index, slides.length]);

  function next() {
    if (index < slides.length - 1) setIndex((i) => i + 1);
  }

  function back() {
    if (index > 0) setIndex((i) => i - 1);
  }

  return {
    slide: slides[index],
    index,
    total: slides.length,
    isFirst: index === 0,
    isLast: index === slides.length - 1,
    next,
    back,
    skip: finish,
  };
}
