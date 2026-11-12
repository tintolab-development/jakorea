import { useCallback, useMemo, type ReactNode } from 'react'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { formatDateDot, formatDateDotWithWeekday } from '@/shared/utils/date'
import { displayServerPiiAsIs } from '@/features/program/shared/lib/program-pii-display'
import { HomeAddressDisplay } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/instructor-basic-info-detail-form'
import { renderDetailInfoPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { formatCountLabel } from '@/features/program/general/lib/detail-value-helpers'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { buildGeminiApprovedManagerTableItems } from '../../lib/approved/build-manager-profile-fields'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  formatTrainingTimeTextWithClassCount,
} from '../../lib/approved/format-display'
import {
  formatOfficialDocumentRequiredInfo,
  formatOfficialDocumentRequiredLabel,
} from '../../lib/approved/official-document'
import { mapGeminiApprovedEmploymentToSchoolStatus } from '../../lib/approved/employment-status'
import type { VerticalInfoTableItem } from '../../lib/approved/vertical-info-table'
import type { GeminiApprovedTrainingDetail } from '../../model/approved/detail-types'
import { usePatchGeminiApprovedTeacherEmploymentMutation } from '../../api/visiting-training/hooks'
import { coercePositiveInt } from '@/features/user/api/user-response-row-id'
import { handleError } from '@/shared/utils/error-handler'
import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import { GeminiApprovedTeacherEmploymentStatusField } from './teacher-employment-status-field'
import '@/shared/components/detail-info-form/detail-info-form.css'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-basic-info.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './detail-program-info-tab.css'
import { GeminiApprovedTrainingStatusText } from './training-status-text'


function dash(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  return trimmed || '-'
}

/** 강사 배정 완료 후 상세 GET 확정 연수일·시간만 표시한다. */
export function formatDetailTrainingDatetime(detail: GeminiApprovedTrainingDetail): string {
  if (!detail.instructorAssigned) return '-'
  const raw = detail.trainingDate.trim()
  if (!raw) return '-'
  const x = dayjs(raw)
  if (!x.isValid()) return '-'
  const datePart = formatDateDotWithWeekday(x)
  if (datePart === '-') return '-'
  const time = formatTrainingTimeTextWithClassCount(detail.trainingTimeText, detail.classCount)
  return time === '-' ? `${datePart} | -` : `${datePart} | ${time}`
}


type AssignedInstructorRow = {
  key: string
  name: string
  region: ReactNode
  experience: string
  grade: string
  contact: string
  email: string
}

const ASSIGNED_INSTRUCTOR_NAME_COLUMN_WIDTH = 180
const ASSIGNED_INSTRUCTOR_DATA_COLUMN_WIDTH = 272

const ASSIGNED_INSTRUCTOR_COLUMNS: ColumnsType<AssignedInstructorRow> = [
  {
    title: '신청 강사명',
    dataIndex: 'name',
    key: 'name',
    width: ASSIGNED_INSTRUCTOR_NAME_COLUMN_WIDTH,
    align: 'center',
  },
  {
    title: '자택 주소지',
    dataIndex: 'region',
    key: 'region',
    width: ASSIGNED_INSTRUCTOR_DATA_COLUMN_WIDTH,
    align: 'center',
  },
  {
    title: 'JA 강의 경력',
    dataIndex: 'experience',
    key: 'experience',
    width: ASSIGNED_INSTRUCTOR_DATA_COLUMN_WIDTH,
    align: 'center',
  },
  {
    title: 'JA 평가 등급',
    dataIndex: 'grade',
    key: 'grade',
    width: ASSIGNED_INSTRUCTOR_DATA_COLUMN_WIDTH,
    align: 'center',
  },
  {
    title: '연락처',
    dataIndex: 'contact',
    key: 'contact',
    width: ASSIGNED_INSTRUCTOR_DATA_COLUMN_WIDTH,
    align: 'center',
  },
  {
    title: '이메일',
    dataIndex: 'email',
    key: 'email',
    width: ASSIGNED_INSTRUCTOR_DATA_COLUMN_WIDTH,
    align: 'center',
  },
]

function EmptyDetailPanel() {
  return (
    <div className="gemini-approved-training-detail-info__empty-panel" role="status">
      <p className="gemini-approved-training-detail-info__empty-title">배정된 강사가 없습니다.</p>
      <p className="gemini-approved-training-detail-info__empty-description">
        강사가 배정되면 이곳에 정보가 표시됩니다.
      </p>
    </div>
  )
}

const DETAIL_INFO_LABEL_WIDTH = 180

function DetailInfoRows({ items }: { items: VerticalInfoTableItem[] }) {
  const rows: ReactNode[] = []
  let index = 0

  while (index < items.length) {
    const item = items[index]
    if (item.span === 2) {
      rows.push(
        <DetailInfoForm.Row key={item.key} type="single">
          <DetailInfoForm.Field
            label={item.label}
            labelWidth={DETAIL_INFO_LABEL_WIDTH}
            fullRow
            view={item.children}
            readOnlyDisplay
          />
        </DetailInfoForm.Row>
      )
      index += 1
      continue
    }

    const next = items[index + 1]
    if (next && next.span !== 2) {
      rows.push(
        <DetailInfoForm.Row key={item.key} type="double">
          <DetailInfoForm.Field
            label={item.label}
            labelWidth={DETAIL_INFO_LABEL_WIDTH}
            view={item.children}
            readOnlyDisplay
          />
          <DetailInfoForm.Field
            label={next.label}
            labelWidth={DETAIL_INFO_LABEL_WIDTH}
            view={next.children}
            readOnlyDisplay
          />
        </DetailInfoForm.Row>
      )
      index += 2
      continue
    }

    rows.push(
      <DetailInfoForm.Row key={item.key} type="single">
        <DetailInfoForm.Field
          label={item.label}
          labelWidth={DETAIL_INFO_LABEL_WIDTH}
          fullRow
          view={item.children}
          readOnlyDisplay
        />
      </DetailInfoForm.Row>
    )
    index += 1
  }

  return <>{rows}</>
}

export function GeminiApprovedTrainingDetailProgramInfoTab({
  detail,
  personalInfoRevealed = false,
}: {
  detail: GeminiApprovedTrainingDetail
  personalInfoRevealed?: boolean
}) {
  const employmentMutation = usePatchGeminiApprovedTeacherEmploymentMutation(detail.id)
  const teacherMemberId = coercePositiveInt(detail.managerMemberId) ?? null
  const teacherSchoolOrganizationId = detail.teacherSchoolOrganizationId
  const canPatchEmployment = teacherMemberId != null && teacherSchoolOrganizationId != null
  const schoolEmploymentStatus =
    detail.managerEmploymentStatus != null
      ? mapGeminiApprovedEmploymentToSchoolStatus(detail.managerEmploymentStatus)
      : null

  const handleEmploymentStatusChange = useCallback(
    async (status: SchoolTeacherEmploymentStatus) => {
      if (teacherMemberId == null || teacherSchoolOrganizationId == null) return
      try {
        await employmentMutation.mutateAsync({
          teacherSchoolOrganizationId,
          teacherMemberId,
          employmentStatus: status,
        })
      } catch (error) {
        handleError(error, { defaultMessage: '재직 현황 변경에 실패했습니다.' })
      }
    },
    [employmentMutation, teacherMemberId, teacherSchoolOrganizationId]
  )

  const employmentStatusControl =
    schoolEmploymentStatus != null && canPatchEmployment ? (
      <GeminiApprovedTeacherEmploymentStatusField
        teacherMemberId={detail.managerMemberId}
        employmentStatus={schoolEmploymentStatus}
        onChange={handleEmploymentStatusChange}
      />
    ) : undefined

  const trainingInfoItems = useMemo<VerticalInfoTableItem[]>(
    () => [
      {
        key: 'recruitmentTitle',
        label: '공고명',
        children: dash(detail.recruitmentTitle),
      },
      {
        key: 'trainingDatetime',
        label: '연수일시',
        children: renderDetailInfoPipeSeparated(formatDetailTrainingDatetime(detail)),
      },
      {
        key: 'status',
        label: '프로그램 진행 현황',
        children: <GeminiApprovedTrainingStatusText status={detail.progressStatus} context="detail" />,
      },
      {
        key: 'studentCount',
        label: '수강 인원',
        children: formatCountLabel(detail.studentCount, '명'),
      },
    ],
    [detail]
  )

  const institutionInfoItems = useMemo<VerticalInfoTableItem[]>(
    () => [
      { key: 'institutionName', label: '기관명', children: dash(detail.institutionName) },
      {
        key: 'institutionAddress',
        label: '기관 소재지',
        children: dash(detail.institutionAddress),
      },
      {
        key: 'recruitmentCount',
        label: '프로그램 신청 횟수',
        children: formatCountLabel(detail.recruitmentCount, '회'),
      },
      {
        key: 'completedRecruitmentCount',
        label: '프로그램 수강 횟수',
        children: formatCountLabel(detail.completedRecruitmentCount, '회'),
      },
      {
        key: 'joinedAt',
        label: '등록일',
        span: 2,
        // 서버 `YYYY-MM-DD`(또는 일시) → 표시 `YYYY.MM.DD`
        children: formatDateDot(detail.joinedAt),
      },
    ],
    [detail]
  )

  const managerInfoItems = buildGeminiApprovedManagerTableItems(
    detail,
    personalInfoRevealed,
    employmentStatusControl
  )

  const officialDocumentItems = useMemo<VerticalInfoTableItem[]>(
    () => [
      {
        key: 'officialDocumentRequired',
        label: '공문 필요 여부',
        span: 2,
        children: formatOfficialDocumentRequiredLabel(detail.officialDocumentRequired),
      },
      {
        key: 'officialDocumentRequiredInfo',
        label: '공문 필요 정보',
        span: 2,
        children: formatOfficialDocumentRequiredInfo(detail.officialDocumentRequiredInfo),
      },
    ],
    [detail]
  )

  const instructorContact = detail.instructor.contact.trim()
  const instructorEmail = detail.instructor.email.trim()
  const maskInstructorSensitive = !personalInfoRevealed

  const assignedInstructorRows = useMemo<AssignedInstructorRow[]>(() => {
    if (!detail.instructorAssigned) return []
    return [
      {
        key: detail.instructor.memberId ?? detail.instructor.name,
        name: detail.instructor.name,
        region: (
          <HomeAddressDisplay address={detail.instructor.region} mask={maskInstructorSensitive} />
        ),
        experience:
          detail.instructor.experienceYears == null
            ? '-'
            : `${detail.instructor.experienceYears}년`,
        grade: dash(detail.instructor.grade === '-' ? '' : detail.instructor.grade),
        contact: displayServerPiiAsIs(instructorContact),
        email: displayServerPiiAsIs(instructorEmail),
      },
    ]
  }, [
    detail.instructor,
    detail.instructorAssigned,
    instructorContact,
    instructorEmail,
    maskInstructorSensitive,
  ])

  return (
    <div className="gemini-approved-training-detail-info">
      <DetailInfoForm title="연수 정보" mode="view">
        <DetailInfoRows items={trainingInfoItems} />
      </DetailInfoForm>

      <DetailInfoForm title="기관 정보" mode="view">
        <DetailInfoRows items={institutionInfoItems} />
      </DetailInfoForm>

      <DetailInfoForm title="담당 교사 정보" mode="view">
        <DetailInfoRows items={managerInfoItems} />
      </DetailInfoForm>

      <DetailInfoForm
        title="연수 담당 강사"
        mode="view"
        className="gemini-approved-training-detail-info__assigned-instructor-form"
      >
        {detail.instructorAssigned ? (
          <CmsDataTable
            className={
              'cms-data-table cms-data-table--skip-auto-no-col ' +
              'gemini-approved-training-detail-info__instructor-table'
            }
            rowKey="key"
            pagination={false}
            columns={ASSIGNED_INSTRUCTOR_COLUMNS}
            dataSource={assignedInstructorRows}
          />
        ) : (
          <EmptyDetailPanel />
        )}
      </DetailInfoForm>

      <DetailInfoForm title="연수 공문" mode="view">
        {detail.instructorAssigned ? (
          <DetailInfoRows items={officialDocumentItems} />
        ) : (
          <EmptyDetailPanel />
        )}
      </DetailInfoForm>
    </div>
  )
}
