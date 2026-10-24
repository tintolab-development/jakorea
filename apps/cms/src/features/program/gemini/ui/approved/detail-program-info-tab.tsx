import { useMemo, type ReactNode } from 'react'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { formatDateDotWithWeekday } from '@/shared/utils/date'
import { displayServerPiiAsIs } from '@/features/program/shared/lib/program-pii-display'
import { HomeAddressDisplay } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/instructor-basic-info-detail-form'
import { renderDetailInfoPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { formatCountLabel } from '@/features/program/general/lib/detail-value-helpers'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { buildGeminiApprovedManagerTableItems } from '../../lib/approved/build-manager-profile-fields'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  approvedTrainingStatusModifier,
  formatStatusLabel,
} from '../../lib/approved/format-display'
import { resolveApprovedTrainingStatus } from '../../lib/approved/resolve-status'
import type { VerticalInfoTableItem } from '../../lib/approved/vertical-info-table'
import type { GeminiApprovedTrainingDetail } from '../../model/approved/detail-types'
import type { GeminiApprovedTrainingStatus } from '../../model/approved/types'
import '@/shared/components/detail-info-form/detail-info-form.css'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-basic-info.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './detail-program-info-tab.css'


function statusClassName(status: GeminiApprovedTrainingStatus) {
  return `gemini-approved-training-detail-info__status--${approvedTrainingStatusModifier(status)}`
}

function formatDetailTrainingDatetime(detail: GeminiApprovedTrainingDetail): string {
  if (!detail.instructorAssigned) {
    return '-'
  }
  const x = dayjs(detail.trainingDate)
  if (!x.isValid()) {
    return '-'
  }
  const datePart = formatDateDotWithWeekday(x)
  return datePart === '-' ? '-' : `${datePart} | ${detail.trainingTimeText}`
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

const ASSIGNED_INSTRUCTOR_COLUMNS: ColumnsType<AssignedInstructorRow> = [
  { title: '신청 강사명', dataIndex: 'name', key: 'name', width: 160, align: 'center' },
  { title: '자택 주소지', dataIndex: 'region', key: 'region', width: 200, align: 'center' },
  { title: 'JA 강의 경력', dataIndex: 'experience', key: 'experience', width: 160, align: 'center' },
  { title: 'JA 평가 등급', dataIndex: 'grade', key: 'grade', width: 160, align: 'center' },
  { title: '연락처', dataIndex: 'contact', key: 'contact', align: 'center' },
  { title: '이메일', dataIndex: 'email', key: 'email', align: 'center' },
]

function DetailInfoRows({ items }: { items: VerticalInfoTableItem[] }) {
  const rows: ReactNode[] = []
  let index = 0

  while (index < items.length) {
    const item = items[index]
    if (item.span === 2) {
      rows.push(
        <DetailInfoForm.Row key={item.key} type="single">
          <DetailInfoForm.Field label={item.label} fullRow view={item.children} readOnlyDisplay />
        </DetailInfoForm.Row>
      )
      index += 1
      continue
    }

    const next = items[index + 1]
    if (next && next.span !== 2) {
      rows.push(
        <DetailInfoForm.Row key={item.key} type="double">
          <DetailInfoForm.Field label={item.label} view={item.children} readOnlyDisplay />
          <DetailInfoForm.Field label={next.label} view={next.children} readOnlyDisplay />
        </DetailInfoForm.Row>
      )
      index += 2
      continue
    }

    rows.push(
      <DetailInfoForm.Row key={item.key} type="single">
        <DetailInfoForm.Field label={item.label} fullRow view={item.children} readOnlyDisplay />
      </DetailInfoForm.Row>
    )
    index += 1
  }

  return <>{rows}</>
}

export function GeminiApprovedTrainingDetailProgramInfoTab({
  detail,
  todayKey,
  personalInfoRevealed = false,
}: {
  detail: GeminiApprovedTrainingDetail
  todayKey: string
  personalInfoRevealed?: boolean
}) {
  const status =
    detail.progressStatus ??
    resolveApprovedTrainingStatus(
      {
        instructorAssigned: detail.instructorAssigned,
        lastPreferredDate: detail.lastPreferredDate,
        trainingDate: detail.trainingDate,
      },
      dayjs(todayKey)
    )

  const trainingInfoItems = useMemo<VerticalInfoTableItem[]>(
    () => [
      {
        key: 'recruitmentTitle',
        label: '공고명',
        children: detail.recruitmentTitle,
      },
      {
        key: 'trainingDatetime',
        label: '연수일시',
        children: renderDetailInfoPipeSeparated(formatDetailTrainingDatetime(detail)),
      },
      {
        key: 'status',
        label: '프로그램 진행 현황',
        children: (
          <span
            className={`gemini-approved-training-detail-info__status ${statusClassName(status)}`}
          >
            {formatStatusLabel(status)}
          </span>
        ),
      },
      {
        key: 'studentCount',
        label: '수강 인원',
        children: formatCountLabel(detail.studentCount, '명'),
      },
    ],
    [detail, status]
  )

  const institutionInfoItems = useMemo<VerticalInfoTableItem[]>(
    () => [
      { key: 'institutionName', label: '기관명', children: detail.institutionName },
      { key: 'institutionAddress', label: '기관 소재지', children: detail.institutionAddress },
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
      { key: 'joinedAt', label: '등록일', span: 2, children: detail.joinedAt },
    ],
    [detail]
  )

  const managerInfoItems = useMemo(
    () => buildGeminiApprovedManagerTableItems(detail, personalInfoRevealed),
    [detail, personalInfoRevealed]
  )

  const officialDocumentItems = useMemo<VerticalInfoTableItem[]>(
    () => [
      {
        key: 'officialDocumentType',
        label: '공문 필요 여부',
        span: 2,
        children: detail.officialDocumentType,
      },
      {
        key: 'officialDocumentRequiredInfo',
        label: '공문 필요 정보',
        span: 2,
        children: detail.officialDocumentRequiredInfo,
      },
    ],
    [detail]
  )

  const instructorContact = detail.instructor.contact.trim()
  const instructorEmail = detail.instructor.email.trim()
  const maskInstructorSensitive = !personalInfoRevealed

  const assignedInstructorRows = useMemo<AssignedInstructorRow[]>(
    () => [
      {
        key: detail.instructor.name,
        name: detail.instructor.name,
        region: (
          <HomeAddressDisplay address={detail.instructor.region} mask={maskInstructorSensitive} />
        ),
        experience:
          detail.instructor.experienceYears == null
            ? '-'
            : `${detail.instructor.experienceYears}년`,
        grade: detail.instructor.grade,
        contact: displayServerPiiAsIs(instructorContact),
        email: displayServerPiiAsIs(instructorEmail),
      },
    ],
    [detail.instructor, instructorContact, instructorEmail, maskInstructorSensitive]
  )

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

      {detail.instructorAssigned ? (
        <>
          <DetailInfoForm title="연수 담당 강사" mode="view">
            <CmsDataTable
              className="cms-data-table gemini-approved-training-detail-info__instructor-table"
              rowKey="key"
              pagination={false}
              columns={ASSIGNED_INSTRUCTOR_COLUMNS}
              dataSource={assignedInstructorRows}
            />
          </DetailInfoForm>

          <DetailInfoForm title="연수 공문" mode="view">
            <DetailInfoRows items={officialDocumentItems} />
          </DetailInfoForm>
        </>
      ) : null}
    </div>
  )
}
