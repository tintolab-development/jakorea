// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
  useGeneralRecruitOverlayKv,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  getGeneralApplicationOverlayRecord,
  patchGeneralApplicationOverlay,
  peekGeneralApplicationOverlayRecord,
  updateGeneralApplicationOverlayKey,
  useGeneralApplicationOverlayKv,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { buildCompanySchoolProgramFromRhf } from '@/features/program/1c-1s/lib/build-registration-create-from-canonical'
import {
  notifyCompanySchoolRegistrationRhf,
  peekCompanySchoolRegistrationRhf,
  registerCompanySchoolRegistrationRhf,
  type CompanySchoolRegistrationRhfApi,
} from '@/features/program/1c-1s/lib/registration-rhf-api'
import {
  applyCompanySchoolRhfOverlayRecord,
  createDefaultCompanySchoolRegistrationRhfValues,
  type CompanySchoolRegistrationRhfValues,
} from '@/features/program/1c-1s/lib/registration-rhf-values'

/**
 * Part3 4단계(1사1교·일반 강사 모집·신청) 저장 결과 고정 — 85e9f5e1f(스토어)에서 스냅샷 생성,
 * RHF 필드 폼 전환 뒤에도 같아야 한다(양식 extensionJson overlay = collect 결과, 1사1교 CREATE leftover).
 */
const RECRUIT = 'recruitment-instructor'
const APPLICATION = 'application-instructor'

function sorted(record: Record<string, unknown> | null | undefined) {
  if (record == null) return record
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)))
}

/** 186369 v2079 강사 모집 22키 형태 */
const RECRUIT_OVERLAY = {
  'recruit.instructor.announcementPublished': 'published',
  'recruit.instructor.recruitTargets': ['adult', 'univ'],
  'recruit.instructor.recruitTargetDetail': '성인·대학생',
  'recruit.instructor.programAnchorIso': '2026-12-01',
  'recruit.instructor.programRangeSeal': { start: '2026-12-01', end: '2026-12-31' },
  'recruit.instructor.recruitAnchorIso': '2026-11-01',
  'recruit.instructor.recruitRangeSeal': { start: '2026-11-01', end: '2026-11-20' },
  'recruit.instructor.finalAnnounceIso': '2026-11-25',
  'recruit.instructor.finalAnnounceMethod': '개별 연락',
  'recruit.instructor.inquiryContact': '강사 담당',
  'recruit.instructor.inquiryTel': '02-1111-2222',
  'recruit.instructor.inquiryEmail': 'inst@example.com',
  'recruit.instructor.notesNotApplicable': false,
  'recruit.instructor.notes': '강사 비고',
  'recruitInstructor.detailInfo.programDescription': '<p>소개</p>',
  'recruitInstructor.detailInfo.recruitmentGuide': '<p>안내</p>',
  'recruitInstructor.detailInfo.applicationMethod': '<p>방법</p>',
  'recruitInstructor.detailInfo.learningSupportContent': '<p>지원</p>',
  'recruitInstructor.detailInfo.additionalContentHtml': '<p>추가</p>',
  'recruitInstructor.detailInfo.otherNotes': '<p>기타</p>',
  'recruitInstructor.detailInfo.thumbFileObjectId': 31,
  'recruitInstructor.detailInfo.attachmentFileObjectIds': [41, 42],
}

const APPLICATION_OVERLAY = {
  'application.instructor.crimeRecordConfirmed': true,
  'application.instructor.currentMonth': '2026-12-01T00:00:00.000Z',
  'application.instructor.selectedDate': '2026-12-03T00:00:00.000Z',
  'application.instructor.selectedSlotIds': ['s1', 's2'],
}

function csValues(): CompanySchoolRegistrationRhfValues {
  return {
    ...createDefaultCompanySchoolRegistrationRhfValues(),
    publicProgramTitle: '[BOT-TEST] 1사1교',
    operationRange: { start: '2026-12-01', end: '2026-12-31' },
    educationScheduleRange: { start: '2026-12-01', end: '2026-12-20' },
    participantCount: 10,
  }
}

function mockCsRhf(values: CompanySchoolRegistrationRhfValues): CompanySchoolRegistrationRhfApi {
  let current = values
  return {
    getValues: () => current,
    getPath: path => (path === 'recruitment' ? current.recruitment : undefined),
    setPath: (path, value) => {
      if (path === 'recruitment') {
        current = { ...current, recruitment: value as CompanySchoolRegistrationRhfValues['recruitment'] }
      }
      if (path === 'instructorRecruit') {
        current = {
          ...current,
          instructorRecruit: value as CompanySchoolRegistrationRhfValues['instructorRecruit'],
        }
      }
      notifyCompanySchoolRegistrationRhf()
    },
    reset: next => {
      current = next
    },
    applyOverlayRecord: overlay => {
      current = applyCompanySchoolRhfOverlayRecord(current, overlay)
    },
    isDirty: () => true,
    markBaseline: () => undefined,
  }
}

describe('강사 모집·신청 overlay save parity (part3 step4)', () => {
  beforeEach(() => {
    resetAllOperationalOverlayStores()
  })
  afterEach(() => {
    registerCompanySchoolRegistrationRhf(null)
    resetAllOperationalOverlayStores()
  })

  it('모집: 양식 불러오기 → collect·peek', () => {
    applyOperationalOverlayForCatalogId(RECRUIT, RECRUIT_OVERLAY)
    expect(sorted(collectOperationalOverlayForCatalogId(RECRUIT))).toMatchSnapshot('recruit-apply')
    expect(sorted(peekGeneralRecruitOverlayRecord(RECRUIT))).toMatchSnapshot('recruit-peek')
  })

  it('모집: 단락 입력(patch·훅) → collect·활성 레코드', () => {
    applyOperationalOverlayForCatalogId(RECRUIT, RECRUIT_OVERLAY)
    setOperationalOverlayScope(RECRUIT)
    patchGeneralRecruitOverlay({
      'recruit.instructor.notes': null,
      'recruit.instructor.notesNotApplicable': true,
      'recruitInstructor.detailInfo.programDescription': '<p>소개2</p>',
    })
    const { result } = renderHook(() =>
      useGeneralRecruitOverlayKv<string[]>('recruit.instructor.recruitTargets', ['adult'])
    )
    act(() => result.current[1](['adult', 'senior']))
    expect(result.current[0]).toEqual(['adult', 'senior'])
    const { result: tel } = renderHook(() =>
      useGeneralRecruitOverlayKv<string>('recruit.instructor.inquiryTel', '')
    )
    expect(tel.current[0]).toBe('02-1111-2222')
    expect(sorted(collectOperationalOverlayForCatalogId(RECRUIT))).toMatchSnapshot('recruit-input')
    expect(sorted(getGeneralRecruitOverlayRecord())).toMatchSnapshot('recruit-active')
  })

  it('모집: reset(시드 억제) → collect 비움·기본값', () => {
    applyOperationalOverlayForCatalogId(RECRUIT, RECRUIT_OVERLAY)
    resetOperationalOverlayForCatalogId(RECRUIT)
    expect(sorted(collectOperationalOverlayForCatalogId(RECRUIT))).toMatchSnapshot('recruit-reset')
    setOperationalOverlayScope(RECRUIT)
    const { result } = renderHook(() =>
      useGeneralRecruitOverlayKv<string>('recruit.instructor.announcementPublished', 'published')
    )
    expect(result.current[0]).toMatchSnapshot('recruit-reset-default')
  })

  it('모집: 임시저장 왕복(collect → 전체 reset → apply) 같은 값', () => {
    applyOperationalOverlayForCatalogId(RECRUIT, RECRUIT_OVERLAY)
    applyOperationalOverlayForCatalogId('recruitment-participant-individual', {
      'recruit.individual.notes': '개인',
    })
    const draft = collectOperationalOverlayForCatalogId(RECRUIT)
    resetAllOperationalOverlayStores()
    applyOperationalOverlayForCatalogId(RECRUIT, draft ?? undefined)
    expect(sorted(collectOperationalOverlayForCatalogId(RECRUIT))).toMatchSnapshot('recruit-draft-roundtrip')
    expect(
      sorted(collectOperationalOverlayForCatalogId('recruitment-participant-individual'))
    ).toMatchSnapshot('individual-after-roundtrip')
  })

  it('신청: 불러오기·입력(patch·updateKey·훅) → collect·reset', () => {
    applyOperationalOverlayForCatalogId(APPLICATION, APPLICATION_OVERLAY)
    expect(sorted(collectOperationalOverlayForCatalogId(APPLICATION))).toMatchSnapshot('application-apply')
    expect(sorted(peekGeneralApplicationOverlayRecord(APPLICATION))).toMatchSnapshot('application-peek')
    setOperationalOverlayScope(APPLICATION)
    patchGeneralApplicationOverlay({ 'application.instructor.selectedDate': '2026-12-05T00:00:00.000Z' })
    updateGeneralApplicationOverlayKey<string[]>('application.instructor.selectedSlotIds', prev => [
      ...(prev ?? []),
      's3',
    ])
    const { result } = renderHook(() =>
      useGeneralApplicationOverlayKv<boolean>('application.instructor.crimeRecordConfirmed', false)
    )
    expect(result.current[0]).toBe(true)
    act(() => result.current[1](false))
    expect(sorted(collectOperationalOverlayForCatalogId(APPLICATION))).toMatchSnapshot('application-input')
    expect(sorted(getGeneralApplicationOverlayRecord())).toMatchSnapshot('application-active')
    resetOperationalOverlayForCatalogId(APPLICATION)
    expect(sorted(collectOperationalOverlayForCatalogId(APPLICATION))).toMatchSnapshot('application-reset')
  })

  it('1사1교: CS RHF 마운트 중 강사 키 입력 → 양식 collect·CREATE leftover', () => {
    registerCompanySchoolRegistrationRhf(mockCsRhf(csValues()))
    applyOperationalOverlayForCatalogId(RECRUIT, RECRUIT_OVERLAY)
    setOperationalOverlayScope(RECRUIT)
    patchGeneralRecruitOverlay({ 'recruit.instructor.notes': 'CS 강사 비고' })
    const { result } = renderHook(() =>
      useGeneralRecruitOverlayKv<string>('recruit.instructor.inquiryContact', '')
    )
    act(() => result.current[1]('CS 담당'))
    expect(result.current[0]).toBe('CS 담당')
    applyOperationalOverlayForCatalogId(APPLICATION, APPLICATION_OVERLAY)
    expect(sorted(collectOperationalOverlayForCatalogId(RECRUIT))).toMatchSnapshot('cs-recruit-collect')
    expect(sorted(collectOperationalOverlayForCatalogId(APPLICATION))).toMatchSnapshot(
      'cs-application-collect'
    )
    const program = buildCompanySchoolProgramFromRhf({
      id: 'cs-instructor',
      values: peekCompanySchoolRegistrationRhf()?.getValues() ?? csValues(),
    })
    const overlay = program.registrationOverlay ?? {}
    const instructorPart = Object.fromEntries(
      Object.entries(overlay).filter(
        ([key]) => key.startsWith('recruit.instructor') || key.startsWith('recruitInstructor.')
      )
    )
    expect(sorted(instructorPart)).toMatchSnapshot('cs-create-instructor-leftover')
    expect(Object.keys(overlay).sort()).toMatchSnapshot('cs-create-overlay-keys')
  })
})
