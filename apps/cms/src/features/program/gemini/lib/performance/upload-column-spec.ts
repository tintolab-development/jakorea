/** Gemini 실적관리 — 연수 보고서 업로드 엑셀 컬럼명 */
export const GEMINI_PERFORMANCE_UPLOAD_COLUMNS = {
  timestamp: '타임스탬프',
  instructorName: '강사명',
  assistantInstructorNames: '보조강사명',
  trainingFormat: '연수형태',
  contact: '연락처',
  email: '이메일 주소',
  school: '소속(학교)',
  paymentDestination: '강사비 지급처',
  trainingLocation: '연수장소',
  trainingDate: '교육일',
  trainingStartTime: '연수 시작 시간',
  trainingEndTime: '연수 종료 시간',
  classCount: '연수 차시',
  participantCount: '교육생 수',
  trainingPhoto: '연수 진행 사진',
  trainingMaterials: '연수 진행 교안',
  lectureEvaluation: '강의 평가',
  trainerSupportNote:
    'Gemini Academy Teacher Trainers 관련하여 지원이 필요한 부분이 있을 경우 자유롭게 작성해주세요.',
} as const

/** 필수 컬럼 — 헤더에 `*`가 붙은 항목 */
export const GEMINI_PERFORMANCE_REQUIRED_UPLOAD_HEADERS = [
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS.timestamp,
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS.instructorName,
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS.trainingFormat,
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS.contact,
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS.email,
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS.school,
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS.paymentDestination,
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS.trainingLocation,
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS.trainingDate,
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS.trainingStartTime,
  GEMINI_PERFORMANCE_UPLOAD_COLUMNS.trainingEndTime,
] as const

export function normalizeUploadHeader(raw: string): string {
  return raw.replace(/\*/g, '').trim()
}
