/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { extensionPayloadToExtensionJson } from '@/features/template/api/adapters/form-template-draft-adapters'
import { OVERLAY_PHASE0_KNOWN_DIFFS } from '@/features/program/general/lib/overlay-phase0/overlay-phase0-known-diff'
import { overlayKvToIndependentApplicationInput } from './overlay-kv-to-application-form-values'
import {
  buildIndependentApplicationDraft,
  buildIndependentApplicationFormVersionPutOverlay,
} from './build-independent-application'
import { collectWizardApplicationOverlayForCatalog } from './registration-wizard-application-from-rhf'
import { createDefaultRegistrationWizardUiValues } from './registration-wizard-ui-values'
import { independentApplicationFormBindingIntent } from './application-domain'

const institutionKv = {
  'application.institution.teacherTel': '02-111-1111',
  'application.institution.teacherEmail': 'org@example.com',
  'application.institution.applicationGrade': '3',
  'application.institution.educationForm': 'offline',
  'application.institution.classCount': '2',
  'application.institution.preferredSchedules': [{ date: '2026-06-01' }],
  'application.institution.fixedScheduleSelected': ['slot-a'],
  'application.institution.guidanceAnswers': { q1: 'yes' },
  'application.institution.sexOffense.inquiryMethod': 'online',
}

const individualKv = {
  'application.individual.teamInfo.teamName': '팀A',
  'application.individual.teamInfo.memberCountSelect': 'etc',
  'application.individual.teamInfo.customMemberCount': '7',
  'application.individual.teamInfo.teamRole': 'leader',
  'application.individual.teamInfo.customNote': '동적',
  'application.individual.fixedScheduleSelected': ['slot-ind'],
}

const instructorKv = {
  'application.instructor.crimeRecordConfirmed': true,
  'application.instructor.selectedSlotIds': ['s1', 's2'],
}

const volunteerKv = {
  'application.volunteer.previousProgram.programName': 'JA',
  'application.volunteer.applicant.selectedSlots': [],
  'application.volunteer.interview.exception.10.exceptionDate': '2026-06-11',
}

describe('신청 Form Version RHF Independent vs catalog overlay', () => {
  it('individual-schedule known-diff는 개인 catalog 키로 해결한다', () => {
    const item = OVERLAY_PHASE0_KNOWN_DIFFS.find(
      row => row.id === 'individual-schedule-writes-institution-prefix'
    )
    expect(item?.change).toBe('keep_current')
    const ui = createDefaultRegistrationWizardUiValues({
      participant: {
        organization: false,
        individual: true,
        teacherInstructor: false,
        volunteer: false,
      },
    })
    ui.applicationKv = {
      ...individualKv,
      'application.institution.fixedScheduleSelected': ['stale-org'],
    }
    const overlay = collectWizardApplicationOverlayForCatalog(
      'application-participant-individual',
      ui
    )
    expect(overlay?.['application.individual.fixedScheduleSelected']).toEqual(['slot-ind'])
    expect(overlay?.['application.institution.fixedScheduleSelected']).toBeUndefined()
  })

  it('기관·개인·강사·봉사자 Form Version overlay가 Independent serialize와 같다', () => {
    const cases = [
      {
        catalog: 'application-participant-school' as const,
        participant: {
          organization: true,
          individual: false,
          teacherInstructor: false,
          volunteer: false,
        },
        kv: institutionKv,
      },
      {
        catalog: 'application-participant-individual' as const,
        participant: {
          organization: false,
          individual: true,
          teacherInstructor: false,
          volunteer: false,
        },
        kv: individualKv,
      },
      {
        catalog: 'application-instructor' as const,
        participant: {
          organization: false,
          individual: false,
          teacherInstructor: true,
          volunteer: false,
        },
        kv: instructorKv,
      },
      {
        catalog: 'application-volunteer' as const,
        participant: {
          organization: false,
          individual: false,
          teacherInstructor: false,
          volunteer: true,
        },
        kv: volunteerKv,
      },
    ]
    for (const row of cases) {
      const ui = createDefaultRegistrationWizardUiValues({ participant: row.participant })
      ui.applicationKv = row.kv
      const fromRhf = collectWizardApplicationOverlayForCatalog(row.catalog, ui)
      const adapted = overlayKvToIndependentApplicationInput(row.kv)
      const independent = buildIndependentApplicationDraft({
        catalog: row.catalog,
        formValues: adapted.formValues,
        sidecars: { ...adapted.sidecars, unownedOverlay: {} },
      })
      expect(fromRhf).toEqual(independent.overlay)
      expect(buildIndependentApplicationFormVersionPutOverlay(fromRhf ?? {})).toEqual({
        overlay: independent.overlay,
      })
      expect(extensionPayloadToExtensionJson({ overlay: fromRhf ?? {} })).toBe(
        extensionPayloadToExtensionJson({ overlay: independent.overlay })
      )
      expect(independentApplicationFormBindingIntent(row.catalog).formType).toBe('APPLICATION')
    }
  })

  it('복수 유형 선택 시 catalog overlay가 섞이지 않는다', () => {
    const ui = createDefaultRegistrationWizardUiValues({
      participant: {
        organization: true,
        individual: true,
        teacherInstructor: true,
        volunteer: true,
      },
    })
    ui.applicationKv = { ...institutionKv, ...individualKv, ...instructorKv, ...volunteerKv }
    const school = collectWizardApplicationOverlayForCatalog('application-participant-school', ui)
    const individual = collectWizardApplicationOverlayForCatalog(
      'application-participant-individual',
      ui
    )
    const instructor = collectWizardApplicationOverlayForCatalog('application-instructor', ui)
    const volunteer = collectWizardApplicationOverlayForCatalog('application-volunteer', ui)
    expect(school?.['application.institution.teacherTel']).toBe('02-111-1111')
    expect(school?.['application.individual.teamInfo.teamName']).toBeUndefined()
    expect(individual?.['application.individual.fixedScheduleSelected']).toEqual(['slot-ind'])
    expect(individual?.['application.institution.fixedScheduleSelected']).toBeUndefined()
    expect(instructor?.['application.instructor.selectedSlotIds']).toEqual(['s1', 's2'])
    expect(volunteer?.['application.volunteer.previousProgram.programName']).toBe('JA')
  })
})
