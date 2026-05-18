/**
 * 다운로드 옵션 모달 컴포넌트
 * Phase 0.5.3: 다운로드 보호 UX
 * 시니어 개발자 관점: 컴포넌트 분리
 */

import { useState, useEffect } from 'react'
import { Modal, Form, Radio, Input, Button, Space, Alert, Typography } from 'antd'
import { useDownloadOptions } from '../hooks/use-download-options'
import { useDownloadQuota } from '../hooks/use-download-quota'
import type { DownloadOptions, DownloadTargetType } from '@/types/download'
import type { UUID } from '@/types'

const { TextArea } = Input
const { Text } = Typography

interface DownloadOptionsModalProps {
  open: boolean
  programId?: UUID
  programName?: string
  targetType: DownloadTargetType
  rowCount: number
  onCancel: () => void
  onDownload: (options: DownloadOptions) => Promise<void>
  /** OWNER/MASTER 등 기존 권한 보유 시 원본 다운로드 허용 */
  canDownloadOriginalOverride?: boolean
}

export function DownloadOptionsModal({
  open,
  programId,
  programName,
  targetType,
  rowCount,
  onCancel,
  onDownload,
  canDownloadOriginalOverride }: DownloadOptionsModalProps) {
  const [form] = Form.useForm()
  const [downloading, setDownloading] = useState(false)

  const { canDownloadOriginal, resetOptions } = useDownloadOptions({
    programId,
    targetType,
    action: 'DOWNLOAD' })

  const allowOriginal = canDownloadOriginalOverride ?? canDownloadOriginal

  const { canDownload, recordDownload } = useDownloadQuota()

  useEffect(() => {
    if (open) {
      // 모달이 열릴 때만 초기값 설정
      form.setFieldsValue({
        maskingEnabled: true, // 기본값으로 초기화
        reason: '' })
    } else {
      // 모달이 닫힐 때만 리셋
      resetOptions()
      form.resetFields()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 다운로드 가능 여부 체크 (행수/쿼터/레이트리밋)
      const checkResult = canDownload(rowCount)
      if (!checkResult.allowed) {
        return
      }

      setDownloading(true)
      const downloadOptions: DownloadOptions = {
        maskingEnabled: values.maskingEnabled,
        reason: values.maskingEnabled ? undefined : values.reason }

      await onDownload(downloadOptions)
      
      // 다운로드 기록
      recordDownload(rowCount)

      form.resetFields()
      resetOptions()
      onCancel()
    } catch (error) {
      // Form validation error는 무시
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return
      }
    } finally {
      setDownloading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    resetOptions()
    onCancel()
  }

  const maskingEnabled = Form.useWatch('maskingEnabled', form) ?? true
  const downloadCheck = canDownload(rowCount)

  return (
    <Modal
      open={open}
      title="다운로드 옵션"
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      {programName && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>프로그램: </Text>
          <Text>{programName}</Text>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <Text strong>다운로드 행수: </Text>
        <Text>{rowCount.toLocaleString()}행</Text>
      </div>

      {!downloadCheck.allowed && (
        <Alert
          type="error"
          description={downloadCheck.reason}
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      {downloadCheck.quota && (
        <Alert
          type="info"
          description={
            <div>
              <div>일일 다운로드: {downloadCheck.quota.todayDownloads.toLocaleString()} / {downloadCheck.quota.dailyQuota.toLocaleString()}</div>
              <div>남은 쿼터: {downloadCheck.quota.remainingQuota.toLocaleString()}행</div>
            </div>
          }
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label="데이터 형식"
          name="maskingEnabled"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio value={true}>마스킹 적용 (기본)</Radio>
            <Radio value={false} disabled={!allowOriginal}>
              원본 데이터
              {!allowOriginal && ' (권한 필요)'}
            </Radio>
          </Radio.Group>
        </Form.Item>

        {!maskingEnabled && (
          <Form.Item
            label="다운로드 사유"
            name="reason"
            rules={[{ required: true }]}
            tooltip="원본 데이터 다운로드는 권한 승인이 필요합니다"
          >
            <TextArea
              rows={4}
              placeholder="원본 데이터가 필요한 사유를 입력하세요"
              maxLength={500}
              showCount
            />
          </Form.Item>
        )}

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel} disabled={downloading}>
              취소
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={downloading}
              disabled={!downloadCheck.allowed}
            >
              다운로드
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
