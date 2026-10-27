import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  applyRecruitmentRowCopy,
  hydrateGeneralRecruitmentInfoFromRows,
  pickRecruitmentCopyRow,
  resolveRecruitmentOtherMatters,
  resolveRecruitmentRemarks,
} from './recruitment-row-copy'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: '186021',
    title: '테스트',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    sponsorId: 'sponsor-1',
    rounds: [],
    otherNotes: '프로그램 공통 기타',
    oneLineIntroduction: '한줄 소개',
    ...overrides,
  } as Program
}

describe('resolveRecruitmentOtherMatters', () => {
  it('봉사자 행 otherMatters를 비고·프로그램 공통보다 먼저 쓴다', () => {
    const program = baseProgram({
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
    })

    expect(resolveRecruitmentOtherMatters(program, 'volunteer')).toBe('행 기타사항')
  })

  it('행이 비면 nested otherMatters를 쓰고 비고는 쓰지 않는다', () => {
    const program = baseProgram({
      generalCommonInfo: {
        volunteerRecruitmentInfo: { remarks: '봉사자 비고', otherMatters: 'nested 기타' },
      },
      programRecruitments: [{ id: 186070, recruitmentType: 'VOLUNTEER', remarks: '행 비고' }],
    })

    expect(resolveRecruitmentOtherMatters(program, 'volunteer')).toBe('nested 기타')
  })
})

describe('resolveRecruitmentRemarks', () => {
  it('강사 비고는 nested remarks만 쓰고 행 remarks를 쓰지 않는다', () => {
    const program = baseProgram({
      generalCommonInfo: {
        instructorRecruitmentInfo: {
          remarks: '신청 전 학교 담당 교사 확인이 필요합니다.',
          otherMatters: '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>',
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
    })

    expect(resolveRecruitmentRemarks(program, 'instructor')).toBe(
      '신청 전 학교 담당 교사 확인이 필요합니다.'
    )
    expect(resolveRecruitmentOtherMatters(program, 'instructor')).toBe(
      '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>'
    )
  })
})

describe('hydrateGeneralRecruitmentInfoFromRows', () => {
  it('강사 행 otherMatters만 nested에 넣고 remarks는 그대로 둔다', () => {
    const program = baseProgram({
      generalCommonInfo: {
        instructorRecruitmentInfo: {
          remarks: '신청 전 학교 담당 교사 확인이 필요합니다.',
          otherMatters: '옛 기타',
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
    })

    const next = hydrateGeneralRecruitmentInfoFromRows(program)
    expect(next.generalCommonInfo?.instructorRecruitmentInfo?.remarks).toBe(
      '신청 전 학교 담당 교사 확인이 필요합니다.'
    )
    expect(next.generalCommonInfo?.instructorRecruitmentInfo?.otherMatters).toBe(
      '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>'
    )
  })
})

describe('applyRecruitmentRowCopy', () => {
  it('강사·봉사자 행 기타사항은 otherNotes로, 비고는 oneLineIntroduction으로 넣는다', () => {
    const program = baseProgram({
      otherNotes: '공통 기타',
      programRecruitments: [
        {
          id: 186070,
          recruitmentType: 'VOLUNTEER',
          programDescription: '봉사자 설명',
          remarks: '봉사자 비고',
          otherMatters: '봉사자 기타사항',
        },
      ],
    })

    const next = applyRecruitmentRowCopy(program, 'volunteer')
    expect(next.otherNotes).toBe('봉사자 기타사항')
    expect(next.oneLineIntroduction).toBe('봉사자 비고')
    expect(next.description).toBe('봉사자 설명')
  })

  it('행 otherMatters가 없으면 overlay otherNotes(비고)를 비고로 덮지 않는다', () => {
    const program = baseProgram({
      otherNotes: 'overlay 비고',
      programRecruitments: [{ id: 1, recruitmentType: 'VOLUNTEER', remarks: '행 비고' }],
    })

    const next = applyRecruitmentRowCopy(program, 'volunteer')
    expect(next.otherNotes).toBe('overlay 비고')
    expect(next.oneLineIntroduction).toBe('행 비고')
  })

  it('빈 모집 행은 overlay로 채운 설명·안내를 지우고 빈 값으로 표시한다', () => {
    const program = baseProgram({
      description: '등록한 프로그램 설명',
      recruitmentGuide: '등록한 모집 안내',
      applicationMethod: '등록한 신청 방법',
      programRecruitments: [
        {
          id: 11,
          recruitmentType: 'PARTICIPANT',
          programDescription: '',
          recruitmentGuide: null,
          applicationMethod: undefined,
        },
      ],
    })

    const next = applyRecruitmentRowCopy(program, 'participant')
    expect(next.description).toBe('')
    expect(next.recruitmentGuide).toBe('')
    expect(next.applicationMethod).toBe('등록한 신청 방법')
  })
})

describe('pickRecruitmentCopyRow 활성 행', () => {
  it('참여자 행이 둘이면 activeRecruitmentId 행을 쓴다', () => {
    const program = baseProgram({
      activeRecruitmentId: 22,
      programRecruitments: [
        { id: 11, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION' },
        { id: 22, recruitmentType: 'PARTICIPANT', applicationType: 'INDIVIDUAL' },
      ],
    })
    expect(pickRecruitmentCopyRow(program, 'participant')?.id).toBe(22)
  })
})

describe('pickRecruitmentCopyRow 봉사자 반기', () => {
  it('recruitTerm이 있으면 시작일 순서보다 recruitTerm을 우선한다', () => {
    const program = baseProgram({
      programRecruitments: [
        { id: 2, recruitmentType: 'VOLUNTEER', recruitTerm: 'SECOND_HALF', startAt: '2026-01-01' },
        { id: 1, recruitmentType: 'VOLUNTEER', recruitTerm: 'FIRST_HALF', startAt: '2026-07-01' },
      ],
    })

    expect(pickRecruitmentCopyRow(program, 'volunteer', 'h1')?.id).toBe(1)
    expect(pickRecruitmentCopyRow(program, 'volunteer', 'h2')?.id).toBe(2)
  })

  it('하반기 행이 없으면 상반기 행을 하반기로 고르지 않는다', () => {
    const program = baseProgram({
      programRecruitments: [{ id: 1, recruitmentType: 'VOLUNTEER', recruitTerm: 'FIRST_HALF' }],
    })

    expect(pickRecruitmentCopyRow(program, 'volunteer', 'h2')).toBeUndefined()
  })

  it('recruitTerm이 없으면 시작일 순서로 고른다', () => {
    const program = baseProgram({
      programRecruitments: [
        { id: 2, recruitmentType: 'VOLUNTEER', startAt: '2026-07-01' },
        { id: 1, recruitmentType: 'VOLUNTEER', startAt: '2026-01-01' },
      ],
    })

    expect(pickRecruitmentCopyRow(program, 'volunteer', 'h1')?.id).toBe(1)
    expect(pickRecruitmentCopyRow(program, 'volunteer', 'h2')?.id).toBe(2)
  })
})
