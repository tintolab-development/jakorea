/**
 * 교사 회원 상세 모달
 * 학교(교사) 상세 모달 내 교사 테이블 행 클릭 시 노출
 */

import { useMemo, useState } from 'react'
import { Tabs, Empty } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import {
  DeleteGuideModal,
  buildMemberWithdrawMessageLines,
} from '@/features/program/general/ui/manager-delete-guide-modal'
import {
  DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  DELETE_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import {
  getTeacherDetail,
  type AffiliatedTeacherRow,
} from '@/data/mock/school-detail'
import { TeacherBasicInfoTab } from './teacher-basic-info-tab'
import { TeacherResumeTab } from './teacher-resume-tab'
import { TeacherTeachingHistoryTab } from './teacher-teaching-history-tab'
import { TeacherSettlementTab } from './teacher-settlement-tab'
import './teacher-detail-modal.css'

export interface TeacherDetailModalProps {
  open: boolean
  teacher: AffiliatedTeacherRow | null
  schoolUserId: string
  onClose: () => void
}

export function TeacherDetailModal({
  open,
  teacher,
  schoolUserId,
  onClose,
}: TeacherDetailModalProps) {
  const detail = useMemo(() => {
    if (!teacher) return null
    return getTeacherDetail(teacher.id, schoolUserId)
  }, [teacher, schoolUserId])

  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)

  if (!detail) return null

  const isInstructor = detail.isInstructorApplicant

  const withdrawLines = buildMemberWithdrawMessageLines({
    displayName: detail.name,
  })

  const handleWithdrawConfirm = () => {
    setWithdrawConfirmOpen(false)
    onClose()
  }

  const tabItems = [
    {
      key: 'basic',
      label: '기본 정보',
      children: (
        <TeacherBasicInfoTab
          detail={detail}
          onWithdraw={() => setWithdrawConfirmOpen(true)}
        />
      ),
    },
    ...(isInstructor ? [{
      key: 'resume',
      label: '강사 이력서',
      children: <TeacherResumeTab detail={detail} />,
    }] : []),
    {
      key: 'enrollment',
      label: '프로그램 수강 이력',
      children: (
        <div className="teacher-detail-modal__tab-placeholder">
          <Empty description="프로그램 수강 이력이 없습니다." />
        </div>
      ),
    },
    ...(isInstructor ? [
      {
        key: 'teaching',
        label: '프로그램 강의 이력',
        children: (
          <TeacherTeachingHistoryTab initialData={detail.teachingHistory ?? []} />
        ),
      },
      ...(detail.settlementOverview ? [{
        key: 'settlement',
        label: '정산 현황',
        children: (
          <TeacherSettlementTab
            data={detail.settlementOverview}
            teacherName={detail.name}
            bankInfo={{
              bankName: detail.bankName,
              accountNumber: detail.accountNumber,
              accountHolder: detail.accountHolder,
            }}
          />
        ),
      }] : [{
        key: 'settlement',
        label: '정산 현황',
        children: (
          <div className="teacher-detail-modal__tab-placeholder">
            <Empty description="정산 현황 정보가 없습니다." />
          </div>
        ),
      }]),
    ] : []),
  ]

  return (
    <>
      <TealHeaderModal
        open={open}
        onCancel={onClose}
        title="교사 회원 상세 정보"
        size="large"
        width={1400}
        className="teal-header-modal--teacher-detail"
        footer={
          <AppButton variant="cancel" size="large" onClick={onClose}>
            닫기
          </AppButton>
        }
      >
        <div className="teacher-detail-modal__body">
          <Tabs defaultActiveKey="basic" items={tabItems} />
        </div>
      </TealHeaderModal>

      <DeleteGuideModal
        open={withdrawConfirmOpen}
        onCancel={() => setWithdrawConfirmOpen(false)}
        onConfirm={handleWithdrawConfirm}
        title="회원 탈퇴 안내"
        lines={withdrawLines}
        confirmText="삭제"
        confirmVariant="delete"
        requiredConfirmInput={DELETE_GUIDE_TYPED_CONFIRM_VALUE}
        confirmInputPlaceholder={DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER}
      />
    </>
  )
}
