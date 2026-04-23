import type { TextbookBusinessArea } from '@/features/textbook/model/textbook-business-areas'
import type { TextbookEducationTarget } from '@/features/textbook/model/textbook-education-targets'

export type TextbookUseStatus = 'ALL' | 'USED' | 'UNUSED'

export type TextbookEducationStageKey =
  | 'kindergarten'
  | 'elementary'
  | 'middle'
  | 'high'
  | 'university'

export type TextbookEducationStage = {
  key: TextbookEducationStageKey
  label: string
  selected: boolean
  grades?: Array<{
    label: string
    selected: boolean
  }>
}

export type TextbookRow = {
  id: string
  businessArea: TextbookBusinessArea
  educationTarget: TextbookEducationTarget
  grade: string
  textbookName: string
  textbookNameEn: string
  educationStages: TextbookEducationStage[]
  useStatus: Exclude<TextbookUseStatus, 'ALL'>
  registrant: string
  registeredAt: string
}

export type TextbookCreateInput = {
  useStatus: Exclude<TextbookUseStatus, 'ALL'>
  textbookName: string
  textbookNameEn?: string
  businessArea: TextbookBusinessArea
  educationTarget: TextbookEducationTarget
  grade: string
  educationStages?: TextbookEducationStage[]
}
