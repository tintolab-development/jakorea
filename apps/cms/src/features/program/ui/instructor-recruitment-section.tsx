/**
 * 강사 모집 섹션 (강사 정보 탭 전용)
 * - 읽기 전용 2×2 테이블: 프로그램 운영 기간, 강사 모집 현황, 모집 대상, 모집 대상 상세,
 *   강사 모집 기간, 1차 서류 합격자 발표, 2차 면접 심사, 최종 합격자 발표, 문의처, 비고
 * - program-detail-info-tab 스타일 재사용 (참여자 모집 섹션과 동일 레이아웃)
 */

import type { Program } from '@/types/domain'
import {
  formatDateOnly,
  formatDateRange,
  getInstructorRecruitmentStatus,
  RECRUITMENT_RADIO_OPTIONS,
} from './program-detail-info-constants'
import './program-detail-info-tab.css'

/** 강사 모집 현황 라벨 (모집 예정 / 모집 중 / 모집 마감) */
const INSTRUCTOR_RECRUITMENT_LABELS: Record<string, string> = {
  scheduled: '강사 모집 예정',
  recruiting: '강사 모집 중',
  closed: '강사 모집 마감',
}

export interface InstructorRecruitmentSectionProps {
  program: Program
  sponsorName?: string
}

export function InstructorRecruitmentSection({
  program,
  sponsorName,
}: InstructorRecruitmentSectionProps) {
  const recruitmentStatus = getInstructorRecruitmentStatus(program)
  const recruitmentStatusLabel =
    recruitmentStatus != null
      ? INSTRUCTOR_RECRUITMENT_LABELS[recruitmentStatus] ??
        RECRUITMENT_RADIO_OPTIONS.find(o => o.value === recruitmentStatus)?.label ??
        '-'
      : '-'

  const instructorTarget = program.instructorTarget ?? '성인'
  const instructorTargetDetail = program.instructorTargetDetail ?? '-'

  const contactParts = [
    sponsorName && `문의처 : ${sponsorName}`,
    program.contactPhone && `Tel : ${program.contactPhone}`,
    program.contactEmail && `E-mail : ${program.contactEmail}`,
  ].filter(Boolean)
  const contactLine = contactParts.length > 0 ? contactParts.join(' | ') : '-'

  const documentPassLine = program.documentPassAnnouncementDate
    ? `${formatDateOnly(program.documentPassAnnouncementDate)}${program.documentPassAnnouncementMethod ? ` | ${program.documentPassAnnouncementMethod}` : ''}`
    : '-'

  const interviewLine =
    program.interviewStartDate && program.interviewEndDate
      ? `${formatDateRange(program.interviewStartDate, program.interviewEndDate)}${program.interviewMethod ? ` | ${program.interviewMethod}` : ''}`
      : '-'

  const finalPassLine = program.finalPassAnnouncementDate
    ? `${formatDateOnly(program.finalPassAnnouncementDate)}${program.finalPassAnnouncementMethod ? ` | ${program.finalPassAnnouncementMethod}` : ''}`
    : '-'

  const notes =
    program.oneLineIntroduction ||
    '상기 일정은 기관 사정에 따라 변동될 수 있습니다.'

  return (
    <>
      <h3 className="program-detail-info-tab__section-title">강사 모집</h3>
      <div className="program-detail-info-tab__table-wrapper">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
            <col style={{ width: '200px' }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>프로그램 운영 기간</th>
              <td>{formatDateRange(program.startDate, program.endDate)}</td>
              <th>강사 모집 현황</th>
              <td>
                {recruitmentStatus != null ? (
                  <span
                    className={`program-detail-info-tab__recruitment-status-text program-detail-info-tab__recruitment-status-text--${recruitmentStatus}`}
                  >
                    {recruitmentStatusLabel}
                  </span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
            <tr>
              <th>모집 대상</th>
              <td>{instructorTarget}</td>
              <th>모집 대상 상세</th>
              <td>{instructorTargetDetail}</td>
            </tr>
            <tr>
              <th>강사 모집 기간</th>
              <td>
                {formatDateRange(
                  program.instructorApplicationStartDate,
                  program.instructorApplicationEndDate
                )}
              </td>
              <th>1차 서류 합격자 발표</th>
              <td>{documentPassLine}</td>
            </tr>
            <tr>
              <th>2차 면접 심사</th>
              <td>{interviewLine}</td>
              <th>최종 합격자 발표</th>
              <td>{finalPassLine}</td>
            </tr>
            <tr>
              <th>문의처</th>
              <td colSpan={3}>{contactLine}</td>
            </tr>
            <tr>
              <th>비고</th>
              <td colSpan={3}>{notes}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
