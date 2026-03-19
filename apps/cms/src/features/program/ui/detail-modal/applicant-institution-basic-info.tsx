/**
 * 신청 기관 상세 - 기본 정보 / 안내 사항 / 강의 회차 별 교육 희망 날짜 및 시간
 * applicant-instructor-basic-info 스타일 참고, 이미지 시안 구조 반영
 * 강의 회차 표시: 프로그램 진행 현황 참여 기관과 동일 형식 (ParticipatingSchoolSession)
 */

import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import './applicant-institution-basic-info.css'

const SESSION_STATUS_LABELS: Record<
  NonNullable<ParticipatingSchoolSession['status']>,
  string
> = {
  completed: '진행 완료',
  pending: '진행 대기',
  not_planned: '미진행 희망',
}

const APPROVAL_STATUS_LABELS: Record<ApplicantSchoolRow['approvalStatus'], string> = {
  pending: '대기 중',
  approved: '승인 완료',
  rejected: '신청 반려',
}

export interface ApplicantInstitutionDetailExtend {
  addressDetail?: string
  educationLocation?: string
  educationType?: string
  textbookName?: string
  totalHoursAndSessions?: string
  previousYearParticipation?: string
  affiliatedFinancialCompany?: string
  /** 담당 교사 정보 (교사명 | Tel | M | E-mail) */
  teacherInfo?: string
  applicationReason?: string
  otherRequests?: string
  computerInSpace?: string
  waitingRoom?: string
  parkingInfo?: string
  mealInfo?: string
  sexOffenseCheckRequest?: string
}

export interface ApplicantInstitutionBasicInfoProps {
  institution: ApplicantSchoolRow
  detail?: ApplicantInstitutionDetailExtend
}

function TableRowTwoCols({
  label1,
  value1,
  label2,
  value2,
}: {
  label1: string
  value1: string
  label2: string
  value2: string
}) {
  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label1}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        {value1}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {label2}
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        {value2}
      </td>
    </tr>
  )
}

export function ApplicantInstitutionBasicInfo({
  institution,
  detail,
}: ApplicantInstitutionBasicInfoProps) {
  const approvalLabel = APPROVAL_STATUS_LABELS[institution.approvalStatus] ?? '-'
  const address = institution.region ?? '-'
  const addressDetail = detail?.addressDetail ?? '-'
  const gradeDisplay = institution.educationGrade ? `초등학교 ${institution.educationGrade}` : '-'
  const classAndCount =
    institution.classCount != null && institution.studentCount != null
      ? `${institution.classCount}개 학급 | 총 ${institution.studentCount}명`
      : '-'
  const teacherInfo =
    detail?.teacherInfo ??
    ([institution.teacherName, institution.contact].filter(Boolean).join(' | ') || '-')

  const sessions = institution.sessions ?? []

  return (
    <div className="applicant-institution-basic-info">
      {/* 기본 정보 */}
      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">기본 정보</h3>
        <div className="applicant-institution-basic-info__table-wrap">
          <table className="applicant-institution-basic-info__table">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              <TableRowTwoCols
                label1="신청 기관명"
                value1={institution.schoolName ?? '-'}
                label2="프로그램 승인 현황"
                value2={approvalLabel}
              />
              <TableRowTwoCols
                label1="기관 주소"
                value1={address}
                label2="상세 주소"
                value2={addressDetail}
              />
              <TableRowTwoCols
                label1="신청 학년"
                value1={gradeDisplay}
                label2="신청 학급 수 및 총 인원"
                value2={classAndCount}
              />
              <TableRowTwoCols
                label1="교육 장소"
                value1={detail?.educationLocation ?? '-'}
                label2="교육 형태"
                value2={detail?.educationType ?? '-'}
              />
              <TableRowTwoCols
                label1="교재명"
                value1={detail?.textbookName ?? '-'}
                label2="신청 총 교육시간 및 회차"
                value2={detail?.totalHoursAndSessions ?? '-'}
              />
              <TableRowTwoCols
                label1="전년도 참여 여부"
                value1={detail?.previousYearParticipation ?? '-'}
                label2="결연 금융회사명"
                value2={detail?.affiliatedFinancialCompany ?? '-'}
              />
              <tr>
                <td
                  colSpan={1}
                  className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label"
                >
                  담당 교사 정보
                </td>
                <td
                  colSpan={3}
                  className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value"
                >
                  {teacherInfo}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={1}
                  className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label"
                >
                  신청 사유
                </td>
                <td
                  colSpan={3}
                  className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value"
                >
                  {detail?.applicationReason ?? '-'}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={1}
                  className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label"
                >
                  기타 요청사항
                </td>
                <td
                  colSpan={3}
                  className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value"
                >
                  {detail?.otherRequests ?? '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 안내 사항 */}
      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">안내 사항</h3>
        <div className="applicant-institution-basic-info__table-wrap">
          <table className="applicant-institution-basic-info__table">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              <TableRowTwoCols
                label1="강의 공간 내 컴퓨터 여부"
                value1={detail?.computerInSpace ?? '-'}
                label2="대기실 여부 및 위치"
                value2={detail?.waitingRoom ?? '-'}
              />
              <TableRowTwoCols
                label1="주차 공간 여부 및 위치"
                value1={detail?.parkingInfo ?? '-'}
                label2="식사 제공 여부 및 안내"
                value2={detail?.mealInfo ?? '-'}
              />
              <tr>
                <td
                  colSpan={1}
                  className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label"
                >
                  성범죄 경력 조회서 요청
                </td>
                <td
                  colSpan={3}
                  className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value"
                >
                  {detail?.sexOffenseCheckRequest ?? '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 강의 회차 별 교육 희망 날짜 및 시간 (참여 기관과 동일 표시 방식) */}
      <section className="applicant-institution-basic-info__section">
        <h3 className="applicant-institution-basic-info__title">
          강의 회차 별 교육 희망 날짜 및 시간
        </h3>
        <div className="applicant-institution-basic-info__table-wrap">
          <table className="applicant-institution-basic-info__table">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value"
                  >
                    등록된 교육 일정이 없습니다.
                  </td>
                </tr>
              ) : (
                sessions.map(session => (
                  <SessionTableRow key={session.round} session={session} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function SessionTableRow({ session }: { session: ParticipatingSchoolSession }) {
  const isNotPlanned = session.status === 'not_planned' || !session.date
  const datePart = `${session.date.replace(/\./g, '. ')}(${session.dayOfWeek})`
  const durationFormat = `${session.duration} (${session.format})`
  const periodTime = `${session.classNum} (${session.timeRange.replace('~', ' ~ ')})`
  const statusLabel =
    session.status ? SESSION_STATUS_LABELS[session.status] ?? session.status : '미진행 희망'
  const statusClass =
    session.status === 'completed'
      ? 'applicant-institution-basic-info__session-status--completed'
      : session.status === 'pending'
        ? 'applicant-institution-basic-info__session-status--pending'
        : 'applicant-institution-basic-info__session-status--not_planned'

  const contentCell = isNotPlanned ? (
    '미진행 희망'
  ) : (
    <span className="applicant-institution-basic-info__session-value">
      {datePart}
      <span className="applicant-institution-basic-info__session-divider" aria-hidden />
      {durationFormat}
      <span className="applicant-institution-basic-info__session-divider" aria-hidden />
      {periodTime}
      <span className="applicant-institution-basic-info__session-divider" aria-hidden />
      <span
        className={`applicant-institution-basic-info__session-status ${statusClass}`}
      >
        {statusLabel}
      </span>
    </span>
  )

  return (
    <tr>
      <td
        className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label"
      >
        {session.round}차시 강의
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        {contentCell}
      </td>
    </tr>
  )
}
