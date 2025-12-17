/**
 * 프로그램 유효성 검사 스키마 (Zod)
 * Phase 2.1: react-hook-form과 함께 사용
 */

import { z } from 'zod'

// 프로그램 회차 스키마
export const programRoundSchema = z
  .object({
    roundNumber: z
      .number()
      .int('회차 번호는 정수여야 합니다')
      .min(1, '회차 번호는 1 이상이어야 합니다')
      .max(100, '회차 번호는 100 이하여야 합니다'),
    startDate: z
      .string()
      .min(1, '회차 시작일을 입력해주세요')
      .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)'),
    endDate: z
      .string()
      .min(1, '회차 종료일을 입력해주세요')
      .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)'),
    capacity: z
      .union([
        z
          .number()
          .int('정원은 정수여야 합니다')
          .min(1, '정원은 1명 이상이어야 합니다')
          .max(10000, '정원은 10,000명 이하여야 합니다'),
        z.literal(''),
      ])
      .optional()
      .transform((val) => (val === '' ? undefined : val)),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: '회차 종료일은 시작일보다 늦어야 합니다',
    path: ['endDate'],
  })

// 프로그램 메인 스키마
export const programSchema = z
  .object({
    title: z
      .string()
      .min(1, '프로그램 제목을 입력해주세요')
      .max(200, '프로그램 제목은 200자 이하여야 합니다'),
    sponsorId: z.string().uuid('올바른 스폰서를 선택해주세요'),
    type: z.enum(['online', 'offline', 'hybrid'], {
      errorMap: () => ({ message: '프로그램 유형을 선택해주세요' }),
    }),
    format: z.enum(['workshop', 'seminar', 'course', 'lecture', 'other'], {
      errorMap: () => ({ message: '프로그램 형태를 선택해주세요' }),
    }),
    description: z.string().max(2000, '설명은 2,000자 이하여야 합니다').optional().or(z.literal('')),
    startDate: z
      .string()
      .min(1, '프로그램 시작일을 입력해주세요')
      .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)'),
    endDate: z
      .string()
      .min(1, '프로그램 종료일을 입력해주세요')
      .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다 (YYYY-MM-DD)'),
    status: z.enum(['active', 'inactive', 'pending'], {
      errorMap: () => ({ message: '프로그램 상태를 선택해주세요' }),
    }),
    rounds: z
      .array(programRoundSchema)
      .min(1, '최소 1개 이상의 회차를 등록해주세요')
      .max(100, '회차는 최대 100개까지 등록할 수 있습니다'),
    settlementRuleId: z
      .union([z.string().uuid('올바른 정산 규칙을 선택해주세요'), z.literal('')])
      .optional()
      .transform((val) => (val === '' ? undefined : val)),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: '프로그램 종료일은 시작일보다 늦어야 합니다',
    path: ['endDate'],
  })
  .refine(
    (data) => {
      // 모든 회차의 시작일/종료일이 프로그램 기간 내에 있는지 확인
      return data.rounds.every(
        (round) => round.startDate >= data.startDate && round.endDate <= data.endDate
      )
    },
    {
      message: '모든 회차는 프로그램 기간 내에 있어야 합니다',
      path: ['rounds'],
    }
  )
  .refine(
    (data) => {
      // 회차 번호가 중복되지 않는지 확인
      const roundNumbers = data.rounds.map((r) => r.roundNumber)
      return new Set(roundNumbers).size === roundNumbers.length
    },
    {
      message: '회차 번호는 중복될 수 없습니다',
      path: ['rounds'],
    }
  )
  .refine(
    (data) => {
      // 회차 날짜가 겹치지 않는지 확인 (선택적 검증)
      const sortedRounds = [...data.rounds].sort((a, b) => a.roundNumber - b.roundNumber)
      for (let i = 0; i < sortedRounds.length - 1; i++) {
        if (sortedRounds[i].endDate >= sortedRounds[i + 1].startDate) {
          return false
        }
      }
      return true
    },
    {
      message: '회차 날짜는 겹치지 않아야 합니다',
      path: ['rounds'],
    }
  )

export type ProgramFormData = z.infer<typeof programSchema>
export type ProgramRoundFormData = z.infer<typeof programRoundSchema>

