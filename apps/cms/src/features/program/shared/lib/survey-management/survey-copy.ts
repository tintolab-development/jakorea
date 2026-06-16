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

export type LectureEvalEmptyCopy = {
  title: string
  description: string
  registerButton: string
}

export type LectureEvalPreStartCopy = {
  title: string
  description: string
  previewButton: string
}

export type LectureEvalSubmittedCopy = {
  title: string
  description: string
  editButton: string
}

export type LectureEvalActionLabels = {
  submit: string
  download: string
}

export type SurveyResultsDownloadModalCopy = {
  title: string
  description: string
  excelLabel: string
  pdfLabel: string
  cancelButton: string
  downloadButton: string
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

/** 설문조사 공유 링크 복사 후 토스트 — 문장 단위 개행 */
export const GENERAL_SURVEY_POLL_SHARE_TOAST_COPY = {
  line1: '설문 참여 링크가 복사되었습니다.',
  line2: '참여 대상에게 복사된 링크를 공유해 주세요.',
} as const

export const GENERAL_SURVEY_POLL_DOWNLOAD_MODAL_COPY = {
  title: '설문조사 결과 다운로드',
  description: '다운로드할 파일 형식을 선택해 주세요.',
  excelLabel: '엑셀',
  pdfLabel: 'PDF',
  cancelButton: '취소',
  downloadButton: '다운로드',
} as const

export const GENERAL_SATISFACTION_EMPTY_COPY = {
  title: '아직 등록된 만족도조사가 없습니다.',
  description: '만족도조사 등록 버튼을 눌러 설문 내용을 추가해 주세요.',
  secondaryDescription: '만족도조사 등록 시 해당 프로그램 참여 대상에게 동일하게 노출됩니다.',
  registerButton: '만족도조사 등록',
} as const satisfies SurveyEmptyCopy

export const GENERAL_STUDENT_SATISFACTION_EMPTY_COPY = {
  title: '아직 등록된 만족도조사가 없습니다.',
  description: '만족도조사 등록 버튼을 눌러 설문 내용을 추가해 주세요.',
  secondaryDescription:
    '링크 공유하여 비회원(학생) 대상으로 진행합니다. 기관 구분 없이 하나의 폼으로 진행됩니다.',
  registerButton: '만족도조사 등록',
} as const satisfies SurveyEmptyCopy

export const GENERAL_TEACHER_SATISFACTION_EMPTY_COPY = {
  title: '아직 등록된 교사 만족도조사가 없습니다.',
  description: '교사 만족도조사 등록 버튼을 눌러 설문 내용을 추가해 주세요.',
  secondaryDescription: '등록 시 해당 프로그램 참여 교사에게 동일하게 노출됩니다.',
  registerButton: '교사 만족도조사 등록',
} as const satisfies SurveyEmptyCopy

export const GENERAL_SATISFACTION_NO_RESPONSE_COPY = {
  description: '설문 진행 이후에 확인해 주세요.',
  deleteButton: '만족도조사 삭제',
  previewButton: '설문 양식 보기',
} as const satisfies SurveyNoResponseCopy

/** 만족도조사 공유 링크 복사 후 토스트 */
export const GENERAL_SATISFACTION_SHARE_TOAST_COPY = {
  line1: '만족도조사 참여 링크가 복사되었습니다.',
  line2: '참여 대상에게 복사된 링크를 공유해 주세요.',
} as const

export const GENERAL_SATISFACTION_ACTION_LABELS = {
  share: '만족도조사 공유',
  download: '만족도조사 결과 다운로드',
  preview: '설문 양식 보기',
} as const satisfies SurveyActionLabels

export const GENERAL_STUDENT_SATISFACTION_ACTION_LABELS = {
  share: '학생 만족도조사 공유',
  download: '학생 만족도조사 결과 다운로드',
  preview: '설문 양식 보기',
} as const satisfies SurveyActionLabels

export const GENERAL_TEACHER_SATISFACTION_ACTION_LABELS = {
  share: '교사 만족도조사 공유',
  download: '교사 만족도조사 결과 다운로드',
  preview: '설문 양식 보기',
} as const satisfies SurveyActionLabels

export const GENERAL_LECTURE_EVAL_EMPTY_COPY = {
  title: '아직 등록된 강의 평가가 없습니다.',
  description: '강의평가 등록 버튼을 눌러 설문 내용을 추가해 주세요.',
  registerButton: '강의평가 등록',
} as const satisfies LectureEvalEmptyCopy

export const GENERAL_LECTURE_EVAL_PRE_START_COPY = {
  title: '강의평가는 아직 진행 전입니다.',
  description: '프로그램 종료 이후 설문이 진행됩니다. 설문 진행 이후에 확인해 주세요.',
  previewButton: '설문 양식 보기',
} as const satisfies LectureEvalPreStartCopy

export const GENERAL_LECTURE_EVAL_SUBMITTED_COPY = {
  title: '강의평가 답변이 완료 되었습니다.',
  description:
    '결과는 결과 탭에서 확인해주세요. 답변은 설문 기한 종료 전까지 수정 가능합니다.',
  editButton: '답변 수정하기',
} as const satisfies LectureEvalSubmittedCopy

export const GENERAL_LECTURE_EVAL_ACTION_LABELS = {
  submit: '강의평가 제출하기',
  download: '강의 평가 결과 다운로드',
} as const satisfies LectureEvalActionLabels

export const GENERAL_LECTURE_EVAL_INCOMPLETE_MODAL_COPY = {
  title: '강의평가 미완료 안내',
  description:
    '아직 강의 평가가 종료되지 않았습니다.\n설문이 종료된 이후 다시 확인해 주세요.',
  confirmButton: '확인',
} as const

export const GENERAL_LECTURE_EVAL_REGISTER_MODAL_COPY = {
  title: '신규 강의평가 등록',
  description: '강의평가를 등록하시겠습니까?\n등록 시 해당 프로그램에 강의평가 설문이 노출됩니다.',
  cancelButton: '취소',
  confirmButton: '신규 등록',
} as const

export const GENERAL_LECTURE_EVAL_DOWNLOAD_MODAL_COPY = {
  title: '강의 평가 결과 다운로드',
  description: '다운로드할 파일 형식을 선택해 주세요.',
  excelLabel: '엑셀',
  pdfLabel: 'PDF',
  cancelButton: '취소',
  downloadButton: '다운로드',
} as const satisfies SurveyResultsDownloadModalCopy
