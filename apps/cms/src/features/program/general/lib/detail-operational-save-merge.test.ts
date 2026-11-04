import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { GENERAL_RECRUIT_OVERLAY_KEYS } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import dayjs from 'dayjs'
import {
  buildMergedRegistrationOverlayForRecruitSave,
  ensureRecruitOperationalEditScope,
  instructorRecruitOverlayPatchFromDetailEditValues,
  mergeOverlayOnlyVolunteerInterviewSchedule,
  participantRecruitOverlayPatchFromDetailEditValues,
} from '@/features/program/general/lib/detail-operational-save-merge'
import { detailEditValuesToProgramPatch } from '@/features/program/shared/model/program-detail-edit-schema'
import { programToRecruitmentTabEditValues } from '@/features/program/general/lib/general-program-recruitment-edit-seed'
import {
  getGeneralRecruitOverlayScope,
  patchGeneralRecruitOverlay,
  replaceGeneralRecruitOverlayForScope,
  resetGeneralRecruitOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { resyncGeneralRecruitOverlayFromProgram } from '@/features/program/general/lib/general-recruit-overlay-from-program'
import {
  parseGeneralProgramServiceDetailJson,
  serializeGeneralProgramServiceDetailJson,
} from '@/features/program/general/lib/general-program-service-detail-json'

beforeEach(() => {
  resetGeneralRecruitOverlayStoreForTests()
})

function baseProgram(): Program {
  return {
    id: 'merge-test',
    title: '테스트',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    sponsorId: 's1',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    generalParticipantTypes: ['school_institution', 'individual'],
    instructorTargets: ['adult'],
    rounds: [],
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-06-30T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    registrationOverlay: {
      [GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]: ['elementary'],
    },
    generalCommonInfo: {
      instructorRecruitmentInfo: { recruitmentTarget: '성인' },
    },
  }
}

describe('detail-operational-save-merge', () => {
  it('stale active-scope instructor overlay보다 폼 instructorTargets가 merge에 우선한다', () => {
    replaceGeneralRecruitOverlayForScope('recruitment-instructor', {
      [GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]: ['elementary'],
    })
    replaceGeneralRecruitOverlayForScope('application-instructor', {
      unrelated: 'stale',
    })

    const program = baseProgram()
    const values = programToRecruitmentTabEditValues(program, 'instructor')
    const patch = detailEditValuesToProgramPatch(
      { ...values, instructorTargets: ['adult'] },
      program
    )
    const merged = buildMergedRegistrationOverlayForRecruitSave({
      program,
      remotePatch: patch,
      values: { ...values, instructorTargets: ['adult'] },
      audience: 'instructor',
    })
    expect(merged[GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]).toEqual(['adult'])
  })

  it('GENERAL 기관 모집 저장은 라이브 강사 overlay store를 정본으로 읽지 않는다', () => {
    replaceGeneralRecruitOverlayForScope('recruitment-instructor', {
      [GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]: ['stale-from-store'],
    })
    const program = {
      ...baseProgram(),
      registrationOverlay: {
        ...baseProgram().registrationOverlay,
        [GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]: ['elementary'],
        'recruit.notes': '기관-비고-유지',
      },
    }
    const values = programToRecruitmentTabEditValues(program, 'participant')
    const merged = buildMergedRegistrationOverlayForRecruitSave({
      program,
      remotePatch: {},
      values: { ...values, remarks: '기관-비고-PATCH' },
      audience: 'participant',
    })
    expect(merged[GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]).toEqual(['elementary'])
    expect(merged[GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]).not.toEqual([
      'stale-from-store',
    ])
  })

  it('원격 SSOT 모드에서는 브라우저 overlay store를 저장 source로 사용하지 않는다', () => {
    replaceGeneralRecruitOverlayForScope('recruitment-instructor', {
      [GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]: ['stale-local'],
      'recruit.instructor.inquiryEmail': 'stale@example.com',
    })
    const program = baseProgram()
    const values = programToRecruitmentTabEditValues(program, 'instructor')
    const merged = buildMergedRegistrationOverlayForRecruitSave({
      program,
      remotePatch: {},
      values,
      audience: 'instructor',
      strictRemote: true,
    })
    expect(merged[GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]).toEqual(['adult'])
    expect(merged['recruit.instructor.inquiryEmail']).toBeUndefined()
  })

  it('participant form patch가 targetLevels에 반영되고 resync 후 overlay에 남는다', () => {
    const program = baseProgram()
    const values = programToRecruitmentTabEditValues(program, 'participant')
    const patch = detailEditValuesToProgramPatch({ ...values, targetLevels: ['high'] }, program)
    const formPatch = participantRecruitOverlayPatchFromDetailEditValues({
      ...values,
      targetLevels: ['high'],
    })
    expect(formPatch[GENERAL_RECRUIT_OVERLAY_KEYS.individual.targetLevels]).toEqual(['high'])

    const merged = buildMergedRegistrationOverlayForRecruitSave({
      program,
      remotePatch: patch,
      values: { ...values, targetLevels: ['high'] },
      audience: 'participant',
    })
    const draft: Program = {
      ...program,
      ...patch,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    }
    const overlay = resyncGeneralRecruitOverlayFromProgram(draft, merged)
    expect(overlay[GENERAL_RECRUIT_OVERLAY_KEYS.individual.targetLevels]).toEqual(['high'])
  })

  it('봉사자 면접 저장 시 selectedSlotKeys 2개면 nested availableTimeSlots도 2구간', () => {
    const slotAStart = dayjs('2026-03-26T10:00:00')
    const slotAEnd = slotAStart.add(30, 'minute')
    const slotBStart = dayjs('2026-03-26T11:00:00')
    const slotBEnd = slotBStart.add(30, 'minute')
    const selectedSlotKeys = [
      `${slotAStart.valueOf()}-${slotAEnd.valueOf()}`,
      `${slotBStart.valueOf()}-${slotBEnd.valueOf()}`,
    ]
    replaceGeneralRecruitOverlayForScope('recruitment-volunteer', {
      'recruit.volunteer.interviewRequired': 'yes',
      'recruit.volunteer.interview.selectedSlotKeys': selectedSlotKeys,
      'recruit.volunteer.interview.interviewTimeRange': [
        slotAStart.toISOString(),
        dayjs('2026-03-26T12:00:00').toISOString(),
      ],
      'recruit.volunteer.interview.timeUnit': '30',
    })

    const program: Program = {
      ...baseProgram(),
      generalParticipantTypes: ['volunteer'],
      generalVolunteerInterviewEnabled: true,
      generalCommonInfo: {
        volunteerInterviewScheduleInfo: {
          availableTimeSlots: '10:00 ~ 10:30',
        },
      },
    }
    const values = programToRecruitmentTabEditValues(program, 'volunteer')
    const patch = detailEditValuesToProgramPatch(
      { ...values, volunteerRecruitmentInterviewEnabled: 'yes' },
      program
    )
    const mergedOverlay = buildMergedRegistrationOverlayForRecruitSave({
      program,
      remotePatch: patch,
      values: { ...values, volunteerRecruitmentInterviewEnabled: 'yes' },
      audience: 'volunteer',
    })
    expect(mergedOverlay['recruit.volunteer.interview.selectedSlotKeys']).toEqual(selectedSlotKeys)

    const remotePatch = mergeOverlayOnlyVolunteerInterviewSchedule(
      program,
      patch,
      mergedOverlay,
      { ...values, volunteerRecruitmentInterviewEnabled: 'yes' }
    )
    const slots =
      remotePatch.generalCommonInfo?.volunteerInterviewScheduleInfo?.availableTimeSlots ?? ''
    expect(slots.split(', ').length).toBe(2)
    expect(slots).toContain('11:00 ~ 11:30')
  })

  it('저장 merge는 live exclusionState를 catalog seed보다 우선한다', () => {
    replaceGeneralRecruitOverlayForScope('recruitment-volunteer', {
      'recruit.volunteer.interview.exclusionState': {
        excludeNone: true,
        excludeSaturday: false,
        excludeSunday: false,
        excludeHoliday: false,
      },
      'recruit.volunteer.interview.selectedSlotKeys': ['1-2'],
    })
    replaceGeneralRecruitOverlayForScope('__default__', {
      'recruit.volunteer.interview.exclusionState': {
        excludeNone: false,
        excludeSaturday: false,
        excludeSunday: false,
        excludeHoliday: true,
      },
      'recruit.volunteer.interview.selectedSlotKeys': ['1-2'],
    })

    const program: Program = {
      ...baseProgram(),
      generalParticipantTypes: ['volunteer'],
      generalVolunteerInterviewEnabled: true,
      generalCommonInfo: {
        volunteerInterviewScheduleInfo: {
          recurringUnavailable: '공휴일',
        },
      },
    }
    const values = programToRecruitmentTabEditValues(program, 'volunteer')
    const patch = detailEditValuesToProgramPatch(
      { ...values, volunteerRecruitmentInterviewEnabled: 'yes' },
      program
    )
    const mergedOverlay = buildMergedRegistrationOverlayForRecruitSave({
      program,
      remotePatch: patch,
      values: { ...values, volunteerRecruitmentInterviewEnabled: 'yes' },
      audience: 'volunteer',
    })
    expect(mergedOverlay['recruit.volunteer.interview.exclusionState']).toEqual({
      excludeNone: false,
      excludeSaturday: false,
      excludeSunday: false,
      excludeHoliday: true,
    })

    const remotePatch = mergeOverlayOnlyVolunteerInterviewSchedule(
      program,
      patch,
      mergedOverlay,
      { ...values, volunteerRecruitmentInterviewEnabled: 'yes' }
    )
    expect(
      remotePatch.generalCommonInfo?.volunteerInterviewScheduleInfo?.recurringUnavailable
    ).toBe('공휴일')
  })

  it('슬롯 toggle가 default 버킷에만 있어도 저장 merge는 긴 selectedSlotKeys를 쓴다', () => {
    const slotAStart = dayjs('2026-03-26T10:00:00')
    const slotAEnd = slotAStart.add(30, 'minute')
    const slotBStart = dayjs('2026-03-26T10:30:00')
    const slotBEnd = slotBStart.add(30, 'minute')
    const selectedSlotKeys = [
      `${slotAStart.valueOf()}-${slotAEnd.valueOf()}`,
      `${slotBStart.valueOf()}-${slotBEnd.valueOf()}`,
    ]

    replaceGeneralRecruitOverlayForScope('__default__', {
      'recruit.volunteer.interview.selectedSlotKeys': selectedSlotKeys,
      'recruit.volunteer.interview.timeUnit': '30',
    })
    replaceGeneralRecruitOverlayForScope('recruitment-volunteer', {
      'recruit.volunteer.interview.selectedSlotKeys': [
        `${slotAStart.valueOf()}-${slotAEnd.valueOf()}`,
      ],
      'recruit.volunteer.interview.timeUnit': '30',
    })

    const program: Program = {
      ...baseProgram(),
      generalParticipantTypes: ['volunteer'],
      generalVolunteerInterviewEnabled: true,
      registrationOverlay: {
        'recruit.volunteer.interview.selectedSlotKeys': [
          `${slotAStart.valueOf()}-${slotAEnd.valueOf()}`,
        ],
      },
    }
    const values = programToRecruitmentTabEditValues(program, 'volunteer')
    const patch = detailEditValuesToProgramPatch(
      { ...values, volunteerRecruitmentInterviewEnabled: 'yes' },
      program
    )
    const mergedOverlay = buildMergedRegistrationOverlayForRecruitSave({
      program,
      remotePatch: patch,
      values: { ...values, volunteerRecruitmentInterviewEnabled: 'yes' },
      audience: 'volunteer',
    })
    expect(mergedOverlay['recruit.volunteer.interview.selectedSlotKeys']).toEqual(selectedSlotKeys)
  })

  it('봉사자 면접 슬롯 toggle는 활성 catalog 스코프에 쌓여 저장 merge에 반영된다', () => {
    const slotAStart = dayjs('2026-03-26T10:00:00')
    const slotAEnd = slotAStart.add(30, 'minute')
    const slotBStart = dayjs('2026-03-26T10:30:00')
    const slotBEnd = slotBStart.add(30, 'minute')
    const selectedSlotKeys = [
      `${slotAStart.valueOf()}-${slotAEnd.valueOf()}`,
      `${slotBStart.valueOf()}-${slotBEnd.valueOf()}`,
    ]

    const program: Program = {
      ...baseProgram(),
      generalParticipantTypes: ['volunteer'],
      generalVolunteerInterviewEnabled: true,
      registrationOverlay: {
        'recruit.volunteer.interview.selectedSlotKeys': [
          `${slotAStart.valueOf()}-${slotAEnd.valueOf()}`,
        ],
      },
    }

    ensureRecruitOperationalEditScope(program, 'volunteer')
    expect(getGeneralRecruitOverlayScope()).toBe('recruitment-volunteer')

    patchGeneralRecruitOverlay({
      'recruit.volunteer.interview.selectedSlotKeys': selectedSlotKeys,
    })

    const values = programToRecruitmentTabEditValues(program, 'volunteer')
    const patch = detailEditValuesToProgramPatch(
      { ...values, volunteerRecruitmentInterviewEnabled: 'yes' },
      program
    )
    const mergedOverlay = buildMergedRegistrationOverlayForRecruitSave({
      program,
      remotePatch: patch,
      values: { ...values, volunteerRecruitmentInterviewEnabled: 'yes' },
      audience: 'volunteer',
    })
    expect(mergedOverlay['recruit.volunteer.interview.selectedSlotKeys']).toEqual(selectedSlotKeys)

    const remotePatch = mergeOverlayOnlyVolunteerInterviewSchedule(
      program,
      patch,
      mergedOverlay,
      { ...values, volunteerRecruitmentInterviewEnabled: 'yes' }
    )
    const json = serializeGeneralProgramServiceDetailJson({
      ...program,
      ...remotePatch,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        ...remotePatch.generalCommonInfo,
      },
      registrationOverlay: resyncGeneralRecruitOverlayFromProgram(
        {
          ...program,
          ...remotePatch,
          generalCommonInfo: {
            ...program.generalCommonInfo,
            ...remotePatch.generalCommonInfo,
          },
        },
        mergedOverlay
      ),
    })
    const parsed = parseGeneralProgramServiceDetailJson(json)
    expect(parsed.registrationOverlay?.['recruit.volunteer.interview.selectedSlotKeys']).toEqual(
      selectedSlotKeys
    )
  })

  it('instructorRecruitOverlayPatchFromDetailEditValues는 빈 배열을 반영한다', () => {
    const patch = instructorRecruitOverlayPatchFromDetailEditValues({
      instructorTargets: [],
      instructorTargetDetail: '',
    })
    expect(patch[GENERAL_RECRUIT_OVERLAY_KEYS.instructor.recruitTargets]).toEqual([])
  })
})
