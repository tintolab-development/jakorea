import { useMemo, type ReactNode } from 'react'
import dayjs from 'dayjs'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { HomeAddressDisplay } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/instructor-basic-info-detail-form'
import { renderDetailInfoPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { buildGeminiApprovedManagerTableItems } from '../../lib/approved/build-manager-profile-fields'
import {
  approvedTrainingStatusModifier,
  formatStatusLabel,
} from '../../lib/approved/format-display'
import { resolveApprovedTrainingStatus } from '../../lib/approved/resolve-status'
import {
  GeminiApprovedVerticalInfoTable,
  type VerticalInfoTableItem,
} from '../../lib/approved/vertical-info-table'
import type { GeminiApprovedTrainingDetail } from '../../model/approved/detail-types'
import type { GeminiApprovedTrainingStatus } from '../../model/approved/types'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-basic-info.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './detail-program-info-tab.css'

const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'] as const

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
  return `${x.format('YYYY. MM. DD')}(${KO_DOW[x.day()]}) | ${detail.trainingTimeText}`
}

function ApprovedInfoSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="gemini-approved-training-detail-info__section">
      <h3 className="program-detail-info-tab__section-title">{title}</h3>
      {children}
    </section>
  )
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
  const status = resolveApprovedTrainingStatus(
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
        children: `${detail.studentCount}명`,
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
        children: `${detail.recruitmentCount}회`,
      },
      {
        key: 'completedRecruitmentCount',
        label: '프로그램 수강 횟수',
        children: `${detail.completedRecruitmentCount}회`,
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

  return (
    <div className="gemini-approved-training-detail-info">
      <ApprovedInfoSection title="연수 정보">
        <GeminiApprovedVerticalInfoTable items={trainingInfoItems} />
      </ApprovedInfoSection>

      <ApprovedInfoSection title="기관 정보">
        <GeminiApprovedVerticalInfoTable items={institutionInfoItems} />
      </ApprovedInfoSection>

      <ApprovedInfoSection title="담당 교사 정보">
        <GeminiApprovedVerticalInfoTable items={managerInfoItems} />
      </ApprovedInfoSection>

      {detail.instructorAssigned ? (
        <>
          <ApprovedInfoSection title="연수 담당 강사">
            <div className="program-detail-info-tab__table-wrapper gemini-approved-training-detail-info__horizontal-table-wrap">
              <table
                className="program-detail-info-tab__table gemini-approved-training-detail-info__horizontal-table"
                role="table"
              >
                <colgroup>
                  <col className="gemini-approved-training-detail-info__horizontal-col-name" />
                  <col className="gemini-approved-training-detail-info__horizontal-col-address" />
                  <col className="gemini-approved-training-detail-info__horizontal-col-career" />
                  <col className="gemini-approved-training-detail-info__horizontal-col-grade" />
                  <col className="gemini-approved-training-detail-info__horizontal-col-contact" />
                  <col className="gemini-approved-training-detail-info__horizontal-col-email" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">신청 강사명</th>
                    <th scope="col">자택 주소지</th>
                    <th scope="col">JA 강의 경력</th>
                    <th scope="col">JA 평가 등급</th>
                    <th scope="col">연락처</th>
                    <th scope="col">이메일</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{detail.instructor.name}</td>
                    <td>
                      <HomeAddressDisplay
                        address={detail.instructor.region}
                        mask={maskInstructorSensitive}
                      />
                    </td>
                    <td>{detail.instructor.experienceYears}년</td>
                    <td>{detail.instructor.grade}</td>
                    <td>
                      {instructorContact
                        ? maskInstructorSensitive
                          ? MASKING_POLICY.phone(instructorContact)
                          : instructorContact
                        : '-'}
                    </td>
                    <td>
                      {instructorEmail
                        ? maskInstructorSensitive
                          ? MASKING_POLICY.email(instructorEmail)
                          : instructorEmail
                        : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ApprovedInfoSection>

          <ApprovedInfoSection title="연수 공문">
            <GeminiApprovedVerticalInfoTable items={officialDocumentItems} />
          </ApprovedInfoSection>
        </>
      ) : null}
    </div>
  )
}
