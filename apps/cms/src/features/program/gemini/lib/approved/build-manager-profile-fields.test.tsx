import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { GeminiApprovedTrainingDetail } from '../../model/approved/detail-types'
import { buildGeminiApprovedManagerTableItems } from './build-manager-profile-fields'

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

  it('E: 담당 교사 마스킹 생년월일에 서버 teacherAge를 「(만 N세)」로 붙인다', () => {
    const html = (detail: GeminiApprovedTrainingDetail) =>
      renderToStaticMarkup(
        <>{buildGeminiApprovedManagerTableItems(detail).find(item => item.key === 'genderBirth')?.children}</>
      )

    const masked = html({ ...baseDetail, managerGender: '**', managerBirthDate: '1985-**-**', managerAge: 41 })
    expect(masked).toContain('1985.**.** (만 41세)')
    const withoutAge = html({ ...baseDetail, managerGender: '**', managerBirthDate: '1985-**-**', managerAge: null })
    expect(withoutAge).toContain('1985.**.**')
    expect(withoutAge).not.toContain('만 ')
  })
})
