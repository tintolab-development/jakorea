/**
 * 다운로드 옵션 모달 — ContentModal 셸
 */

import { CmsButton, CmsRadio } from '@/shared/ui'
import { ContentModal } from '@/shared/ui/content-modal'
import { useState, useEffect } from 'react'
import { Form, Input, Alert, Typography } from 'antd'
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
  canDownloadOriginalOverride,
}: DownloadOptionsModalProps) {
  const [form] = Form.useForm()
  const [downloading, setDownloading] = useState(false)

  const { canDownloadOriginal, resetOptions } = useDownloadOptions({
    programId,
    targetType,
    action: 'DOWNLOAD',
  })

  const allowOriginal = canDownloadOriginalOverride ?? canDownloadOriginal

  const { canDownload, recordDownload } = useDownloadQuota()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        maskingEnabled: true,
        reason: '',
      })
    } else {
      resetOptions()
      form.resetFields()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const checkResult = canDownload(rowCount)
      if (!checkResult.allowed) {
        return
      }

      setDownloading(true)
      const downloadOptions: DownloadOptions = {
        maskingEnabled: values.maskingEnabled,
        reason: values.maskingEnabled ? undefined : values.reason,
      }

      await onDownload(downloadOptions)

      recordDownload(rowCount)

      form.resetFields()
      resetOptions()
      onCancel()
    } catch (error) {
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
    <ContentModal
      open={open}
      title="다운로드 옵션"
      onCancel={handleCancel}
      width={600}
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            onClick={handleCancel}
            disabled={downloading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            loading={downloading}
            disabled={!downloadCheck.allowed}
            onClick={() => form.submit()}
          >
            다운로드
          </CmsButton>
        </>
      }
    >
      {programName ? (
        <div style={{ marginBottom: 16 }}>
          <Text strong>프로그램: </Text>
          <Text>{programName}</Text>
        </div>
      ) : null}

      <div style={{ marginBottom: 16 }}>
        <Text strong>다운로드 행수: </Text>
        <Text>{rowCount.toLocaleString()}행</Text>
      </div>

      {!downloadCheck.allowed ? (
        <Alert
          type="error"
          description={downloadCheck.reason}
          style={{ marginBottom: 16 }}
          showIcon
        />
      ) : null}

      {downloadCheck.quota ? (
        <Alert
          type="info"
          description={
            <div>
              <div>
                일일 다운로드: {downloadCheck.quota.todayDownloads.toLocaleString()} /{' '}
                {downloadCheck.quota.dailyQuota.toLocaleString()}
              </div>
              <div>남은 쿼터: {downloadCheck.quota.remainingQuota.toLocaleString()}행</div>
            </div>
          }
          style={{ marginBottom: 16 }}
          showIcon
        />
      ) : null}

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="데이터 형식" name="maskingEnabled" rules={[{ required: true }]}>
          <CmsRadio.Group>
            <CmsRadio value={true}>마스킹 적용 (기본)</CmsRadio>
            <CmsRadio value={false} disabled={!allowOriginal}>
              원본 데이터
              {!allowOriginal && ' (권한 필요)'}
            </CmsRadio>
          </CmsRadio.Group>
        </Form.Item>

        {!maskingEnabled ? (
          <Form.Item
            label="다운로드 사유"
            name="reason"
            rules={[{ required: true }]}
            tooltip="원본 데이터 다운로드는 권한 승인이 필요합니다"
            style={{ marginBottom: 0 }}
          >
            <TextArea
              rows={4}
              placeholder="원본 데이터가 필요한 사유를 입력하세요"
              maxLength={500}
              showCount
            />
          </Form.Item>
        ) : null}
      </Form>
    </ContentModal>
  )
}
