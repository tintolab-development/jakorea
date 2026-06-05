export type SurveyEmptyCopy = {
  title: string
  description: string
  secondaryDescription?: string
  registerButton: string
}

export type SurveyNoResponseCopy = {
  title?: string
  description: string
  deleteButton: string
  previewButton: string
}

export type SurveyActionLabels = {
  share: string
  add?: string
  download: string
  preview: string
}

export const GENERAL_SURVEY_POLL_EMPTY_COPY = {
  title: '아직 등록된 설문조사가 없습니다.',
  description: '설문조사 등록 버튼을 눌러 설문 내용을 추가해 주세요.',
  registerButton: '설문조사 등록',
} as const satisfies SurveyEmptyCopy

export const GENERAL_SURVEY_POLL_NO_RESPONSE_COPY = {
  title: '해당 설문조사는 아직 진행 전입니다.',
  description: '설문 진행 이후에 확인해 주세요.',
  deleteButton: '설문조사 삭제',
  previewButton: '설문 양식 보기',
} as const satisfies SurveyNoResponseCopy

export const GENERAL_SURVEY_POLL_ACTION_LABELS = {
  share: '설문조사 공유',
  add: '설문조사 추가',
  download: '설문조사 결과 다운로드',
  preview: '설문 양식 보기',
} as const satisfies SurveyActionLabels

export const GENERAL_SATISFACTION_EMPTY_COPY = {
  title: '아직 등록된 만족도조사가 없습니다.',
  description: '만족도조사 등록 버튼을 눌러 설문 내용을 추가해 주세요.',
  secondaryDescription: '만족도조사 등록 시 해당 프로그램 참여 대상에게 동일하게 노출됩니다.',
  registerButton: '만족도조사 등록',
} as const satisfies SurveyEmptyCopy

export const GENERAL_SATISFACTION_NO_RESPONSE_COPY = {
  description: '설문 진행 이후에 확인해 주세요.',
  deleteButton: '만족도조사 삭제',
  previewButton: '설문 양식 보기',
} as const satisfies SurveyNoResponseCopy

export const GENERAL_SATISFACTION_ACTION_LABELS = {
  share: '만족도조사 공유',
  download: '만족도조사 결과 다운로드',
  preview: '설문 양식 보기',
} as const satisfies SurveyActionLabels
