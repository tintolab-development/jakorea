import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { renderDetailInfoPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { EditableStatusBadge } from '@/shared/components'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { StatusDropdownCell } from '@/shared/components/status-dropdown-cell'
import type { EditableStatusBadgeTone } from '@/shared/constants/editable-status-badge-tones'
import {
  approvedTrainingStatusModifier,
  formatStatusLabel,
} from '../../lib/approved/format-display'
import { resolveApprovedTrainingStatus } from '../../lib/approved/resolve-status'
import type {
  GeminiApprovedTrainingDetail,
  GeminiApprovedTrainingEmploymentStatus,
} from '../../model/approved/detail-types'
import type { GeminiApprovedTrainingStatus } from '../../model/approved/types'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './detail-program-info-tab.css'

const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'] as const

const EMPLOYMENT_STATUS_LABEL: Record<GeminiApprovedTrainingEmploymentStatus, string> = {
  ACTIVE: '재직 중',
  LEAVE: '휴직',
  TRANSFER: '전근',
}

const EMPLOYMENT_STATUS_ORDER: GeminiApprovedTrainingEmploymentStatus[] = [
  'ACTIVE',
  'LEAVE',
  'TRANSFER',
]

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

function getGeminiEmploymentBadgeTone(
  status: GeminiApprovedTrainingEmploymentStatus
): EditableStatusBadgeTone {
  return status === 'ACTIVE' ? 'blue' : 'gray'
}

function employmentStatusBadge(status: GeminiApprovedTrainingEmploymentStatus) {
  return (
    <EditableStatusBadge
      label={EMPLOYMENT_STATUS_LABEL[status]}
      tone={getGeminiEmploymentBadgeTone(status)}
    />
  )
}

export function GeminiApprovedTrainingDetailProgramInfoTab({
  detail,
  todayKey,
}: {
  detail: GeminiApprovedTrainingDetail
  todayKey: string
}) {
  const status = resolveApprovedTrainingStatus(
    {
      instructorAssigned: detail.instructorAssigned,
      lastPreferredDate: detail.lastPreferredDate,
      trainingDate: detail.trainingDate,
    },
    dayjs(todayKey)
  )
  const [employmentStatus, setEmploymentStatus] = useState<GeminiApprovedTrainingEmploymentStatus>(
    detail.managerEmploymentStatus
  )
  const [isEmploymentStatusOpen, setIsEmploymentStatusOpen] = useState(false)

  useEffect(() => {
    setEmploymentStatus(detail.managerEmploymentStatus)
  }, [detail.id, detail.managerEmploymentStatus])

  const managerNameCell =
    detail.managerScheduleChangeCount > 0 ? (
      <span className="gemini-approved-training-detail-info__manager-name-with-badge">
        {detail.managerNameKo}
        <ScheduleChangeHistoryBadge count={detail.managerScheduleChangeCount} />
      </span>
    ) : (
      detail.managerNameKo
    )

  return (
    <div className="gemini-approved-training-detail-info">
      <DetailInfoForm title="연수 정보" mode="view" className="program-registration-paragraph">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="연수일시"
            view={renderDetailInfoPipeSeparated(formatDetailTrainingDatetime(detail))}
          />
          <DetailInfoForm.Field
            label="프로그램 진행 현황"
            view={
              <span
                className={`gemini-approved-training-detail-info__status ${statusClassName(status)}`}
              >
                {formatStatusLabel(status)}
              </span>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="수강 인원" fullRow view={`${detail.studentCount}명`} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="기관 정보" mode="view" className="program-registration-paragraph">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="기관명" view={detail.institutionName} />
          <DetailInfoForm.Field label="기관 소재지" view={detail.institutionAddress} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="프로그램 신청 횟수" view={`${detail.recruitmentCount}회`} />
          <DetailInfoForm.Field
            label="프로그램 수강 횟수"
            view={`${detail.completedRecruitmentCount}회`}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="등록일" fullRow view={detail.joinedAt} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="기관 담당자 정보" mode="view" className="program-registration-paragraph">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="성명" view={managerNameCell} />
          <DetailInfoForm.Field
            label="성별 및 생년월일"
            view={
              <>
                {detail.managerGender}
                <DetailInfoForm.InputsSeparator />
                {detail.managerBirthDate}
              </>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="소속" view={detail.managerSchool} />
          <DetailInfoForm.Field
            label="재직 현황"
            view={
              <StatusDropdownCell<GeminiApprovedTrainingEmploymentStatus>
                status={employmentStatus}
                statusOptions={EMPLOYMENT_STATUS_ORDER}
                renderBadge={status => employmentStatusBadge(status)}
                isItemDisabled={(current, option) => current === option}
                onChange={setEmploymentStatus}
                isOpen={isEmploymentStatusOpen}
                onOpenChange={setIsEmploymentStatusOpen}
                tagLayout="tag100"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="연락처" view={detail.managerContact} />
          <DetailInfoForm.Field label="이메일" view={detail.managerEmail} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="직급" view={detail.managerPosition} />
          <DetailInfoForm.Field label="과목" view={detail.managerSubject} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm
        title="연수 담당 강사"
        mode="view"
        className="program-registration-paragraph gemini-approved-training-detail-info__table-only-block"
      >
        <DetailInfoForm.Row type="custom">
          <div className="program-detail-info-tab__table-wrapper gemini-approved-training-detail-info__instructor-table-wrap">
            <table
              className="program-detail-info-tab__table gemini-approved-training-detail-info__instructor-table"
              role="table"
            >
              <colgroup>
                <col style={{ width: '140px' }} />
                <col />
                <col style={{ width: '90px' }} />
                <col style={{ width: '120px' }} />
                <col />
                <col />
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
                  <td>{detail.instructor.region}</td>
                  <td>{detail.instructor.experienceYears}년</td>
                  <td>{detail.instructor.grade}</td>
                  <td>{detail.instructor.contact}</td>
                  <td>{detail.instructor.email}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <DetailInfoForm title="연수 공문" mode="view" className="program-registration-paragraph">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="공문 필요 여부" fullRow view={detail.officialDocumentType} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="공문 필요 정보"
            fullRow
            view={detail.officialDocumentRequiredInfo}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
