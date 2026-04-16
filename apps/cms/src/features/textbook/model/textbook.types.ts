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
  businessArea: string
  educationTarget: string
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
  businessArea: string
  educationTarget: string
  grade: string
  educationStages?: TextbookEducationStage[]
}
