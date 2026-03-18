/**
 * 신청 기관 상세 - 기본 정보 / 안내 사항 / 강의 회차 별 교육 희망 날짜 및 시간
 * applicant-instructor-basic-info 스타일 참고, 이미지 시안 구조 반영
 */

import type { ApplicantSchoolRow } from '@/data/mock/applicant-schools'
import './applicant-institution-basic-info.css'

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
  /** 1차시~4차시 강의 (label: "1차시 강의", value: "2026. 01. 09(금) | ...") */
  sessions?: { label: string; value: string }[]
}

export interface ApplicantInstitutionBasicInfoProps {
  school: ApplicantSchoolRow
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
  school,
  detail,
}: ApplicantInstitutionBasicInfoProps) {
  const approvalLabel = APPROVAL_STATUS_LABELS[school.approvalStatus] ?? '-'
  const address = school.region ?? '-'
  const addressDetail = detail?.addressDetail ?? '-'
  const gradeDisplay = school.educationGrade ? `초등학교 ${school.educationGrade}` : '-'
  const classAndCount =
    school.classCount != null && school.studentCount != null
      ? `${school.classCount}개 학급 | 총 ${school.studentCount}명`
      : '-'
  const teacherInfo =
    detail?.teacherInfo ?? ([school.teacherName, school.contact].filter(Boolean).join(' | ') || '-')

  const defaultSessions: { label: string; value: string }[] = [
    { label: '1차시 강의', value: school.desiredEducationPeriod ?? '-' },
    { label: '2차시 강의', value: '-' },
    { label: '3차시 강의', value: '미진행 희망' },
    { label: '4차시 강의', value: '미진행 희망' },
  ]
  const sessions = detail?.sessions?.length ? detail.sessions : defaultSessions

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
                value1={school.schoolName ?? '-'}
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

      {/* 강의 회차 별 교육 희망 날짜 및 시간 */}
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
              {sessions.map((s, idx) => (
                <tr key={idx}>
                  <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
                    {s.label}
                  </td>
                  <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
                    {s.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
