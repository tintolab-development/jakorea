import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  formatDateRange,
  resolvePersistedProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { GENERAL_RECRUIT_OVERLAY_KEYS } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import {
  replaceGeneralRecruitOverlay,
  resetGeneralRecruitOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { parseDisplayPeriodLabelToIsoRange } from './general-program-recruitment-operation-period'
import {
  parseTargetLevelsFromDisplayLabel,
  programToRecruitmentTabEditValues,
  resolveGeneralProgramForRecruitmentEdit,
} from './general-program-recruitment-edit-seed'

describe('programToRecruitmentTabEditValues volunteer nested seed', () => {
  it('봉사자 탭은 nested 서류·면접 값을 공용 컬럼보다 우선 시드한다', () => {
    const program = {
      id: '186068',
      title: '테스트',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      documentPassAnnouncementDate: '2026-01-01T00:00:00+09:00',
      documentPassAnnouncementMethod: '공용',
      interviewStartDate: '2026-01-10T00:00:00+09:00',
      interviewEndDate: '2026-01-12T00:00:00+09:00',
      interviewMethod: '대면',
      generalCommonInfo: {
        volunteerRecruitmentInfo: {
          documentPassAnnouncementDate: '2026-11-05T00:00:00+09:00',
          documentPassAnnouncementMethod: '이메일',
          interviewStartDate: '2026-11-10T00:00:00+09:00',
          interviewEndDate: '2026-11-12T00:00:00+09:00',
          interviewMethod: '온라인',
          finalPassAnnouncementDate: '2026-11-20T00:00:00+09:00',
          finalPassAnnouncementMethod: '문자',
        },
      },
    } as Program

    const values = programToRecruitmentTabEditValues(program, 'volunteer')
    expect(values.documentPassAnnouncementMethod).toBe('이메일')
    expect(values.interviewMethod).toBe('온라인')
    expect(values.finalPassAnnouncementMethod).toBe('문자')
    expect(String(values.documentPassAnnouncementDate)).toContain('2026-11-05')
    expect(String(values.interviewStartDate)).toContain('2026-11-10')
  })
})

describe('resolveGeneralProgramForRecruitmentEdit', () => {
  it('strict remote 모드에서는 브라우저 in-memory 모집 overlay를 사용하지 않는다', () => {
    replaceGeneralRecruitOverlay({
      [GENERAL_RECRUIT_OVERLAY_KEYS.detailInfo.participantDescription]: '브라우저 임시값',
    })
    const program = {
      id: 'trained-teacher-remote-1',
      title: '원격 프로그램',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '원격 컬럼 설명',
      generalCommonInfo: {
        participantRecruitmentInfo: {
          programDescription: '원격 모집 설명',
        },
      },
    } as Program

    try {
      expect(
        resolveGeneralProgramForRecruitmentEdit(program, { strictRemote: true }).description
      ).toBe('원격 컬럼 설명')
    } finally {
      resetGeneralRecruitOverlayStoreForTests()
    }
  })

  it('participantRecruitmentInfo 라벨만 있을 때 targetLevels·기간을 폼 시드용 program에 채운다', () => {
    const program = {
      id: 'general-prog-1',
      title: '테스트',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '공통 설명',
      generalCommonInfo: {
        participantRecruitmentInfo: {
          educationTarget: '고등학교',
          educationTargetDetail: '모집 상세',
          recruitmentPeriodLabel: '2025-12-08 ~ 2026-01-16',
          operationPeriodLabel: '2026-04-01 ~ 2026-12-31',
          inquiryTel: '02-6085-6028',
          inquiryEmail: 'recruit@jakorea.org',
          contactOrganizationName: '모집 문의처',
          programDescription: '모집 전용 설명',
        },
      },
    } as Program

    const merged = resolveGeneralProgramForRecruitmentEdit(program)
    expect(merged.targetLevels).toEqual(['high'])
    expect(merged.educationTargetDetail).toBe('모집 상세')
    expect(merged.applicationStartDate).toBeTruthy()
    expect(merged.applicationEndDate).toBeTruthy()

    const values = programToRecruitmentTabEditValues(program, 'participant')
    expect(values.participantProgramOperationStartDate).toBeTruthy()
    expect(values.participantProgramOperationEndDate).toBeTruthy()
    expect(values.targetLevels).toEqual(['high'])
    expect(values.educationTargetDetail).toBe('모집 상세')
    expect(values.description).toBe('모집 전용 설명')
    expect(values.recruitmentContactOrganizationName).toBe('모집 문의처')
    expect(values.contactPhone).toBe('02-6085-6028')
  })

  it('참여자 모집 비고는 remarks에 넣고 otherNotes(기타 안내)와 섞지 않는다', () => {
    const program = {
      id: 'general-prog-notes',
      title: '비고',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      otherNotes: '기타 안내',
      remarks: '컬럼 비고',
      generalCommonInfo: {
        participantRecruitmentInfo: {
          remarks: '모집 비고',
        },
      },
    } as Program

    const values = programToRecruitmentTabEditValues(program, 'participant')
    expect(values.remarks).toBe('모집 비고')
    expect(values.otherNotes).toBe('기타 안내')
  })

  it('강사·봉사자 모집 비고는 각 nested remarks를 해당 폼 필드에 넣는다', () => {
    const program = {
      id: 'general-prog-audience-notes',
      title: '비고',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      otherNotes: '기타 안내',
      oneLineIntroduction: '한줄 소개',
      generalCommonInfo: {
        instructorRecruitmentInfo: { remarks: '강사 비고' },
        volunteerRecruitmentInfo: { remarks: '봉사자 비고' },
      },
    } as Program

    expect(programToRecruitmentTabEditValues(program, 'instructor').instructorRecruitmentRemarks).toBe(
      '강사 비고'
    )
    expect(programToRecruitmentTabEditValues(program, 'instructor').otherNotes).toBe('기타 안내')
    expect(programToRecruitmentTabEditValues(program, 'volunteer').oneLineIntroduction).toBe(
      '봉사자 비고'
    )
    expect(programToRecruitmentTabEditValues(program, 'volunteer').otherNotes).toBe('기타 안내')
  })

  it('봉사자 기타사항은 행 otherMatters를 쓰고 비고·프로그램 공통을 섞지 않는다', () => {
    const program = {
      id: 'general-prog-volunteer-other-matters',
      title: '기타사항',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      otherNotes: '프로그램 공통 기타',
      oneLineIntroduction: '한줄 소개',
      generalCommonInfo: {
        volunteerRecruitmentInfo: { remarks: '봉사자 비고', otherMatters: 'nested 기타' },
      },
      programRecruitments: [
        {
          id: 186070,
          recruitmentType: 'VOLUNTEER',
          remarks: '행 비고',
          otherMatters: '행 기타사항',
        },
      ],
    } as Program

    const values = programToRecruitmentTabEditValues(program, 'volunteer')
    expect(values.otherNotes).toBe('행 기타사항')
    expect(values.oneLineIntroduction).toBe('봉사자 비고')
  })

  it('강사 비고는 nested remarks, 기타사항은 행 otherMatters다', () => {
    const program = {
      id: 'general-prog-instructor-remarks-row',
      title: '비고',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      otherNotes: '프로그램 공통 기타',
      generalCommonInfo: {
        instructorRecruitmentInfo: {
          remarks: '신청 전 학교 담당 교사 확인이 필요합니다.',
          otherMatters: '옛 nested 기타',
        },
      },
      programRecruitments: [
        {
          id: 186069,
          recruitmentType: 'INSTRUCTOR',
          remarks: '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>',
          otherMatters: '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>',
        },
      ],
    } as Program

    const values = programToRecruitmentTabEditValues(program, 'instructor')
    expect(values.instructorRecruitmentRemarks).toBe(
      '신청 전 학교 담당 교사 확인이 필요합니다.'
    )
    expect(values.otherNotes).toBe(
      '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>'
    )
  })

  it('조회 leftover overlay notes가 기타사항과 같아도 비고 시드에 넣지 않는다', () => {
    const html = '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>'
    const keys = GENERAL_RECRUIT_OVERLAY_KEYS
    const program = {
      id: 'general-prog-instructor-leftover-notes',
      title: '비고',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      otherNotes: '프로그램 공통 기타',
      registrationOverlay: {
        [keys.instructor.notes]: html,
        [keys.detailInfo.instructorOtherNotes]: html,
      },
      generalCommonInfo: {
        instructorRecruitmentInfo: { otherMatters: '옛 nested 기타' },
      },
      programRecruitments: [
        {
          id: 186069,
          recruitmentType: 'INSTRUCTOR',
          remarks: html,
          otherMatters: html,
        },
      ],
    } as unknown as Program

    const values = programToRecruitmentTabEditValues(program, 'instructor')
    expect(values.instructorRecruitmentRemarks).toBeUndefined()
    expect(values.otherNotes).toBe(html)
  })

  it('강사 모집 대상 라벨을 instructorTargets로 복원한다', () => {
    const program = {
      id: 'general-prog-2',
      title: '강사',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      generalCommonInfo: {
        instructorRecruitmentInfo: {
          recruitmentTarget: '성인, 대학생',
          recruitmentTargetDetail: '상세',
          recruitmentPeriodLabel: '2026-01-01 ~ 2026-01-31',
          programDescription: '강사 모집 설명',
        },
      },
    } as Program

    const values = programToRecruitmentTabEditValues(program, 'instructor')
    expect(values.instructorTargets).toEqual(['adult', 'university'])
    expect(values.instructorTargetDetail).toBe('상세')
    expect(values.description).toBe('강사 모집 설명')
    expect(values.instructorApplicationStartDate).toBeTruthy()
  })

  it('1사1교 저장된 registrationOverlay 모집 대상을 edit 시드에 반영한다', () => {
    const program = {
      id: 'company-school-prog-1',
      title: '1사1교',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      registrationOverlay: {
        'recruit.targetLevels': ['middle', 'high'],
        'recruit.targetLevelDetail': '중고등 상세',
      },
    } as unknown as Program

    const values = programToRecruitmentTabEditValues(program, 'participant')
    expect(values.targetLevels).toEqual(['middle', 'high'])
    expect(values.educationTargetDetail).toBe('중고등 상세')
  })

  it('시드 leftover overlay가 중첩·컬럼보다 긴 배열이어도 이기지 않는다', () => {
    const program = {
      id: 'general-prog-leftover-levels',
      title: 'leftover',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      targetLevel: 'high',
      targetLevels: ['high'],
      generalCommonInfo: {
        participantRecruitmentInfo: {
          educationTarget: '고등학교',
        },
      },
      registrationOverlay: {
        'recruit.targetLevels': ['elementary', 'middle', 'high'],
        'recruit.individual.targetLevels': ['elementary', 'middle', 'high'],
      },
    } as unknown as Program

    const values = programToRecruitmentTabEditValues(program, 'participant')
    expect(values.targetLevels).toEqual(['high'])
  })

  it('조회 라벨이 더 많은 교육 대상이면 수정 시드는 컬럼 1개를 덮는다', () => {
    const program = {
      id: 'general-prog-multi-target',
      title: '복수 대상',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      targetLevel: 'middle',
      targetLevels: ['middle'],
      generalCommonInfo: {
        participantRecruitmentInfo: {
          educationTarget: '중학교 1~3학년, 대학교 1~2학년',
        },
      },
      registrationOverlay: {
        'recruit.individual.targetLevels': ['middle', 'university'],
      },
    } as unknown as Program

    const values = programToRecruitmentTabEditValues(program, 'participant')
    expect(values.targetLevels).toEqual(['middle', 'university'])
  })

  it('모집 탭 시드는 공통정보 공고명을 행 공고명으로 바꾸지 않는다', () => {
    const program = {
      id: 'general-prog-public-title',
      title: '대표 프로그램명',
      mainTitle: '대표 프로그램명',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      backendProgramType: 'GENERAL',
      generalCommonInfo: { announcementTitle: '공통 공고명' },
      programRecruitments: [
        { id: 1, recruitmentType: 'PARTICIPANT', announcementTitle: null },
      ],
    } as Program

    expect(programToRecruitmentTabEditValues(program, 'participant').announcementTitle).toBe(
      '공통 공고명'
    )
  })

  it('기존 program 컬럼이 있으면 nested 라벨로 덮어쓰지 않는다', () => {
    const program = {
      id: 'general-prog-3',
      title: '유지',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      description: '',
      targetLevels: ['middle'],
      applicationStartDate: '2026-02-01T00:00:00.000Z',
      generalCommonInfo: {
        participantRecruitmentInfo: {
          educationTarget: '고등학교',
          recruitmentPeriodLabel: '2025-01-01 ~ 2025-01-31',
        },
      },
    } as Program

    const merged = resolveGeneralProgramForRecruitmentEdit(program)
    expect(merged.targetLevels).toEqual(['middle'])
    expect(merged.applicationStartDate).toBe('2026-02-01T00:00:00.000Z')

    const values = programToDetailEditValues(merged)
    expect(values.targetLevels).toEqual(['middle'])
  })
})

describe('resolvePersistedProgramTargetLevels', () => {
  it('컬럼 배열이 있으면 모집 라벨로 확대하지 않는다', () => {
    expect(
      resolvePersistedProgramTargetLevels({
        targetLevel: 'elementary',
        targetLevels: ['elementary'],
        generalCommonInfo: {
          participantRecruitmentInfo: {
            educationTarget: '초등학교, 중학교, 대학(원)생',
          },
        },
      })
    ).toEqual(['elementary'])
  })

  it('컬럼 키가 없을 때만 모집 라벨로 hydrate한다', () => {
    expect(
      resolvePersistedProgramTargetLevels({
        targetLevel: 'elementary',
        generalCommonInfo: {
          participantRecruitmentInfo: {
            educationTarget: '초등학교, 중학교, 대학(원)생',
          },
        },
      })
    ).toEqual(['elementary', 'middle', 'university'])
  })
})

describe('parse helpers', () => {
  it('parseTargetLevelsFromDisplayLabel', () => {
    expect(parseTargetLevelsFromDisplayLabel('초등, 중학교')).toEqual(['elementary', 'middle'])
    expect(parseTargetLevelsFromDisplayLabel('중학교 1~3학년, 대학교 1~2학년')).toEqual([
      'middle',
      'university',
    ])
  })

  it('parseDisplayPeriodLabelToIsoRange', () => {
    const range = parseDisplayPeriodLabelToIsoRange('2026.04.03(금) ~ 2026.11.20(금)')
    expect(range.start).toBeTruthy()
    expect(range.end).toBeTruthy()
  })

  it('parseDisplayPeriodLabelToIsoRange keeps clock when present', () => {
    const range = parseDisplayPeriodLabelToIsoRange(
      '2026.04.03(금) 09:30 ~ 2026.11.20(금) 18:00'
    )
    expect(dayjs(range.start).format('YYYY-MM-DD HH:mm')).toBe('2026-04-03 09:30')
    expect(dayjs(range.end).format('YYYY-MM-DD HH:mm')).toBe('2026-11-20 18:00')
  })

  it('formatDateRange keeps clock when present', () => {
    expect(
      formatDateRange('2026-04-03T09:30:00+09:00', '2026-11-20T18:00:00+09:00')
    ).toBe('2026.04.03(금) 09:30 ~ 2026.11.20(금) 18:00')
  })
})
