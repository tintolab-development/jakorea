/** Platform layout breakpoints — keep in sync with shared/styles/breakpoints.css and tokens.css */
export const platformBreakpoints = {
  layoutMinWidth: 375,
  mobileMax: 520,
  tabletMin: 521,
  tabletMax: 1079,
  pcMin: 1080,
  headerFullMin: 1360,
} as const

export const platformMediaQueries = {
  mobileOnly: `(max-width: ${platformBreakpoints.mobileMax}px)`,
  tabletUp: `(min-width: ${platformBreakpoints.tabletMin}px)`,
  tabletOnly: `(min-width: ${platformBreakpoints.tabletMin}px) and (max-width: ${platformBreakpoints.tabletMax}px)`,
  belowPc: `(max-width: ${platformBreakpoints.tabletMax}px)`,
  pcUp: `(min-width: ${platformBreakpoints.pcMin}px)`,
  pcCompact: `(min-width: ${platformBreakpoints.pcMin}px) and (max-width: ${platformBreakpoints.headerFullMin - 1}px)`,
  headerFullUp: `(min-width: ${platformBreakpoints.headerFullMin}px)`,
} as const

export type PlatformBreakpointKey = keyof typeof platformBreakpoints
