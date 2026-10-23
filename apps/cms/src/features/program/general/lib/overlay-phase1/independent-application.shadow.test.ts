/** @vitest-environment node */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { extensionPayloadToExtensionJson } from '@/features/template/api/adapters/form-template-draft-adapters'
import { resolveGeneralApplicationFormHiddenParagraphIds } from '@/features/program/general/lib/application-form-preview-options'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import {
  applyOperationalOverlayForCatalogId,
  collectOperationalOverlayForCatalogId,
  resetOperationalOverlayForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import { resetGeneralApplicationOverlayStoreForTests } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { OVERLAY_PHASE0_KNOWN_DIFFS } from '@/features/program/general/lib/overlay-phase0/overlay-phase0-known-diff'
import { overlayKvToIndependentApplicationInput } from './overlay-kv-to-application-form-values'
import {
  buildIndependentApplicationDraft,
  buildIndependentApplicationDrafts,
  buildIndependentApplicationFormVersionPutOverlay,
  splitIndependentApplicationOverlays,
} from './build-independent-application'
import { isFieldPresent } from './common-info-form-values'
import type { ApplicationCatalog } from './application-form-values'
import { APPLICATION_BINDING_CATALOG_IDS } from './program-edit-snapshot.types'

afterEach(() => {
  for (const catalog of APPLICATION_BINDING_CATALOG_IDS) {
    resetOperationalOverlayForCatalogId(catalog)
  }
  resetGeneralApplicationOverlayStoreForTests()
})

const schoolOverlay: Record<string, unknown> = {
  'application.institution.teacherTel': '',
  'application.institution.teacherMobile': null,
  'application.institution.teacherEmail': 'teacher@school.kr',
  'application.institution.applicationGrade': '3',
  'application.institution.educationForm': 'offline',
  'application.institution.classCount': '2',
  'application.institution.preferredSchedules': [
    { date: '2026-06-01', session: '1', start: '09:00', end: '10:00' },
    { date: '2026-06-02', session: '2', start: '13:00', end: '14:00' },
  ],
  'application.institution.fixedScheduleSelected': ['slot-b', 'slot-a'],
  'application.institution.guidanceAnswers': { q2: '', q1: 'yes' },
  'application.institution.sexOffense.inquiryMethod': 'online',
  'application.institution.sexOffense.siteSubmission': 'no',
  'application.institution.sexOffense.institutionId': '',
  'application.institution.sexOffense.verificationNumber': '1234',
  'application.institution.memo': 'test-only',
}

const individualOverlay: Record<string, unknown> = {
  'application.individual.teamInfo.teamName': '팀A',
  'application.individual.teamInfo.memberCountSelect': 'etc',
  'application.individual.teamInfo.customMemberCount': '7',
  'application.individual.teamInfo.teamRole': 'leader',
  'application.individual.teamInfo.customNote': '동적 키',
  'application.institution.fixedScheduleSelected': ['slot-1'],
}

const instructorOverlay: Record<string, unknown> = {
  'application.instructor.crimeRecordConfirmed': true,
  'application.instructor.currentMonth': '2026-06-01T00:00:00.000Z',
  'application.instructor.selectedDate': '2026-06-10T00:00:00.000Z',
  'application.instructor.selectedSlotIds': ['s1', 's2'],
}

const volunteerOverlay: Record<string, unknown> = {
  'application.volunteer.previousProgram.applicationYear': '2025',
  'application.volunteer.previousProgram.programName': 'JA 프로그램',
  'application.volunteer.previousProgram.fileNames': ['cert.pdf'],
  'application.volunteer.applicant.currentMonth': '2026-05-01T00:00:00.000Z',
  'application.volunteer.applicant.selectedDate': '',
  'application.volunteer.applicant.selectedSlots': [],
  'application.volunteer.activitySchedule.currentMonth': '2026-06-01T00:00:00.000Z',
  'application.volunteer.activitySchedule.selectedDate': '2026-06-03T00:00:00.000Z',
  'application.volunteer.activitySchedule.selectedSlotIds': ['a1'],
  'application.volunteer.interview.selectedSlotKeys': ['1-2'],
  'application.volunteer.interview.timeUnit': '30',
  'application.volunteer.interview.exception.10.exceptionDate': '2026-06-11',
  'application.volunteer.interview.exception.10.selectedSlotKeys': [],
  'application.volunteer.interview.exception.20.exceptionDate': '',
  'application.volunteer.interview.exception.20.interviewTime': null,
}

const emptyPresenceOverlay: Record<string, unknown> = {
  'application.instructor.selectedSlotIds': [],
  'application.institution.guidanceAnswers': {},
  'application.institution.preferredSchedules': [],
  'application.individual.teamInfo.teamName': '',
}

const bridgeSnapshot: InstitutionApplicationProgramBridge = {
  preEducationNoticeRequired: true,
  educationScheduleMode: 'date',
  showPreferredEducationForm: true,
  educationScheduleLines: ['2026.06.01(월) 09:00~10:00', '2026.06.02(화) 13:00~14:00'],
  educationRoundCount: 2,
  sessionsPerRound: 1,
  curriculumChartSessionCount: 2,
}

function legacyCollect(catalog: ApplicationCatalog, overlay: Record<string, unknown>) {
  applyOperationalOverlayForCatalogId(catalog, overlay)
  return collectOperationalOverlayForCatalogId(catalog) ?? {}
}

function independentFromOverlay(
  overlay: Record<string, unknown>,
  catalog: ApplicationCatalog,
  sidecars?: { bridge?: InstitutionApplicationProgramBridge; previousLocalOverlay?: Record<string, unknown> }
) {
  const adapted = overlayKvToIndependentApplicationInput(overlay)
  return buildIndependentApplicationDraft({
    catalog,
    formValues: adapted.formValues,
    sidecars: { ...adapted.sidecars, ...sidecars },
  })
}

describe('0. Independent Builder 금지 의존성', () => {
  it('Builder가 overlay store/collect/RHF를 호출하지 않는다', () => {
    const dir = path.join(__dirname)
    const files = [
      'build-independent-application.ts',
      'application-domain.ts',
      'application-form-values.ts',
    ]
    const forbidden = [
      /(?:import|from).*collectOperationalOverlayForCatalogId/,
      /peek[A-Z]/,
      /getRecord\(/,
      /getInstitutionApplicationProgramBridge/,
      /persistDraftOwnedFormVersion/,
      /localStorage/,
      /from ['"]react['"]/,
      /from ['"]react-hook-form['"]/,
      /deriveIndependentEditorExtrasFromProgram/,
    ]
    for (const file of files) {
      const source = readFileSync(path.join(dir, file), 'utf8')
      for (const token of forbidden) {
        expect(token.test(source), `${file} matches ${token}`).toBe(false)
      }
    }
  })

  it('기존 known-diff 13건을 유지한다', () => {
    expect(OVERLAY_PHASE0_KNOWN_DIFFS).toHaveLength(13)
    expect(OVERLAY_PHASE0_KNOWN_DIFFS.map(item => item.id)).toEqual(
      expect.arrayContaining([
        'detail-common-save-overlay-first',
        'recruit-detailinfo-reseed-gap',
        'empty-public-title-apply-fallback',
        'individual-schedule-writes-institution-prefix',
        'recruit-save-locks-announcement-title',
      ])
    )
  })
})

describe('1. 참여기관 신청 catalog', () => {
  it('정적 키·배열 순서·guidanceAnswers·성범죄 4키·동적 extra가 collect와 같다', () => {
    const legacy = legacyCollect('application-participant-school', schoolOverlay)
    const independent = independentFromOverlay(schoolOverlay, 'application-participant-school')
    expect(independent.overlay).toEqual(legacy)
    expect(independent.sink).toBe('form-version-overlay')
    expect(independent.overlay['application.institution.preferredSchedules']).toEqual([
      { date: '2026-06-01', session: '1', start: '09:00', end: '10:00' },
      { date: '2026-06-02', session: '2', start: '13:00', end: '14:00' },
    ])
    expect(independent.overlay['application.institution.fixedScheduleSelected']).toEqual([
      'slot-b',
      'slot-a',
    ])
    expect(independent.overlay['application.institution.guidanceAnswers']).toEqual({
      q2: '',
      q1: 'yes',
    })
    expect(independent.overlay['application.institution.sexOffense.inquiryMethod']).toBe('online')
    expect(independent.overlay['application.institution.sexOffense.siteSubmission']).toBe('no')
    expect(independent.overlay['application.institution.sexOffense.institutionId']).toBe('')
    expect(independent.overlay['application.institution.sexOffense.verificationNumber']).toBe('1234')
    expect(independent.overlay['application.institution.memo']).toBe('test-only')
    expect(independent.overlay['application.institution.teacherTel']).toBe('')
    expect(independent.overlay['application.institution.teacherMobile']).toBeNull()
  })
})

describe('2. 개인 참여자 신청 catalog', () => {
  it('teamInfo 정적·동적 키를 유지하고 institution 일정 키는 빠뜨린다 (known-diff)', () => {
    const legacy = legacyCollect('application-participant-individual', individualOverlay)
    const independent = independentFromOverlay(individualOverlay, 'application-participant-individual')
    expect(independent.overlay).toEqual(legacy)
    expect(independent.overlay).toEqual({
      'application.individual.teamInfo.teamName': '팀A',
      'application.individual.teamInfo.memberCountSelect': 'etc',
      'application.individual.teamInfo.customMemberCount': '7',
      'application.individual.teamInfo.teamRole': 'leader',
      'application.individual.teamInfo.customNote': '동적 키',
    })
    expect(independent.overlay['application.institution.fixedScheduleSelected']).toBeUndefined()
  })
})

describe('3. 강사 신청 catalog', () => {
  it('선택 슬롯 배열 순서와 명시적 빈 배열을 유지한다', () => {
    const legacy = legacyCollect('application-instructor', instructorOverlay)
    const independent = independentFromOverlay(instructorOverlay, 'application-instructor')
    expect(independent.overlay).toEqual(legacy)
    expect(independent.overlay['application.instructor.selectedSlotIds']).toEqual(['s1', 's2'])

    const emptyLegacy = legacyCollect('application-instructor', {
      'application.instructor.selectedSlotIds': [],
    })
    const emptyIndependent = independentFromOverlay(
      { 'application.instructor.selectedSlotIds': [] },
      'application-instructor'
    )
    expect(emptyIndependent.overlay).toEqual(emptyLegacy)
    expect(emptyIndependent.overlay['application.instructor.selectedSlotIds']).toEqual([])
    expect(
      Object.prototype.hasOwnProperty.call(
        emptyIndependent.overlay,
        'application.instructor.crimeRecordConfirmed'
      )
    ).toBe(false)
  })
})

describe('4. 봉사자 신청 catalog', () => {
  it('이전 프로그램·applicant·activity·interview·exception 빈 슬롯을 유지한다', () => {
    const legacy = legacyCollect('application-volunteer', volunteerOverlay)
    const independent = independentFromOverlay(volunteerOverlay, 'application-volunteer')
    expect(independent.overlay).toEqual(legacy)
    expect(independent.overlay['application.volunteer.applicant.selectedSlots']).toEqual([])
    expect(independent.overlay['application.volunteer.interview.exception.10.selectedSlotKeys']).toEqual(
      []
    )
    expect(independent.overlay['application.volunteer.interview.exception.20.exceptionDate']).toBe('')
    expect(independent.overlay['application.volunteer.interview.exception.20.interviewTime']).toBeNull()
  })

  it('exception 블록 삭제는 해당 키만 제거하고 빈 값을 채우지 않는다', () => {
    const adapted = overlayKvToIndependentApplicationInput(volunteerOverlay)
    const volunteer = adapted.formValues.volunteer
    expect(volunteer && isFieldPresent(volunteer.interviewExceptions)).toBe(true)
    if (!volunteer || !isFieldPresent(volunteer.interviewExceptions)) throw new Error('expected exceptions')
    const next = {
      ...adapted.formValues,
      volunteer: {
        ...volunteer,
        interviewExceptions: {
          present: true as const,
          value: volunteer.interviewExceptions.value.filter(block => block.blockId !== '20'),
          persist: volunteer.interviewExceptions.value.filter(block => block.blockId !== '20'),
        },
      },
    }
    const independent = buildIndependentApplicationDraft({
      catalog: 'application-volunteer',
      formValues: next,
      sidecars: adapted.sidecars,
    })
    expect(independent.overlay['application.volunteer.interview.exception.10.exceptionDate']).toBe(
      '2026-06-11'
    )
    expect(
      Object.keys(independent.overlay).some(key => key.includes('exception.20'))
    ).toBe(false)
  })
})

describe('5. form version PUT overlay', () => {
  it('4 catalog PUT overlay payload가 collect와 같다', () => {
    const fixtures: Array<[ApplicationCatalog, Record<string, unknown>]> = [
      ['application-participant-school', schoolOverlay],
      ['application-participant-individual', individualOverlay],
      ['application-instructor', instructorOverlay],
      ['application-volunteer', volunteerOverlay],
    ]
    for (const [catalog, overlay] of fixtures) {
      const legacy = legacyCollect(catalog, overlay)
      const independent = independentFromOverlay(overlay, catalog)
      expect(buildIndependentApplicationFormVersionPutOverlay(independent.overlay)).toEqual({
        overlay: legacy,
      })
      expect(extensionPayloadToExtensionJson({ overlay: independent.overlay })).toBe(
        extensionPayloadToExtensionJson({ overlay: legacy })
      )
    }
  })
})

describe('6. 빈값·필드 부재', () => {
  it('빈 배열·빈 객체·빈 문자열은 유지하고 없는 키는 만들지 않는다', () => {
    const legacy = legacyCollect('application-participant-school', emptyPresenceOverlay)
    const independentSchool = independentFromOverlay(
      emptyPresenceOverlay,
      'application-participant-school'
    )
    expect(independentSchool.overlay).toEqual(legacy)
    expect(independentSchool.overlay['application.institution.guidanceAnswers']).toEqual({})
    expect(independentSchool.overlay['application.institution.preferredSchedules']).toEqual([])
    expect(independentSchool.overlay['application.institution.teacherEmail']).toBeUndefined()

    const independentIndividual = independentFromOverlay(
      emptyPresenceOverlay,
      'application-participant-individual'
    )
    expect(independentIndividual.overlay['application.individual.teamInfo.teamName']).toBe('')
    expect(independentIndividual.overlay['application.individual.teamInfo.teamRole']).toBeUndefined()
  })
})

describe('7. catalog 간 데이터 오염', () => {
  it('혼합 overlay를 catalog별로 나누면 prefix 밖 키를 갖지 않는다', () => {
    const merged = {
      ...schoolOverlay,
      ...individualOverlay,
      ...instructorOverlay,
      ...volunteerOverlay,
    }
    const split = splitIndependentApplicationOverlays(merged)
    expect(Object.keys(split['application-participant-school']).every(key =>
      key.startsWith('application.institution.')
    )).toBe(true)
    expect(Object.keys(split['application-participant-individual']).every(key =>
      key.startsWith('application.individual.')
    )).toBe(true)
    expect(split['application-participant-individual']['application.institution.fixedScheduleSelected']).toBeUndefined()
    expect(split['application-instructor']['application.volunteer.previousProgram.programName']).toBeUndefined()

    const drafts = buildIndependentApplicationDrafts(
      overlayKvToIndependentApplicationInput(merged)
    )
    expect(drafts.map(draft => draft.catalogId)).toEqual([...APPLICATION_BINDING_CATALOG_IDS])
    for (const draft of drafts) {
      expect(draft.overlay).toEqual(split[draft.catalogId])
      expect(draft.sink).toBe('form-version-overlay')
    }
  })
})

describe('8. 위저드 임시저장·복원', () => {
  it('local overlay 병합 후 catalog 복원이 collect 왕복과 같다', () => {
    const previous = { 'application.instructor.crimeRecordConfirmed': false }
    const independent = independentFromOverlay(volunteerOverlay, 'application-volunteer', {
      previousLocalOverlay: previous,
    })
    expect(independent.localOverlay['application.instructor.crimeRecordConfirmed']).toBe(false)
    expect(independent.localOverlay['application.volunteer.previousProgram.programName']).toBe(
      'JA 프로그램'
    )

    applyOperationalOverlayForCatalogId('application-volunteer', volunteerOverlay)
    const collected = collectOperationalOverlayForCatalogId('application-volunteer') ?? {}
    const restored = independentFromOverlay(
      { ...previous, ...collected },
      'application-volunteer'
    )
    expect(restored.overlay).toEqual(collected)
  })
})

describe('9. 기관 신청 브리지·미리보기', () => {
  it('브리지는 sidecar 입력을 그대로 에코하고 Independent extras를 쓰지 않는다', () => {
    const independent = independentFromOverlay(schoolOverlay, 'application-participant-school', {
      bridge: bridgeSnapshot,
    })
    expect(independent.bridge).toEqual(bridgeSnapshot)
    expect(independent.bridge?.educationRoundCount).toBe(2)

    const hidden = resolveGeneralApplicationFormHiddenParagraphIds('institution', {
      paragraphs: [],
      institutionBridge: independent.bridge,
    })
    expect(hidden?.has(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice)).toBeFalsy()

    const individualHidden = resolveGeneralApplicationFormHiddenParagraphIds('individual', {
      paragraphs: [],
      institutionBridge: {
        ...bridgeSnapshot,
        educationScheduleLines: [],
        educationScheduleRange: undefined,
      },
    })
    expect(individualHidden?.has(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice)).toBe(true)
  })
})

describe('10. form binding 연결 계약', () => {
  it('APPLICATION formType·targetRole·targetType만 고정하고 프로그램 PATCH sink가 아니다', () => {
    const school = independentFromOverlay(schoolOverlay, 'application-participant-school')
    const instructor = independentFromOverlay(instructorOverlay, 'application-instructor')
    const volunteer = independentFromOverlay(volunteerOverlay, 'application-volunteer')
    const individual = independentFromOverlay(individualOverlay, 'application-participant-individual')
    expect(school.formBindingIntent).toEqual({
      formType: 'APPLICATION',
      active: true,
      required: false,
      targetRole: 'ORGANIZATION',
      targetType: 'ORGANIZATION',
    })
    expect(individual.formBindingIntent.targetRole).toBe('INDIVIDUAL')
    expect(individual.formBindingIntent.targetType).toBe('INDIVIDUAL')
    expect(instructor.formBindingIntent.targetType).toBe('TEACHER')
    expect(volunteer.formBindingIntent.targetType).toBe('COLLEGE_STUDENT')
    expect(school.sink).toBe('form-version-overlay')
  })
})
