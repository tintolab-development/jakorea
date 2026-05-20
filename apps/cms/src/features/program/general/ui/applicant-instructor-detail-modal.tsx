/**
 * 강의 신청 강사 상세 정보 모달
 * 신청자 목록 > 신청 강사 탭에서 강사명(열) 클릭 시 노출
 * 명세: docs/design/applicant-instructor-detail-modal-spec.md
 */

import { useState, useEffect, Fragment, type ReactNode } from 'react'
import { Tabs, Radio, Select } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import {
  DeleteGuideModal,
  buildInstructorRejectMessageLines,
  buildInstructorApproveMessageLines,
} from './manager-delete-guide-modal'
import type {
  ApplicantInstructorRow,
  ApplicantInstructorCareerDetail,
  ApplicantInstructorEducationItem,
} from '@/data/mock/applicant-instructors'
import {
  ProgramDetailTdDivider,
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import './applicant-instructor-detail-modal.css'

const TAB_BASIC = 'basic'
const TAB_RESUME = 'resume'

/** educationLevel(예: 4년제 졸업) 또는 schoolType(예: 대학 4년제) → 강사 이력서 탭 학력사항 대학상태 배지 표시 */
function getEducationLevelBadge(educationLevel?: string, schoolType?: string): string {
  const raw = schoolType ?? educationLevel ?? ''
  const map: Record<string, string> = {
    '4년제 졸업': '대학교 4년제',
    '2년제 졸업': '대학교 2년제',
    '고등학교 졸업': '고등학교',
    '4년제 휴학': '대학교 4년제',
    '4년제 중퇴': '대학교 4년제',
    '대학원': '대학원',
    '대학 4년제': '대학교 4년제',
    '대학 2・3년제': '대학교 2·3년제',
    '고등학교': '고등학교',
    '중학교': '중학교',
  }
  return map[raw] || raw || '-'
}

/** 학력 한 건 기간 문자열: "YYYY.MM ~ YYYY.MM" */
function formatEducationPeriod(item: ApplicantInstructorEducationItem): string {
  const start = item.enrollmentYear
  const end = item.graduationYear
  if (!start) return '-'
  if (!end) return start
  return `${start} ~ ${end}`
}

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

/** 경력 상세 배열에서 총 경력 연수 (재직중은 오늘까지) */
function getTotalCareerYears(items: ApplicantInstructorCareerDetail[] | undefined): number {
  if (!items?.length) return 0
  const today = new Date()
  let totalMonths = 0
  for (const item of items) {
    const start = item.startDate
    if (!start) continue
    const [y1, m1] = start.split('.').map(Number)
    const end = item.isCurrent
      ? { year: today.getFullYear(), month: today.getMonth() + 1 }
      : item.endDate
        ? (() => {
            const [y2, m2] = item.endDate!.split('.').map(Number)
            return { year: y2, month: m2 }
          })()
        : null
    if (!end) continue
    totalMonths += (end.year - y1) * 12 + (end.month - m1)
  }
  return Math.floor(totalMonths / 12)
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
    <AppButton variant="cancel" size="large" onClick={onCancel}>
      닫기
    </AppButton>
  )

  const basicTabContent = (
    <div className="applicant-instructor-detail-modal__basic">
      <div className="applicant-instructor-detail-modal__basic-top">
        <span className="applicant-instructor-detail-modal__section-title">
          기본 정보
        </span>
        {showApprovalActions && (
          <div className="applicant-instructor-detail-modal__actions">
            <AppButton
              variant="danger"
              size="middle"
              onClick={() => setConfirmType('reject')}
              disabled={!canApproveReject}
            >
              반려
            </AppButton>
            <AppButton
              variant="primary"
              size="middle"
              modalTeal
              onClick={() => setConfirmType('approve')}
              disabled={!canApproveReject}
            >
              승인
            </AppButton>
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
          <Radio.Group
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
                              <Radio
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
                              </Radio>
                            </td>
                          </Fragment>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Radio.Group>
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
                  <AppButton
                    variant="default"
                    size="small"
                    onClick={() => window.alert('준비 중입니다.')}
                  >
                    알림 발송
                  </AppButton>
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
                  <AppButton
                    variant="default"
                    size="small"
                    onClick={() => window.alert('준비 중입니다.')}
                  >
                    알림 발송
                  </AppButton>
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

  const tabItems = [
    {
      key: TAB_BASIC,
      label: '기본 정보',
      children: basicTabContent,
    },
    {
      key: TAB_RESUME,
      label: '강사 이력서',
      children: (() => {
        const NO_DATA = '데이터 없음'
        const totalCareerYears = getTotalCareerYears(instructor.careerDetails)
        const educationBadge =
          instructor.educations?.[0]?.schoolType != null
            ? getEducationLevelBadge(undefined, instructor.educations[0].schoolType)
            : getEducationLevelBadge(instructor.educationLevel)
        const hasEducation =
          (instructor.educations?.length ?? 0) > 0 ||
          (instructor.educationLevel ?? instructor.educationSchoolName)
        return (
          <div className="applicant-instructor-detail-modal__resume applicant-instructor-detail-modal__resume--has-content">
            {/* 1. 학력사항: 항상 노출 */}
            <section className="applicant-instructor-detail-modal__resume-section">
              <h3 className="applicant-instructor-detail-modal__resume-section-title">
                학력사항
                <span className="applicant-instructor-detail-modal__resume-section-count">
                  {hasEducation ? educationBadge : NO_DATA}
                </span>
              </h3>
              <div className="applicant-instructor-detail-modal__resume-card">
                {(instructor.educations?.length ?? 0) > 0 ? (
                  instructor.educations?.map((item, idx) => {
                    const period = formatEducationPeriod(item)
                    const schoolLabel = item.schoolName
                      ? [item.schoolName, item.schoolType ? `(${getEducationLevelBadge(undefined, item.schoolType)})` : ''].filter(Boolean).join(' ')
                      : NO_DATA
                    return (
                      <div
                        key={idx}
                        className="applicant-instructor-detail-modal__resume-row applicant-instructor-detail-modal__resume-row--career"
                      >
                        <span className="applicant-instructor-detail-modal__resume-row-left">
                          {period || NO_DATA}
                        </span>
                        <span className="applicant-instructor-detail-modal__resume-row-right applicant-instructor-detail-modal__resume-row-right--with-divider">
                          <span className="applicant-instructor-detail-modal__resume-emphasis applicant-instructor-detail-modal__resume-emphasis--left">
                            {schoolLabel}
                          </span>
                          {item.major ? (
                            <>
                              <ProgramDetailTdDivider />
                              <span className="applicant-instructor-detail-modal__resume-role">
                                {item.major}
                              </span>
                            </>
                          ) : null}
                        </span>
                      </div>
                    )
                  })
                ) : hasEducation ? (
                  <div className="applicant-instructor-detail-modal__resume-row applicant-instructor-detail-modal__resume-row--career">
                    <span className="applicant-instructor-detail-modal__resume-row-left">-</span>
                    <span className="applicant-instructor-detail-modal__resume-row-right applicant-instructor-detail-modal__resume-row-right--with-divider">
                      <span className="applicant-instructor-detail-modal__resume-emphasis applicant-instructor-detail-modal__resume-emphasis--left">
                        {withProgramDetailTdDivider(
                          [instructor.educationLevel, instructor.educationSchoolName].filter(
                            Boolean
                          ) as string[]
                        )}
                      </span>
                    </span>
                  </div>
                ) : (
                  <p className="applicant-instructor-detail-modal__resume-empty">{NO_DATA}</p>
                )}
              </div>
            </section>

            {/* 2. 경력사항: 항상 노출 */}
            <section className="applicant-instructor-detail-modal__resume-section">
              <h3 className="applicant-instructor-detail-modal__resume-section-title">
                경력사항
                <span className="applicant-instructor-detail-modal__resume-section-count">
                  {(instructor.careerDetails?.length ?? 0) > 0 ? `${totalCareerYears}년` : NO_DATA}
                </span>
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
                            NO_DATA
                          )}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <p className="applicant-instructor-detail-modal__resume-empty">{NO_DATA}</p>
                )}
              </div>
            </section>

            {/* 3. 자격 및 면허: 항상 노출 */}
            <section className="applicant-instructor-detail-modal__resume-section">
              <h3 className="applicant-instructor-detail-modal__resume-section-title">
                자격 및 면허
                <span className="applicant-instructor-detail-modal__resume-section-count">
                  {(instructor.qualifications?.length ?? 0) > 0 ? `${instructor.qualifications?.length}개` : NO_DATA}
                </span>
              </h3>
              <div className="applicant-instructor-detail-modal__resume-card">
                {(instructor.qualifications?.length ?? 0) > 0 ? (
                  instructor.qualifications?.map((item, idx) => (
                    <div
                      key={idx}
                      className="applicant-instructor-detail-modal__resume-row"
                    >
                      <span className="applicant-instructor-detail-modal__resume-row-left">
                        {item.year ?? NO_DATA}
                      </span>
                      <span className="applicant-instructor-detail-modal__resume-row-right applicant-instructor-detail-modal__resume-row-right--black">
                        {item.name ? (
                          <span className="applicant-instructor-detail-modal__resume-emphasis">
                            {item.name}
                          </span>
                        ) : (
                          NO_DATA
                        )}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="applicant-instructor-detail-modal__resume-empty">{NO_DATA}</p>
                )}
              </div>
            </section>

            {/* 4. 수상 및 수료 내역: 항상 노출 */}
            <section className="applicant-instructor-detail-modal__resume-section">
              <h3 className="applicant-instructor-detail-modal__resume-section-title">
                수상 및 수료 내역
                <span className="applicant-instructor-detail-modal__resume-section-count">
                  {(instructor.awards?.length ?? 0) > 0 ? `${instructor.awards?.length}개` : NO_DATA}
                </span>
              </h3>
              <div className="applicant-instructor-detail-modal__resume-card">
                {(instructor.awards?.length ?? 0) > 0 ? (
                  instructor.awards?.map((item, idx) => (
                    <div
                      key={idx}
                      className="applicant-instructor-detail-modal__resume-row"
                    >
                      <span className="applicant-instructor-detail-modal__resume-row-left">
                        {item.year ?? NO_DATA}
                      </span>
                      <span className="applicant-instructor-detail-modal__resume-row-right applicant-instructor-detail-modal__resume-row-right--black">
                        {item.name ? (
                          <span className="applicant-instructor-detail-modal__resume-emphasis">
                            {item.name}
                          </span>
                        ) : (
                          NO_DATA
                        )}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="applicant-instructor-detail-modal__resume-empty">{NO_DATA}</p>
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
                      : NO_DATA}
                  </p>
                </div>
              </section>
            ))}
          </div>
        )
      })(),
    },
  ]

  return (
    <>
      <TealHeaderModal
        open={open}
        onCancel={onCancel}
        title={title}
        width={1400}
        className="applicant-instructor-detail-modal__root"
        footer={footer}
      >
        <div className="applicant-instructor-detail-modal">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className="applicant-instructor-detail-modal__tabs"
          />
        </div>
      </TealHeaderModal>

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
