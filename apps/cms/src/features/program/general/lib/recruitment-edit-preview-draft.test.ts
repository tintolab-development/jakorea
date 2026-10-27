import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { programToRecruitmentTabEditValues } from '@/features/program/general/lib/general-program-recruitment-edit-seed'
import { buildGeneralProgramPortalPreview } from '@/features/program/general/lib/platform-preview-payload'
import {
  buildRecruitmentEditPreviewDraft,
  recruitmentAudienceFromDetailTab,
} from '@/features/program/general/lib/recruitment-edit-preview-draft'
import {
  patchGeneralRecruitOverlay,
  peekGeneralRecruitOverlayRecord,
  resetGeneralRecruitOverlayStoreForTests,
  setGeneralRecruitOverlayScope,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

function makeProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: '186410',
    sponsorId: 'sp-1',
    title: '미리보기 스냅샷',
    type: 'offline',
    format: 'course',
    category: 'school',
    backendProgramType: 'GENERAL_ORGANIZATION',
    rounds: [],
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    applicationStartDate: '2026-09-01',
    applicationEndDate: '2026-09-20',
    status: 'active',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
    description: '저장본 프로그램 설명',
    recruitmentGuide: '<p>저장본 모집 안내</p>',
    generalCommonInfo: {
      announcementTitle: '저장본 공고',
      participantRecruitmentInfo: {
        programDescription: '저장본 프로그램 설명',
        recruitmentGuide: '<p>저장본 모집 안내</p>',
        additionalContentHtml: '<p>저장본 추가</p>',
      },
    },
    programRecruitments: [
      {
        id: 11,
        recruitmentType: 'PARTICIPANT',
        applicationType: 'ORGANIZATION',
        programDescription: '저장본 프로그램 설명',
        recruitmentGuide: '<p>저장본 모집 안내</p>',
        additionalContentHtml: '<p>저장본 추가</p>',
      },
    ],
    ...overrides,
  } as Program
}

describe('recruitmentAudienceFromDetailTab', () => {
  it('모집 탭을 저장 audience로 매핑한다', () => {
    expect(recruitmentAudienceFromDetailTab('institutions')).toBe('participant')
    expect(recruitmentAudienceFromDetailTab('instructors')).toBe('instructor')
    expect(recruitmentAudienceFromDetailTab('volunteers')).toBe('volunteer')
  })
})

describe('buildRecruitmentEditPreviewDraft', () => {
  beforeEach(() => {
    resetGeneralRecruitOverlayStoreForTests()
  })

  it('수정 중인 프로그램 설명·모집 안내를 저장본 행보다 먼저 미리보기에 넣는다', () => {
    const program = makeProgram()
    const values = {
      ...programToRecruitmentTabEditValues(program, 'participant'),
      description: '수정 중 프로그램 설명',
      recruitmentGuide: '<p>수정 중 모집 안내</p>',
      additionalContentHtml: '<p>수정 중 추가</p>',
    }
    const overlayBefore = peekGeneralRecruitOverlayRecord('recruitment-participant-school')
    const draft = buildRecruitmentEditPreviewDraft({
      program,
      values,
      audience: 'participant',
    })
    const overlayAfter = peekGeneralRecruitOverlayRecord('recruitment-participant-school')
    const detail = buildGeneralProgramPortalPreview({
      audience: 'institutions',
      program: draft.program,
      extraOverlay: draft.extraOverlay,
    })

    expect(overlayAfter).toEqual(overlayBefore)
    expect(draft.extraOverlay['recruit.detailInfo.programDescription']).toBe(
      '수정 중 프로그램 설명'
    )
    expect(detail.summary).toBe('수정 중 프로그램 설명')
    expect(detail.recruitmentGuide).toBe('<p>수정 중 모집 안내</p>')
    expect(detail.additionalContentHtml).toBe('<p>수정 중 추가</p>')
  })

  it('overlay store의 옛 문구가 있어도 draft + extraOverlay는 폼 값을 유지한다', () => {
    setGeneralRecruitOverlayScope('recruitment-participant-school')
    patchGeneralRecruitOverlay({
      'recruit.detailInfo.programDescription': 'overlay 옛 설명',
      'recruit.detailInfo.recruitmentGuide': '<p>overlay 옛 안내</p>',
    })
    const program = makeProgram()
    const values = {
      ...programToRecruitmentTabEditValues(program, 'participant'),
      description: '폼 설명',
      recruitmentGuide: '<p>폼 안내</p>',
    }
    const overlayBefore = peekGeneralRecruitOverlayRecord('recruitment-participant-school')
    const draft = buildRecruitmentEditPreviewDraft({
      program,
      values,
      audience: 'participant',
    })
    const overlayAfter = peekGeneralRecruitOverlayRecord('recruitment-participant-school')
    const detail = buildGeneralProgramPortalPreview({
      audience: 'institutions',
      program: draft.program,
      extraOverlay: draft.extraOverlay,
    })

    expect(overlayAfter).toEqual(overlayBefore)
    expect(detail.summary).toBe('폼 설명')
    expect(detail.recruitmentGuide).toBe('<p>폼 안내</p>')
  })
})
