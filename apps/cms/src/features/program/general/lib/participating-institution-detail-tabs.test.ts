import { describe, expect, it } from 'vitest'
import {
  getTrainedTeachersInstitutionDetailTabKeys,
  normalizeTrainedTeachersInstitutionDetailTab,
} from '@/features/program/trained-teachers/lib/institution-detail-tabs'
import {
  getGeneralParticipatingInstitutionDetailTabKeys,
  normalizeGeneralParticipatingInstitutionDetailTab,
} from './participating-institution-detail-tabs'

describe('프로그램 진행 현황 하위 capability', () => {
  it('학생 명단 capability가 비활성이면 학생 명단 탭만 숨긴다', () => {
    const tabs = getGeneralParticipatingInstitutionDetailTabKeys(
      {
        studentListRequired: 'required',
        generalParticipantTypes: ['school_institution', 'teacher_instructor'],
      },
      false
    )

    expect(tabs).not.toContain('students')
    expect(tabs).toContain('attendance')
    expect(tabs).toContain('instructors')
    expect(tabs).toContain('application')
  })

  it('학생 명단 capability가 없으면 프로그램 설정 fallback을 유지한다', () => {
    expect(
      getGeneralParticipatingInstitutionDetailTabKeys(
        { studentListRequired: 'required' },
        undefined
      )
    ).toContain('students')
    expect(
      getGeneralParticipatingInstitutionDetailTabKeys(
        { studentListRequired: 'not_required' },
        undefined
      )
    ).not.toContain('students')
  })

  it('모집 정보 학생 명단 제출 여부가 제출 필요가 아니면 학생 명단 탭을 숨긴다', () => {
    const hidden = getGeneralParticipatingInstitutionDetailTabKeys({
      studentListRequired: 'required',
      generalCommonInfo: {
        participantRecruitmentInfo: { studentListRequired: 'not_required' },
      },
    })
    expect(hidden).not.toContain('students')
    expect(hidden).not.toContain('attendance')

    const shown = getGeneralParticipatingInstitutionDetailTabKeys({
      generalCommonInfo: {
        participantRecruitmentInfo: { studentListRequiredLabel: '제출 필요' },
      },
    })
    expect(shown).toContain('students')
    expect(
      getGeneralParticipatingInstitutionDetailTabKeys({
        generalCommonInfo: {
          participantRecruitmentInfo: { studentListRequiredLabel: '제출 불필요' },
        },
      })
    ).not.toContain('students')
  })

  it('참여자 유형에 강사가 없으면 강사 배정 현황 탭을 숨긴다', () => {
    const withoutInstructor = getGeneralParticipatingInstitutionDetailTabKeys({
      studentListRequired: 'required',
      generalParticipantTypes: ['school_institution', 'volunteer'],
    })
    expect(withoutInstructor).not.toContain('instructors')
    expect(withoutInstructor).toContain('students')
    expect(
      normalizeGeneralParticipatingInstitutionDetailTab('instructors', {
        generalParticipantTypes: ['school_institution'],
      })
    ).toBe('application')

    const withInstructor = getGeneralParticipatingInstitutionDetailTabKeys({
      studentListRequired: 'required',
      generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    })
    expect(withInstructor).toContain('instructors')
  })

  it('교육일지 capability가 비활성이면 교육받은 교사 교육 일지 탭만 숨긴다', () => {
    const tabs = getTrainedTeachersInstitutionDetailTabKeys(false)

    expect(tabs).toEqual(['application'])
  })

  it('교육일지 capability가 없으면 교육받은 교사 기존 탭 fallback을 유지한다', () => {
    expect(getTrainedTeachersInstitutionDetailTabKeys()).toEqual(['application', 'journal'])
  })

  it('교육일지 OFF 상태의 legacy 딥링크를 신청 정보로 정규화한다', () => {
    expect(normalizeTrainedTeachersInstitutionDetailTab('journal', false)).toBe('application')
    expect(normalizeTrainedTeachersInstitutionDetailTab('journal', true)).toBe('journal')
    expect(normalizeTrainedTeachersInstitutionDetailTab('journal')).toBe('journal')
  })
})
