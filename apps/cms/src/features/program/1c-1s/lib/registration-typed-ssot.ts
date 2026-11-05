/**
 * 1사1교 등록·상세 정본 규칙.
 * overlay store / overlay-first merge 는 입력 정본이 아니다.
 */

export const COMPANY_SCHOOL_TYPED_SSOT = {
  create: 'RHF → CompanySchoolRegistrationCanonical → Program / API mapper',
  get: 'API response → mapCompanySchoolDetailToProgram → hydrateCompanySchoolDetailFromGet. overlay 는 import/sidecar/wire',
  patch: 'GET typed Program + 상세 RHF Typed Draft → buildCompanySchoolDetailTypedSave → wire serializer. overlay store 는 단락 UI adapter만',
  draft: 'typed canonical snapshot → versioned local draft (settingsJson)',
  preview: 'typed draft 또는 GET view model',
  recruitmentsRowPriority:
    'GET recruitments[] 가 있으면 모집기간·운영기간·문의처·면접은 행 정본',
  apiWire:
    'serviceDetailJson.registration.overlay 는 BE 호환 직렬화만. FE 메모리 정본이 아님',
} as const

export const COMPANY_SCHOOL_UNMAPPED_FIELDS = [
  'economyRegistration.kpi.volunteer',
  'economyRegistration.kpi.educationProgress.*',
  'economyRegistration.educationScheduleSettings.scheduleLines',
  'economyRegistration.educationScheduleSettings.singleDateIso',
  'application.instructor.*',
  'recruit.individual.*',
  'recruit.volunteer.*',
] as const
