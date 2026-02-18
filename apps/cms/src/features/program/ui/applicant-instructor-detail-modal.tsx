/**
 * 강의 신청 강사 상세 정보 모달
 * 신청자 목록 > 신청 강사 탭에서 강사명(열) 클릭 시 노출
 * 명세: docs/design/applicant-instructor-detail-modal-spec.md
 */

import { useState } from 'react'
import { Tabs, Descriptions } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import './applicant-instructor-detail-modal.css'

const TAB_BASIC = 'basic'
const TAB_RESUME = 'resume'

export interface ApplicantInstructorDetailModalProps {
  open: boolean
  onCancel: () => void
  /** 선택된 강사 데이터 (null이면 미노출) */
  instructor: ApplicantInstructorRow | null
  /** 모달 제목 (기본: 강의 신청 강사 상세 정보) */
  title?: string
  /** 반려/승인 버튼 표시 여부 (진행현황 참여 강사용 false) */
  showApprovalButtons?: boolean
}

export function ApplicantInstructorDetailModal({
  open,
  onCancel,
  instructor,
  title: titleProp,
  showApprovalButtons = true,
}: ApplicantInstructorDetailModalProps) {
  const title = titleProp ?? '강의 신청 강사 상세 정보'
  const [activeTab, setActiveTab] = useState<string>(TAB_BASIC)

  if (!instructor) return null

  const educationDisplay = `${instructor.educationLevel} | ${instructor.educationSchoolName}`
  const instructorNameCell =
    instructor.scheduleChangeCancelCount != null && instructor.scheduleChangeCancelCount > 0 ? (
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

  /* 테이블 필드 순서(명세): 1행 강사명|주소, 2행 연락처|이메일, 3행 강의 경력|최종 학력, 4행 한줄소개(span 2) */
  const basicItems = [
    { key: 'instructorName', label: '강사명', children: instructorNameCell },
    { key: 'address', label: '주소', children: instructor.address ?? '-' },
    { key: 'contact', label: '연락처', children: instructor.contact ?? '-' },
    { key: 'email', label: '이메일', children: instructor.email ?? '-' },
    {
      key: 'lectureExperienceYears',
      label: '강의 경력',
      children:
        instructor.lectureExperienceYears != null ? `${instructor.lectureExperienceYears}년` : '-',
    },
    { key: 'education', label: '최종 학력', children: educationDisplay },
    {
      key: 'oneLineIntro',
      label: '한줄소개',
      children: (
        <span className="applicant-instructor-detail-modal__one-line-intro">
          {instructor.oneLineIntro ?? '-'}
        </span>
      ),
      span: 2,
    },
  ]

  const footer = (
    <AppButton variant="cancel" size="large" onClick={onCancel}>
      닫기
    </AppButton>
  )

  const tabItems = [
    {
      key: TAB_BASIC,
      label: '기본 정보',
      children: (
        <div className="applicant-instructor-detail-modal__basic">
          <div className="applicant-instructor-detail-modal__basic-top">
            <span className="applicant-instructor-detail-modal__section-title">기본 정보</span>
            {showApprovalButtons && (
              <div className="applicant-instructor-detail-modal__actions">
                <AppButton variant="danger" size="middle" onClick={() => {}}>
                  반려
                </AppButton>
                <AppButton variant="primary" size="middle" modalTeal onClick={() => {}}>
                  승인
                </AppButton>
              </div>
            )}
          </div>
          <Descriptions
            column={2}
            bordered
            size="middle"
            className="applicant-instructor-detail-modal__descriptions"
            labelStyle={{ background: '#EDF0F2' }}
            items={basicItems}
          />
        </div>
      ),
    },
    {
      key: TAB_RESUME,
      label: '강사 이력서',
      children: (
        <div className="applicant-instructor-detail-modal__resume">
          <p className="applicant-instructor-detail-modal__resume-placeholder">
            강사 이력서 내용이 없습니다.
          </p>
        </div>
      ),
    },
  ]

  return (
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
  )
}
