/**
 * 참여자 모집 섹션 (참여자 정보 탭 전용)
 * - 읽기 전용 테이블: 프로그램 운영 기간, 참여자 모집 현황, 교육 대상, 교육 대상 상세,
 *   참여자 모집 기간, 결과 발표일 및 방법, 신청 가능 최대 학급 수, 학생 명단 제출 여부, 문의처, 비고
 * - program-detail-info-tab 스타일 재사용
 */

import type { Program } from '@/types/domain'
import {
  formatDateOnly,
  formatDateRange,
  getRecruitmentStatus,
  RECRUITMENT_RADIO_OPTIONS,
  TARGET_LEVEL_LABEL,
} from './program-detail-info-constants'
import './program-detail-info-tab.css'

export interface ParticipantRecruitmentSectionProps {
  program: Program
  sponsorName?: string
}

export function ParticipantRecruitmentSection({
  program,
  sponsorName,
}: ParticipantRecruitmentSectionProps) {
  const recruitmentStatus = getRecruitmentStatus(program)
  const recruitmentStatusLabel =
    recruitmentStatus != null
      ? RECRUITMENT_RADIO_OPTIONS.find(o => o.value === recruitmentStatus)?.label ?? '-'
      : '-'
  const targetLabel = program.targetLevel
    ? (TARGET_LEVEL_LABEL[program.targetLevel] ?? program.targetLevel)
    : '-'
  const contactParts = [
    sponsorName && `문의처 : ${sponsorName}`,
    program.contactPhone && `Tel : ${program.contactPhone}`,
    program.contactEmail && `E-mail : ${program.contactEmail}`,
  ].filter(Boolean)
  const contactLine = contactParts.length > 0 ? contactParts.join(' | ') : '-'
  const resultDate = program.resultAnnouncementDate ?? program.applicationEndDate
  const resultMethod =
    program.resultAnnouncementMethod ?? '홈페이지 공지 및 담당교사 개별 안내'
  const resultLine = resultDate
    ? `${formatDateOnly(resultDate)} | ${resultMethod}`
    : '-'
  const maxClassCount = program.rounds?.[0]?.classCount
  const maxClassLabel = maxClassCount != null ? `${maxClassCount}개` : '-'
  const notes = program.oneLineIntroduction ?? '-'

  return (
    <>
      <h3 className="program-detail-info-tab__section-title">참여자 모집</h3>
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
              <th>참여자 모집 현황</th>
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
              <th>교육 대상</th>
              <td>{targetLabel}</td>
              <th>교육 대상 상세</th>
              <td>{program.district ?? '-'}</td>
            </tr>
            <tr>
              <th>참여자 모집 기간</th>
              <td>
                {formatDateRange(program.applicationStartDate, program.applicationEndDate)}
              </td>
              <th>결과 발표일 및 방법</th>
              <td>{resultLine}</td>
            </tr>
            <tr>
              <th>신청 가능 최대 학급 수</th>
              <td>{maxClassLabel}</td>
              <th>학생 명단 제출 여부</th>
              <td>-</td>
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
