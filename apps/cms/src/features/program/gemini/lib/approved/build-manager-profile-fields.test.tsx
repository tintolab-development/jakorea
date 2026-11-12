import { describe, expect, it } from 'vitest'
import type { GeminiApprovedTrainingDetail } from '../../model/approved/detail-types'
import {
  buildGeminiApprovedManagerTableItems,
  formatGeminiManagerBirthDisplay,
} from './build-manager-profile-fields'

const baseDetail: GeminiApprovedTrainingDetail = {
  id: '1',
  programId: '2',
  recruitmentTitle: '',
  institutionName: '',
  trainingDate: '',
  trainingTimeText: '',
  classCount: null,
  trainingDateCandidates: [],
  studentCount: null,
  recruitmentCount: null,
  completedRecruitmentCount: null,
  institutionAddress: '',
  joinedAt: '',
  teacherSchoolOrganizationId: null,
  managerNameKo: '',
  managerScheduleChangeCount: 0,
  managerGender: '',
  managerBirthDate: '',
  managerEmploymentStatus: null,
  managerContact: '',
  managerEmail: '',
  managerSchool: '',
  managerHomeAddress: '',
  managerLectureExperience: '',
  managerAccountBank: '',
  managerAccountNumber: '',
  managerAccountHolder: '',
  managerInstructorFeeGrade: '',
  managerBusinessIncomeLabel: '',
  managerOneLineIntro: '',
  managerPosition: '',
  managerSubject: '',
  instructor: {
    name: '-',
    region: '-',
    experienceYears: null,
    grade: '-',
    contact: '-',
    email: '-',
  },
  trainingContent: '',
  instructorAssigned: false,
  lastPreferredDate: '',
  officialDocumentRequired: null,
  officialDocumentRequiredInfo: null,
  progressStatus: null,
}

function valueFor(detail: GeminiApprovedTrainingDetail, key: 'position' | 'subject') {
  return buildGeminiApprovedManagerTableItems(detail).find(item => item.key === key)?.children
}

describe('buildGeminiApprovedManagerTableItems', () => {
  it.each([
    ['', '', '-', '-'],
    ['   ', '\t', '-', '-'],
    ['교사', '정보', '교사', '정보'],
  ])(
    '직급·과목 표시값을 공백 규칙에 맞게 처리한다 (%j, %j)',
    (position, subject, expectedPosition, expectedSubject) => {
      const detail = { ...baseDetail, managerPosition: position, managerSubject: subject }

      expect(valueFor(detail, 'position')).toBe(expectedPosition)
      expect(valueFor(detail, 'subject')).toBe(expectedSubject)
    }
  )
})

describe('formatGeminiManagerBirthDisplay', () => {
  it('상세 GET 마스킹 yyyy-**-**는 정책 표기 yyyy.**.**로 보여준다(나이 필드 없음 → 나이 미표시)', () => {
    expect(formatGeminiManagerBirthDisplay('1985-**-**')).toBe('1985.**.**')
  })

  it('원문 조회 yyyy-MM-dd는 yyyy. MM. dd (만 N세)로 보여준다', () => {
    const result = formatGeminiManagerBirthDisplay('1985-03-15')
    expect(result).toMatch(/^1985\. 03\. 15 \(만 \d+세\)$/)
  })

  it('빈 값은 빈 문자열, 연도를 읽을 수 없는 마스킹 값은 그대로 둔다', () => {
    expect(formatGeminiManagerBirthDisplay('')).toBe('')
    expect(formatGeminiManagerBirthDisplay('****-**-**')).toBe('****-**-**')
  })
})
