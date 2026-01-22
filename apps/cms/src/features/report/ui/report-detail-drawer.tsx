/**
 * 보고서 상세 Drawer 컴포넌트
 * Phase 7.1.1: 보고서 검토 및 승인
 */

import { Drawer, Descriptions, Tag, Space, Button, Modal, Input, message } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { Report } from '@/types/domain'
import { getReportStatusLabel, getReportStatusColor } from '@/shared/constants/status'
import { reportService } from '@/entities/report/api/report-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useState } from 'react'
import { programService } from '@/entities/program/api/program-service'
import dayjs from 'dayjs'

const { TextArea } = Input

const reportTypeLabels: Record<Report['type'], string> = {
  lecture: '강의보고서',
  volunteer: '교육봉사 활동보고서',
  program: '프로그램 종료 보고서',
}

const reportTypeColors: Record<Report['type'], string> = {
  lecture: 'blue',
  volunteer: 'purple',
  program: 'cyan',
}

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
      message.error('검토 처리 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      await reportService.approve(report.id, user.id, reviewNotes || undefined)
      message.success('보고서가 승인되었습니다')
      setApproveModalOpen(false)
      setReviewNotes('')
      onReviewComplete?.()
    } catch {
      message.error('승인 처리 중 오류가 발생했습니다')
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
      message.success('보고서가 반려되었습니다')
      setRejectModalOpen(false)
      setReviewNotes('')
      onReviewComplete?.()
    } catch {
      message.error('반려 처리 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Drawer
        title="보고서 상세"
        width={792}
        open={open}
        onClose={onClose}
        extra={
          showReviewActions ? (
            <Space>
              {report.status === 'submitted' && (
                <Button onClick={handleReview} loading={loading}>
                  검토 시작
                </Button>
              )}
              {report.status === 'reviewing' && (
                <>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => setApproveModalOpen(true)}
                  >
                    승인
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => setRejectModalOpen(true)}
                  >
                    반려
                  </Button>
                </>
              )}
            </Space>
          ) : undefined
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 기본 정보 */}
          <Descriptions title="기본 정보" bordered column={1}>
            <Descriptions.Item label="보고서 ID">{report.id}</Descriptions.Item>
            <Descriptions.Item label="타입">
              <Tag color={reportTypeColors[report.type]}>{reportTypeLabels[report.type]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="상태">
              <Tag color={getReportStatusColor(report.status)}>
                {getReportStatusLabel(report.status)}
              </Tag>
            </Descriptions.Item>
            {program && (
              <Descriptions.Item label="프로그램">
                {program.title}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="제출일">
              {dayjs(report.submittedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            {report.reviewedAt && (
              <Descriptions.Item label="검토일">
                {dayjs(report.reviewedAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
            {report.reviewNotes && (
              <Descriptions.Item label="검토 사유">
                {report.reviewNotes}
              </Descriptions.Item>
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
      </Drawer>

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

