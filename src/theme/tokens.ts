//colors and styles: night city, one gold accent, hard comic outlines and shadows

export const colors = {
  ink: '#0B1220', //night sky backdrop
  inkLine: '#05070C', //hard outline
  panel: '#151F35', //panel fill
  paper: '#F2E9D8', //cream, for inputs/light surfaces
  signal: '#FFC53D', //main gold accent
  signalDim: '#8A6A1E', //pressed/disabled gold
  alarm: '#E6483C', //danger/error red
  resolved: "#69db7c",
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

//comic style hard shadow
export const inkShadow = (offset: number) => ({
  shadowColor: colors.inkLine,
  shadowOffset: { width: offset, height: offset },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: offset * 2,
});
