// Drop-in replacement for react-native-size-matters' `scale`/`verticalScale`/
// `moderateScale`, same formula and reference sizes (so existing styles tuned
// against it look the same) — but without the bug that breaks it on web.
//
// react-native-size-matters reads `Dimensions.get('window')` once at module
// import time and bakes the result into a closure forever. react-native-web's
// Dimensions module only measures the real window on its *first* `.get()`
// call ever (after that it just returns the same cached object until an
// actual browser `resize` event fires) — and if that first call happens
// before the DOM is ready to measure, every `scale()` call for the rest of
// the session returns 0. Confirmed live: computed fontSize/width/height on
// screens using `scale()` were all literally 0px/0px, collapsing the layout,
// while `window.innerWidth` read correctly at the same moment.
//
// Reading `window.innerWidth`/`innerHeight` directly on web sidesteps
// Dimensions' caching entirely — there's nothing to freeze. Native platforms
// don't have this failure mode, so they keep using Dimensions as normal.

import { Dimensions, Platform } from 'react-native';

const GUIDELINE_BASE_WIDTH = 350;
const GUIDELINE_BASE_HEIGHT = 680;

function windowSize(): { width: number; height: number } {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  return Dimensions.get('window');
}

function shortAndLongDimension(): [number, number] {
  const { width, height } = windowSize();
  return width < height ? [width, height] : [height, width];
}

export function scale(size: number): number {
  const [shortDimension] = shortAndLongDimension();
  return (shortDimension / GUIDELINE_BASE_WIDTH) * size;
}

export function verticalScale(size: number): number {
  const [, longDimension] = shortAndLongDimension();
  return (longDimension / GUIDELINE_BASE_HEIGHT) * size;
}

export function moderateScale(size: number, factor = 0.5): number {
  return size + (scale(size) - size) * factor;
}
