/**
 * 면접 관련 스키마 정의
 * Phase 4.3: 강사/봉사자 면접 및 승인 프로세스
 */

import { z } from 'zod'

/**
 * 강사/수강자 신청 폼 스키마
 */
export const instructorApplicationFormSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  phone: z.string().min(1, '연락처를 입력해주세요'),
  region: z.string().min(1, '지역을 선택해주세요'),
  specialty: z.array(z.string()).min(1, '최소 1개의 전문분야를 선택해주세요'),
  participationHistory: z.number().int().min(0, '참여이력은 0 이상이어야 합니다'),
  experience: z.string().optional(),
  availableTime: z.string().optional(),
  role: z.enum(['INSTRUCTOR', 'INDIVIDUAL', 'SCHOOL']),
})

export type InstructorApplicationFormData = z.infer<typeof instructorApplicationFormSchema>

/**
 * 면접 일정 스키마
 */
export const interviewScheduleSchema = z.object({
  scheduledAt: z.date({ required_error: '면접 일정을 선택해주세요' }),
  location: z.string().optional(),
  interviewerId: z.string().uuid().optional(),
  notes: z.string().optional(),
})

export type InterviewScheduleFormData = z.infer<typeof interviewScheduleSchema>

/**
 * 면접 결과 스키마
 */
export const interviewResultSchema = z.object({
  result: z.enum(['PASS', 'FAIL'], { required_error: '면접 결과를 선택해주세요' }),
  notes: z.string().optional(),
})

export type InterviewResultFormData = z.infer<typeof interviewResultSchema>

/**
 * 승인/반려 스키마
 */
export const approvalSchema = z.object({
  approved: z.boolean(),
  reason: z.string().optional(),
})

export type ApprovalFormData = z.infer<typeof approvalSchema>

