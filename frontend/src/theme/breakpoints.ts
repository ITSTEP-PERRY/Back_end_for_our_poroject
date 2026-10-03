export const breakpoints = {
  mobile: 390,
  tablet: 768,
  desktop: 1200,
  wide: 1920,
} as const;

export type BreakpointKey = keyof typeof breakpoints;
