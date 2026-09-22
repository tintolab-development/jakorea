import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  detailEditValuesToProgramPatch,
  programDetailTrainedTeachersCommonInfoEditSchema,
  programToDetailEditValues,
} from './program-detail-edit-schema'

const program = {
  id: 'program-1',
  title: '기존 제목',
  category: 'school',
  type: 'offline',
  format: 'workshop',
  status: 'active',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  sponsorId: 'sponsor-1',
  managerName: '담당자',
  description: '설명',
  learningSupportContent: '지원',
  applicationStartDate: '2026-01-01',
  applicationEndDate: '2026-01-31',
  resultAnnouncementDate: '2026-02-01',
  resultAnnouncementMethod: '개별 안내',
  rounds: [],
  generalCommonInfo: {
    announcementTitle: '기존 공고명',
    detailedProgramName: '기존 세부명',
  },
} as Program

describe('program detail trained teachers boolean fields', () => {
  it('partnerInvolvement null 을 허용한다', () => {
    const values = {
      ...programToDetailEditValues(program),
      partnerInvolvement: null,
    }

    const result = programDetailTrainedTeachersCommonInfoEditSchema.safeParse(values)
    expect(result.success).toBe(true)
  })

  it('programToDetailEditValues 는 partnerInvolvement null 을 false 로 정규화한다', () => {
    const values = programToDetailEditValues({
      ...program,
      partnerInvolvement: null,
    } as unknown as Program)

    expect(values.partnerInvolvement).toBe(false)
  })
})

describe('programToDetailEditValues keeps stored common info in edit fields', () => {
  it('공고명·세부명·일정명·진행 시간·IPS 상세를 수정 폼에 채운다', () => {
    const values = programToDetailEditValues({
      ...program,
      id: '186034',
      title: '교육받은교사(수정4)',
      mainTitle: '대표명',
      textbookName: '사회공헌 프로젝트',
      sponsorId: '1627251',
      managerName: '백진혁',
      venue: '별관 301호',
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        announcementTitle: '교육받은교사(수정4)',
        detailedProgramName: '사회공헌 프로젝트',
        sponsorManagementIds: ['1627251'],
        venueDetail: '별관 301호',
        educationFormLabel: '오프라인',
        scheduleDetails: [
          {
            scheduleLabel: '세부 일정 01',
            name: '교육받은교사(수정3)',
            progressTimeSummary: '15:43 ~ 16:43',
            ipsTypeSummary: 'Inspire | Kick-Off event (킥오프 행사)',
          },
        ],
      },
    } as Program)

    expect(values.announcementTitle).toBe('교육받은교사(수정4)')
    expect(values.mainTitle).toBe('대표명')
    expect(values.detailedProgramName).toBe('사회공헌 프로젝트')
    expect(values.sponsorManagementIds).toEqual(['1627251'])
    expect(values.managerName).toBe('백진혁')
    expect(values.venueDetail).toBe('별관 301호')
    expect(values.educationStructure).toBe('schedule')
    expect(values.sessionRound).toBe('single')
    expect(values.educationForm).toBe('offline')
    expect(values.ipsCategory).toBe('inspire')
    expect(values.ipsDetail).toBe('kick_off_event')
  })

  it('루트 IPS가 없어도 일정 행의 IPS 문구로 수정 셀렉트를 채운다', () => {
    const values = programToDetailEditValues({
      ...program,
      generalCommonInfo: {
        scheduleDetails: [
          {
            scheduleLabel: '세부 일정 01',
            name: '교육받은교사(수정3)',
            ipsTypeSummary: 'Inspire | Kick-Off event (킥오프 행사)',
          },
        ],
      },
    } as Program)

    expect(values.ipsCategory).toBe('inspire')
    expect(values.ipsDetail).toBe('kick_off_event')
  })
})

describe('program detail title edit fields', () => {
  it('공고용 프로그램명과 세부 프로그램명을 독립적으로 패치한다', () => {
    const values = {
      ...programToDetailEditValues(program),
      announcementTitle: '수정 공고명',
      detailedProgramName: '수정 세부명',
    }

    const patch = detailEditValuesToProgramPatch(values, program)

    expect(patch.title).toBe('수정 공고명')
    expect(patch.textbookName).toBe('수정 세부명')
    expect(patch.generalCommonInfo?.announcementTitle).toBe('수정 공고명')
    expect(patch.generalCommonInfo?.detailedProgramName).toBe('수정 세부명')
  })
})
