// Shared visual language for Gothem Cité: a night-city backdrop with one
// "bat-signal" gold accent, and hard-edged comic-panel outlines/shadows
// instead of soft blurred card shadows.

export const colors = {
  ink: '#0B1220', // night-sky backdrop
  inkLine: '#05070C', // hard outline stroke, comic ink
  panel: '#151F35', // panel fill, one step up from ink
  paper: '#F2E9D8', // comic-page cream, for inputs/light surfaces
  signal: '#FFC53D', // bat-signal gold, the one hero accent
  signalDim: '#8A6A1E', // pressed/disabled state of signal
  alarm: '#E6483C', // danger/error red
  textOnInk: '#F2E9D8',
  textMuted: '#8C93A6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 4,
  md: 8,
} as const;

// Comic-panel style: hard offset shadow instead of a soft blurred one.
export const inkShadow = (offset: number) => ({
  shadowColor: colors.inkLine,
  shadowOffset: { width: offset, height: offset },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: offset * 2,
});
