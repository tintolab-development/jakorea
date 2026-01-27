/**
 * 알림톡 단체 발송 모달
 * 템플릿 선택 후 수신자 선택 및 발송 기능
 */

import { useState, useMemo } from 'react'
import {
  Modal,
  Form,
  Select,
  Button,
  Space,
  Table,
  Typography,
  Tag,
  Input,
  Card,
  message,
  Progress,
  Divider,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { SmsTemplate } from '@/types/template'
import { applyTemplateVariables } from '@/data/mock/templates'
import { smsProvider } from '@/entities/application/api/notification-providers'
import { mockUsers } from '@/data/mock/users'
import { mockInstructors } from '@/data/mock/instructors'
import { mockSchools } from '@/data/mock/schools'

const { Text } = Typography
const { TextArea } = Input

export type RecipientType = 'user' | 'instructor' | 'school' | 'manual'

export interface Recipient {
  id: string
  type: RecipientType
  name: string
  phone: string
  email?: string
  variables?: Record<string, string>
}

interface BulkSendSmsModalProps {
  open: boolean
  template: SmsTemplate | null
  onCancel: () => void
  onSuccess?: () => void
}

interface SendResult {
  recipient: Recipient
  success: boolean
  messageId?: string
  error?: string
}

export function BulkSendSmsModal({ open, template, onCancel, onSuccess }: BulkSendSmsModalProps) {
  const [form] = Form.useForm()
  const [step, setStep] = useState<'select' | 'preview' | 'sending' | 'result'>('select')
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([])
  const [sendResults, setSendResults] = useState<SendResult[]>([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)

  // 사용자 목록 (전화번호가 있는 사용자만)
  const availableUsers = useMemo(() => {
    return mockUsers
      .filter(u => u.phone)
      .map(u => ({
        id: `user-${u.id}`,
        type: 'user' as RecipientType,
        name: u.name,
        phone: u.phone!,
        email: u.email,
      }))
  }, [])

  // 강사 목록
  const availableInstructors = useMemo(() => {
    return mockInstructors
      .filter(i => i.contactPhone)
      .map(i => ({
        id: `instructor-${i.id}`,
        type: 'instructor' as RecipientType,
        name: i.name,
        phone: i.contactPhone || '',
        email: i.contactEmail || '',
      }))
  }, [])

  // 학교 목록
  const availableSchools = useMemo(() => {
    return mockSchools
      .filter(s => s.contactPhone)
      .map(s => ({
        id: `school-${s.id}`,
        type: 'school' as RecipientType,
        name: s.name,
        phone: s.contactPhone!,
        email: s.contactEmail,
      }))
  }, [])

  const handleRecipientTypeChange = (_value: RecipientType) => {
    form.setFieldValue('recipientIds', [])
    setSelectedRecipients([])
  }

  const handleRecipientSelect = (recipientIds: string[]) => {
    const recipientType = form.getFieldValue('recipientType') as RecipientType

    let recipients: Recipient[] = []
    if (recipientType === 'user') {
      recipients = availableUsers.filter(u => recipientIds.includes(u.id))
    } else if (recipientType === 'instructor') {
      recipients = availableInstructors.filter(i => recipientIds.includes(i.id))
    } else if (recipientType === 'school') {
      recipients = availableSchools.filter(s => recipientIds.includes(s.id))
    } else if (recipientType === 'manual') {
      // 수동 입력 처리
      const manualPhones = form.getFieldValue('manualPhones') as string
      if (manualPhones) {
        const phones = manualPhones
          .split('\n')
          .map(p => p.trim())
          .filter(p => p)
        recipients = phones.map((phone, idx) => ({
          id: `manual-${idx}`,
          type: 'manual' as RecipientType,
          name: `수동입력-${idx + 1}`,
          phone,
        }))
      }
    }

    setSelectedRecipients(recipients)
  }

  const handleManualPhonesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const phones = e.target.value
      .split('\n')
      .map(p => p.trim())
      .filter(p => p)
    const recipients: Recipient[] = phones.map((phone, idx) => ({
      id: `manual-${idx}`,
      type: 'manual' as RecipientType,
      name: `수동입력-${idx + 1}`,
      phone,
    }))
    setSelectedRecipients(recipients)
    form.setFieldValue(
      'recipientIds',
      recipients.map(r => r.id)
    )
  }

  const handlePreview = () => {
    if (selectedRecipients.length === 0) {
      message.warning('수신자를 선택해주세요')
      return
    }
    setStep('preview')
  }

  const handleSend = async () => {
    if (!template) return

    setStep('sending')
    setSending(true)
    setProgress(0)
    const results: SendResult[] = []

    for (let i = 0; i < selectedRecipients.length; i++) {
      const recipient = selectedRecipients[i]

      // 변수 치환 (기본 샘플 값 사용, 실제로는 recipient의 정보를 사용)
      const sampleValues: Record<string, string> = {
        name: recipient.name,
        phone: recipient.phone,
        ...recipient.variables,
      }
      const message = applyTemplateVariables(template.content.text, sampleValues)

      try {
        const result = await smsProvider.send({
          to: recipient.phone,
          message,
        })

        results.push({
          recipient,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
        })
      } catch (error) {
        results.push({
          recipient,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        })
      }

      setProgress(Math.round(((i + 1) / selectedRecipients.length) * 100))
    }

    setSendResults(results)
    setSending(false)
    setStep('result')
  }

  const handleClose = () => {
    form.resetFields()
    setSelectedRecipients([])
    setSendResults([])
    setStep('select')
    setProgress(0)
    onCancel()
  }

  const handleFinish = () => {
    handleClose()
    onSuccess?.()
  }

  const recipientType = Form.useWatch('recipientType', form)

  // 미리보기: 첫 번째 수신자 기준
  const previewMessage = useMemo(() => {
    if (!template || selectedRecipients.length === 0) return ''
    const firstRecipient = selectedRecipients[0]
    const sampleValues: Record<string, string> = {
      name: firstRecipient.name,
      phone: firstRecipient.phone,
      ...firstRecipient.variables,
    }
    return applyTemplateVariables(template.content.text, sampleValues)
  }, [template, selectedRecipients])

  const recipientColumns: ColumnsType<Recipient> = [
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '전화번호',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '타입',
      dataIndex: 'type',
      key: 'type',
      render: (type: RecipientType) => {
        const labels: Record<RecipientType, string> = {
          user: '사용자',
          instructor: '강사',
          school: '학교',
          manual: '수동입력',
        }
        return <Tag>{labels[type]}</Tag>
      },
    },
  ]

  const resultColumns: ColumnsType<SendResult> = [
    {
      title: '수신자',
      key: 'recipient',
      render: (_: unknown, result: SendResult) => (
        <Space direction="vertical" size={0}>
          <Text strong>{result.recipient.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {result.recipient.phone}
          </Text>
        </Space>
      ),
    },
    {
      title: '결과',
      key: 'success',
      width: 100,
      render: (_: unknown, result: SendResult) => (
        <Tag color={result.success ? 'success' : 'error'}>{result.success ? '성공' : '실패'}</Tag>
      ),
    },
    {
      title: '메시지 ID',
      dataIndex: 'messageId',
      key: 'messageId',
      render: (v: string | undefined) => v || '-',
    },
    {
      title: '오류',
      dataIndex: 'error',
      key: 'error',
      render: (v: string | undefined) => (v ? <Text type="danger">{v}</Text> : '-'),
    },
  ]

  const successCount = sendResults.filter(r => r.success).length
  const failCount = sendResults.filter(r => !r.success).length

  return (
    <Modal
      title="알림톡 단체 발송"
      open={open}
      onCancel={handleClose}
      width={800}
      footer={
        step === 'select' ? (
          <Space>
            <Button onClick={handleClose}>취소</Button>
            <Button
              type="primary"
              onClick={handlePreview}
              disabled={selectedRecipients.length === 0}
            >
              다음
            </Button>
          </Space>
        ) : step === 'preview' ? (
          <Space>
            <Button onClick={() => setStep('select')}>이전</Button>
            <Button onClick={handleClose}>취소</Button>
            <Button type="primary" onClick={handleSend} loading={sending}>
              발송
            </Button>
          </Space>
        ) : step === 'sending' ? (
          <Button onClick={handleClose} disabled>
            발송 중...
          </Button>
        ) : (
          <Space>
            <Button onClick={handleClose}>닫기</Button>
            <Button type="primary" onClick={handleFinish}>
              완료
            </Button>
          </Space>
        )
      }
    >
      {step === 'select' && (
        <Form form={form} layout="vertical">
          <Form.Item
            name="recipientType"
            label="수신자 타입"
            rules={[{ required: true, message: '수신자 타입을 선택해주세요' }]}
            initialValue="user"
          >
            <Select onChange={handleRecipientTypeChange}>
              <Select.Option value="user">사용자</Select.Option>
              <Select.Option value="instructor">강사</Select.Option>
              <Select.Option value="school">학교</Select.Option>
              <Select.Option value="manual">수동 입력</Select.Option>
            </Select>
          </Form.Item>

          {recipientType === 'manual' ? (
            <Form.Item
              name="manualPhones"
              label="전화번호 (줄바꿈으로 구분)"
              rules={[{ required: true, message: '전화번호를 입력해주세요' }]}
            >
              <TextArea
                rows={6}
                placeholder="010-1234-5678&#10;010-2345-6789&#10;..."
                onChange={handleManualPhonesChange}
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="recipientIds"
              label={`${recipientType === 'user' ? '사용자' : recipientType === 'instructor' ? '강사' : '학교'} 선택`}
              rules={[{ required: true, message: '수신자를 선택해주세요' }]}
            >
              <Select
                mode="multiple"
                showSearch
                placeholder="수신자를 선택하세요"
                onChange={handleRecipientSelect}
                filterOption={(input, option) => {
                  const label = option?.label as string | undefined
                  return label ? label.toLowerCase().includes(input.toLowerCase()) : false
                }}
                options={
                  recipientType === 'user'
                    ? availableUsers.map(u => ({ value: u.id, label: `${u.name} (${u.phone})` }))
                    : recipientType === 'instructor'
                      ? availableInstructors.map(i => ({
                          value: i.id,
                          label: `${i.name} (${i.phone})`,
                        }))
                      : availableSchools.map(s => ({
                          value: s.id,
                          label: `${s.name} (${s.phone})`,
                        }))
                }
              />
            </Form.Item>
          )}

          {selectedRecipients.length > 0 && (
            <Card size="small" style={{ marginTop: 16 }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>선택된 수신자: {selectedRecipients.length}명</Text>
                <Table
                  dataSource={selectedRecipients}
                  columns={recipientColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ y: 200 }}
                />
              </Space>
            </Card>
          )}
        </Form>
      )}

      {step === 'preview' && template && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card size="small">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>템플릿: {template.title}</Text>
              <Text type="secondary">수신자: {selectedRecipients.length}명</Text>
            </Space>
          </Card>

          <Divider />

          <Card size="small" title="미리보기 (첫 번째 수신자 기준)">
            <Text style={{ whiteSpace: 'pre-wrap' }}>{previewMessage}</Text>
          </Card>

          <Card size="small">
            <Table
              dataSource={selectedRecipients}
              columns={recipientColumns}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 200 }}
            />
          </Card>
        </Space>
      )}

      {step === 'sending' && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Text>발송 중...</Text>
          <Progress percent={progress} status="active" />
          <Text type="secondary">
            {sendResults.length} / {selectedRecipients.length} 발송 완료
          </Text>
        </Space>
      )}

      {step === 'result' && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card size="small">
            <Space direction="vertical" size="small">
              <Text strong>발송 결과</Text>
              <Space>
                <Tag color="success">성공: {successCount}건</Tag>
                <Tag color="error">실패: {failCount}건</Tag>
              </Space>
            </Space>
          </Card>

          <Table
            dataSource={sendResults}
            columns={resultColumns}
            rowKey={(record, index) => `${record.recipient.id}-${index}`}
            pagination={false}
            size="small"
            scroll={{ y: 300 }}
          />
        </Space>
      )}
    </Modal>
  )
}
