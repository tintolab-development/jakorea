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
  'recruiting_students',
  'recruiting_instructors',
  'matching_completed',
  'education_before_textbook',
  'education_after_textbook',
  'education_completed',
  'document_processing_completed',
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
  description: z.string().optional(),
  recruitmentGuide: z.string().optional(),
  learningSupportContent: z.string().optional(),
  attachmentFileNames: z.array(z.string()).optional(),
  rounds: z.array(roundEditSchema),
  // 수강자 모집
  resultAnnouncementDate: z.string().optional(),
  resultAnnouncementMethod: z.string().optional(),
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
    description: program.description ?? undefined,
    recruitmentGuide: program.recruitmentGuide ?? undefined,
    learningSupportContent: program.learningSupportContent ?? undefined,
    attachmentFileNames: program.attachmentFileNames ?? [],
    resultAnnouncementDate: program.resultAnnouncementDate
      ? toStr(program.resultAnnouncementDate)
      : undefined,
    resultAnnouncementMethod: program.resultAnnouncementMethod ?? undefined,
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
  }
}
