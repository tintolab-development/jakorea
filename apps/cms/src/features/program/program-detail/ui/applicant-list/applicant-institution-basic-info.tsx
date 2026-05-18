/**
 * 신청 기관 상세 - 기본 정보 / 안내 사항 / 강의 회차 별 교육 희망 날짜 및 시간
 * applicant-instructor-basic-info 스타일 참고, 이미지 시안 구조 반영
 * 강의 회차 표시: 프로그램 진행 현황 참여 기관과 동일 형식 (ParticipatingSchoolSession)
 */

import type { ReactNode } from 'react'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import type {
  ApplicantInstitutionDetailExtend,
  ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import { SendNotiButton } from '@/features/program/ui/detail-modal/components/send-noti-button'
import { FileSelectField } from '@/shared/ui/file-select-field'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/ui/program-detail-td-divider'
import './applicant-institution-basic-info.css'

/** 담당 교사 정보 한 줄 — Tel / M / E-mail 구간만 마스킹 */
function maskInstitutionTeacherInfoLine(text: string): string {
  return text
    .replace(/(Tel\s*:\s*)([\d-]+)/gi, (_, prefix: string, num: string) => {
      const cleaned = num.replace(/\s/g, '')
      const masked = MASKING_POLICY.phone(cleaned)
      return prefix + (masked || num)
    })
    .replace(/(^|\s|\|)(M\s*:\s*)([\d-]+)/g, (_, lead: string, prefix: string, num: string) => {
      const cleaned = num.replace(/\s/g, '')
      const masked = MASKING_POLICY.phone(cleaned)
      return lead + prefix + (masked || num)
    })
    .replace(
      /(E-mail\s*:\s*)(\S+)/gi,
      (_, prefix: string, em: string) => prefix + MASKING_POLICY.email(em)
    )
}

/** detail 없을 때 `이름 | 연락처` 폴백 — 연락처만 전화 마스킹 */
function maskInstitutionContactOnly(phone: string): string {
  const cleaned = phone.replace(/\s/g, '')
  return MASKING_POLICY.phone(cleaned) || phone
}

/** 성범죄 조회 요청 행: ID·검증번호 가림 */
function maskSexOffenseCheckRequestLine(text: string): string {
  return text
    .replace(/\bID\s*:\s*(\S+)/gi, (_, id: string) => {
      if (id.length <= 1) return 'ID : *'
      return `ID : ${id[0]}***`
    })
    .replace(/\b검증번호\s*:\s*(\d+)/gi, (_, n: string) => {
      if (n.length <= 2) return '검증번호 : **'
      return `검증번호 : ${n[0]}${'*'.repeat(Math.max(0, n.length - 2))}${n[n.length - 1]}`
    })
}

const APPROVAL_STATUS_LABELS: Record<ApplicantSchoolRow['approvalStatus'], string> = {
  pending: '대기 중',
  approved: '승인 완료',
  rejected: '신청 반려',
}

export type { ApplicantInstitutionDetailExtend } from '@/data/mock/applicant-institutions'

export interface ApplicantInstitutionBasicInfoProps {
  institution: ApplicantSchoolRow
  detail?: ApplicantInstitutionDetailExtend
  /**
   * false면 연락처·이메일 등 마스킹 없이 표시(개인정보 상세보기 후).
   * true이고 승인 완료가 아니면 Tel/M/E-mail·조회 ID 등 마스킹.
   */
  maskSensitive?: boolean
}

function ProgramApprovalStatusValue({ institution }: { institution: ApplicantSchoolRow }) {
  const status = institution.approvalStatus
  if (status === 'pending') {
    return <>{APPROVAL_STATUS_LABELS.pending}</>
  }
  if (status === 'approved') {
    return (
      <div className="applicant-institution-basic-info__approval-status-row">
        <span>{APPROVAL_STATUS_LABELS.approved}</span>
        <span className="applicant-institution-basic-info__approval-status-vbar" aria-hidden />
        <SendNotiButton />
      </div>
    )
  }
  if (status === 'rejected') {
    const reason = institution.participationRejectionReason ?? '-'
    return (
      <div className="applicant-institution-basic-info__approval-status-row">
        <span>참여 반려</span>
        <span className="applicant-institution-basic-info__approval-status-vbar" aria-hidden />
        <span>사유 : {reason}</span>
        <span className="applicant-institution-basic-info__approval-status-vbar" aria-hidden />
        <SendNotiButton />
      </div>
    )
  }
  return <>-</>
}

function TableRowTwoCols({
  label1,
  value1,
  label2,
  value2,
}: {
  label1: string
  value1: ReactNode
  label2: string
  value2: ReactNode
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

function buildTeacherInfoCell(
  institution: ApplicantSchoolRow,
  detail: ApplicantInstitutionDetailExtend | undefined,
  shouldMask: boolean
): ReactNode {
  const raw = detail?.teacherInfo?.trim()
  if (raw) {
    const text = shouldMask ? maskInstitutionTeacherInfoLine(raw) : raw
    const parts = text
      .split(' | ')
      .map(s => s.trim())
      .filter(Boolean)
    if (parts.length === 0) return '-'
    return (
      <ProgramDetailTdSegmentWrap>
        {parts.length === 1 ? parts[0] : withProgramDetailTdDivider(parts)}
      </ProgramDetailTdSegmentWrap>
    )
  }
  const parts = [institution.teacherName, institution.contact].filter(Boolean) as string[]
  if (parts.length === 0) return '-'
  if (parts.length === 1) return parts[0]
  const name = parts[0]!
  const phone = parts[1]!
  const phoneShown = shouldMask ? maskInstitutionContactOnly(phone) : phone
  return (
    <ProgramDetailTdSegmentWrap>
      {withProgramDetailTdDivider([name, phoneShown])}
    </ProgramDetailTdSegmentWrap>
  )
}

export function ApplicantInstitutionBasicInfo({
  institution,
  detail,
  maskSensitive = true,
}: ApplicantInstitutionBasicInfoProps) {
  const managerComment = '정보 재검토 정보 재확인 필요, 입금기입이 다르네요.'
  const showManagerComment = institution.approvalStatus === 'approved'
  const shouldMask = maskSensitive && institution.approvalStatus !== 'approved'

  const address = institution.region ?? '-'
  const addressDetail = detail?.addressDetail ?? '-'
  const gradeDisplay = institution.educationGrade ? `초등학교 ${institution.educationGrade}` : '-'
  const classAndCount: ReactNode =
    institution.classCount != null && institution.studentCount != null ? (
      <ProgramDetailTdSegmentWrap>
        {withProgramDetailTdDivider([
          `${institution.classCount}개 학급`,
          `총 ${institution.studentCount}명`,
        ])}
      </ProgramDetailTdSegmentWrap>
    ) : (
      '-'
    )

  const teacherInfo = buildTeacherInfoCell(institution, detail, shouldMask)

  const sexOffenseRequestDisplay =
    detail?.sexOffenseCheckRequest == null || detail.sexOffenseCheckRequest === ''
      ? '-'
      : shouldMask
        ? maskSexOffenseCheckRequestLine(detail.sexOffenseCheckRequest)
        : detail.sexOffenseCheckRequest

  const sessions = institution.sessions ?? []

  return (
    <div className="applicant-institution-basic-info">
      {/* 기본 정보 */}
      <section className="applicant-institution-basic-info__section">
        {showManagerComment ? (
          <div className="applicant-institution-basic-info__manager-comment">
            <div className="applicant-institution-basic-info__title">관리자 코멘트</div>
            <div className="applicant-institution-basic-info__manager-comment-content">
              {managerComment}
            </div>
          </div>
        ) : null}
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
                value2={<ProgramApprovalStatusValue institution={institution} />}
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
              <TableRowTwoCols
                label1="성범죄 경력 조회서 요청"
                value1={sexOffenseRequestDisplay}
                label2="성범죄 경력 조회서"
                value2={
                  <div className="applicant-institution-basic-info__attachment-file-select">
                    <FileSelectField
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      multiple
                      disabled
                      buttonLabel="파일 선택"
                      fileNames={
                        detail?.sexOffenseRecordAttachmentFileName
                          ? [detail.sexOffenseRecordAttachmentFileName]
                          : []
                      }
                    />
                  </div>
                }
              />
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
                sessions.map(session => <SessionTableRow key={session.round} session={session} />)
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

  const contentCell = isNotPlanned ? (
    '미진행 희망'
  ) : (
    <span className="applicant-institution-basic-info__session-value">
      {datePart}
      <span className="applicant-institution-basic-info__session-divider" aria-hidden />
      {durationFormat}
      <span className="applicant-institution-basic-info__session-divider" aria-hidden />
      {periodTime}
    </span>
  )

  return (
    <tr>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--label">
        {session.round}차시 강의
      </td>
      <td className="applicant-institution-basic-info__cell applicant-institution-basic-info__cell--value">
        {contentCell}
      </td>
    </tr>
  )
}
