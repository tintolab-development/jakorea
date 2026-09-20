import type { DigitalLiteracyProgramId } from '../model/types'

export const EDUCATION_DIGITAL_LITERACY_PATH = '/education/digital-literacy'

export const EDUCATION_DIGITAL_LITERACY_HERO = {
  label: '디지털 리터러시 Digital Literacy',
  titleLines: [
    '과학 기술을 기반으로 지식과 정보를 습득하는 방법을 익히고,',
    '디지털 플랫폼을 통해 문제를 해결할 수 있도록 지원합니다.',
  ],
} as const

export const EDUCATION_DIGITAL_LITERACY_TAB_ITEMS: {
  key: DigitalLiteracyProgramId
  label: string
}[] = [
  { key: 'ai-literacy', label: 'AI 리터러시 교육' },
  { key: 'sw-ai', label: 'SW·AI 역량강화 교육' },
]

export const DEFAULT_EDUCATION_DIGITAL_LITERACY_TAB: DigitalLiteracyProgramId = 'ai-literacy'
