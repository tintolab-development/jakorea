import { beforeEach, describe, expect, it } from 'vitest'
import {
  collectParticipantOverlayForVariant,
  participantEditorHydrateKey,
} from '@/features/template/hooks/use-program-participant-application-editor'
import { ujatApplicationInstitutionBlockIdsFromOverlay } from '@/features/template/lib/participant-application-editor-state'
import { UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS as AI } from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  resetGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  replaceUjatRecruitVolunteerOverlay,
  resetUjatRecruitVolunteerOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import { setOperationalOverlayScope } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import { restoreUjatVolunteerRecruitGeneralStoreSidecar } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-overlay'
import { programToUjatRecruitTemplateFormValues } from '@/features/program/ujat/lib/use-ujat-recruit-template-form-overlay-sync'
import { UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-volunteer-recruit-template-preview-program'
import { UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS as VK } from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'

const hydrateArgs = {
  templateId: 'recruitment-ujat-volunteer',
  usesRegistrationWizardDraft: true,
  localOnlyDraftPersistence: false,
  preferLocalDraft: false,
  wizardDraftRevision: 0,
} as const

describe('UJAT 등록 위저드 세션 스냅샷', () => {
  beforeEach(() => {
    resetUjatRecruitVolunteerOverlay()
    resetGeneralRecruitOverlay()
    setOperationalOverlayScope('recruitment-ujat-volunteer')
  })

  it('상·하반기 hydrate 키가 달라 스냅샷이 섞이지 않는다', () => {
    const h1 = participantEditorHydrateKey({ ...hydrateArgs, volunteerHalf: 'h1' })
    const h2 = participantEditorHydrateKey({ ...hydrateArgs, volunteerHalf: 'h2' })
    expect(h1).not.toBe(h2)
    expect(h1).toContain('::h1')
    expect(h2).toContain('::h2')
  })

  it('모집 overlay 캐시에 TipTap·면접 sidecar를 포함한다', () => {
    replaceUjatRecruitVolunteerOverlay({
      'ujat.recruit.volunteer.h1.publicTitle': '상반기 공고',
    })
    patchGeneralRecruitOverlay({
      'recruitVolunteer.h1.detailInfo.additionalContentHtml': '<p>상반기 상세</p>',
      'recruit.volunteer.h1.interview.slots': [{ id: 'slot-1', date: '2026-03-10' }],
    })
    expect(collectParticipantOverlayForVariant('ujat-recruit-volunteer')).toMatchObject({
      'ujat.recruit.volunteer.h1.publicTitle': '상반기 공고',
      'recruitVolunteer.h1.detailInfo.additionalContentHtml': '<p>상반기 상세</p>',
      'recruit.volunteer.h1.interview.slots': [{ id: 'slot-1', date: '2026-03-10' }],
    })
  })

  it('live 버킷이 비면 sidecar를 강제 복원한다', () => {
    restoreUjatVolunteerRecruitGeneralStoreSidecar(
      {
        'recruitVolunteer.h1.detailInfo.additionalContentHtml': '<p>복원</p>',
      },
      { forceEmptyLive: true }
    )
    expect(getGeneralRecruitOverlayRecord()['recruitVolunteer.h1.detailInfo.additionalContentHtml']).toBe(
      '<p>복원</p>'
    )
  })

  it('H1 입력 후 H2 폼으로 옮겨도 H1 공고명·대상이 섞이지 않는다', () => {
    const program = {
      ...UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      ujatRegistrationOverlay: {
        'ujat.recruit.volunteer.h1.publicTitle': '상반기 공고용 프로그램명',
        'ujat.recruit.volunteer.h1.volunteerTargets': ['대학생'],
        [VK.recruitRangeH1]: {
          start: '2026-03-01T00:00:00.000Z',
          end: '2026-03-31T00:00:00.000Z',
        },
      },
    }
    const h1 = programToUjatRecruitTemplateFormValues(program, 'volunteer', 'h1')
    const h2 = programToUjatRecruitTemplateFormValues(program, 'volunteer', 'h2')
    expect(h1.announcementTitle).toBe('상반기 공고용 프로그램명')
    expect(h1.volunteerTargets).toEqual(['university'])
    expect(h2.announcementTitle).toBe('')
    expect(h2.volunteerApplicationStartDate ?? '').toBe('')
  })

  it('신청 기관 학년/교시 표는 overlay 블록 ID를 재시드하지 않는다', () => {
    const gradeId = 'grade-keep-1'
    const classTimeId = 'class-keep-1'
    const restored = ujatApplicationInstitutionBlockIdsFromOverlay({
      [AI.gradeDetailByBlock]: {
        [gradeId]: { classCountInput: '2' },
      },
      [AI.classTimePeriodsByBlock]: {
        [classTimeId]: { '1': { start: '09:00', end: '09:45' } },
      },
    })
    expect(restored).toEqual({
      gradeIds: [gradeId],
      classTimeIds: [classTimeId],
    })
    expect(ujatApplicationInstitutionBlockIdsFromOverlay({})).toBeNull()
  })
})
