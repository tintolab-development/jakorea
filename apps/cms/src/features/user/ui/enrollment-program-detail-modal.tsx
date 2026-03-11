/**
 * 수강 프로그램 상세 모달
 * 전체 회원 > 전체회원 목록 모달 > 프로그램 수강이력 탭 > 테이블 행 클릭 시 노출.
 * 테이블 UI: 학교 상세 정보 모달 참고. 필드·항목: persona.md / member-detail-modal-spec §6 스크린샷 기준.
 */

import { useMemo } from 'react'
import { Tabs, Typography } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import type { Application, Program } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { EnrollmentProgramDetailView } from './enrollment-program-detail-view'
import { EnrollmentProgramDetailPostsTab } from './enrollment-program-detail-posts-tab'
import { EnrollmentProgramDetailSubmissionsTab } from './enrollment-program-detail-submissions-tab'
import './enrollment-program-detail-modal.css'

export interface EnrollmentProgramDetailModalProps {
  open: boolean
  onCancel: () => void
  /** 클릭한 수강 이력 행(Application). programId로 프로그램 조회 */
  application: Application | null
}

const TAB_KEYS = {
  INFO: 'info',
  POSTS: 'posts',
  SUBMISSIONS: 'submissions',
} as const

export function EnrollmentProgramDetailModal({
  open,
  onCancel,
  application,
}: EnrollmentProgramDetailModalProps) {
  const program: Program | undefined = useMemo(() => {
    if (!open || !application?.programId) return undefined
    return programService.getByIdSync(application.programId) ?? undefined
  }, [open, application?.programId])

  const tabItems = useMemo(() => {
    if (!program) return []
    return [
      {
        key: TAB_KEYS.INFO,
        label: '프로그램 상세 정보',
        children: (
          <div className="enrollment-program-detail-modal__tab-body">
            <EnrollmentProgramDetailView program={program} application={application} />
          </div>
        ),
      },
      {
        key: TAB_KEYS.POSTS,
        label: '게시글',
        children: (
          <div className="enrollment-program-detail-modal__tab-body">
            <EnrollmentProgramDetailPostsTab program={program} />
          </div>
        ),
      },
      {
        key: TAB_KEYS.SUBMISSIONS,
        label: '제출 내역 및 서류 발급',
        children: (
          <div className="enrollment-program-detail-modal__tab-body">
            <EnrollmentProgramDetailSubmissionsTab program={program} />
          </div>
        ),
      },
    ]
  }, [program, application])

  return (
    <TealHeaderModal
      open={open}
      onCancel={onCancel}
      title="수강 프로그램 상세"
      size="large"
      width={1400}
      className="enrollment-program-detail-modal"
      footer={
        <AppButton variant="cancel" size="large" onClick={onCancel}>
          닫기
        </AppButton>
      }
    >
      <div className="enrollment-program-detail-modal__body">
        {program ? (
          <Tabs defaultActiveKey={TAB_KEYS.INFO} items={tabItems} />
        ) : (
          <Typography.Text type="secondary">프로그램 정보를 찾을 수 없습니다.</Typography.Text>
        )}
      </div>
    </TealHeaderModal>
  )
}
