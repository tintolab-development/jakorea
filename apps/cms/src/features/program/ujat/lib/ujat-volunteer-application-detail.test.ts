import { describe, expect, it } from 'vitest'
import {
  applyUjatVolunteerApplicationDetail,
  applyUjatVolunteerProjection,
} from './ujat-volunteer-application-detail'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import type { VolunteerApplicationEvidenceAttachment } from '@/features/program/general/model/volunteer-applicant'

const row = {
  id: '1',
  no: 1,
  name: '김봉사',
  grade: '1학년',
  preferredRegion: '',
  contact: '',
  email: '',
  contactRaw: '',
  emailRaw: '',
  hasEducationExperience: false,
  applicationType: 'new',
  essayIntro: '목록 자기소개',
  essayEducationExperience: '',
  essayNecessity: '',
  essayJaExperience: '',
  managerAEvaluation: 'unreviewed',
  managerBEvaluation: 'unreviewed',
  documentScreeningStatus: 'pending',
  interviewSlotCount: 0,
  interviewAssignmentStatus: 'waiting',
  programId: '186026',
  half: 'h1',
  englishName: '',
  id1365: '',
  gender: '',
  birthDate: '',
  age: 0,
  universityName: '',
  major: '',
  applicationRoute: '',
  scheduleChangeCancelCount: 0,
  interviewAvailability: [],
  totalAssignedDays: null,
  homeAddress: '',
} satisfies UjatVolunteerApplicantRow

const certificate: VolunteerApplicationEvidenceAttachment = {
  submissionFileId: 9,
  questionKey: 'ujat-program-application-volunteer-seed-previous-term',
  fileObjectId: 88,
  originalFileName: 'certificate.pdf',
  contentType: 'application/pdf',
  fileSize: 10,
  downloadPolicyPath: '/api/admin/form-submission-files/9/download',
}

describe('applyUjatVolunteerProjection', () => {
  it('maps graduate projection and certificate attachments', () => {
    const next = applyUjatVolunteerProjection(
      row,
      {
        universityName: '서울대학교',
        grade: '3',
        gradeLabel: '3학년',
        major: '경영',
        applicationRouteLabel: '인스타그램',
        applicationType: 'ujat-graduate',
        previousActivityTerm: '12',
        previousActivityYear: '2024',
        essayIntro: null,
        educationExperienceYn: true,
        preferredActivityRegion: '서울',
      },
      [certificate],
    )

    expect(next.applicationType).toBe('ujat-graduate')
    expect(next.universityName).toBe('서울대학교')
    expect(next.grade).toBe('3학년')
    expect(next.major).toBe('경영')
    expect(next.applicationRoute).toBe('인스타그램')
    expect(next.hasEducationExperience).toBe(true)
    expect(next.preferredRegion).toBe('서울')
    expect(next.essayIntro).toBe('')
    expect(next.previousUjatActivity).toEqual({
      term: '12',
      year: '2024',
      certificateFileName: 'certificate.pdf',
    })
    expect(next.evidenceAttachments).toEqual([certificate])
  })

  it('profile.homeAddress만 자택 주소지로 쓰고 기관 주소는 쓰지 않는다', () => {
    const next = applyUjatVolunteerApplicationDetail(
      row,
      { ujat: { essayIntro: '상세 서술형' }, general: { essayIntro: '일반 서술형' } },
      { homeAddress: '서울특별시', homeAddressSido: '서울특별시', homeAddressSigungu: null },
    )
    expect(next.homeAddress).toBe('서울특별시')
    expect(next.essayIntro).toBe('상세 서술형')
  })

  it('homeAddress가 null이면 sido만 쓰고 sigungu로 채우지 않는다', () => {
    const next = applyUjatVolunteerApplicationDetail(row, null, {
      homeAddress: null,
      homeAddressSido: '서울특별시',
      homeAddressSigungu: '강남구',
    })
    expect(next.homeAddress).toBe('서울특별시')
  })

  it('application.scheduleChangeCancelCount를 성명 옆 배지용으로 반영한다', () => {
    const next = applyUjatVolunteerApplicationDetail(
      row,
      {
        scheduleChangeCancelCount: 1,
        ujat: { applicationType: 'ujat-graduate', previousActivityTerm: '30', previousActivityYear: '2023' },
        attachments: [certificate],
      },
      null,
    )
    expect(next.scheduleChangeCancelCount).toBe(1)
    expect(next.applicationType).toBe('ujat-graduate')
    expect(next.previousUjatActivity).toEqual({
      term: '30',
      year: '2023',
      certificateFileName: 'certificate.pdf',
    })
  })
})
