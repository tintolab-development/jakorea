import { describe, expect, it } from 'vitest'
import type { ProgramRecruitmentWindow } from '@/types/domain'
import { resolveRecruitmentFinalAnnouncementAt } from './recruitment-final-announcement'

function program(rows: ProgramRecruitmentWindow[]) {
  return { programRecruitments: rows }
}

/** GET recruitments[] 실제 응답 형태(2026-11 스테이징) */
const generalOrganization = program([
  { recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION', finalPassAnnouncementAt: '2026-11-16T01:00:00Z' },
  { recruitmentType: 'INSTRUCTOR', applicationType: 'INSTRUCTOR', finalPassAnnouncementAt: '2026-11-18T01:00:00Z' },
  { recruitmentType: 'VOLUNTEER', applicationType: 'VOLUNTEER', finalPassAnnouncementAt: '2026-11-19T01:00:00Z' },
])

const generalIndividual = program([
  { recruitmentType: 'PARTICIPANT', applicationType: 'INDIVIDUAL', finalPassAnnouncementAt: '2026-11-09T15:00:00Z' },
])

const companySchool = program([
  { recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION', finalPassAnnouncementAt: null },
  { recruitmentType: 'INSTRUCTOR', applicationType: 'INSTRUCTOR', finalPassAnnouncementAt: '2027-10-17T15:00:00Z' },
])

const ujat = program([
  { recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION', finalPassAnnouncementAt: '2026-03-15T15:00:00Z' },
  { recruitmentType: 'VOLUNTEER', applicationType: 'VOLUNTEER', recruitTerm: 'FIRST_HALF', finalPassAnnouncementAt: '2026-03-22T15:00:00Z' },
  { recruitmentType: 'VOLUNTEER', applicationType: 'VOLUNTEER', recruitTerm: 'SECOND_HALF', finalPassAnnouncementAt: '2026-08-12T15:00:00Z' },
])

const trainedTeacher = program([
  { recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION', finalPassAnnouncementAt: '2026-12-02T15:00:00Z' },
])

describe('resolveRecruitmentFinalAnnouncementAt — 알림이 따르는 모집 발표일', () => {
  it('일반(기관): 기관=참여 기관 모집, 강사=강사 모집, 봉사자=봉사자 모집 행', () => {
    expect(resolveRecruitmentFinalAnnouncementAt(generalOrganization, 'organization')).toBe('2026-11-16T01:00:00Z')
    expect(resolveRecruitmentFinalAnnouncementAt(generalOrganization, 'instructor')).toBe('2026-11-18T01:00:00Z')
    expect(resolveRecruitmentFinalAnnouncementAt(generalOrganization, 'volunteer')).toBe('2026-11-19T01:00:00Z')
    expect(resolveRecruitmentFinalAnnouncementAt(generalOrganization, 'individual')).toBeNull()
  })

  it('일반(개인): 개인 참여자 모집 행', () => {
    expect(resolveRecruitmentFinalAnnouncementAt(generalIndividual, 'individual')).toBe('2026-11-09T15:00:00Z')
    expect(resolveRecruitmentFinalAnnouncementAt(generalIndividual, 'organization')).toBeNull()
  })

  it('1사1교: 강사는 강사 모집 최종 합격 발표일, 기관 모집 발표일이 없으면 null', () => {
    expect(resolveRecruitmentFinalAnnouncementAt(companySchool, 'instructor')).toBe('2027-10-17T15:00:00Z')
    expect(resolveRecruitmentFinalAnnouncementAt(companySchool, 'organization')).toBeNull()
  })

  it('UJAT: 봉사자는 반기 행, 반기를 모르면 값이 달라 null', () => {
    expect(resolveRecruitmentFinalAnnouncementAt(ujat, 'organization')).toBe('2026-03-15T15:00:00Z')
    expect(
      resolveRecruitmentFinalAnnouncementAt(ujat, 'volunteer', { recruitTerm: 'FIRST_HALF' })
    ).toBe('2026-03-22T15:00:00Z')
    expect(
      resolveRecruitmentFinalAnnouncementAt(ujat, 'volunteer', { recruitTerm: 'SECOND_HALF' })
    ).toBe('2026-08-12T15:00:00Z')
    expect(resolveRecruitmentFinalAnnouncementAt(ujat, 'volunteer')).toBeNull()
  })

  it('교육받은 교사: 기관 신청 = 참여 기관 모집 행', () => {
    expect(resolveRecruitmentFinalAnnouncementAt(trainedTeacher, 'organization')).toBe('2026-12-02T15:00:00Z')
  })

  it('모집 행이 없으면 null', () => {
    expect(resolveRecruitmentFinalAnnouncementAt(null, 'organization')).toBeNull()
    expect(resolveRecruitmentFinalAnnouncementAt(program([]), 'instructor')).toBeNull()
  })
})
