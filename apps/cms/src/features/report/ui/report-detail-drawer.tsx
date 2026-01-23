/**
 * 보고서 상세 Drawer 컴포넌트
 * Phase 7.1.1: 보고서 검토 및 승인
 */

import { Descriptions, Tag, Space, Modal, Input, message } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { Report } from '@/types/domain'
import { getReportStatusLabel, getReportStatusColor } from '@/shared/constants/status'
import { getReportTypeLabel, getReportTypeColor } from '@/shared/constants/domain-status'
import { LAYOUT_CONSTANTS, MESSAGES } from '@/shared/constants'
import { reportService } from '@/entities/report/api/report-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useState } from 'react'
import { programService } from '@/entities/program/api/program-service'
import { BaseDetailDrawer } from '@/shared/ui/base-detail-drawer'
import dayjs from 'dayjs'

const { TextArea } = Input

interface ReportDetailDrawerProps {
  open: boolean
  report: Report | null
  onClose: () => void
  onReviewComplete?: () => void
  /** Phase 0.2.7: 강사 보기 시 검토/승인/반려 버튼 숨김 */
  showReviewActions?: boolean
}

export function ReportDetailDrawer({
  open,
  report,
  onClose,
  onReviewComplete,
  showReviewActions = true,
}: ReportDetailDrawerProps) {
  const { user } = useAuthStore()
  const [reviewNotes, setReviewNotes] = useState('')
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!report) return null

  const program = report.programId ? programService.getByIdSync(report.programId) : undefined

  const handleReview = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      await reportService.review(report.id, user.id)
      message.success('보고서가 검토 상태로 변경되었습니다')
      onReviewComplete?.()
    } catch {
      message.error(MESSAGES.error.unknown)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      await reportService.approve(report.id, user.id, reviewNotes || undefined)
      message.success(MESSAGES.success.approved)
      setApproveModalOpen(false)
      setReviewNotes('')
      onReviewComplete?.()
    } catch {
      message.error(MESSAGES.error.approve)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!user?.id) return
    if (!reviewNotes.trim()) {
      message.warning('반려 사유를 입력해주세요')
      return
    }
    setLoading(true)
    try {
      await reportService.reject(report.id, user.id, reviewNotes)
      message.success(MESSAGES.success.rejected)
      setRejectModalOpen(false)
      setReviewNotes('')
      onReviewComplete?.()
    } catch {
      message.error(MESSAGES.error.reject)
    } finally {
      setLoading(false)
    }
  }

  // 액션 버튼 구성
  const actions = showReviewActions
    ? [
        ...(report.status === 'submitted'
          ? [
              {
                key: 'review',
                label: '검토 시작',
                onClick: handleReview,
                loading,
              },
            ]
          : []),
        ...(report.status === 'reviewing'
          ? [
              {
                key: 'approve',
                label: '승인',
                onClick: () => setApproveModalOpen(true),
                icon: <CheckOutlined />,
              },
              {
                key: 'reject',
                label: '반려',
                onClick: () => setRejectModalOpen(true),
                danger: true,
                icon: <CloseOutlined />,
              },
            ]
          : []),
      ]
    : []

  return (
    <>
      <BaseDetailDrawer
        open={open}
        onClose={onClose}
        title="보고서 상세"
        width={LAYOUT_CONSTANTS.widths.modal.large}
        loading={loading}
        actions={actions}
        hideActions={!showReviewActions || actions.length === 0}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 기본 정보 */}
          <Descriptions title="기본 정보" bordered column={1}>
            <Descriptions.Item label="보고서 ID">{report.id}</Descriptions.Item>
            <Descriptions.Item label="타입">
              <Tag color={getReportTypeColor(report.type)}>{getReportTypeLabel(report.type)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="상태">
              <Tag color={getReportStatusColor(report.status)}>
                {getReportStatusLabel(report.status)}
              </Tag>
            </Descriptions.Item>
            {program && <Descriptions.Item label="프로그램">{program.title}</Descriptions.Item>}
            <Descriptions.Item label="제출일">
              {dayjs(report.submittedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            {report.reviewedAt && (
              <Descriptions.Item label="검토일">
                {dayjs(report.reviewedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
            {report.reviewNotes && (
              <Descriptions.Item label="검토 사유">{report.reviewNotes}</Descriptions.Item>
            )}
          </Descriptions>

          {/* 보고서 내용 */}
          <Descriptions title="보고서 내용" bordered column={1}>
            {Object.entries(report.fields).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                {typeof value === 'number' ? value.toLocaleString() : String(value)}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </Space>
      </BaseDetailDrawer>

      {/* 승인 모달 */}
      <Modal
        title="보고서 승인"
        open={approveModalOpen}
        onOk={handleApprove}
        onCancel={() => {
          setApproveModalOpen(false)
          setReviewNotes('')
        }}
        confirmLoading={loading}
        zIndex={1001}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>이 보고서를 승인하시겠습니까?</div>
          <TextArea
            placeholder="검토 사유 (선택사항)"
            rows={4}
            value={reviewNotes}
            onChange={e => setReviewNotes(e.target.value)}
          />
        </Space>
      </Modal>

      {/* 반려 모달 */}
      <Modal
        title="보고서 반려"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalOpen(false)
          setReviewNotes('')
        }}
        confirmLoading={loading}
        okButtonProps={{ danger: true }}
        zIndex={1001}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>이 보고서를 반려하시겠습니까?</div>
          <TextArea
            placeholder="반려 사유 (필수)"
            rows={4}
            value={reviewNotes}
            onChange={e => setReviewNotes(e.target.value)}
            required
          />
        </Space>
      </Modal>
    </>
  )
}
