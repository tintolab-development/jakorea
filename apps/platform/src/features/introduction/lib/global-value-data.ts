export type GlobalValueItem = {
  id: string
  number: string
  englishTitleLines: readonly string[]
  koreanTitle: string
  iconUrl: string
}

export const GLOBAL_VALUE_SECTION_TITLE = 'JA Global Value'

/** Desktop accordion open/close — Hero Motion과 동일 계열 */
export const GLOBAL_VALUE_MOTION_MS = 400
