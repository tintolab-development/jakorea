/**
 * 신청 스키마 정의
 * Phase 2.2: Zod 스키마
 * Phase 0.2.2: 역할별 신청서 폼 확장 (FR-C03)
 */

import { z } from 'zod'

// 기본 신청 스키마
export const baseApplicationSchema = z.object({
  programId: z.string().min(1, '프로그램을 선택해주세요'),
  roundId: z.string().optional(),
  subjectType: z.enum(['school', 'student', 'instructor', 'volunteer']),
  subjectId: z
    .string()
    .transform(value => value.trim())
    .refine(value => value.length > 0, '신청 주체를 선택해주세요'),
  status: z.enum(['submitted', 'reviewing', 'approved', 'rejected', 'cancelled', 'waiting']),
  notes: z.string().optional(),
})

// Phase 0.2.2: 학교 신청서 스키마 (FR-C03)
export const schoolApplicationSchema = baseApplicationSchema.extend({
  subjectType: z.literal('school'),
  // §3.1 학교 신청 프로세스 - 신청서 작성
  schoolName: z.string().min(1, '학교명을 입력해주세요'),
  address: z.string().min(1, '주소를 입력해주세요'),
  targetGrade: z.string().optional(), // 대상 학년
  classCount: z.number().int().positive().optional(), // 학급 수
  studentsPerClass: z.number().int().positive().optional(), // 학급별 인원
  instructorWaitingRoom: z.string().optional(), // 강사 대기장소
  // Phase 0.2.2: 엑셀 파일 (FR-C03) - 파일 검증 포함
  studentListFile: z
    .instanceof(File)
    .refine(file => {
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      return ['.xlsx', '.xls'].includes(extension)
    })
    .refine(file => file.size <= 5 * 1024 * 1024)
    .optional(),
  mealAvailable: z.boolean().optional(), // 급식 가능 여부
  canEatInWaitingRoom: z.boolean().optional(), // 대기실 내 취식 가능 여부
})

// Phase 0.2.2: 강사 신청서 스키마 (FR-C03)
export const instructorApplicationSchema = baseApplicationSchema.extend({
  subjectType: z.literal('instructor'),
  // §3.2 강사 프로세스 - 강의 신청
  preferredSchedule: z.array(z.string()).optional(), // 선호 일정
  experience: z.string().optional(), // 강의 경력
  resume: z.instanceof(File).optional(), // 이력서
  crimeCheckConsent: z.instanceof(File).optional(), // 성범죄조회동의서
})

// Phase 0.2.2: 개인 신청서 스키마
export const individualApplicationSchema = baseApplicationSchema.extend({
  subjectType: z.literal('student'),
  motivation: z.string().optional(), // 지원 동기
  customFields: z.record(z.unknown()).optional(), // 템플릿 기반 커스텀 필드
})

// 통합 신청서 스키마 (역할별 분기)
export const applicationSchema = z.discriminatedUnion('subjectType', [
  schoolApplicationSchema,
  instructorApplicationSchema,
  individualApplicationSchema,
  baseApplicationSchema.extend({ subjectType: z.literal('volunteer') }),
])

export type ApplicationFormData = z.infer<typeof applicationSchema>
export type SchoolApplicationFormData = z.infer<typeof schoolApplicationSchema>
export type InstructorApplicationFormData = z.infer<typeof instructorApplicationSchema>
export type IndividualApplicationFormData = z.infer<typeof individualApplicationSchema>








