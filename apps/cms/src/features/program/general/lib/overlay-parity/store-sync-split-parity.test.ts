/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
// --- 대상 import (8단계 분리 커밋: sync 모듈 → 새 순수 모듈 경로. 스냅샷은 그대로) ---
import {
  buildGeneralRegistrationOverlayFromProgram,
  countRegularCurriculumSessions,
  describeIncompleteGeneralProgramDetailEditRequiredFields,
  extrasFromGeneralProgram,
  mergeRegistrationOverlayNestedSsot,
  resyncGeneralRegistrationOverlayFromProgram,
} from '@/features/program/general/lib/general-registration-overlay-from-program'
import {
  UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS,
  stripUjatApplicationVolunteerProgramOnlyFields,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-keys'
import { UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-keys'
import { buildVolunteerInterviewOverlayKey } from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-keys'
// --- 끝 ---

/**
 * Part4 8단계(스토어·sync 모듈 순수 함수 분리) parity — 81024fbf2에서 만든 스냅샷.
 * 순수 함수·키를 sync 모듈 밖으로 옮겨도 결과가 같아야 한다.
 */

function curriculumProgram(): Program {
  return {
    id: 'general-1',
    title: '청소년 경제',
    mainTitle: '청소년 경제',
    titleEn: 'Youth Economy',
    type: 'offline',
    format: 'course',
    category: 'school',
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-11-30T00:00:00.000Z',
    status: 'active',
    detailedProgramId: '163006',
    businessArea: '경제금융',
    educationProcess: 'Digital (Computer)',
    ipOwned: 'JA',
    sponsorId: '163001',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    generalSurveyMenuKeys: ['survey'],
    generalCommonInfo: {
      announcementTitle: '공고용 청소년 경제',
      detailedProgramName: '캠프 A',
      curriculumSessions: [
        { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '내용1' },
        { sessionNo: 2, sessionLabel: '2회차', title: '단원2', description: '내용2' },
      ],
      kpi: {
        finalParticipants: 20,
        instructorCount: 2,
        volunteerCount: 0,
        finalSchools: 4,
        finalClasses: 8,
      },
    },
    registrationOverlay: {
      'generalRegistration.basicInfo.educationVenueDetail': '본관',
      'generalRegistration.wageInfo.grade1Fee': 170000,
      'recruit.inquiryTel': '02-111-1111',
    },
  } as unknown as Program
}

function scheduleProgram(): Program {
  return {
    ...curriculumProgram(),
    generalProgramEducationStructure: 'schedule',
    generalProgramSessionRound: 'single',
    generalCommonInfo: {
      announcementTitle: '공고 일정형',
      scheduleDetails: [{ scheduleLabel: '1', educationFormLabel: '오프라인' }],
    },
  } as unknown as Program
}

describe('store·sync 순수 함수 분리 parity', () => {
  for (const [name, make] of [
    ['curriculum', curriculumProgram],
    ['schedule', scheduleProgram],
  ] as const) {
    it(`overlay·extras — ${name}`, () => {
      const program = make()
      const overlay = buildGeneralRegistrationOverlayFromProgram(program)
      const extras = extrasFromGeneralProgram(program)
      expect({
        overlay,
        extras,
        regular: countRegularCurriculumSessions(program.generalCommonInfo?.curriculumSessions),
        incomplete: describeIncompleteGeneralProgramDetailEditRequiredFields(overlay, extras),
        incompleteEmpty: describeIncompleteGeneralProgramDetailEditRequiredFields({}, extras),
        nestedSsot: mergeRegistrationOverlayNestedSsot(program, {
          ...(program.registrationOverlay ?? {}),
          'generalRegistration.educationCurriculum.unitNameBySession': { 1: 'stale', 3: 'ghost' },
        }),
        resync: resyncGeneralRegistrationOverlayFromProgram(program),
        resyncEdit: resyncGeneralRegistrationOverlayFromProgram(program, {
          'generalRegistration.kpi.participantCount': null,
          'recruit.inquiryTel': 'edit',
        }),
      }).toMatchSnapshot()
    })
  }

  it('UJAT 신청 키·봉사 신청 프로그램 전용 필드 제거', () => {
    expect({
      volunteerKeys: UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS,
      institutionKeys: UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS,
      stripped: stripUjatApplicationVolunteerProgramOnlyFields({
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileNames]: ['a.pdf'],
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.grade]: '3',
      }),
    }).toMatchSnapshot()
  })

  it('봉사 면접 overlay 키', () => {
    expect([
      buildVolunteerInterviewOverlayKey('recruit', 'timeUnit'),
      buildVolunteerInterviewOverlayKey('application', 'selectedSlotKeys'),
      buildVolunteerInterviewOverlayKey(
        'recruit',
        'timeUnit',
        'ujat.recruit.volunteer.h1.interview'
      ),
      buildVolunteerInterviewOverlayKey('recruit', 'x', '  '),
    ]).toMatchSnapshot()
  })
})
