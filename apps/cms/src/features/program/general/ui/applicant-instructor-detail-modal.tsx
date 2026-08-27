/**
 * 강의 신청 강사 상세 정보 모달
 * 신청자 목록 > 신청 강사 탭에서 강사명(열) 클릭 시 노출
 * 명세: docs/design/applicant-instructor-detail-modal-spec.md
 */

import { useState, useEffect, Fragment, type ReactNode } from 'react'
import { Select } from 'antd'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { UserOutlined } from '@ant-design/icons'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsRadio } from '@/shared/ui'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { DeleteGuideModal } from '@/shared/ui/delete-guide-modal'
import {
  buildInstructorRejectMessageLines,
  buildInstructorApproveMessageLines,
} from './manager-delete-guide-modal'
import type {
  ApplicantInstructorRow,
  ApplicantInstructorCareerDetail,
} from '@/data/mock/applicant-instructors'
import {
  ProgramDetailTdDivider,
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import {
  INSTRUCTOR_RESUME_EMPTY_DISPLAY,
  INSTRUCTOR_RESUME_NO_DATA,
  instructorAwardsSectionDescription,
  instructorCareerSectionDescription,
  instructorEducationSectionDescription,
  instructorQualificationsSectionDescription,
  resolveFinalEducationDisplay,
} from '@/features/user/detail/ui/instructor-resume/blocks'
import './applicant-instructor-detail-modal.css'

const TAB_BASIC = 'basic'
const TAB_RESUME = 'resume'

/** 경력 한 건 기간 문자열: "YYYY.MM ~ 재직중" 또는 "YYYY.MM ~ YYYY.MM(N년)" */
function formatCareerPeriod(item: ApplicantInstructorCareerDetail): string {
  const start = item.startDate
  if (!start) return '-'
  if (item.isCurrent) return `${start} ~ 재직중`
  const end = item.endDate
  if (!end) return start
  const years = getMonthsBetween(start, end) / 12
  const yearLabel = years >= 1 ? `(${Math.floor(years)}년)` : ''
  return `${start} ~ ${end}${yearLabel}`
}

/** YYYY.MM 두 개 사이 개월 수 */
function getMonthsBetween(from: string, to: string): number {
  const [y1, m1] = from.split('.').map(Number)
  const [y2, m2] = to.split('.').map(Number)
  return (y2 - y1) * 12 + (m2 - m1)
}

function formatBirthDateAndAgeContent(birthDate?: string, age?: number): ReactNode {
  if (!birthDate && age == null) return '-'
  if (birthDate && age != null) {
    return withProgramDetailTdDivider([birthDate, `만 ${age}세`])
  }
  if (birthDate) return birthDate
  if (age != null) return `만 ${age}세`
  return '-'
}

function formatAccountDisplayContent(instructor: ApplicantInstructorRow, mask: boolean): ReactNode {
  const bank = instructor.bankName ?? ''
  const num = instructor.accountNumber ?? ''
  const holder = instructor.accountHolder ?? ''
  if (!bank && !num && !holder) return '-'
  if (mask) {
    const maskedNum = num ? MASKING_POLICY.accountNumber(num) : ''
    const maskedHolder = holder ? MASKING_POLICY.accountHolderName(holder) : ''
    const left = [bank, maskedNum].filter(Boolean).join(' ')
    if (!maskedHolder) return left || '-'
    if (!left) return maskedHolder
    return withProgramDetailTdDivider([left, maskedHolder])
  }
  const left = [bank, num].filter(Boolean).join(' ')
  if (!holder) return left || '-'
  if (!left) return holder
  return withProgramDetailTdDivider([left, holder])
}

export interface ApplicantInstructorDetailModalProps {
  open: boolean
  onCancel: () => void
  /** 선택된 강사 데이터 (null이면 미노출) */
  instructor: ApplicantInstructorRow | null
  /** 모달 제목 (기본: 강의 신청 강사 상세 정보) */
  title?: string
  /** 반려/승인 버튼 표시 여부 (진행현황 참여 강사용 false) */
  showApprovalButtons?: boolean
  /** 반려 확정 시 호출 (상세 모달은 확인 팝업 후 호출) */
  onReject?: (instructor: ApplicantInstructorRow) => void
  /** 승인 확정 시 호출 (선택한 희망 배정 학교 ID 전달, 확인 팝업 후 호출) */
  onApprove?: (instructor: ApplicantInstructorRow, selectedSchoolId: string) => void
}

export function ApplicantInstructorDetailModal({
  open,
  onCancel,
  instructor,
  title: titleProp,
  showApprovalButtons = true,
  onReject,
  onApprove,
}: ApplicantInstructorDetailModalProps) {
  const title = titleProp ?? '강의 신청 강사 상세 정보'
  const [activeTab, setActiveTab] = useState<string>(TAB_BASIC)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)
  const [confirmType, setConfirmType] = useState<'reject' | 'approve' | null>(null)

  const preferredSchools = instructor?.preferredSchools ?? []
  const canApproveReject = selectedSchoolId != null
  const isPending = instructor?.approvalStatus === 'pending'
  const isApproved = instructor?.approvalStatus === 'approved'
  const isRejected = instructor?.approvalStatus === 'rejected'
  const showApprovalActions = showApprovalButtons && isPending

  const handleRejectConfirm = () => {
    if (instructor) onReject?.(instructor)
    setConfirmType(null)
    onCancel()
  }

  const handleApproveConfirm = () => {
    if (instructor && selectedSchoolId) onApprove?.(instructor, selectedSchoolId)
    setConfirmType(null)
    onCancel()
  }

  useEffect(() => {
    if (instructor?.preferredSchools?.length) {
      const first = instructor.preferredSchools.find((s) => s.assignable)
      setSelectedSchoolId(first?.schoolId ?? instructor.preferredSchools[0]?.schoolId ?? null)
    } else {
      setSelectedSchoolId(null)
    }
  }, [instructor?.id, instructor?.preferredSchools])

  if (!instructor) return null

  const educationDisplay = withProgramDetailTdDivider(
    [instructor.educationLevel, instructor.educationSchoolName].filter(Boolean) as string[]
  )
  const birthDisplay = formatBirthDateAndAgeContent(instructor.birthDate, instructor.age)
  const accountDisplay = formatAccountDisplayContent(
    instructor,
    instructor.approvalStatus !== 'approved'
  )

  const nameKoreanCell =
    instructor.scheduleChangeCancelCount != null &&
    instructor.scheduleChangeCancelCount > 0 ? (
      <>
        {instructor.instructorName}
        <ScheduleChangeHistoryBadge
          count={instructor.scheduleChangeCancelCount}
          className="applicant-instructor-detail-modal__name-badge"
        />
      </>
    ) : (
      instructor.instructorName
    )

  const footer = (
    <CmsButton variant="secondary" size="large" onClick={onCancel}>
      닫기
    </CmsButton>
  )

  const basicTabContent = (
    <div className="applicant-instructor-detail-modal__basic">
      <div className="applicant-instructor-detail-modal__basic-top">
        <span className="applicant-instructor-detail-modal__section-title">
          기본 정보
        </span>
        {showApprovalActions && (
          <div className="applicant-instructor-detail-modal__actions">
            <CmsButton
              variant="delete"
              size="medium"
              onClick={() => setConfirmType('reject')}
              disabled={!canApproveReject}
            >
              반려
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              onClick={() => setConfirmType('approve')}
              disabled={!canApproveReject}
            >
              승인
            </CmsButton>
          </div>
        )}
      </div>
      <div className="applicant-instructor-detail-modal__basic-info">
        <div className="applicant-instructor-detail-modal__profile-area">
          {instructor.profileImageUrl ? (
            <div className="applicant-instructor-detail-modal__profile-preview-wrap">
              <img
                src={instructor.profileImageUrl}
                alt="강사 프로필"
                className="applicant-instructor-detail-modal__profile-preview"
              />
            </div>
          ) : (
            <div className="applicant-instructor-detail-modal__profile-placeholder">
              <UserOutlined className="applicant-instructor-detail-modal__profile-icon" />
            </div>
          )}
        </div>
        <div className="applicant-instructor-detail-modal__basic-table-wrap">
          <table className="applicant-instructor-detail-modal__basic-table">
            <colgroup>
              <col className="applicant-instructor-detail-modal__basic-table-col-label-left" />
              <col className="applicant-instructor-detail-modal__basic-table-col-name-sub" />
              <col className="applicant-instructor-detail-modal__basic-table-col-input-left" />
              <col className="applicant-instructor-detail-modal__basic-table-col-label-right" />
              <col className="applicant-instructor-detail-modal__basic-table-col-input-right" />
            </colgroup>
            <tbody>
              {/* 1행: 성명(한글) | 값+배지 · 생년월일 | 값 */}
              <tr>
                <td
                  rowSpan={2}
                  className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--label applicant-instructor-detail-modal__basic-table-cell--name"
                >
                  <span className="applicant-instructor-detail-modal__basic-table-label">
                    성명
                  </span>
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--label applicant-instructor-detail-modal__basic-table-cell--name-sub">
                  <span className="applicant-instructor-detail-modal__basic-table-label">
                    한글
                  </span>
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--input applicant-instructor-detail-modal__basic-table-cell--before-divider">
                  {nameKoreanCell}
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--label applicant-instructor-detail-modal__basic-table-cell--label-right applicant-instructor-detail-modal__basic-table-cell--divider-left">
                  <span className="applicant-instructor-detail-modal__basic-table-label">
                    생년월일
                  </span>
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--input">
                  <ProgramDetailTdSegmentWrap>{birthDisplay}</ProgramDetailTdSegmentWrap>
                </td>
              </tr>
              {/* 2행: 성명(영문) | 값 · 성별 및 병역사항 | 값 */}
              <tr>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--label applicant-instructor-detail-modal__basic-table-cell--name-sub">
                  <span className="applicant-instructor-detail-modal__basic-table-label">
                    영문
                  </span>
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--input applicant-instructor-detail-modal__basic-table-cell--before-divider">
                  {instructor.nameEnglish ?? '-'}
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--label applicant-instructor-detail-modal__basic-table-cell--label-right applicant-instructor-detail-modal__basic-table-cell--divider-left">
                  <span className="applicant-instructor-detail-modal__basic-table-label">
                    성별 및 병역사항
                  </span>
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--input">
                  <ProgramDetailTdSegmentWrap>
                    {withProgramDetailTdDivider(
                      [instructor.gender, instructor.militaryStatus].filter(Boolean) as string[]
                    )}
                  </ProgramDetailTdSegmentWrap>
                </td>
              </tr>
              {/* 3행: 연락처 | 값 · 이메일 | 값 */}
              <tr>
                <td
                  colSpan={2}
                  className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--label applicant-instructor-detail-modal__basic-table-cell--row-label"
                >
                  <span className="applicant-instructor-detail-modal__basic-table-label">
                    연락처
                  </span>
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--input applicant-instructor-detail-modal__basic-table-cell--before-divider">
                  {instructor.contact ?? '-'}
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--label applicant-instructor-detail-modal__basic-table-cell--label-right applicant-instructor-detail-modal__basic-table-cell--divider-left">
                  <span className="applicant-instructor-detail-modal__basic-table-label">
                    이메일
                  </span>
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--input">
                  {instructor.email ?? '-'}
                </td>
              </tr>
              {/* 4행: 주소 | 값 · 정산 계좌 정보 | 값 */}
              <tr>
                <td
                  colSpan={2}
                  className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--label applicant-instructor-detail-modal__basic-table-cell--row-label"
                >
                  <span className="applicant-instructor-detail-modal__basic-table-label">
                    주소
                  </span>
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--input applicant-instructor-detail-modal__basic-table-cell--before-divider">
                  {instructor.address ?? '-'}
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--label applicant-instructor-detail-modal__basic-table-cell--label-right applicant-instructor-detail-modal__basic-table-cell--divider-left">
                  <span className="applicant-instructor-detail-modal__basic-table-label">
                    정산 계좌 정보
                  </span>
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--input">
                  <ProgramDetailTdSegmentWrap>{accountDisplay}</ProgramDetailTdSegmentWrap>
                </td>
              </tr>
              {/* 5행: 최종 학력 | 값 · 강사 경력 | N년 */}
              <tr>
                <td
                  colSpan={2}
                  className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--label applicant-instructor-detail-modal__basic-table-cell--row-label"
                >
                  <span className="applicant-instructor-detail-modal__basic-table-label">
                    최종 학력
                  </span>
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--input applicant-instructor-detail-modal__basic-table-cell--before-divider">
                  <ProgramDetailTdSegmentWrap>{educationDisplay}</ProgramDetailTdSegmentWrap>
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--label applicant-instructor-detail-modal__basic-table-cell--label-right applicant-instructor-detail-modal__basic-table-cell--divider-left">
                  <span className="applicant-instructor-detail-modal__basic-table-label">
                    강사 경력
                  </span>
                </td>
                <td className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--input">
                  {instructor.lectureExperienceYears != null
                    ? `${instructor.lectureExperienceYears}년`
                    : '-'}
                </td>
              </tr>
              {/* 6행: 한 줄 소개 | 값(전체 너비) */}
              <tr>
                <td
                  colSpan={2}
                  className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--label applicant-instructor-detail-modal__basic-table-cell--row-label"
                >
                  <span className="applicant-instructor-detail-modal__basic-table-label">
                    한 줄 소개
                  </span>
                </td>
                <td
                  colSpan={3}
                  className="applicant-instructor-detail-modal__basic-table-cell applicant-instructor-detail-modal__basic-table-cell--input applicant-instructor-detail-modal__basic-table-cell--one-line"
                >
                  <span className="applicant-instructor-detail-modal__one-line-intro">
                    {instructor.oneLineIntro ?? '-'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* 승인 대기: 희망 배정 학교 */}
      {isPending && preferredSchools.length > 0 && (
        <div className="applicant-instructor-detail-modal__preferred-schools">
          <span className="applicant-instructor-detail-modal__section-title">
            희망 배정 학교
          </span>
          <CmsRadio.Group
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="applicant-instructor-detail-modal__preferred-schools-radio-group"
          >
            <div className="applicant-instructor-detail-modal__preferred-schools-table-wrap">
              <table className="applicant-instructor-detail-modal__preferred-schools-table">
                <colgroup>
                  <col className="applicant-instructor-detail-modal__preferred-schools-col-rank" />
                  <col className="applicant-instructor-detail-modal__preferred-schools-col-school" />
                  <col className="applicant-instructor-detail-modal__preferred-schools-col-rank" />
                  <col className="applicant-instructor-detail-modal__preferred-schools-col-school" />
                </colgroup>
                <tbody>
                  {[0, 2].map((startIdx) => (
                    <tr key={startIdx}>
                      {[startIdx, startIdx + 1].map((idx) => {
                        const school = preferredSchools[idx]
                        if (!school) return null
                        return (
                          <Fragment key={school.schoolId}>
                            <th
                              scope="row"
                              className="applicant-instructor-detail-modal__preferred-schools-cell applicant-instructor-detail-modal__preferred-schools-cell--rank"
                            >
                              <span className="applicant-instructor-detail-modal__basic-table-label">
                                {school.rank}순위
                              </span>
                            </th>
                            <td className="applicant-instructor-detail-modal__preferred-schools-cell applicant-instructor-detail-modal__preferred-schools-cell--school">
                              <CmsRadio
                                value={school.schoolId}
                                disabled={!school.assignable}
                                className="applicant-instructor-detail-modal__preferred-school-radio"
                              >
                                <span className="applicant-instructor-detail-modal__preferred-school-td-content">
                                  <span className="applicant-instructor-detail-modal__preferred-school-td-segment">
                                    {school.schoolName}
                                  </span>
                                  <span
                                    className="applicant-instructor-detail-modal__preferred-school-td-divider"
                                    aria-hidden
                                  />
                                  <span className="applicant-instructor-detail-modal__preferred-school-td-segment">
                                    {school.grade ?? '-'}
                                  </span>
                                  <span
                                    className="applicant-instructor-detail-modal__preferred-school-td-divider"
                                    aria-hidden
                                  />
                                  <span className="applicant-instructor-detail-modal__preferred-school-td-segment">
                                    {school.dateRange ?? '-'}
                                  </span>
                                </span>
                              </CmsRadio>
                            </td>
                          </Fragment>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CmsRadio.Group>
        </div>
      )}

      {/* 승인 완료: 결재 내역 (승인 완료 + 알림 발송 + 배정 학교) */}
      {isApproved && (
        <div className="applicant-instructor-detail-modal__approval-history">
          <span className="applicant-instructor-detail-modal__section-title">
            결재 내역
          </span>
          <div className="applicant-instructor-detail-modal__approval-history-block">
            <div className="applicant-instructor-detail-modal__approval-history-row">
              <div className="applicant-instructor-detail-modal__approval-history-cell applicant-instructor-detail-modal__approval-history-cell--label">
                결재 현황
              </div>
              <div className="applicant-instructor-detail-modal__approval-history-td-content">
                <div className="applicant-instructor-detail-modal__approval-history-cell applicant-instructor-detail-modal__approval-history-cell--value applicant-instructor-detail-modal__approval-history-cell--before-divider">
                  승인 완료
                </div>
                <div className="applicant-instructor-detail-modal__approval-history-divider" />
                <div className="applicant-instructor-detail-modal__approval-history-cell applicant-instructor-detail-modal__approval-history-cell--action">
                  <CmsButton
                    variant="default"
                    size="small"
                    onClick={() => window.alert('준비 중입니다.')}
                  >
                    알림 발송
                  </CmsButton>
                </div>
              </div>
              <div className="applicant-instructor-detail-modal__approval-history-cell applicant-instructor-detail-modal__approval-history-cell--label">
                배정 학교
              </div>
              <div className="applicant-instructor-detail-modal__approval-history-cell applicant-instructor-detail-modal__approval-history-cell--value applicant-instructor-detail-modal__approval-history-cell--select applicant-instructor-detail-modal__approval-history-cell--td-default">
                <Select
                  value={instructor.assignedSchoolId ?? undefined}
                  options={[
                    ...(instructor.assignedSchoolId && instructor.assignedSchoolName
                      ? [{ value: instructor.assignedSchoolId, label: instructor.assignedSchoolName }]
                      : []),
                    ...(preferredSchools
                      .filter((s) => s.schoolId !== instructor.assignedSchoolId)
                      .map((s) => ({ value: s.schoolId, label: s.schoolName }))),
                  ]}
                  className="applicant-instructor-detail-modal__approval-school-select"
                  placeholder="배정 학교 선택"
                  allowClear={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 승인 반려: 결재 내역 (신청 반려 + 알림 발송 + 반려 사유) */}
      {isRejected && (
        <div className="applicant-instructor-detail-modal__approval-history">
          <span className="applicant-instructor-detail-modal__section-title">
            결재 내역
          </span>
          <div className="applicant-instructor-detail-modal__approval-history-block">
            <div className="applicant-instructor-detail-modal__approval-history-row">
              <div className="applicant-instructor-detail-modal__approval-history-cell applicant-instructor-detail-modal__approval-history-cell--label">
                결재 현황
              </div>
              <div className="applicant-instructor-detail-modal__approval-history-td-content">
                <div className="applicant-instructor-detail-modal__approval-history-cell applicant-instructor-detail-modal__approval-history-cell--value applicant-instructor-detail-modal__approval-history-cell--before-divider">
                  신청 반려
                </div>
                <div className="applicant-instructor-detail-modal__approval-history-divider" />
                <div className="applicant-instructor-detail-modal__approval-history-cell applicant-instructor-detail-modal__approval-history-cell--action">
                  <CmsButton
                    variant="default"
                    size="small"
                    onClick={() => window.alert('준비 중입니다.')}
                  >
                    알림 발송
                  </CmsButton>
                </div>
              </div>
              <div className="applicant-instructor-detail-modal__approval-history-cell applicant-instructor-detail-modal__approval-history-cell--label">
                반려 사유
              </div>
              <div className="applicant-instructor-detail-modal__approval-history-cell applicant-instructor-detail-modal__approval-history-cell--value applicant-instructor-detail-modal__approval-history-cell--td-default">
                {instructor.rejectionReason ?? '-'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const resumeTabContent = (() => {
        const EMPTY = INSTRUCTOR_RESUME_EMPTY_DISPLAY
        const educationSummary = instructorEducationSectionDescription(instructor)
        const careerSummary = instructorCareerSectionDescription(instructor)
        const qualificationSummary = instructorQualificationsSectionDescription(instructor)
        const awardsSummary = instructorAwardsSectionDescription(instructor)
        const finalEducation = resolveFinalEducationDisplay(instructor)
        return (
          <div className="applicant-instructor-detail-modal__resume applicant-instructor-detail-modal__resume--has-content">
            {/* 1. 학력사항: 항상 노출 */}
            <section className="applicant-instructor-detail-modal__resume-section">
              <h3 className="applicant-instructor-detail-modal__resume-section-title">
                학력사항
                {educationSummary ? (
                  <span className="applicant-instructor-detail-modal__resume-section-count">
                    {educationSummary}
                  </span>
                ) : null}
              </h3>
              <div className="applicant-instructor-detail-modal__resume-card">
                {finalEducation ? (
                  <div className="applicant-instructor-detail-modal__resume-row applicant-instructor-detail-modal__resume-row--career">
                    <span className="applicant-instructor-detail-modal__resume-row-left">
                      {finalEducation.period ?? '-'}
                    </span>
                    <span className="applicant-instructor-detail-modal__resume-row-right applicant-instructor-detail-modal__resume-row-right--with-divider">
                      <span className="applicant-instructor-detail-modal__resume-emphasis applicant-instructor-detail-modal__resume-emphasis--left">
                        {finalEducation.schoolName}
                      </span>
                      {finalEducation.major ? (
                        <>
                          <ProgramDetailTdDivider />
                          <span className="applicant-instructor-detail-modal__resume-role">
                            {finalEducation.major}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </div>
                ) : (
                  <p className="applicant-instructor-detail-modal__resume-empty">{EMPTY}</p>
                )}
              </div>
            </section>

            {/* 2. 경력사항: 항상 노출 */}
            <section className="applicant-instructor-detail-modal__resume-section">
              <h3 className="applicant-instructor-detail-modal__resume-section-title">
                경력사항
                {careerSummary ? (
                  <span className="applicant-instructor-detail-modal__resume-section-count">
                    {careerSummary}
                  </span>
                ) : null}
              </h3>
              <div className="applicant-instructor-detail-modal__resume-card">
                {(instructor.careerDetails?.length ?? 0) > 0 ? (
                  instructor.careerDetails?.map((item, idx) => {
                    const period = formatCareerPeriod(item)
                    const isSingleYear = !period.includes(' ~ ')
                    return (
                      <div
                        key={idx}
                        className="applicant-instructor-detail-modal__resume-row applicant-instructor-detail-modal__resume-row--career"
                      >
                        <span
                          className={
                            'applicant-instructor-detail-modal__resume-row-left' +
                            (isSingleYear
                              ? ' applicant-instructor-detail-modal__resume-row-left--single-year'
                              : '')
                          }
                        >
                          {period}
                        </span>
                        <span className="applicant-instructor-detail-modal__resume-row-right applicant-instructor-detail-modal__resume-row-right--with-divider">
                          {item.companyName || item.role ? (
                            <>
                              {item.companyName && (
                                <span className="applicant-instructor-detail-modal__resume-emphasis applicant-instructor-detail-modal__resume-emphasis--left">
                                  {item.companyName}
                                </span>
                              )}
                              {item.companyName && item.role ? <ProgramDetailTdDivider /> : null}
                              {item.role != null && item.role !== '' ? (
                                <span className="applicant-instructor-detail-modal__resume-role">
                                  {item.role}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            EMPTY
                          )}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <p className="applicant-instructor-detail-modal__resume-empty">{EMPTY}</p>
                )}
              </div>
            </section>

            {/* 3. 자격 및 면허: 항상 노출 */}
            <section className="applicant-instructor-detail-modal__resume-section">
              <h3 className="applicant-instructor-detail-modal__resume-section-title">
                자격 및 면허
                {qualificationSummary ? (
                  <span className="applicant-instructor-detail-modal__resume-section-count">
                    {qualificationSummary}
                  </span>
                ) : null}
              </h3>
              <div className="applicant-instructor-detail-modal__resume-card">
                {(instructor.qualifications?.length ?? 0) > 0 ? (
                  instructor.qualifications?.map((item, idx) => (
                    <div
                      key={idx}
                      className="applicant-instructor-detail-modal__resume-row"
                    >
                      <span className="applicant-instructor-detail-modal__resume-row-left">
                        {item.year ?? EMPTY}
                      </span>
                      <span className="applicant-instructor-detail-modal__resume-row-right applicant-instructor-detail-modal__resume-row-right--black">
                        {item.name ? (
                          <span className="applicant-instructor-detail-modal__resume-emphasis">
                            {item.name}
                          </span>
                        ) : (
                          EMPTY
                        )}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="applicant-instructor-detail-modal__resume-empty">{EMPTY}</p>
                )}
              </div>
            </section>

            {/* 4. 수상 및 수료 내역: 항상 노출 */}
            <section className="applicant-instructor-detail-modal__resume-section">
              <h3 className="applicant-instructor-detail-modal__resume-section-title">
                수상 및 수료 내역
                {awardsSummary ? (
                  <span className="applicant-instructor-detail-modal__resume-section-count">
                    {awardsSummary}
                  </span>
                ) : null}
              </h3>
              <div className="applicant-instructor-detail-modal__resume-card">
                {(instructor.awards?.length ?? 0) > 0 ? (
                  instructor.awards?.map((item, idx) => (
                    <div
                      key={idx}
                      className="applicant-instructor-detail-modal__resume-row"
                    >
                      <span className="applicant-instructor-detail-modal__resume-row-left">
                        {item.year ?? EMPTY}
                      </span>
                      <span className="applicant-instructor-detail-modal__resume-row-right applicant-instructor-detail-modal__resume-row-right--black">
                        {item.name ? (
                          <span className="applicant-instructor-detail-modal__resume-emphasis">
                            {item.name}
                          </span>
                        ) : (
                          EMPTY
                        )}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="applicant-instructor-detail-modal__resume-empty">{EMPTY}</p>
                )}
              </div>
            </section>

            {/* 5~8. 자유 작성 1~4: 항상 노출 */}
            {[
              {
                title: '1. 자기소개 및 지원동기',
                content: instructor.freeWriting1,
              },
              {
                title: '2. 청소년 경제 교육의 중요성에 대해 본인의 생각을 구체적으로 작성해주세요.',
                content: instructor.freeWriting2,
              },
              {
                title: '3. 청소년과 소통할 때 가장 중요하다고 생각하는 점은 무엇이며, 이를 실천하기 위해 어떤 노력을 하는지 작성해주세요.',
                content: instructor.freeWriting3,
              },
              {
                title: '4. 교육 중 예기치 않은 상황(예: 수업 분위기 저하, 참여도 부족 등)이 발생했을 때 대처한 사례가 있다면 공유해주세요.',
                content: instructor.freeWriting4,
              },
            ].map((item, idx) => (
              <section
                key={idx}
                className="applicant-instructor-detail-modal__resume-section applicant-instructor-detail-modal__resume-section--free-writing"
              >
                <h3 className="applicant-instructor-detail-modal__resume-section-title applicant-instructor-detail-modal__resume-section-title--free-writing">
                  {item.title}
                </h3>
                <div className="applicant-instructor-detail-modal__resume-free-writing-card">
                  <p className="applicant-instructor-detail-modal__resume-free-writing-text">
                    {item.content != null && String(item.content).trim() !== ''
                      ? item.content
                      : INSTRUCTOR_RESUME_NO_DATA}
                  </p>
                </div>
              </section>
            ))}
          </div>
        )
      })()

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title={title}
        size="large"
        className="applicant-instructor-detail-modal__root"
        footer={footer}
      >
        <div className="applicant-instructor-detail-modal">
          <CmsTextTabs
            className="applicant-instructor-detail-modal__tabs"
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: TAB_BASIC, label: '기본 정보' },
              { key: TAB_RESUME, label: '강사 이력서' },
            ]}
          />
          <div className="applicant-instructor-detail-modal__tab-panel">
            {activeTab === TAB_RESUME ? resumeTabContent : basicTabContent}
          </div>
        </div>
      </ContentModal>

      {confirmType === 'reject' && (
        <DeleteGuideModal
          open
          onCancel={() => setConfirmType(null)}
          onConfirm={handleRejectConfirm}
          title="반려 안내"
          lines={buildInstructorRejectMessageLines(1)}
          confirmText="반려"
          confirmVariant="delete"
        />
      )}
      {confirmType === 'approve' && (
        <DeleteGuideModal
          open
          onCancel={() => setConfirmType(null)}
          onConfirm={handleApproveConfirm}
          title="승인 안내"
          lines={buildInstructorApproveMessageLines(1)}
          confirmText="승인"
          confirmVariant="primary"
        />
      )}
    </>
  )
}
