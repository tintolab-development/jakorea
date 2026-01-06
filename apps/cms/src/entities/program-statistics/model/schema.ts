/**
 * 프로그램 통계 스키마 정의
 * 엑셀 데이터 분석 기반 추가
 */

import { z } from 'zod'

export const programStatisticsSchema = z.object({
  programId: z.string().min(1, '프로그램을 선택해주세요'),
  roundId: z.string().optional(),
  scheduleId: z.string().optional(),
  // 참가자 통계
  maleParticipants: z.number().min(0, '남성 참가자 수를 입력해주세요'),
  femaleParticipants: z.number().min(0, '여성 참가자 수를 입력해주세요'),
  totalParticipants: z.number().min(0, '총 참가자 수를 입력해주세요'),
  // 자원봉사자 통계
  generalVolunteers: z.number().min(0, '일반 자원봉사자 수를 입력해주세요'),
  staffVolunteers: z.number().min(0, '임직원 자원봉사자 수를 입력해주세요'),
  returningVolunteers: z.number().min(0, '재참여 자원봉사자 수를 입력해주세요'),
  // 교사/강사 통계
  generalTeachers: z.number().min(0, '일반담당교사 수를 입력해주세요'),
  educatedTeachers: z.number().min(0, '교육받은교사 수를 입력해주세요'),
  instructors: z.number().min(0, '강사 수를 입력해주세요'),
  // 담당자
  managerName: z.string().optional(),
})

export type ProgramStatisticsFormData = z.infer<typeof programStatisticsSchema>



