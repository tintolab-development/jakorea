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
  classCount: z.number().min(1, '학급수를 입력해주세요').optional(),
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
  applicationPathId: z.string().optional(), // V3 Phase 7: 신청 경로 참조
  // 엑셀 데이터 기반 추가 필드 - 기본 교육실적 정보
  businessArea: z.string().optional(),
  titleEn: z.string().optional(),
  mainTitle: z.string().optional(),
  textbookName: z.string().optional(),
  textbookNameEn: z.string().optional(),
  schoolId: z.string().optional(),
  district: z.string().optional(),
  ips: z.enum(['Prepare', 'Succeed', 'Inspire']).optional(),
  targetLevel: z.enum(['elementary', 'middle', 'high']).optional(),
  institutionType: z.enum(['inside_school', 'outside_school']).optional(),
  // 프로그램 설정 정보
  ipOwned: z.string().optional(),
  courseDeliveredBy: z.enum(['JA', 'Jointly', 'Partner']).optional(),
  partnerInvolvement: z.boolean().optional(),
  programCategory: z.string().nullable().optional(),
  programChannel: z.string().nullable().optional(),
  educationTime: z.number().min(0, '교육시간을 입력해주세요').optional(),
  // 엑셀 데이터 기반 추가 필드 - 참가자 통계 정보
  maleParticipants: z.number().min(0, '남성 참가자 수를 입력해주세요').optional(),
  femaleParticipants: z.number().min(0, '여성 참가자 수를 입력해주세요').optional(),
  totalParticipants: z.number().min(0, '총 참가자 수를 입력해주세요').optional(),
  generalVolunteers: z.number().min(0, '일반 자원봉사자 수를 입력해주세요').optional(),
  staffVolunteers: z.number().min(0, '임직원 자원봉사자 수를 입력해주세요').optional(),
  returningVolunteers: z.number().min(0, '재참여 자원봉사자 수를 입력해주세요').optional(),
  generalTeachers: z.number().min(0, '일반담당교사 수를 입력해주세요').optional(),
  educatedTeachers: z.number().min(0, '교육받은교사 수를 입력해주세요').optional(),
  instructors: z.number().min(0, '강사 수를 입력해주세요').optional(),
  managerName: z.string().optional(),
  rounds: z.array(programRoundSchema).min(1, '최소 1개 이상의 회차를 추가해주세요'),
})

export type ProgramFormData = z.infer<typeof programSchema>
export type ProgramRoundFormData = z.infer<typeof programRoundSchema>





