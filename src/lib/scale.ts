// Drop-in replacement for react-native-size-matters' `scale`/`verticalScale`/
// `moderateScale`, same formula and reference sizes (so existing styles tuned
// against it look the same) — but without the bug that breaks it on web.

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
