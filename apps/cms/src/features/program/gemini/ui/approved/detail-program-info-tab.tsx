import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { StatusDropdownCell } from '@/shared/components/status-dropdown-cell'
import type { GeminiApprovedTrainingDetail } from '../../model/approved/detail-types'
import type { GeminiApprovedTrainingStatus } from '../../model/approved/types'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './detail-program-info-tab.css'

const KO_DOW = ['일', '월', '화', '수', '목', '금', '토'] as const
type GeminiApprovedEmploymentStatusValue = 'ACTIVE' | 'LEAVE' | 'TRANSFER'

const STATUS_LABEL: Record<GeminiApprovedTrainingStatus, string> = {
  SCHEDULED: '프로그램 진행 예정',
  IN_PROGRESS: '프로그램 진행 중',
  ENDED: '프로그램 진행 종료',
}

const EMPLOYMENT_STATUS_LABEL: Record<GeminiApprovedEmploymentStatusValue, string> = {
  ACTIVE: '재직 중',
  LEAVE: '휴직',
  TRANSFER: '전근',
}

const EMPLOYMENT_STATUS_ORDER: GeminiApprovedEmploymentStatusValue[] = [
  'ACTIVE',
  'LEAVE',
  'TRANSFER',
]

function formatTrainingDate(rawDate: string) {
  const x = dayjs(rawDate)
  return `${x.format('YYYY. MM. DD')}(${KO_DOW[x.day()]})`
}

function splitTrainingTimeText(raw: string): { time: string; session: string } {
  const matched = raw.match(/^(.*?)(?:\((.+)\))?$/)
  const time = matched?.[1]?.trim() || raw
  const session = matched?.[2]?.trim() || ''
  return { time, session }
}

function statusClassName(status: GeminiApprovedTrainingStatus) {
  if (status === 'SCHEDULED') return 'gemini-approved-training-detail-info__status--scheduled'
  if (status === 'IN_PROGRESS') return 'gemini-approved-training-detail-info__status--in-progress'
  return 'gemini-approved-training-detail-info__status--ended'
}

function employmentStatusBadge(status: GeminiApprovedEmploymentStatusValue) {
  const modifier =
    status === 'ACTIVE'
      ? 'gemini-approved-training-detail-info__employment-badge--active'
      : 'gemini-approved-training-detail-info__employment-badge--inactive'
  return (
    <span
      className={`gemini-approved-training-detail-info__employment-badge gemini-approved-training-detail-info__employment-badge--static ${modifier}`}
    >
      {EMPLOYMENT_STATUS_LABEL[status]}
    </span>
  )
}

export function GeminiApprovedTrainingDetailProgramInfoTab({
  detail,
}: {
  detail: GeminiApprovedTrainingDetail
}) {
  const trainingTime = splitTrainingTimeText(detail.trainingTimeText)
  const [employmentStatus, setEmploymentStatus] =
    useState<GeminiApprovedEmploymentStatusValue>('ACTIVE')
  const [isEmploymentStatusOpen, setIsEmploymentStatusOpen] = useState(false)
  const employmentBadgeStyle = useMemo(() => ({ width: 100, minWidth: 100, maxWidth: 200 }), [])

  return (
    <div className="gemini-approved-training-detail-info">
      <DetailInfoForm title="연수 정보" mode="view" className="program-registration-paragraph">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="연수일시"
            view={
              <>
                {formatTrainingDate(detail.trainingDate)}
                <DetailInfoForm.InputsSeparator />
                {trainingTime.time}
                {trainingTime.session ? (
                  <>
                    <DetailInfoForm.InputsSeparator />
                    {trainingTime.session}
                  </>
                ) : null}
              </>
            }
          />
          <DetailInfoForm.Field
            label="프로그램 진행 현황"
            view={
              <span
                className={`gemini-approved-training-detail-info__status ${statusClassName(detail.status)}`}
              >
                {STATUS_LABEL[detail.status]}
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

      <div>
        <DetailInfoForm
          title="기관 담당자 정보"
          mode="view"
          className="program-registration-paragraph mb-16"
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field label="가입일" view={detail.joinedAt} />
            <DetailInfoForm.Field label="연동된 소셜 계정" view={detail.connectedSocialAccount} />
          </DetailInfoForm.Row>
        </DetailInfoForm>
        <DetailInfoForm
          title="기관 담당자 정보"
          hideHeader
          mode="view"
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="custom">
            <DetailInfoForm.NameBlock
              rows={[
                {
                  subLabel: '한글',
                  main: detail.managerNameKo,
                  sideLabel: '재직 현황',
                  side: (
                    <StatusDropdownCell<GeminiApprovedEmploymentStatusValue>
                      status={employmentStatus}
                      statusOptions={EMPLOYMENT_STATUS_ORDER}
                      renderBadge={status => employmentStatusBadge(status)}
                      isItemDisabled={(current, option) => current === option}
                      onChange={setEmploymentStatus}
                      isOpen={isEmploymentStatusOpen}
                      onOpenChange={setIsEmploymentStatusOpen}
                      style={employmentBadgeStyle}
                      tagLayout="tag160"
                    />
                  ),
                },
                {
                  subLabel: '영문',
                  main: detail.managerNameEn,
                  sideLabel: '성별 및 생년월일',
                  side: (
                    <>
                      남성
                      <DetailInfoForm.InputsSeparator />
                      {detail.managerBirthDate}
                    </>
                  ),
                },
              ]}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field label="연락처" view={detail.managerContact} />
            <DetailInfoForm.Field label="이메일" view={detail.managerEmail} />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field label="자택 주소" view={detail.managerHomeAddress} />
            <DetailInfoForm.Field
              label="소속 및 담당 학년"
              view={
                <>
                  {detail.managerSchool}
                  <DetailInfoForm.InputsSeparator />
                  {detail.managerGrade}
                </>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field label="직급" view={detail.managerPosition} />
            <DetailInfoForm.Field label="과목" view={detail.managerSubject} />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>

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
                  <th scope="col">JA 경력</th>
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
