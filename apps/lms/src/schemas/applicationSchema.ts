/**
 * 신청 유효성 검사 스키마 (Zod)
 * Phase 2.2: react-hook-form과 함께 사용
 */

import { z } from 'zod'

// 신청 등록 폼용 스키마 (status는 자동으로 'submitted'로 설정)
export const applicationCreateSchema = z.object({
  programId: z.string().uuid('올바른 프로그램을 선택해주세요'),
  roundId: z.string().uuid('올바른 회차를 선택해주세요').optional().or(z.literal('')),
  subjectType: z.enum(['school', 'student', 'instructor'], {
    errorMap: () => ({ message: '신청 주체 유형을 선택해주세요' }),
  }),
  subjectId: z.string().uuid('올바른 신청 주체를 선택해주세요').optional(),
  // 학생의 경우 이름과 연락처로 임시 ID 생성
  studentName: z.string().min(1, '학생 이름을 입력해주세요').optional(),
  studentContact: z.string().min(1, '학생 연락처를 입력해주세요').optional(),
  notes: z.string().max(2000, '메모는 2,000자 이하여야 합니다').optional().or(z.literal('')),
}).refine(
  (data) => {
    // 주체 유형이 학생이면 이름과 연락처가 필수
    if (data.subjectType === 'student') {
      return data.studentName && data.studentContact
    }
    // 그 외에는 subjectId가 필수
    return !!data.subjectId
  },
  {
    message: '신청 주체 정보를 입력해주세요',
    path: ['subjectId'],
  }
)

// 신청 수정/관리용 스키마 (status 포함)
export const applicationSchema = z.object({
  programId: z.string().uuid('올바른 프로그램을 선택해주세요'),
  roundId: z.string().uuid('올바른 회차를 선택해주세요').optional().or(z.literal('')),
  subjectType: z.enum(['school', 'student', 'instructor'], {
    errorMap: () => ({ message: '신청 주체 유형을 선택해주세요' }),
  }),
  subjectId: z.string().uuid('올바른 신청 주체를 선택해주세요'),
  status: z.enum(['submitted', 'reviewing', 'approved', 'rejected', 'cancelled'], {
    errorMap: () => ({ message: '신청 상태를 선택해주세요' }),
  }),
  notes: z.string().max(2000, '메모는 2,000자 이하여야 합니다').optional().or(z.literal('')),
})

export type ApplicationFormData = z.infer<typeof applicationSchema>
export type ApplicationCreateFormData = z.infer<typeof applicationCreateSchema>

