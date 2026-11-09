//same as react-native-size-matters scale but works on web

import { Dimensions, Platform } from 'react-native';

const GUIDELINE_BASE_WIDTH = 350;

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
