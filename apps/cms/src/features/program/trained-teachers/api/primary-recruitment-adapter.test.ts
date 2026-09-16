import { describe, expect, it } from 'vitest'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import { resolveGeneralProgramParticipantRecruitmentDisplay } from '@/features/program/general/lib/participant-recruitment-display'
import { mapTrainedTeacherDetailToProgram } from './adapters'
import { parseTrainedTeacherServiceDetailJson } from './service-detail-json'

/** TCH-05 (186005) 스타일 — BE flat+nested config_jsonb */
const TCH_05_FLAT_CONFIG = {
  schemaVersion: 1,
  seedCase: 'TCH-05',
  frontendProgramId: 'trained-teacher-primary-case-05',
  generalProgramAudience: 'organization',
  generalProgramEducationStructure: 'schedule',
  generalProgramSessionRound: 'single',
  generalParticipantTypes: ['school_institution'],
  studentListRequired: 'not_required',
  announcementPublished: true,
  announcementPublishedLabel: '게시',
  preEducationNoticeRequired: false,
  preEducationNoticeRequiredLabel: '해당없음',
  maxAssignableInstructors: 0,
  maxClassCount: 1,
  inquiryTel: '010-8681-6741',
  inquiryEmail: 'bjh1234@tinto.co.kr',
  remarks: 'TCH-05 로컬 데모',
  otherMatters: '기타 사항',
  participantRecruitment: {
    announcementPublished: true,
    announcementPublishedLabel: '게시',
    studentListRequired: 'not_required',
    studentListRequiredLabel: '제출 불필요',
    preEducationNoticeRequired: false,
    preEducationNoticeRequiredLabel: '해당없음',
    maxAssignableInstructors: 0,
    maxClassCount: 1,
    operationPeriodLabel: '2026-09-01 ~ 2026-11-30',
    recruitmentPeriodLabel: '2026-08-01 ~ 2026-08-31',
    finalAnnouncementLabel: '2026-08-31 | 담당교사 개별 안내',
    educationTarget: '초등',
    educationTargetDetail: '초등학교 5~6학년',
    contactOrganizationName: '로컬나눔은행',
    contactName: '백진혁',
    inquiryTel: '010-8681-6741',
    inquiryEmail: 'bjh1234@tinto.co.kr',
    remarks: 'TCH-05 로컬 데모',
  },
  generalCommonInfo: {
    participantRecruitmentInfo: {
      announcementPublished: true,
      announcementPublishedLabel: '게시',
      studentListRequired: 'not_required',
      studentListRequiredLabel: '제출 불필요',
      preEducationNoticeRequired: false,
      preEducationNoticeRequiredLabel: '해당없음',
      maxAssignableInstructors: 0,
      maxClassCount: 1,
      operationPeriodLabel: '2026-09-01 ~ 2026-11-30',
      recruitmentPeriodLabel: '2026-08-01 ~ 2026-08-31',
      finalAnnouncementLabel: '2026-08-31 | 담당교사 개별 안내',
      educationTarget: '초등',
      educationTargetDetail: '초등학교 5~6학년',
      contactOrganizationName: '로컬나눔은행',
      contactName: '백진혁',
      inquiryTel: '010-8681-6741',
      inquiryEmail: 'bjh1234@tinto.co.kr',
      remarks: 'TCH-05 로컬 데모',
    },
  },
}

describe('trained-teacher Primary recruitment adapter', () => {
  it('parses flat Primary serviceDetailJson (not only {program} envelope)', () => {
    const partial = parseTrainedTeacherServiceDetailJson(JSON.stringify(TCH_05_FLAT_CONFIG))
    expect(partial.studentListRequired).toBe('not_required')
    expect(partial.generalParticipantTypes).toEqual(['school_institution'])
    expect(partial.generalCommonInfo?.participantRecruitmentInfo?.maxAssignableInstructors).toBe(0)
    expect(partial.generalCommonInfo?.participantRecruitmentInfo?.maxClassCount).toBe(1)
    expect(
      (partial.generalCommonInfo?.participantRecruitmentInfo as { inquiryTel?: string } | undefined)
        ?.inquiryTel
    ).toBe('010-8681-6741')
    expect(partial.generalCommonInfo?.instructorRecruitmentInfo).toBeUndefined()
    expect(partial.generalCommonInfo?.volunteerRecruitmentInfo).toBeUndefined()
  })

  it('maps 186005 detail with recruitmentGuide, otherNotes, and display labels', () => {
    const program = mapTrainedTeacherDetailToProgram({
      id: '186005',
      programType: 'TRAINED_TEACHER',
      title: '[교육받은 교사] TCH-05',
      mainTitle: 'TCH-05',
      contactName: '백진혁',
      contactEmail: 'bjh1234@tinto.co.kr',
      contactPhone: '010-8681-6741',
      recruitmentGuide: '참여자 모집 안내 — TCH-05',
      keyVisualImage: 'https://local.example/demo/trained-teacher-primary-case-05-key-visual.png',
      remarks: 'TCH-05 로컬 데모',
      educationStructure: 'SCHEDULE',
      serviceDetailJson: JSON.stringify(TCH_05_FLAT_CONFIG),
    } as ProgramResponse)

    expect(program.recruitmentGuide).toBe('참여자 모집 안내 — TCH-05')
    expect(program.keyVisualImage).toContain('trained-teacher-primary-case-05')
    expect(program.otherNotes).toBe('TCH-05 로컬 데모')
    expect(program.studentListRequired).toBe('not_required')
    expect(program.generalProgramEducationStructure).toBe('schedule')
    expect(program.generalCommonInfo?.instructorRecruitmentInfo).toBeUndefined()
    expect(program.generalCommonInfo?.volunteerRecruitmentInfo).toBeUndefined()

    const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)
    expect(display.announcementPublishedLabel).toBe('게시')
    expect(display.preEducationNoticeLabel).toBe('해당없음')
    expect(display.studentListLabel).toBe('제출 불필요')
    expect(display.maxInstructorsLabel).toBe('0명')
    expect(display.maxClassLabel).toBe('1개')
    expect(display.operationPeriodLabel).not.toBe('-')
    expect(display.recruitmentPeriodLabel).not.toBe('-')
    expect(display.targetLabel).toBe('초등')
    expect(display.targetDetailLabel).toBe('초등학교 5~6학년')
    expect(display.contactOrganizationName).toBe('로컬나눔은행 / 백진혁')
    expect(display.contactPhone).toBe('010-8681-6741')
    expect(display.contactEmail).toBe('bjh1234@tinto.co.kr')
    expect(display.notes).toContain('TCH-05')
  })

  it('maps roster-required cases (TCH-04/08) as 제출 필요', () => {
    const rosterRequired = {
      ...TCH_05_FLAT_CONFIG,
      studentListRequired: 'required',
      generalCommonInfo: {
        participantRecruitmentInfo: {
          ...TCH_05_FLAT_CONFIG.generalCommonInfo.participantRecruitmentInfo,
          studentListRequired: 'required',
          studentListRequiredLabel: '제출 필요',
        },
      },
    }
    const program = mapTrainedTeacherDetailToProgram({
      id: '186004',
      title: 'TCH-04',
      serviceDetailJson: JSON.stringify(rosterRequired),
    } as ProgramResponse)
    const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)
    expect(display.studentListLabel).toBe('제출 필요')
  })

  it('still accepts FE write {schemaVersion, program} envelope', () => {
    const envelope = {
      schemaVersion: 1,
      program: {
        generalProgramEducationStructure: 'curriculum',
        studentListRequired: 'not_required',
        generalCommonInfo: {
          participantRecruitmentInfo: {
            maxAssignableInstructors: 0,
            announcementPublishedLabel: '게시',
          },
        },
      },
    }
    const partial = parseTrainedTeacherServiceDetailJson(JSON.stringify(envelope))
    expect(partial.generalProgramEducationStructure).toBe('curriculum')
    expect(partial.generalCommonInfo?.participantRecruitmentInfo?.maxAssignableInstructors).toBe(0)
    expect(partial.generalParticipantTypes).toEqual(['school_institution'])
  })
})
