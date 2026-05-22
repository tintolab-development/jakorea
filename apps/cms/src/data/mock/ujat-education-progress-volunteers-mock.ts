import { UJAT_INSTITUTION_APPLICATION_REGIONS } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/ujat-education-progress-tabs'
import type {
  UjatEducationProgressVolunteerAssignmentStatus,
  UjatEducationProgressVolunteerGrade,
  UjatEducationProgressVolunteerRow,
} from '@/features/program/ujat/ui/detail-modal/progress/volunteers/types'

const ASSIGNMENT_STATUSES: UjatEducationProgressVolunteerAssignmentStatus[] = [
  'assignment_waiting',
  'assignment_completed',
  'activity_abandoned',
]

type VolunteerSeed = {
  volunteerName: string
  grade: UjatEducationProgressVolunteerGrade
  regionKey: UjatInstitutionApplicationRegionKey
  mobile: string
  email: string
  totalAssignmentDays: number | null
}

const SEEDS_BY_STATUS: Record<UjatEducationProgressVolunteerAssignmentStatus, VolunteerSeed[]> = {
  assignment_waiting: [
    {
      volunteerName: '김민토',
      grade: '1학년',
      regionKey: 'seoul',
      mobile: '010-2847-4829',
      email: 'mint.kim@naver.com',
      totalAssignmentDays: null,
    },
    {
      volunteerName: '이민토',
      grade: '3학년',
      regionKey: 'seoul',
      mobile: '010-3912-6641',
      email: 'mint.lee@kakao.com',
      totalAssignmentDays: null,
    },
  ],
  assignment_completed: [
    {
      volunteerName: '박서연',
      grade: '2학년',
      regionKey: 'busan',
      mobile: '010-5521-9033',
      email: 'seoyeon.park@gmail.com',
      totalAssignmentDays: 4,
    },
    {
      volunteerName: '최준호',
      grade: '4학년',
      regionKey: 'daejeon',
      mobile: '010-7788-2104',
      email: 'junho.choi@naver.com',
      totalAssignmentDays: 6,
    },
  ],
  activity_abandoned: [
    {
      volunteerName: '정하은',
      grade: '휴학생',
      regionKey: 'gwangju',
      mobile: '010-4412-8876',
      email: 'haeun.jung@naver.com',
      totalAssignmentDays: null,
    },
    {
      volunteerName: '한지우',
      grade: '졸업유예',
      regionKey: 'incheon',
      mobile: '010-9033-1542',
      email: 'jiwoo.han@kakao.com',
      totalAssignmentDays: 2,
    },
  ],
}

function regionLabelForKey(regionKey: UjatInstitutionApplicationRegionKey): string {
  return (
    UJAT_INSTITUTION_APPLICATION_REGIONS.find(r => r.key === regionKey)?.label ?? regionKey
  )
}

export function getUjatEducationProgressVolunteerMockRows(
  half: EducationProgressHalfKey
): UjatEducationProgressVolunteerRow[] {
  const rows: UjatEducationProgressVolunteerRow[] = []
  let no = ASSIGNMENT_STATUSES.length * 2

  for (const status of ASSIGNMENT_STATUSES) {
    const seeds = SEEDS_BY_STATUS[status]
    seeds.forEach((seed, index) => {
      rows.push({
        id: `${half}-vol-${status}-${index}`,
        no,
        volunteerName: seed.volunteerName,
        grade: seed.grade,
        regionKey: seed.regionKey,
        regionLabel: regionLabelForKey(seed.regionKey),
        mobile: seed.mobile,
        email: seed.email,
        totalAssignmentDays: seed.totalAssignmentDays,
        assignmentStatus: status,
      })
      no -= 1
    })
  }

  return rows
}
