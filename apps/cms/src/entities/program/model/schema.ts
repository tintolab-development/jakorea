/**
 * 프로그램 스키마 정의
 * Phase 2.1: Zod 스키마
 */

import { z } from 'zod'

export const programRoundSchema = z.object({
  roundNumber: z.number().min(1, '회차 번호를 입력해주세요'),
  startDate: z.string().min(1, '시작일을 선택해주세요'),
  endDate: z.string().min(1, '종료일을 선택해주세요'),
  capacity: z.number().min(1, '정원을 입력해주세요').optional(),
  status: z.enum(['active', 'pending', 'inactive', 'completed', 'cancelled']),
})

export const programSchema = z.object({
  sponsorId: z.string().min(1, '스폰서를 선택해주세요'),
  title: z.string().min(1, '프로그램명을 입력해주세요'),
  type: z.enum(['online', 'offline', 'hybrid']),
  format: z.enum(['workshop', 'seminar', 'course', 'lecture', 'other']),
  description: z.string().optional(),
  startDate: z.string().min(1, '시작일을 선택해주세요'),
  endDate: z.string().min(1, '종료일을 선택해주세요'),
  status: z.enum(['active', 'pending', 'inactive', 'completed', 'cancelled']),
  settlementRuleId: z.string().optional(),
  rounds: z.array(programRoundSchema).min(1, '최소 1개 이상의 회차를 추가해주세요'),
})

export type ProgramFormData = z.infer<typeof programSchema>
export type ProgramRoundFormData = z.infer<typeof programRoundSchema>

