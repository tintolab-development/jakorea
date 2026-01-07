/**
 * 일정 협의 등록/수정 폼 (Modal 내부에서 사용)
 * 간단한 버전: 프로그램/학교 선택 + 제안 날짜 1개 + 상태/메모
 */
import { Form, Select, DatePicker, TimePicker, Input, Button, Space } from 'antd'
import { useEffect } from 'react'
import type { ScheduleNegotiation } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { schoolService } from '@/entities/school/api/school-service'

const { Option } = Select
const { TextArea } = Input

export interface ScheduleNegotiationFormData {
  programId: string
  schoolId: string
  proposals: Array<{
    date: string
    startTime?: string
    endTime?: string
    status?: 'pending' | 'accepted' | 'rejected'
    note?: string
  }>
  status: ScheduleNegotiation['status']
}

interface Props {
  initial?: ScheduleNegotiation
  loading?: boolean
  fixedProgramId?: string
  onSubmit: (data: ScheduleNegotiationFormData) => Promise<void>
  onCancel: () => void
}

export function ScheduleNegotiationForm({
  initial,
  loading,
  fixedProgramId,
  onSubmit,
  onCancel,
}: Props) {
  const [form] = Form.useForm<ScheduleNegotiationFormData>()

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        programId: initial.programId,
        schoolId: initial.schoolId,
        status: initial.status,
        proposals: [
          {
            date: initial.proposals[0]?.date,
            startTime: initial.proposals[0]?.startTime,
            endTime: initial.proposals[0]?.endTime,
            status: initial.proposals[0]?.status,
            note: initial.proposals[0]?.note,
          },
        ],
      } as any)
    } else {
      form.setFieldsValue({
        programId: fixedProgramId || undefined,
        proposals: [{ status: 'pending' }],
        status: 'proposed',
      } as any)
    }
  }, [initial, fixedProgramId, form])

  const programs = programService.getAllSync()
  const schools = schoolService.getAllSync()

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={values => onSubmit(values)}
      initialValues={{ status: 'proposed' }}
    >
      <Form.Item
        label="프로그램"
        name="programId"
        rules={[{ required: true, message: '프로그램을 선택하세요' }]}
      >
        <Select placeholder="프로그램 선택" disabled={!!fixedProgramId || !!initial}>
          {programs.map(p => (
            <Option key={p.id} value={p.id}>
              {p.title}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="학교"
        name="schoolId"
        rules={[{ required: true, message: '학교를 선택하세요' }]}
      >
        <Select placeholder="학교 선택" disabled={!!initial}>
          {schools.map(s => (
            <Option key={s.id} value={s.id}>
              {s.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="제안 1" required>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item
            name={['proposals', 0, 'date']}
            rules={[{ required: true, message: '날짜를 선택하세요' }]}
            noStyle
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Space>
            <Form.Item name={['proposals', 0, 'startTime']} noStyle>
              <TimePicker placeholder="시작" format="HH:mm" />
            </Form.Item>
            <Form.Item name={['proposals', 0, 'endTime']} noStyle>
              <TimePicker placeholder="종료" format="HH:mm" />
            </Form.Item>
          </Space>
          <Form.Item name={['proposals', 0, 'note']} noStyle>
            <TextArea rows={3} placeholder="메모 (선택)" />
          </Form.Item>
        </Space>
      </Form.Item>

      <Form.Item label="진행 상태" name="status">
        <Select>
          <Option value="proposed">제안</Option>
          <Option value="accepted">합의</Option>
          <Option value="rejected">거절</Option>
          <Option value="revised">재제안</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initial ? '수정' : '등록'}
          </Button>
          <Button onClick={onCancel}>취소</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}


