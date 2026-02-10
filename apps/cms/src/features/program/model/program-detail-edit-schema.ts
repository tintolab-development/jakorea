/**
 * 프로그램 상세 정보 수정 폼 스키마 (Zod)
 * - 정보수정 시 사용, 기본값으로 기존 프로그램 값 채움
 */

import { z } from 'zod'

const roundStatusEnum = z.enum(['active', 'inactive', 'pending', 'completed', 'cancelled'])

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
})

export const programDetailEditSchema = z.object({
  title: z.string().min(1, '프로그램명을 입력해주세요'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.enum(['school', 'individual']),
  targetLevel: z.enum(['elementary', 'middle', 'high']).optional(),
  district: z.string().optional(),
  type: z.enum(['online', 'offline', 'hybrid']),
  applicationStartDate: z.string().optional(),
  applicationEndDate: z.string().optional(),
  businessArea: z.string().optional(),
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
})

export type ProgramDetailEditFormValues = z.infer<typeof programDetailEditSchema>

/** Program → 폼 기본값 (날짜는 ISO 문자열) */
export function programToDetailEditValues(
  program: import('@/types/domain').Program
): ProgramDetailEditFormValues {
  type DateValue = string | Date
  const toStr = (d: DateValue | undefined): string =>
    d == null ? '' : typeof d === 'string' ? d : (d as Date).toISOString?.() ?? String(d)
  return {
    title: program.title ?? '',
    startDate: toStr(program.startDate),
    endDate: toStr(program.endDate),
    category: program.category ?? 'school',
    targetLevel: program.targetLevel ?? undefined,
    district: program.district ?? undefined,
    type: program.type ?? 'offline',
    applicationStartDate: toStr(program.applicationStartDate),
    applicationEndDate: toStr(program.applicationEndDate),
    businessArea: program.businessArea ?? undefined,
    contactPhone: program.contactPhone ?? undefined,
    contactEmail: program.contactEmail ?? undefined,
    oneLineIntroduction: program.oneLineIntroduction ?? undefined,
    keyVisualImage: program.keyVisualImage ?? undefined,
    posterImage: program.posterImage ?? undefined,
    description: program.description ?? undefined,
    recruitmentGuide: program.recruitmentGuide ?? undefined,
    learningSupportContent: program.learningSupportContent ?? undefined,
    attachmentFileNames: program.attachmentFileNames ?? [],
    rounds: (program.rounds ?? []).map((r) => ({
      id: r.id,
      programId: r.programId,
      roundNumber: r.roundNumber,
      startDate: toStr(r.startDate),
      endDate: toStr(r.endDate),
      capacity: r.capacity,
      classCount: r.classCount,
      status: r.status,
      curriculum: r.curriculum ?? undefined,
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
    applicationStartDate: values.applicationStartDate,
    applicationEndDate: values.applicationEndDate,
    businessArea: values.businessArea,
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
  }
}
