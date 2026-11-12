import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import { VolunteerAssignmentPanelSkeleton } from '@/features/mypage/shared/ui'
import { PFText } from '@/shared/ui'
import { useVolunteerAssignmentsQuery } from '../api/use-assignments-query'
import { VOLUNTEER_DISTANCE_UNAVAILABLE_TOOLTIP } from '../lib/format-distance'
import type {
  VolunteerIndividualAssignment,
  VolunteerInstitutionAssignment,
} from '../model/types'
import {
  VolunteerAssignmentStatusText,
  VolunteerAssignmentTable,
  VolunteerCellText,
  VolunteerScheduleLines,
} from './assignment-table'
import styles from './panel.module.css'

const EMPTY_VOLUNTEER_INDIVIDUAL_ASSIGNMENT: VolunteerIndividualAssignment = {
  assigned: [],
  waiting: [],
}
const EMPTY_VOLUNTEER_INSTITUTION_ASSIGNMENT: VolunteerInstitutionAssignment = {
  assigned: [],
  waiting: [],
}

function DistanceCell({ value }: { value: string }) {
  if (value === '-') {
    return (
      <span title={VOLUNTEER_DISTANCE_UNAVAILABLE_TOOLTIP}>
        <VolunteerCellText>{value}</VolunteerCellText>
      </span>
    )
  }
  return <VolunteerCellText>{value}</VolunteerCellText>
}

type VolunteerAssignmentPanelProps = {
  programAudience: 'organization' | 'individual'
  lastParticipatedSession?: number
  /** remote 시 배정 API 조회. 없으면 mock */
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
}

function IndividualTables({ data }: { data: VolunteerIndividualAssignment }) {
  return (
    <>
      <VolunteerAssignmentTable
        title="배정된 봉사 일정"
        count={data.assigned.length}
        rows={data.assigned}
        rowKey={row => row.id}
        emptyMessage="배정된 봉사 일정이 없어요."
        columns={[
          {
            key: 'no',
            label: 'No.',
            width: '72px',
            render: row => <VolunteerCellText>{row.no}</VolunteerCellText>,
          },
          {
            key: 'location',
            label: '봉사 지역',
            align: 'left',
            render: row => <VolunteerCellText>{row.location}</VolunteerCellText>,
          },
          {
            key: 'distance',
            label: '자택과의 거리',
            width: '120px',
            render: row => <DistanceCell value={row.distanceFromHome} />,
          },
          {
            key: 'schedule',
            label: '담당 봉사 진행 일정',
            render: row => <VolunteerScheduleLines lines={row.scheduleLines} />,
          },
        ]}
      />
      <VolunteerAssignmentTable
        title="배정된 봉사 일정 목록"
        count={data.waiting.length}
        rows={data.waiting}
        rowKey={row => row.id}
        emptyMessage="배정 대기 중인 봉사 일정이 없어요."
        columns={[
          {
            key: 'no',
            label: 'No.',
            width: '72px',
            render: row => <VolunteerCellText>{row.no}</VolunteerCellText>,
          },
          {
            key: 'location',
            label: '기관 소재지',
            align: 'left',
            render: row => <VolunteerCellText>{row.location}</VolunteerCellText>,
          },
          {
            key: 'distance',
            label: '자택과의 거리',
            width: '120px',
            render: row => <DistanceCell value={row.distanceFromHome} />,
          },
          {
            key: 'schedule',
            label: '담당 봉사 진행 일정',
            render: row => <VolunteerScheduleLines lines={[row.scheduleLine]} />,
          },
          {
            key: 'status',
            label: '배정 상태',
            width: '112px',
            render: row => <VolunteerAssignmentStatusText status={row.assignmentStatus} />,
          },
        ]}
      />
    </>
  )
}

function InstitutionTables({ data }: { data: VolunteerInstitutionAssignment }) {
  return (
    <>
      <VolunteerAssignmentTable
        title="배정된 기관 목록"
        count={data.assigned.length}
        rows={data.assigned}
        rowKey={row => row.id}
        emptyMessage="배정된 기관이 없어요."
        columns={[
          {
            key: 'no',
            label: 'No.',
            width: '72px',
            render: row => <VolunteerCellText>{row.no}</VolunteerCellText>,
          },
          {
            key: 'school',
            label: '기관명',
            render: row => <VolunteerCellText>{row.schoolName}</VolunteerCellText>,
          },
          {
            key: 'grade',
            label: '담당학년',
            width: '100px',
            render: row => <VolunteerCellText>{row.educationGrade}</VolunteerCellText>,
          },
          {
            key: 'region',
            label: '기관 소재지',
            render: row => <VolunteerCellText>{row.region}</VolunteerCellText>,
          },
          {
            key: 'distance',
            label: '자택과의 거리',
            width: '120px',
            render: row => <DistanceCell value={row.distanceFromHome} />,
          },
          {
            key: 'schedule',
            label: '담당 봉사 진행 일정',
            render: row => <VolunteerScheduleLines lines={row.scheduleLines} />,
          },
        ]}
      />
      <VolunteerAssignmentTable
        title="배정된 대기 기관 목록"
        count={data.waiting.length}
        rows={data.waiting}
        rowKey={row => row.id}
        emptyMessage="배정 대기 중인 기관이 없어요."
        columns={[
          {
            key: 'no',
            label: 'No.',
            width: '72px',
            render: row => <VolunteerCellText>{row.no}</VolunteerCellText>,
          },
          {
            key: 'school',
            label: '기관명',
            render: row => <VolunteerCellText>{row.schoolName}</VolunteerCellText>,
          },
          {
            key: 'grade',
            label: '희망 학년',
            width: '100px',
            render: row => <VolunteerCellText>{row.desiredGrade}</VolunteerCellText>,
          },
          {
            key: 'region',
            label: '기관 소재지',
            render: row => <VolunteerCellText>{row.region}</VolunteerCellText>,
          },
          {
            key: 'distance',
            label: '자택과의 거리',
            width: '120px',
            render: row => <DistanceCell value={row.distanceFromHome} />,
          },
          {
            key: 'schedule',
            label: '담당 봉사 진행 일정',
            render: row => <VolunteerScheduleLines lines={[row.scheduleLine]} />,
          },
          {
            key: 'status',
            label: '배정 상태',
            width: '112px',
            render: row => <VolunteerAssignmentStatusText status={row.assignmentStatus} />,
          },
        ]}
      />
    </>
  )
}

export function VolunteerAssignmentPanel({
  programAudience,
  lastParticipatedSession,
  applicationType,
  applicationId,
}: VolunteerAssignmentPanelProps) {
  const remoteQuery = useVolunteerAssignmentsQuery({
    applicationType,
    applicationId,
    programAudience,
    lastParticipatedSession,
  })

  if (remoteQuery.enabled) {
    if (remoteQuery.isLoading) {
      return <VolunteerAssignmentPanelSkeleton />
    }
    if (remoteQuery.isError || !remoteQuery.bundle) {
      return (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          배정 현황을 불러오지 못했습니다.
        </PFText>
      )
    }
    return (
      <div className={styles.shell}>
        {remoteQuery.bundle.audience === 'individual' ? (
          <IndividualTables data={remoteQuery.bundle.data} />
        ) : (
          <InstitutionTables data={remoteQuery.bundle.data} />
        )}
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      {programAudience === 'individual' ? (
        <IndividualTables data={EMPTY_VOLUNTEER_INDIVIDUAL_ASSIGNMENT} />
      ) : (
        <InstitutionTables data={EMPTY_VOLUNTEER_INSTITUTION_ASSIGNMENT} />
      )}
    </div>
  )
}
