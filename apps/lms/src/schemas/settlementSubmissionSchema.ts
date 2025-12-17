/**
 * 정산 제출 폼 Zod 스키마
 * Phase 6: 강사가 정산 정보를 제출하는 폼 검증
 */

import { z } from 'zod'

// 파일 객체 타입 (Mock 단계에서는 File 객체)
export interface FileUpload {
  file: File
  id: string // 임시 ID (UUID)
}

// 정산 제출 폼 데이터
export const settlementSubmissionSchema = z
  .object({
    matchingId: z.string().min(1, '프로그램/강의를 선택해주세요'),
    instructorFee: z
      .number()
      .min(0, '강사비는 0원 이상이어야 합니다')
      .optional()
      .or(z.literal('')),
    transportationFee: z
      .number()
      .min(0, '교통비는 0원 이상이어야 합니다')
      .optional()
      .or(z.literal('')),
    accommodationFee: z
      .number()
      .min(0, '숙박비는 0원 이상이어야 합니다')
      .max(80000, '숙박비는 최대 80,000원입니다')
      .optional()
      .or(z.literal('')),
    fuelFee: z
      .number()
      .min(0, '유류비는 0원 이상이어야 합니다')
      .optional()
      .or(z.literal('')),
    fuelProofFiles: z
      .array(
        z.object({
          file: z.instanceof(File),
          id: z.string(),
        })
      )
      .optional()
      .default([]),
    otherFee: z
      .number()
      .min(0, '기타 비용은 0원 이상이어야 합니다')
      .optional()
      .or(z.literal('')),
    notes: z.string().optional().default(''),
  })
  .refine(
    (data) => {
      // 최소 하나의 비용 항목은 입력되어야 함 (숙박비는 옵셔널이므로 제외)
      const hasInstructorFee = typeof data.instructorFee === 'number' && data.instructorFee > 0
      const hasTransportationFee = typeof data.transportationFee === 'number' && data.transportationFee > 0
      const hasFuelFee = typeof data.fuelFee === 'number' && data.fuelFee > 0
      const hasOtherFee = typeof data.otherFee === 'number' && data.otherFee > 0
      const hasAccommodationFee = typeof data.accommodationFee === 'number' && data.accommodationFee > 0

      return hasInstructorFee || hasTransportationFee || hasFuelFee || hasOtherFee || hasAccommodationFee
    },
    {
      message: '최소 하나의 비용 항목을 입력해주세요',
      path: ['instructorFee'],
    }
  )
  .refine(
    (data) => {
      // 유류비가 입력된 경우 증빙 파일 필수
      if (data.fuelFee && data.fuelFee > 0) {
        return data.fuelProofFiles && data.fuelProofFiles.length > 0
      }
      return true
    },
    {
      message: '유류비 입력 시 증빙 파일을 첨부해주세요',
      path: ['fuelProofFiles'],
    }
  )

export type SettlementSubmissionFormData = z.infer<typeof settlementSubmissionSchema>

