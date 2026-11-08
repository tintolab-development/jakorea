import type {
  ProgramIntroFieldCode,
  ProgramIntroTabKey,
} from '@/entities/education-program-intro/model/types'

export const PROGRAM_INTRO_TABS: readonly {
  key: ProgramIntroTabKey
  fieldCode: ProgramIntroFieldCode
  label: string
}[] = [
  { key: 'career', fieldCode: 'CAREER_EMPLOYMENT', label: '진로·취업' },
  { key: 'economy', fieldCode: 'ECONOMICS_FINANCE', label: '경제·금융' },
  { key: 'entrepreneurship', fieldCode: 'ENTREPRENEURSHIP', label: '기업가정신' },
  { key: 'digital', fieldCode: 'DIGITAL_LITERACY', label: '디지털 리터러시' },
]

const TAB_BY_SLUG: Record<string, ProgramIntroTabKey> = {
  career: 'career',
  economy: 'economy',
  finance: 'economy',
  entrepreneurship: 'entrepreneurship',
  digital: 'digital',
  'digital-literacy': 'digital',
}

export function parseProgramIntroTab(raw: string | null): ProgramIntroTabKey {
  if (!raw) return 'career'
  return TAB_BY_SLUG[raw] ?? 'career'
}

export function fieldCodeForTab(tab: ProgramIntroTabKey): ProgramIntroFieldCode {
  const found = PROGRAM_INTRO_TABS.find(item => item.key === tab)
  return found?.fieldCode ?? 'CAREER_EMPLOYMENT'
}
