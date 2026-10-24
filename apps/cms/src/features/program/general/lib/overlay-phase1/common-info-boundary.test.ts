/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { extrasFromGeneralProgram } from '@/features/program/general/lib/registration-overlay-sync'
import { buildGeneralRegistrationOverlayFromProgram } from '@/features/program/general/lib/registration-overlay-sync'
import { deriveIndependentEditorExtrasFromProgram } from './common-info-domain'
import { seedIndependentCommonInfoOverlayFromProgram } from './build-independent-common-info'
import { overlayKvToIndependentCommonInfoInput } from './overlay-kv-to-common-info-form-values'
import { buildIndependentCommonInfo } from './build-independent-common-info'
import { EDITOR_EXTRAS_CURRICULUM_SINGLE } from '@/features/program/general/lib/overlay-phase0/editor-extras-fixtures'
import { commonInfoRhfFieldMapCoversAllKeys } from './common-info-rhf-field-map'
import { orderOverlayKeys } from './common-info-domain'

function baseProgram(): Program {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: '186234',
    sponsorId: 'sponsor-1',
    title: '기존 대표명',
    mainTitle: '기존 대표명',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    businessArea: '경제금융',
    partnerInvolvement: true,
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    generalParticipantTypes: ['school_institution'],
    generalCommonInfo: {
      announcementTitle: '기존 공고',
      venueKind: 'inside',
      curriculumSessions: [
        { sessionLabel: '1회차', title: '단원1', description: '본문1' },
        { sessionLabel: '2회차', title: '단원2', description: '본문2' },
      ],
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

describe('공통정보 경계 A. 세션 수', () => {
  it('nested 세션 수 = overlay 맵 세션 수이면 Independent extras와 GET extras가 같다', () => {
    const program: Program = {
      ...baseProgram(),
      registrationOverlay: {
        'generalRegistration.educationCurriculum.unitNameBySession': { 1: '단원1', 2: '단원2' },
        'generalRegistration.educationCurriculum.unitContentBySession': { 1: '본문1', 2: '본문2' },
      },
    }
    const legacyExtras = extrasFromGeneralProgram(program)
    const independentExtras = deriveIndependentEditorExtrasFromProgram(program)
    expect(independentExtras.curriculumSessionCount).toBe(legacyExtras.curriculumSessionCount)
    expect(independentExtras.curriculumSessionCount).toBe(2)
    expect(seedIndependentCommonInfoOverlayFromProgram(program)).toEqual(
      buildGeneralRegistrationOverlayFromProgram(program)
    )
  })

  it('overlay 맵이 nested보다 많으면 extras 세션 수가 갈린다 (자동 보정하지 않음)', () => {
    const program: Program = {
      ...baseProgram(),
      registrationOverlay: {
        'generalRegistration.educationCurriculum.unitNameBySession': {
          1: '단원1',
          2: '단원2',
          3: '단원3',
          4: '단원4',
        },
      },
    }
    const legacyExtras = extrasFromGeneralProgram(program)
    const independentExtras = deriveIndependentEditorExtrasFromProgram(program)
    expect(independentExtras.curriculumSessionCount).toBe(2)
    const legacyCount = legacyExtras.curriculumSessionCount
    expect(legacyCount).toBeDefined()
    expect(legacyCount ?? Number.NaN).toBeGreaterThan(2)
    expect(seedIndependentCommonInfoOverlayFromProgram(program)[
      'generalRegistration.educationCurriculum.unitNameBySession'
    ]).toEqual(
      buildGeneralRegistrationOverlayFromProgram(program)[
        'generalRegistration.educationCurriculum.unitNameBySession'
      ]
    )
  })
})

describe('공통정보 경계 B. overlayKeyOrder', () => {
  it('JS 객체 동등성과 JSON 문자열 순서를 구분한다', () => {
    const overlay = {
      'generalRegistration.basicInfo.localProgramTitleKo': '신규 프로그램',
      'generalRegistration.basicInfo.publicProgramTitle': '공고',
    }
    const reordered = {
      'generalRegistration.basicInfo.publicProgramTitle': '공고',
      'generalRegistration.basicInfo.localProgramTitleKo': '신규 프로그램',
    }
    expect(reordered).toEqual(overlay)
    expect(JSON.stringify(reordered)).not.toBe(JSON.stringify(overlay))
    expect(JSON.stringify(orderOverlayKeys(reordered, Object.keys(overlay)))).toBe(JSON.stringify(overlay))
  })

  it('create persist는 overlayKeyOrder가 있어야 JSON 문자열이 원본과 같다', () => {
    const overlay = {
      'generalRegistration.basicInfo.publicProgramTitle': '공고',
      'generalRegistration.basicInfo.localProgramTitleKo': '신규',
      'generalRegistration.kpi.participantCount': 1,
    }
    const adapted = overlayKvToIndependentCommonInfoInput(overlay)
    const withoutOrder = buildIndependentCommonInfo({
      formValues: adapted.formValues,
      sidecars: { unownedOverlay: adapted.sidecars.unownedOverlay },
      editorExtras: EDITOR_EXTRAS_CURRICULUM_SINGLE,
      baseline: baseProgram(),
      mode: 'create',
    })
    const withOrder = buildIndependentCommonInfo({
      formValues: adapted.formValues,
      sidecars: adapted.sidecars,
      editorExtras: EDITOR_EXTRAS_CURRICULUM_SINGLE,
      baseline: baseProgram(),
      mode: 'create',
    })
    expect(withoutOrder.persistOverlay).toEqual(overlay)
    expect(withOrder.persistOverlay).toEqual(overlay)
    expect(JSON.stringify(withOrder.persistOverlay)).toBe(JSON.stringify(overlay))
    expect(JSON.stringify(withoutOrder.persistOverlay) === JSON.stringify(overlay)).toBe(
      Object.keys(withoutOrder.persistOverlay).join() === Object.keys(overlay).join()
    )
  })
})

describe('공통정보 경계 C. RHF 필드 대응', () => {
  it('CommonInfoFormValues 모든 키에 UI 대응이 있다', () => {
    expect(commonInfoRhfFieldMapCoversAllKeys()).toBe(true)
  })
})
