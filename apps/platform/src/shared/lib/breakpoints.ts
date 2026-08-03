/** Platform layout breakpoints — keep in sync with shared/styles/breakpoints.css and tokens.css */
export const platformBreakpoints = {
  layoutMinWidth: 375,
  /** Mobile · ~1079 */
  belowPcMax: 1079,
  /** PC compact · 1080~1599 (starts at) */
  pcMin: 1080,
  /** PC compact upper bound */
  pcCompactMax: 1599,
  /** PC full · 1600~ */
  pcFullMin: 1600,
} as const

export const platformMediaQueries = {
  /** Mobile · ~1079 */
  belowPc: `(max-width: ${platformBreakpoints.belowPcMax}px)`,
  /** PC compact + PC full · 1080~ */
  pcUp: `(min-width: ${platformBreakpoints.pcMin}px)`,
  /** PC compact only · 1080~1599 */
  pcCompact: `(min-width: ${platformBreakpoints.pcMin}px) and (max-width: ${platformBreakpoints.pcCompactMax}px)`,
  /** PC full · 1600~ */
  pcFullUp: `(min-width: ${platformBreakpoints.pcFullMin}px)`,
} as const

export type PlatformBreakpointKey = keyof typeof platformBreakpoints
