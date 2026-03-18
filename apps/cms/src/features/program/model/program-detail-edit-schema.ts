/**
 * 프로그램 상세 정보 수정 폼 전용 스키마·도메인 변환
 * - 비즈니스 규칙: 필수/선택 필드, 검증(Zod), Program ↔ 폼 값 변환
 * - programToDetailEditValues: Program → 폼 기본값 (정보 수정 시 기존 값 채움)
 * - detailEditValuesToProgramPatch: 폼 값 → 저장용 패치 (optional 필드는 existing fallback)
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
  'education_before_textbook',
  'education_after_textbook',
  'matching_completed',
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

export const programDetailEditSchema = z.object({
  title: z.string().min(1, '프로그램명을 입력해주세요'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.enum(['school', 'individual']),
  targetLevel: z.enum(['elementary', 'middle', 'high']).optional(),
  district: z.string().optional(),
  type: z.enum(['online', 'offline', 'hybrid']),
  lifecycleStatus: programLifecycleStatusEnum.optional(),
  applicationStartDate: z.string().optional(),
  applicationEndDate: z.string().optional(),
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
  learningSupportContent: z
    .string()
    .min(1, '학습 지원 내용을 입력해주세요'),
  attachmentFileNames: z.array(z.string()).optional(),
  rounds: z.array(roundEditSchema),
  // 수강자 모집
  resultAnnouncementDate: z.string().optional(),
  resultAnnouncementMethod: z.string().optional(),
  /** 학생 명단 제출 여부: 필요 | 불필요 */
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
  // 봉사자 정보 탭
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
  // 공통 정보 탭 전용
  mainTitle: z.string().optional(),
  teamDivision: z.string().optional(),
  educationProcess: z.string().optional(),
  ipOwned: z.string().optional(),
  courseDeliveredBy: z.enum(['JA', 'Jointly', 'Partner']).optional(),
  partnerInvolvement: z.boolean().optional(),
  ips: z.enum(['Inspire', 'Prepare', 'Succeed']).optional(),
  programCategory: z.string().optional(),
  programChannel: z.string().optional(),
  // 사업 KPI 목표 (폼 전용, API 연동은 별도)
  kpiFinalParticipants: z.number().min(0).optional(),
  kpiInstructorCount: z.number().min(0).optional(),
  kpiVolunteerCount: z.number().min(0).optional(),
  kpiFinalSchools: z.number().min(0).optional(),
  kpiFinalClasses: z.number().min(0).optional(),
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
      : undefined,
    resultAnnouncementMethod: program.resultAnnouncementMethod ?? undefined,
    /** 수정 모드 진입 시 미설정이면 '필요'로 기본 체크 */
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
    // 사업 KPI 목표 (폼 전용, 별도 API로 채움 가능)
    kpiFinalParticipants: undefined,
    kpiInstructorCount: undefined,
    kpiVolunteerCount: undefined,
    kpiFinalSchools: undefined,
    kpiFinalClasses: undefined,
  }
}

/** 폼 값 → Program 패치 (저장 시 병합용) */
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
