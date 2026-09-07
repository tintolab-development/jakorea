import { useMemo } from 'react'
import {
  getMockVolunteerIndividualAssignment,
  getMockVolunteerInstitutionAssignment,
} from '../lib/mock-assignments'
import {
  VolunteerAssignmentStatusText,
  VolunteerAssignmentTable,
  VolunteerCellText,
  VolunteerScheduleLines,
} from './assignment-table'
import styles from './panel.module.css'

type VolunteerAssignmentPanelProps = {
  programAudience: 'organization' | 'individual'
  lastParticipatedSession?: number
}

export function VolunteerAssignmentPanel({
  programAudience,
  lastParticipatedSession,
}: VolunteerAssignmentPanelProps) {
  const institution = useMemo(
    () => getMockVolunteerInstitutionAssignment(lastParticipatedSession),
    [lastParticipatedSession],
  )
  const individual = useMemo(
    () => getMockVolunteerIndividualAssignment(lastParticipatedSession),
    [lastParticipatedSession],
  )

  if (programAudience === 'individual') {
    return (
      <div className={styles.shell}>
        <VolunteerAssignmentTable
          title="배정된 봉사 일정"
          count={individual.assigned.length}
          rows={individual.assigned}
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
              render: row => <VolunteerCellText>{row.distanceFromHome}</VolunteerCellText>,
            },
            {
              key: 'schedule',
              label: '담당 봉사 진행 일정',
              align: 'left',
              render: row => <VolunteerScheduleLines lines={[row.scheduleLine]} />,
            },
          ]}
        />
        <VolunteerAssignmentTable
          title="배정된 봉사 일정 목록"
          count={individual.waiting.length}
          rows={individual.waiting}
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
              render: row => <VolunteerCellText>{row.distanceFromHome}</VolunteerCellText>,
            },
            {
              key: 'schedule',
              label: '담당 봉사 진행 일정',
              align: 'left',
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
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      <VolunteerAssignmentTable
        title="배정된 기관 목록"
        count={institution.assigned.length}
        rows={institution.assigned}
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
            align: 'left',
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
            align: 'left',
            render: row => <VolunteerCellText>{row.region}</VolunteerCellText>,
          },
          {
            key: 'distance',
            label: '자택과의 거리',
            width: '120px',
            render: row => <VolunteerCellText>{row.distanceFromHome}</VolunteerCellText>,
          },
          {
            key: 'schedule',
            label: '담당 봉사 진행 일정',
            align: 'left',
            render: row => <VolunteerScheduleLines lines={row.scheduleLines} />,
          },
        ]}
      />
      <VolunteerAssignmentTable
        title="배정된 대기 기관 목록"
        count={institution.waiting.length}
        rows={institution.waiting}
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
            align: 'left',
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
            align: 'left',
            render: row => <VolunteerCellText>{row.region}</VolunteerCellText>,
          },
          {
            key: 'distance',
            label: '자택과의 거리',
            width: '120px',
            render: row => <VolunteerCellText>{row.distanceFromHome}</VolunteerCellText>,
          },
          {
            key: 'schedule',
            label: '담당 봉사 진행 일정',
            align: 'left',
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
    </div>
  )
}
