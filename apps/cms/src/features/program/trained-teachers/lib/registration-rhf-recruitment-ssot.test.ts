import { describe, expect, it } from 'vitest'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS as K } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { buildTrainedTeachersProgramFromRhf } from './build-registration-create-from-canonical'
import { createDefaultTrainedTeachersRegistrationRhfValues } from './registration-rhf-values'
import {
  applyTrainedTeachersRecruitmentOverlayRecord,
  emptyTrainedTeachersRecruitFormState,
  importLegacyTrainedTeachersRecruitmentOverlay,
  serializeTrainedTeachersRecruitmentForFormVersion,
} from './registration-rhf-recruitment'
import { listIncompleteTrainedTeachersRecruitmentRequiredFields } from './trained-teachers-recruitment-required-fields'

function filledRecruit() {
  return {
    ...emptyTrainedTeachersRecruitFormState(),
    announcementPublished: 'published',
    studentListRequired: 'need',
    maxClassCount: 20,
    maxScheduleCount: 3,
    maxSessionsPerDay: 2,
    programRangeSeal: { start: '2026-04-01', end: '2026-12-31' },
    recruitRangeSeal: { start: '2026-03-01', end: '2026-03-31' },
    finalAnnounceIso: '2026-04-02',
    finalAnnounceMethod: '홈페이지',
    targetLevels: ['ELEMENTARY'],
    targetLevelDetail: '초등 전학년',
    inquiryContact: '담당자',
    inquiryTel: '02-0000-0000',
    inquiryEmail: 'tt@example.com',
    notesNotApplicable: false,
    notes: 'RHF 비고',
    additionalContentHtml: '<p>RHF 상세</p>',
    attachmentFileObjectIds: [11, 22],
  }
}

describe('TT 등록 모집 RHF SSOT', () => {
  it('RHF와 Overlay가 달라도 CREATE·PUT은 RHF를 쓴다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    values.recruitment = filledRecruit()
    const stale = {
      [K.maxClassCount]: 40,
      [K.notes]: '오래된 비고',
      'trainedTeachersRecruit.detailInfo.additionalContentHtml': '<p>old</p>',
    }
    const afterStale = applyTrainedTeachersRecruitmentOverlayRecord(
      emptyTrainedTeachersRecruitFormState(),
      stale
    )
    expect(afterStale.maxClassCount).toBe(40)

    const program = buildTrainedTeachersProgramFromRhf({ id: 'tt-recruit', values })
    expect(program.generalCommonInfo?.participantRecruitmentInfo?.maxClassCount).toBe(20)
    const overlay = serializeTrainedTeachersRecruitmentForFormVersion(values.recruitment)
    expect(overlay[K.maxClassCount]).toBe(20)
    expect(overlay[K.notes]).toBe('RHF 비고')
    expect(overlay['trainedTeachersRecruit.detailInfo.additionalContentHtml']).toBe('<p>RHF 상세</p>')
    expect(JSON.stringify(overlay)).not.toContain('application.trainedTeachers')
  })

  it('명시적 빈 값은 stale Overlay를 복원하지 않는다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    values.recruitment = {
      ...filledRecruit(),
      notes: '',
      targetLevels: [],
      attachmentFileObjectIds: [],
    }
    const overlay = serializeTrainedTeachersRecruitmentForFormVersion(values.recruitment)
    expect(overlay[K.notes]).toBe('')
    expect(overlay[K.targetLevels]).toEqual([])
    expect(overlay['trainedTeachersRecruit.detailInfo.attachmentFileObjectIds']).toEqual([])
  })

  it('운영기간과 모집기간을 분리한다', () => {
    const state = filledRecruit()
    const overlay = serializeTrainedTeachersRecruitmentForFormVersion(state)
    expect(overlay[K.programRangeSeal]).toEqual({ start: '2026-04-01', end: '2026-12-31' })
    expect(overlay[K.recruitRangeSeal]).toEqual({ start: '2026-03-01', end: '2026-03-31' })
  })

  it('blob URL을 Form Version에 넣지 않는다', () => {
    const overlay = serializeTrainedTeachersRecruitmentForFormVersion({
      ...filledRecruit(),
      thumbContentUrl: 'blob:https://cms.local/preview',
      thumbFileObjectId: 42,
    })
    expect(overlay['trainedTeachersRecruit.detailInfo.thumbContentUrl']).toBeUndefined()
    expect(overlay['trainedTeachersRecruit.detailInfo.thumbFileObjectId']).toBe(42)
  })

  it('TT 고정값을 Overlay 과거값으로 바꾸지 않는다', () => {
    const overlay = serializeTrainedTeachersRecruitmentForFormVersion(filledRecruit())
    expect(overlay[K.maxAssignableInstructors]).toBe(0)
    expect(overlay[K.preguidanceRequired]).toBe(false)
  })

  it('typed snapshot이 있으면 Legacy overlay를 무시한다', () => {
    const typed = filledRecruit()
    const imported = importLegacyTrainedTeachersRecruitmentOverlay({
      [K.maxClassCount]: 99,
      [K.notes]: '레거시',
    })
    expect(imported.maxClassCount).toBe(99)
    expect(typed.maxClassCount).toBe(20)
    expect(typed.notes).not.toBe(imported.notes)
  })

  it('비노출 사전안내·최대강사는 필수 오류가 아니다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    values.recruitment = filledRecruit()
    const reasons = listIncompleteTrainedTeachersRecruitmentRequiredFields(values)
    expect(reasons.some(key => key.includes('preguidance'))).toBe(false)
    expect(reasons.some(key => key.includes('maxAssignable'))).toBe(false)
    expect(reasons).toEqual([])
  })

  it('공고 게시 여부 빈 값은 필수 오류다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    values.recruitment = { ...filledRecruit(), announcementPublished: '' }
    expect(listIncompleteTrainedTeachersRecruitmentRequiredFields(values)).toContain(
      'recruit.institution.announcementPublished'
    )
  })
})
