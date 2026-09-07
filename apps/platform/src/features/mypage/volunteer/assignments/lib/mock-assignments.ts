import type {
  VolunteerAssignedInstitutionRow,
  VolunteerAssignedScheduleRow,
  VolunteerIndividualAssignment,
  VolunteerInstitutionAssignment,
  VolunteerWaitingInstitutionRow,
  VolunteerWaitingScheduleRow,
} from '../model/types'
import { isScheduleLineWithinLastSession } from './status'

const INSTITUTION_ASSIGNED: VolunteerAssignedInstitutionRow[] = [
  {
    id: 'org-assigned-1',
    no: 3,
    schoolName: 'JA 초등학교',
    educationGrade: '1학년',
    region: '서울특별시 강서구',
    distanceFromHome: '10km',
    scheduleLines: [
      '2026년 01월 09일(금) 09:00~12:20 | 1차시',
      '2026년 01월 16일(금) 09:00~12:20 | 2차시',
    ],
  },
  {
    id: 'org-assigned-2',
    no: 2,
    schoolName: 'JA 초등학교',
    educationGrade: '2학년',
    region: '서울특별시 강서구',
    distanceFromHome: '10km',
    scheduleLines: ['2026년 01월 09일(금) 09:00~12:20 | 1차시'],
  },
  {
    id: 'org-assigned-3',
    no: 1,
    schoolName: 'JA 초등학교',
    educationGrade: '3학년',
    region: '서울특별시 강서구',
    distanceFromHome: '10km',
    scheduleLines: [
      '2026년 01월 09일(금) 09:00~12:20 | 1차시',
      '2026년 01월 16일(금) 09:00~12:20 | 2차시',
      '2026년 01월 23일(금) 09:00~12:20 | 3차시',
      '2026년 01월 30일(금) 09:00~12:20 | 4차시',
    ],
  },
]

const INSTITUTION_WAITING: VolunteerWaitingInstitutionRow[] = [
  {
    id: 'org-waiting-5',
    no: 5,
    schoolName: '재희중학교',
    desiredGrade: '1학년',
    region: '서울특별시 강서구',
    distanceFromHome: '10km',
    scheduleLine: '2026년 02월 06일(금) 09:00~12:20 | 1차시',
    assignmentStatus: 'waiting',
  },
  {
    id: 'org-waiting-4',
    no: 4,
    schoolName: '재희중학교',
    desiredGrade: '2학년',
    region: '서울특별시 강서구',
    distanceFromHome: '10km',
    scheduleLine: '2026년 02월 13일(금) 09:00~12:20 | 2차시',
    assignmentStatus: 'waiting',
  },
  {
    id: 'org-waiting-3',
    no: 3,
    schoolName: '재희중학교',
    desiredGrade: '3학년',
    region: '서울특별시 강서구',
    distanceFromHome: '10km',
    scheduleLine: '2026년 02월 20일(금) 09:00~12:20 | 3차시',
    assignmentStatus: 'cancelled',
  },
  {
    id: 'org-waiting-2',
    no: 2,
    schoolName: '재희중학교',
    desiredGrade: '4학년',
    region: '서울특별시 강서구',
    distanceFromHome: '10km',
    scheduleLine: '2026년 02월 27일(금) 09:00~12:20 | 4차시',
    assignmentStatus: 'cancelled',
  },
  {
    id: 'org-waiting-1',
    no: 1,
    schoolName: '재희중학교',
    desiredGrade: '5학년',
    region: '서울특별시 강서구',
    distanceFromHome: '10km',
    scheduleLine: '2026년 03월 06일(금) 09:00~12:20 | 5차시',
    assignmentStatus: 'cancelled',
  },
]

const INDIVIDUAL_ASSIGNED: VolunteerAssignedScheduleRow[] = [
  {
    id: 'ind-assigned-3',
    no: 3,
    location: '서울특별시 강서구',
    distanceFromHome: '10km',
    scheduleLine: '2026년 01월 09일(금) 09:00~12:20 | 2차시',
  },
  {
    id: 'ind-assigned-2',
    no: 2,
    location: '서울특별시 강서구',
    distanceFromHome: '10km',
    scheduleLine: '2026년 01월 16일(금) 09:00~12:20 | 1차시',
  },
  {
    id: 'ind-assigned-1',
    no: 1,
    location: '서울특별시 강서구',
    distanceFromHome: '10km',
    scheduleLine: '2026년 01월 23일(금) 09:00~12:20 | 1차시',
  },
]

const INDIVIDUAL_WAITING: VolunteerWaitingScheduleRow[] = [
  {
    id: 'ind-waiting-5',
    no: 5,
    location: '서울특별시 양천구',
    distanceFromHome: '10km',
    scheduleLine: '2026년 02월 06일(금) 09:00~12:20 | 1차시',
    assignmentStatus: 'waiting',
  },
  {
    id: 'ind-waiting-4',
    no: 4,
    location: '서울특별시 양천구',
    distanceFromHome: '10km',
    scheduleLine: '2026년 02월 13일(금) 09:00~12:20 | 3차시',
    assignmentStatus: 'waiting',
  },
  {
    id: 'ind-waiting-3',
    no: 3,
    location: '서울특별시 영등포구',
    distanceFromHome: '10km',
    scheduleLine: '2026년 02월 20일(금) 09:00~12:20 | 4차시',
    assignmentStatus: 'cancelled',
  },
  {
    id: 'ind-waiting-2',
    no: 2,
    location: '서울특별시 영등포구',
    distanceFromHome: '10km',
    scheduleLine: '2026년 02월 27일(금) 09:00~12:20 | 5차시',
    assignmentStatus: 'cancelled',
  },
  {
    id: 'ind-waiting-1',
    no: 1,
    location: '서울특별시 마포구',
    distanceFromHome: '10km',
    scheduleLine: '2026년 03월 06일(금) 09:00~12:20 | 6차시',
    assignmentStatus: 'cancelled',
  },
]

function renumber<T extends { no: number }>(rows: T[]): T[] {
  return rows.map((row, index) => ({ ...row, no: rows.length - index }))
}

export function getMockVolunteerInstitutionAssignment(
  lastParticipatedSession?: number,
): VolunteerInstitutionAssignment {
  const assigned = INSTITUTION_ASSIGNED.map(row => ({
    ...row,
    scheduleLines: row.scheduleLines.filter(line =>
      isScheduleLineWithinLastSession(line, lastParticipatedSession),
    ),
  })).filter(row => row.scheduleLines.length > 0)

  const waiting = INSTITUTION_WAITING.filter(row =>
    isScheduleLineWithinLastSession(row.scheduleLine, lastParticipatedSession),
  )

  return {
    assigned: renumber(assigned),
    waiting: renumber(waiting),
  }
}

export function getMockVolunteerIndividualAssignment(
  lastParticipatedSession?: number,
): VolunteerIndividualAssignment {
  const assigned = INDIVIDUAL_ASSIGNED.filter(row =>
    isScheduleLineWithinLastSession(row.scheduleLine, lastParticipatedSession),
  )
  const waiting = INDIVIDUAL_WAITING.filter(row =>
    isScheduleLineWithinLastSession(row.scheduleLine, lastParticipatedSession),
  )

  return {
    assigned: renumber(assigned),
    waiting: renumber(waiting),
  }
}
