// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyOperationalOverlayForCatalogId,
  collectOperationalOverlayForCatalogId,
  resetOperationalOverlayForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  resetAllOperationalOverlayStores,
  setOperationalOverlayScope,
} from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  peekGeneralRecruitOverlayRecord,
  updateGeneralRecruitOverlayKey,
  useGeneralRecruitOverlayKv,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  getGeneralApplicationOverlayRecord,
  updateGeneralApplicationOverlayKey,
  useGeneralApplicationOverlayKv,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  getProgramRegistrationOverlayRecord,
  patchProgramRegistrationOverlay,
  peekProgramRegistrationOverlayRecord,
  readGeneralRegistrationOverlayScheduleLines,
  replaceProgramRegistrationOverlay,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { peekApplicantRecruitInstitutionOverlayRecord } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  mergeRecruitDetailInfoFromGeneralStore,
  pickUjatVolunteerRecruitGeneralStoreSidecar,
  replaceRecruitDetailInfoIntoGeneralStore,
  replaceUjatVolunteerRecruitGeneralStoreSidecar,
  restoreRecruitDetailInfoIntoGeneralStore,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-overlay'
import { readRecruitDetailMediaFromOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import {
  persistRecruitDetailDraftMediaFromOverlay,
  recruitDetailDraftMediaRestorePatch,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-draft-media-session'
import {
  flushRecruitDetailRichTextIntoGeneralRecruitOverlay,
  registerRecruitDetailRichTextHtml,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import { syncVolunteerInterviewRangeSealOverlay } from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import { applyEducationScheduleModeLineSwap } from '@/features/program/shared/lib/education-schedule-mode-lines'
import { resolveEducationScheduleGroupTimeSlots } from '@/features/program/general/lib/education-schedule-lines-display'
import { buildGeminiRecruitmentSnapshotFromOverlay } from '@/features/program/gemini/lib/recruitment/snapshot-from-overlay'
import { collectTrainedTeachersRecruitFormState } from '@/features/program/trained-teachers/lib/recruit-form-state'

/**
 * Part3 5단계(일반 단체·공통) 저장 결과 고정 — 6278e80a3(스토어)에서 스냅샷 생성, 전환 뒤에도 같아야 한다.
 * 모집 상세정보·미디어(공용 단락, 강사·Gemini·UJAT prefix 포함), 봉사자 모집 평면 키·면접 키(슬롯·예외 블록은 스토어 유지),
 * fixedScheduleSelected, 일반 등록 scheduleLines, TT 모집 fallback state.
 */
function sorted(record: Record<string, unknown> | null | undefined) {
  if (record == null) return record
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)))
}

const DETAIL = {
  'recruit.detailInfo.programDescription': '<p>개인 소개</p>',
  'recruit.detailInfo.additionalContentHtml': '<p>추가</p>',
  'recruit.detailInfo.thumbFileObjectId': 11,
  'recruit.detailInfo.thumbFileName': 'a.png',
  'recruit.detailInfo.thumbContentUrl': 'https://cdn.example/a.png',
  'recruit.detailInfo.attachmentFileObjectIds': [21, 22],
  'recruit.detailInfo.attachmentFileNames': ['a.pdf', 'b.pdf'],
}
const INSTRUCTOR_MEDIA = {
  'recruitInstructor.detailInfo.programDescription': '<p>강사</p>',
  'recruitInstructor.detailInfo.thumbFileObjectId': 31,
  'recruitInstructor.detailInfo.thumbFileName': 'i.png',
  'recruitInstructor.detailInfo.attachmentFileObjectIds': [41],
  'recruitInstructor.detailInfo.attachmentFileNames': ['i.pdf'],
}
const GEMINI_DETAIL = {
  'geminiRecruit.detailInfo.programDescription': '<p>제미니</p>',
  'geminiRecruit.detailInfo.thumbFileObjectId': 51,
  'geminiRecruit.detailInfo.thumbFileName': 'g.png',
  'geminiRecruit.detailInfo.attachmentFileNames': ['g.pdf'],
  'geminiRecruit.detailInfo.attachmentFileObjectIds': [61],
}
const VOLUNTEER = {
  'recruit.volunteer.announcementPublished': 'published',
  'recruit.volunteer.interviewRequired': 'yes',
  'recruit.volunteer.interviewMethod': '대면',
  'recruit.volunteer.interviewAnchorIso': '2026-11-21',
  'recruit.volunteer.interviewRangeSeal': { start: '2026-11-21', end: '2026-11-22' },
  'recruit.volunteer.volunteerTargets': ['univ'],
  'recruit.volunteer.notes': '봉사',
  'recruit.volunteer.interview.selectedSlotKeys': ['2026-11-21T10:00'],
  'recruit.volunteer.interview.timeUnit': 30,
  'recruit.volunteer.interview.exception.10.exceptionDate': '2026-11-22',
  'recruitVolunteer.detailInfo.programDescription': '<p>봉사 소개</p>',
}

describe('일반 단체·공통 overlay save parity (part3 step5)', () => {
  beforeEach(() => {
    resetAllOperationalOverlayStores()
    sessionStorage.clear()
  })

  it('모집 상세정보: 양식 불러오기(개인·강사·Gemini) → collect·peek·미디어 읽기', () => {
    applyOperationalOverlayForCatalogId('recruitment-participant-individual', {
      'recruit.individual.notes': '개인',
      ...DETAIL,
    })
    applyOperationalOverlayForCatalogId('recruitment-instructor', {
      'recruit.instructor.notes': '강사',
      ...INSTRUCTOR_MEDIA,
    })
    applyOperationalOverlayForCatalogId('recruitment-gemini-visiting-training', {
      'geminiRecruit.title': '제미니 모집',
      ...GEMINI_DETAIL,
    })
    for (const code of [
      'recruitment-participant-individual',
      'recruitment-instructor',
      'recruitment-gemini-visiting-training',
    ]) {
      expect(sorted(collectOperationalOverlayForCatalogId(code))).toMatchSnapshot(`collect-${code}`)
      expect(sorted(peekGeneralRecruitOverlayRecord(code))).toMatchSnapshot(`peek-${code}`)
    }
    setOperationalOverlayScope('recruitment-instructor')
    expect(readRecruitDetailMediaFromOverlay(getGeneralRecruitOverlayRecord())).toMatchSnapshot(
      'media-instructor-active'
    )
    setOperationalOverlayScope('recruitment-gemini-visiting-training')
    expect(buildGeminiRecruitmentSnapshotFromOverlay()).toMatchSnapshot('gemini-snapshot')
  })

  it('모집 상세정보: 단락 입력(patch·updateKey·훅·리치텍스트 flush) → collect', () => {
    applyOperationalOverlayForCatalogId('recruitment-participant-individual', DETAIL)
    setOperationalOverlayScope('recruitment-participant-individual')
    patchGeneralRecruitOverlay({ 'recruit.detailInfo.thumbFileName': 'b.png' })
    updateGeneralRecruitOverlayKey<string[]>('recruit.detailInfo.attachmentFileNames', prev => [
      ...(prev ?? []),
      'c.pdf',
    ])
    updateGeneralRecruitOverlayKey<number[]>('recruit.detailInfo.attachmentFileObjectIds', prev => [
      ...(prev ?? []),
      23,
    ])
    const { result } = renderHook(() =>
      useGeneralRecruitOverlayKv<string>('recruit.detailInfo.recruitmentGuide', '')
    )
    act(() => result.current[1]('<p>안내</p>'))
    registerRecruitDetailRichTextHtml('recruit.detailInfo.otherNotes', () => '<p>기타</p>')
    flushRecruitDetailRichTextIntoGeneralRecruitOverlay()
    registerRecruitDetailRichTextHtml('recruit.detailInfo.otherNotes', null)
    expect(sorted(collectOperationalOverlayForCatalogId('recruitment-participant-individual'))).toMatchSnapshot(
      'detail-input-collect'
    )
    expect(sorted(getGeneralRecruitOverlayRecord())).toMatchSnapshot('detail-input-active')
  })

  it('모집 상세정보: 기관 양식 prefix 교체·복원·병합, 미디어 세션 sidecar', () => {
    applyOperationalOverlayForCatalogId('recruitment-participant-school', {
      'recruit.programRangeSeal': { start: '2026-12-01', end: '2026-12-31' },
      ...DETAIL,
    })
    expect(sorted(collectOperationalOverlayForCatalogId('recruitment-participant-school'))).toMatchSnapshot(
      'school-collect'
    )
    replaceRecruitDetailInfoIntoGeneralStore(
      { 'recruit.detailInfo.programDescription': '<p>교체</p>' },
      'recruit.detailInfo',
      'recruitment-participant-school'
    )
    expect(sorted(peekGeneralRecruitOverlayRecord('recruitment-participant-school'))).toMatchSnapshot(
      'school-after-replace'
    )
    setOperationalOverlayScope('recruitment-participant-school')
    restoreRecruitDetailInfoIntoGeneralStore(DETAIL, 'recruit.detailInfo')
    expect(sorted(getGeneralRecruitOverlayRecord())).toMatchSnapshot('school-after-restore')
    expect(
      sorted(mergeRecruitDetailInfoFromGeneralStore({ 'recruit.x': 1 }, 'recruit.detailInfo'))
    ).toMatchSnapshot('school-merge')
    persistRecruitDetailDraftMediaFromOverlay('recruitment-participant-school', 'recruit.detailInfo')
    replaceRecruitDetailInfoIntoGeneralStore(undefined, 'recruit.detailInfo', 'recruitment-participant-school')
    expect(
      recruitDetailDraftMediaRestorePatch('recruitment-participant-school', 'recruit.detailInfo')
    ).toMatchSnapshot('media-session-restore-patch')
  })

  it('모집 상세정보: UJAT 기관·봉사 prefix(공용 단락)', () => {
    applyOperationalOverlayForCatalogId('recruitment-ujat-school', {
      'ujatRecruit.detailInfo.programDescription': '<p>UJAT</p>',
      'ujatRecruit.detailInfo.thumbFileObjectId': 71,
    })
    expect(sorted(collectOperationalOverlayForCatalogId('recruitment-ujat-school'))).toMatchSnapshot(
      'ujat-school-collect'
    )
    applyOperationalOverlayForCatalogId('recruitment-ujat-volunteer', {
      'recruitVolunteer.h1.detailInfo.programDescription': '<p>h1</p>',
      'recruit.volunteer.h1.notes': 'h1 비고',
    })
    setOperationalOverlayScope('recruitment-ujat-volunteer')
    expect(sorted(pickUjatVolunteerRecruitGeneralStoreSidecar())).toMatchSnapshot('ujat-vol-sidecar')
    replaceUjatVolunteerRecruitGeneralStoreSidecar(
      { 'recruitVolunteer.h2.detailInfo.otherNotes': '<p>h2</p>' },
      'recruitment-ujat-volunteer'
    )
    expect(sorted(collectOperationalOverlayForCatalogId('recruitment-ujat-volunteer'))).toMatchSnapshot(
      'ujat-vol-collect'
    )
  })

  it('봉사자 모집: 평면 키·면접 키 입력 → collect (슬롯·예외 블록 포함 결과)', () => {
    applyOperationalOverlayForCatalogId('recruitment-volunteer', VOLUNTEER)
    setOperationalOverlayScope('recruitment-volunteer')
    const { result } = renderHook(() =>
      useGeneralRecruitOverlayKv<string>('recruit.volunteer.interviewMethod', '')
    )
    expect(result.current[0]).toBe('대면')
    act(() => result.current[1]('온라인'))
    patchGeneralRecruitOverlay({ 'recruit.volunteer.interviewRequired': 'no' })
    syncVolunteerInterviewRangeSealOverlay('2026-11-25', '2026-11-23')
    expect(sorted(collectOperationalOverlayForCatalogId('recruitment-volunteer'))).toMatchSnapshot(
      'volunteer-collect'
    )
    expect(sorted(getGeneralRecruitOverlayRecord())).toMatchSnapshot('volunteer-active')
    resetOperationalOverlayForCatalogId('recruitment-volunteer')
    expect(sorted(collectOperationalOverlayForCatalogId('recruitment-volunteer'))).toMatchSnapshot(
      'volunteer-reset'
    )
  })

  it('fixedScheduleSelected: 기관·개인 신청 입력 → collect', () => {
    applyOperationalOverlayForCatalogId('application-participant-school', {
      'application.institution.fixedScheduleSelected': ['s1'],
      'application.institution.basicInfo.schoolName': '학교',
    })
    setOperationalOverlayScope('application-participant-school')
    updateGeneralApplicationOverlayKey<string[]>('application.institution.fixedScheduleSelected', prev => [
      ...(prev ?? []),
      's2',
    ])
    const { result } = renderHook(() =>
      useGeneralApplicationOverlayKv<string[]>('application.institution.fixedScheduleSelected', [])
    )
    expect(result.current[0]).toEqual(['s1', 's2'])
    expect(sorted(collectOperationalOverlayForCatalogId('application-participant-school'))).toMatchSnapshot(
      'school-app-collect'
    )
    applyOperationalOverlayForCatalogId('application-participant-individual', {
      'application.individual.fixedScheduleSelected': ['a'],
      'application.individual.teamInfo.teamName': '팀',
    })
    setOperationalOverlayScope('application-participant-individual')
    updateGeneralApplicationOverlayKey<string[]>('application.individual.fixedScheduleSelected', () => [])
    expect(
      sorted(collectOperationalOverlayForCatalogId('application-participant-individual'))
    ).toMatchSnapshot('individual-app-collect')
    expect(sorted(getGeneralApplicationOverlayRecord())).toMatchSnapshot('individual-app-active')
  })

  it('일반 등록 scheduleLines(V27 형식 문자열) → 레코드·모드 전환·조회', () => {
    const lines = ['2026.12.01(화) 10:00~12:00', '2026.12.08(화) 10:00~12:00']
    replaceProgramRegistrationOverlay({
      'generalRegistration.basicInfo.localProgramTitleKo': '일반',
      'generalRegistration.educationScheduleSettings.scheduleLines': lines,
      'generalRegistration.educationScheduleCurriculum.groupTimesByDetail': { d1: ['10:00~12:00'] },
    })
    expect(readGeneralRegistrationOverlayScheduleLines()).toMatchSnapshot('lines-read')
    applyEducationScheduleModeLineSwap({
      overlayKeyPrefix: 'generalRegistration.educationScheduleSettings',
      currentMode: 'date',
      nextMode: 'period',
    })
    expect(sorted(getProgramRegistrationOverlayRecord())).toMatchSnapshot('after-swap-period')
    patchProgramRegistrationOverlay({
      'generalRegistration.educationScheduleSettings.scheduleLines': ['2026.12.01 ~ 2026.12.31'],
    })
    applyEducationScheduleModeLineSwap({
      overlayKeyPrefix: 'generalRegistration.educationScheduleSettings',
      currentMode: 'period',
      nextMode: 'date',
    })
    const { result } = renderHook(() =>
      useProgramRegistrationOverlayKv<string[]>(
        'generalRegistration.educationScheduleSettings.scheduleLines',
        []
      )
    )
    expect(result.current[0]).toEqual(lines)
    expect(sorted(peekProgramRegistrationOverlayRecord(undefined))).toMatchSnapshot('after-swap-date')
    expect(
      resolveEducationScheduleGroupTimeSlots({
        scheduleDetails: [],
        overlay: getProgramRegistrationOverlayRecord(),
      })
    ).toMatchSnapshot('group-time-slots')
  })

  it('TT 모집 state fallback(TT RHF 미마운트) → 기관·일반 모집 스토어 병합', () => {
    applyOperationalOverlayForCatalogId('recruitment-trained-teachers', {
      'recruit.programRangeSeal': { start: '2026-12-01', end: '2026-12-31' },
      'recruit.inquiryContact': 'TT 담당',
      'trainedTeachersRecruit.detailInfo.programDescription': '<p>TT</p>',
      'trainedTeachersRecruit.detailInfo.thumbFileObjectId': 81,
    })
    setOperationalOverlayScope('recruitment-trained-teachers')
    expect(
      collectTrainedTeachersRecruitFormState(undefined, () => ({
        ...peekApplicantRecruitInstitutionOverlayRecord('recruitment-trained-teachers'),
        ...getGeneralRecruitOverlayRecord(),
      }))
    ).toMatchSnapshot('tt-recruit-fallback')
  })
})
