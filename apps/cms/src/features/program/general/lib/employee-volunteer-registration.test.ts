import { describe, expect, it } from 'vitest'
import {
  aggregateEmployeeVolunteerEducationMetrics,
  countGeneralReturningVolunteersForInstitutionSession,
} from './employee-volunteer-registration'
import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'

describe('employee-volunteer-registration', () => {
  it('재참여는 임직원 입력 + 일반 재참여 봉사자를 합산한다', () => {
    const volunteerList: ParticipatingVolunteerRow[] = [
      {
        id: 'v1',
        no: 1,
        volunteerName: '재참여A',
        id1365: '1',
        assignedInstitutionNames: ['틴토초등학교'],
        sessions: [{ round: 1, date: '2026.01.01', dayOfWeek: '금', duration: '2', format: '오프라인', classNum: '1', timeRange: '9~11' }],
        contact: '',
        email: '',
        isReturningVolunteer: true,
      },
    ]

    const metrics = aggregateEmployeeVolunteerEducationMetrics({
      sessionRows: [
        {
          id: 'round_1',
          label: '1회차 교육',
          round: 1,
          isPreEducation: false,
          countsTowardParticipants: false,
        },
      ],
      registrations: [
        {
          institutionId: 'school-1',
          countsBySessionId: {
            round_1: { newCount: 4, returningCount: 2 },
          },
        },
      ],
      volunteerList,
      institutionIdToName: new Map([['school-1', '틴토초등학교']]),
    })

    expect(metrics.staffVolunteers).toBe(4)
    expect(metrics.returningVolunteers).toBe(3)
  })

  it('사전교육 신규·재참여는 참가자 반영분에 모두 합산한다', () => {
    const metrics = aggregateEmployeeVolunteerEducationMetrics({
      sessionRows: [
        {
          id: 'pre_education',
          label: '사전교육',
          round: null,
          isPreEducation: true,
          countsTowardParticipants: true,
        },
      ],
      registrations: [
        {
          institutionId: 'school-1',
          countsBySessionId: {
            pre_education: { newCount: 2, returningCount: 3 },
          },
        },
      ],
      volunteerList: [],
      institutionIdToName: new Map([['school-1', '틴토초등학교']]),
    })

    expect(metrics.preEducationParticipantContribution).toBe(5)
  })

  it('일반 재참여 봉사자는 기관·회차로 필터한다', () => {
    const volunteers: ParticipatingVolunteerRow[] = [
      {
        id: 'v1',
        no: 1,
        volunteerName: 'A',
        id1365: '1',
        assignedInstitutionNames: ['틴토초등학교'],
        sessions: [{ round: 1, date: '', dayOfWeek: '금', duration: '', format: '', classNum: '', timeRange: '' }],
        contact: '',
        email: '',
        isReturningVolunteer: true,
      },
      {
        id: 'v2',
        no: 2,
        volunteerName: 'B',
        id1365: '2',
        assignedInstitutionNames: ['틴토초등학교'],
        sessions: [{ round: 2, date: '', dayOfWeek: '금', duration: '', format: '', classNum: '', timeRange: '' }],
        contact: '',
        email: '',
        isReturningVolunteer: true,
      },
    ]

    expect(
      countGeneralReturningVolunteersForInstitutionSession(volunteers, '틴토초등학교', 1)
    ).toBe(1)
    expect(
      countGeneralReturningVolunteersForInstitutionSession(volunteers, '틴토초등학교', null)
    ).toBe(2)
  })
})
