/**
 * 프로그램 상세 정보 수정 폼 전용 스키마·도메인 변환
 * - 비즈니스 규칙: 필수/선택 필드, 검증(Zod), Program ↔ 폼 값 변환
 * - programToDetailEditValues: Program → 폼 기본값 (정보 수정 시 기존 값 채움)
 * - detailEditValuesToProgramPatch: 폼 값 → 저장용 패치 (optional 필드는 existing fallback)
 *
 * ─── React Hook Form / Zod 연동 (풀페이지 수정 모드) ─────────────────────────
 * - 폼 값 타입: `programDetailEditSchemaBase` → `ProgramDetailEditFormValues` (`z.infer`)
 * - 검증: 기본 `programDetailEditSchema`, 참여자 정보 탭만 `programDetailInstitutionsEditSchema` (`use-program-detail-edit-form` 의 `schema` 옵션)
 * - 저장 시 검증: `use-program-detail-info-save.ts` → `form.trigger()` 가 이 스키마 기준으로 동작
 *
 * ─── 브랜치 병합 시 주의 (연동 깨짐 방지) ───────────────────────────────────
 * 1) 새 `Controller`/`register` 필드를 추가하면 반드시:
 *    - 아래 `programDetailEditSchema` 에 동일 키 추가
 *    - `programToDetailEditValues` 에 Program(또는 mock)에서의 매핑 추가
 *    - API/도메인에 내려야 하면 `detailEditValuesToProgramPatch` 와 `Program` 타입에도 필드 추가
 * 2) 스키마 키 이름을 바꾸면 모든 `name="..."` / `setValue` / `watch` 호출부를 함께 수정
 * 3) 임금(`wage*`)·KPI(`kpi*`) 등은 현재 스키마·폼에는 있으나 `detailEditValuesToProgramPatch` 미반영.
 *    백엔드 저장이 필요하면 패치 함수와 `Program` 모델을 확장할 것 (그 전까지는 UI 상태만 유지)
 */

import { z } from 'zod'

const roundStatusEnum = z.enum(['active', 'inactive', 'pending', 'completed', 'cancelled'])

const roundDeliveryTypeEnum = z.enum(['online', 'offline', 'hybrid'])

const programLifecycleStatusEnum = z.enum([
  'planned',
  'instructor_recruitment_planned',
  'volunteer_recruitment_planned',
  'participant_instructor_recruitment_planned',
  'recruiting_students',
  'recruiting_instructors',
  'recruiting_volunteers',
  'participant_instructor_recruiting',
  'education_in_progress',
  'matching_completed',
  'education_before_textbook',
  'education_after_textbook',
  'education_completed',
  'document_processing_completed',
  'participant_instructor_recruitment_completed',
])

const roundEditSchema = z.object({
  id: z.string(),
  programId: z.string(),
  roundNumber: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  capacity: z.number().min(0).optional(),
  classCount: z.number().optional(),
  status: roundStatusEnum,
  curriculum: z.string().optional(),
  deliveryType: roundDeliveryTypeEnum.optional(),
})

const programDetailEditSchemaBase = z.object({
  title: z.string().min(1, '프로그램명을 입력해주세요'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.enum(['school', 'individual']),
  targetLevel: z.enum(['elementary', 'middle', 'high', 'university', 'adult']).optional(),
  district: z.string().optional(),
  type: z.enum(['online', 'offline', 'hybrid']),
  lifecycleStatus: programLifecycleStatusEnum.optional(),
  /** 수강자·참여자 모집 기간(공통/참여자 정보 탭) */
  applicationStartDate: z.string().min(1, '참여자 모집 시작일을 선택해주세요'),
  applicationEndDate: z.string().min(1, '참여자 모집 종료일을 선택해주세요'),
  businessArea: z.string().optional(),
  sponsorId: z.string().min(1, '후원사를 선택해주세요'),
  managerName: z.string().min(1, '후원사 담당자를 입력해주세요'),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  oneLineIntroduction: z.string().optional(),
  keyVisualImage: z.string().optional(),
  posterImage: z.string().optional(),
  description: z.string().min(1, '프로그램 설명을 입력해주세요'),
  recruitmentGuide: z
    .string()
    .optional()
    .refine(v => v === undefined || (typeof v === 'string' && v.trim().length >= 1), '모집 안내를 입력해주세요'),
  learningSupportContent: z.string().min(1, '학습 지원 내용을 입력해주세요'),
  attachmentFileNames: z.array(z.string()).optional(),
  rounds: z.array(roundEditSchema),
  // 수강자 모집
  /** 결과 발표일 및 방법(공통 정보 수강자 모집 / 참여자 정보 참여자 모집) */
  resultAnnouncementDate: z.string().min(1, '결과 발표일을 선택해주세요'),
  resultAnnouncementMethod: z
    .string()
    .trim()
    .min(1, '결과 발표 방법을 입력해주세요'),
  studentListRequired: z.enum(['required', 'not_required']).optional(),
  // 강사 모집
  instructorCapacity: z.number().min(0).optional(),
  instructorApplicationStartDate: z.string().optional(),
  instructorApplicationEndDate: z.string().optional(),
  documentPassAnnouncementDate: z.string().optional(),
  documentPassAnnouncementMethod: z.string().optional(),
  interviewStartDate: z.string().optional(),
  interviewEndDate: z.string().optional(),
  interviewMethod: z.string().optional(),
  finalPassAnnouncementDate: z.string().optional(),
  finalPassAnnouncementMethod: z.string().optional(),
  instructorTarget: z.string().optional(),
  instructorTargetDetail: z.string().optional(),
  // 봉사자
  volunteerApplicationStartDate: z.string().optional(),
  volunteerApplicationEndDate: z.string().optional(),
  volunteerTarget: z.string().optional(),
  volunteerTargetDetail: z.string().optional(),
  applicationMethod: z
    .string()
    .optional()
    .refine(v => v === undefined || (typeof v === 'string' && v.trim().length >= 1), '지원 방법을 입력해주세요'),
  otherNotes: z
    .string()
    .optional()
    .refine(v => v === undefined || (typeof v === 'string' && v.trim().length >= 1), '기타사항을 입력해주세요'),
  additionalContentHtml: z.string().optional(),
  // 공통 정보
  mainTitle: z.string().optional(),
  teamDivision: z.string().optional(),
  educationProcess: z.string().optional(),
  ipOwned: z.string().optional(),
  courseDeliveredBy: z.enum(['JA', 'Jointly', 'Partner']).optional(),
  partnerInvolvement: z.boolean().optional(),
  ips: z.enum(['Inspire', 'Prepare', 'Succeed']).optional(),
  programCategory: z.string().optional(),
  programChannel: z.string().optional(),
  // 임금 정보
  wageType: z.string().optional(),
  wagePricingTimeUnit: z.string().optional(),
  /** 임금 책정 기준 — 단위 셀렉트(예: 시간) */
  wagePricingMeasureLabel: z.string().optional(),
  /** 임금 책정 기준 — 수치(예: 1) */
  wagePricingQuantity: z.number().min(0, '0 이상을 입력해주세요').optional(),
  /** 임금 책정 기준 — 기준(당) / 초과 / 이하 */
  wagePricingCompareMode: z.enum(['per', 'over', 'under']).optional(),
  wagePricingBase: z.string().optional(),
  wagePricingLongDistance: z.string().optional(),
  wagePaymentItems: z.string().optional(),
  wageDeductionItems: z.string().optional(),
  // KPI
  kpiFinalParticipants: z.number().min(0).optional(),
  kpiInstructorCount: z.number().min(0).optional(),
  kpiVolunteerCount: z.number().min(0).optional(),
  kpiFinalSchools: z.number().min(0).optional(),
  kpiFinalClasses: z.number().min(0).optional(),
})

/** 기본: 공통·강사·봉사 탭 등 — 모집 안내는 값이 있으면 공백만 불가 */
export const programDetailEditSchema = programDetailEditSchemaBase

/**
 * 참여자 정보(institutions) 탭 — 모집 안내·추가 내용(HTML)은 저장 시 필수 검증 제외
 * (추가 내용은 폼 필드가 아니며 스키마상 이미 optional)
 */
export const programDetailInstitutionsEditSchema = programDetailEditSchemaBase.extend({
  recruitmentGuide: z.string().optional(),
})

export type ProgramDetailEditFormValues = z.infer<typeof programDetailEditSchema>

/** Program → 폼 기본값 (날짜는 ISO 문자열) */
export function programToDetailEditValues(
  program: import('@/types/domain').Program
): ProgramDetailEditFormValues {
  type DateValue = string | Date
  const toStr = (d: DateValue | undefined): string =>
    d == null ? '' : typeof d === 'string' ? d : ((d as Date).toISOString?.() ?? String(d))
  return {
    title: program.title ?? '',
    startDate: toStr(program.startDate),
    endDate: toStr(program.endDate),
    category: program.category ?? 'school',
    targetLevel: program.targetLevel ?? undefined,
    district: program.district ?? undefined,
    type: program.type ?? 'offline',
    lifecycleStatus: program.lifecycleStatus ?? undefined,
    applicationStartDate: toStr(program.applicationStartDate),
    applicationEndDate: toStr(program.applicationEndDate),
    businessArea: program.businessArea ?? undefined,
    sponsorId: program.sponsorId ?? '',
    managerName: program.managerName ?? '',
    contactPhone: program.contactPhone ?? undefined,
    contactEmail: program.contactEmail ?? undefined,
    oneLineIntroduction: program.oneLineIntroduction ?? undefined,
    keyVisualImage: program.keyVisualImage ?? undefined,
    posterImage: program.posterImage ?? undefined,
    description: program.description ?? '',
    recruitmentGuide: program.recruitmentGuide?.trim() ? program.recruitmentGuide : undefined,
    learningSupportContent: program.learningSupportContent ?? '',
    attachmentFileNames: program.attachmentFileNames ?? [],
    resultAnnouncementDate: program.resultAnnouncementDate
      ? toStr(program.resultAnnouncementDate)
      : '',
    resultAnnouncementMethod: program.resultAnnouncementMethod ?? '',
    studentListRequired: program.studentListRequired ?? 'required',
    instructorCapacity: program.instructorCapacity ?? undefined,
    instructorApplicationStartDate: program.instructorApplicationStartDate
      ? toStr(program.instructorApplicationStartDate)
      : undefined,
    instructorApplicationEndDate: program.instructorApplicationEndDate
      ? toStr(program.instructorApplicationEndDate)
      : undefined,
    documentPassAnnouncementDate: program.documentPassAnnouncementDate
      ? toStr(program.documentPassAnnouncementDate)
      : undefined,
    documentPassAnnouncementMethod: program.documentPassAnnouncementMethod ?? undefined,
    interviewStartDate: program.interviewStartDate ? toStr(program.interviewStartDate) : undefined,
    interviewEndDate: program.interviewEndDate ? toStr(program.interviewEndDate) : undefined,
    interviewMethod: program.interviewMethod ?? undefined,
    finalPassAnnouncementDate: program.finalPassAnnouncementDate
      ? toStr(program.finalPassAnnouncementDate)
      : undefined,
    finalPassAnnouncementMethod: program.finalPassAnnouncementMethod ?? undefined,
    instructorTarget: program.instructorTarget ?? undefined,
    instructorTargetDetail: program.instructorTargetDetail ?? undefined,
    volunteerApplicationStartDate: program.volunteerApplicationStartDate
      ? toStr(program.volunteerApplicationStartDate)
      : undefined,
    volunteerApplicationEndDate: program.volunteerApplicationEndDate
      ? toStr(program.volunteerApplicationEndDate)
      : undefined,
    volunteerTarget: program.volunteerTarget ?? undefined,
    volunteerTargetDetail: program.volunteerTargetDetail ?? undefined,
    applicationMethod: program.applicationMethod?.trim() ? program.applicationMethod : undefined,
    otherNotes: program.otherNotes?.trim() ? program.otherNotes : undefined,
    additionalContentHtml: program.additionalContentHtml ?? undefined,
    rounds: (program.rounds ?? []).map(r => ({
      id: r.id,
      programId: r.programId,
      roundNumber: r.roundNumber,
      startDate: toStr(r.startDate),
      endDate: toStr(r.endDate),
      capacity: r.capacity,
      classCount: r.classCount,
      status: r.status,
      curriculum: r.curriculum ?? undefined,
      deliveryType: r.deliveryType ?? 'offline',
    })),
    mainTitle: program.mainTitle ?? undefined,
    teamDivision: program.teamDivision ?? undefined,
    educationProcess: program.educationProcess ?? undefined,
    ipOwned: program.ipOwned ?? undefined,
    courseDeliveredBy: program.courseDeliveredBy ?? undefined,
    partnerInvolvement: program.partnerInvolvement,
    ips: program.ips ?? undefined,
    programCategory: program.programCategory ?? undefined,
    programChannel: program.programChannel ?? undefined,
    wageType: undefined,
    wagePricingTimeUnit: undefined,
    wagePricingMeasureLabel: undefined,
    wagePricingQuantity: undefined,
    wagePricingCompareMode: undefined,
    wagePricingBase: undefined,
    wagePricingLongDistance: undefined,
    wagePaymentItems: undefined,
    wageDeductionItems: undefined,
    kpiFinalParticipants: undefined,
    kpiInstructorCount: undefined,
    kpiVolunteerCount: undefined,
    kpiFinalSchools: undefined,
    kpiFinalClasses: undefined,
  }
}

/**
 * 폼 값 → Program 패치 (저장 시 병합용)
 * `useProgramDetailInfoSave` 의 `triggerSave` 에서만 호출 — RHF `getValues()` 결과를 받음.
 * 병합: 새 폼 필드를 저장하려면 여기와 `@/types/domain` Program 정의를 함께 갱신.
 */
export function detailEditValuesToProgramPatch(
  values: ProgramDetailEditFormValues,
  existing: import('@/types/domain').Program
): Partial<import('@/types/domain').Program> {
  type ProgramRound = import('@/types/domain').ProgramRound
  return {
    title: values.title,
    startDate: values.startDate ?? existing.startDate,
    endDate: values.endDate ?? existing.endDate,
    category: values.category,
    targetLevel: values.targetLevel,
    district: values.district,
    type: values.type,
    lifecycleStatus: values.lifecycleStatus ?? existing.lifecycleStatus,
    applicationStartDate: values.applicationStartDate,
    applicationEndDate: values.applicationEndDate,
    businessArea: values.businessArea,
    sponsorId: values.sponsorId || existing.sponsorId,
    managerName: values.managerName,
    contactPhone: values.contactPhone,
    contactEmail: values.contactEmail,
    oneLineIntroduction: values.oneLineIntroduction,
    keyVisualImage: values.keyVisualImage,
    posterImage: values.posterImage,
    description: values.description,
    recruitmentGuide: values.recruitmentGuide,
    learningSupportContent: values.learningSupportContent,
    attachmentFileNames: values.attachmentFileNames,
    rounds: values.rounds as ProgramRound[],
    resultAnnouncementDate: values.resultAnnouncementDate ?? existing.resultAnnouncementDate,
    resultAnnouncementMethod: values.resultAnnouncementMethod ?? existing.resultAnnouncementMethod,
    studentListRequired: values.studentListRequired ?? existing.studentListRequired,
    instructorCapacity: values.instructorCapacity ?? existing.instructorCapacity,
    instructorApplicationStartDate:
      values.instructorApplicationStartDate ?? existing.instructorApplicationStartDate,
    instructorApplicationEndDate:
      values.instructorApplicationEndDate ?? existing.instructorApplicationEndDate,
    documentPassAnnouncementDate:
      values.documentPassAnnouncementDate ?? existing.documentPassAnnouncementDate,
    documentPassAnnouncementMethod:
      values.documentPassAnnouncementMethod ?? existing.documentPassAnnouncementMethod,
    interviewStartDate: values.interviewStartDate ?? existing.interviewStartDate,
    interviewEndDate: values.interviewEndDate ?? existing.interviewEndDate,
    interviewMethod: values.interviewMethod ?? existing.interviewMethod,
    finalPassAnnouncementDate:
      values.finalPassAnnouncementDate ?? existing.finalPassAnnouncementDate,
    finalPassAnnouncementMethod:
      values.finalPassAnnouncementMethod ?? existing.finalPassAnnouncementMethod,
    instructorTarget: values.instructorTarget ?? existing.instructorTarget,
    instructorTargetDetail: values.instructorTargetDetail ?? existing.instructorTargetDetail,
    volunteerApplicationStartDate:
      values.volunteerApplicationStartDate ?? existing.volunteerApplicationStartDate,
    volunteerApplicationEndDate:
      values.volunteerApplicationEndDate ?? existing.volunteerApplicationEndDate,
    volunteerTarget: values.volunteerTarget ?? existing.volunteerTarget,
    volunteerTargetDetail: values.volunteerTargetDetail ?? existing.volunteerTargetDetail,
    applicationMethod: values.applicationMethod ?? existing.applicationMethod,
    otherNotes: values.otherNotes ?? existing.otherNotes,
    additionalContentHtml: values.additionalContentHtml ?? existing.additionalContentHtml,
    mainTitle: values.mainTitle ?? existing.mainTitle,
    teamDivision: values.teamDivision ?? existing.teamDivision,
    educationProcess: values.educationProcess ?? existing.educationProcess,
    ipOwned: values.ipOwned ?? existing.ipOwned,
    courseDeliveredBy: values.courseDeliveredBy ?? existing.courseDeliveredBy,
    partnerInvolvement: values.partnerInvolvement ?? existing.partnerInvolvement,
    ips: values.ips ?? existing.ips,
    programCategory: values.programCategory ?? existing.programCategory,
    programChannel: values.programChannel ?? existing.programChannel,
  }
}
