/** Platform layout breakpoints — keep in sync with shared/styles/breakpoints.css and tokens.css */
export const platformBreakpoints = {
  layoutMinWidth: 375,
  belowPcMax: 1079,
  pcMin: 1080,
  headerFullMin: 1360,
  wideShellMin: 1600,
} as const

export const platformMediaQueries = {
  belowPc: `(max-width: ${platformBreakpoints.belowPcMax}px)`,
  pcUp: `(min-width: ${platformBreakpoints.pcMin}px)`,
  pcCompact: `(min-width: ${platformBreakpoints.pcMin}px) and (max-width: ${platformBreakpoints.headerFullMin - 1}px)`,
  headerFullUp: `(min-width: ${platformBreakpoints.headerFullMin}px)`,
  wideShellUp: `(min-width: ${platformBreakpoints.wideShellMin}px)`,
} as const

export type PlatformBreakpointKey = keyof typeof platformBreakpoints
