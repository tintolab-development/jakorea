/**
 * 일정 등록/수정 폼 컴포넌트
 * Phase 3.1: react-hook-form + zod
 */

import { Form, Input, Select, Button, Card, Space, DatePicker, TimePicker, Alert } from 'antd'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { scheduleSchema, type ScheduleFormData } from '@/entities/schedule/model/schema'
import type { Schedule } from '@/types/domain'
import { mockPrograms, mockInstructors } from '@/data/mock'
import dayjs from 'dayjs'

const { Option } = Select

interface ScheduleFormProps {
  schedule?: Schedule
  initialDate?: string // 초기 날짜 (YYYY-MM-DD 형식)
  onSubmit: (data: ScheduleFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  conflicts?: Schedule[]
}

export function ScheduleForm({ schedule, initialDate, onSubmit, onCancel, loading, conflicts = [] }: ScheduleFormProps) {
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: schedule
      ? {
          programId: schedule.programId,
          roundId: schedule.roundId || '',
          title: schedule.title,
          date: typeof schedule.date === 'string' ? schedule.date : schedule.date.toISOString().split('T')[0],
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          location: schedule.location || '',
          onlineLink: schedule.onlineLink || '',
          instructorId: schedule.instructorId || '',
        }
      : {
          date: initialDate || dayjs().format('YYYY-MM-DD'),
          startTime: '09:00',
          endTime: '18:00',
        },
  })

  // initialDate가 변경될 때 날짜 필드 업데이트
  useEffect(() => {
    if (initialDate && !schedule) {
      setValue('date', initialDate)
    }
  }, [initialDate, schedule, setValue])

  const selectedProgramId = watch('programId')
  const selectedProgram = mockPrograms.find(p => p.id === selectedProgramId)

  const onFormSubmit = async (data: ScheduleFormData) => {
    await onSubmit(data)
  }

  return (
    <Card title={schedule ? '일정 수정' : '일정 등록'}>
      {conflicts.length > 0 && (
        <Alert
          message="일정 중복 경고"
          description={
            <div>
              <p>다음 일정과 시간이 겹칩니다:</p>
              <ul>
                {conflicts.map(c => (
                  <li key={c.id}>
                    {c.title} ({c.startTime} - {c.endTime})
                  </li>
                ))}
              </ul>
              <p>계속 진행하시겠습니까?</p>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
        <Form.Item label="프로그램" validateStatus={errors.programId ? 'error' : ''} help={errors.programId?.message}>
          <Select
            value={watch('programId')}
            onChange={value => setValue('programId', value)}
            placeholder="프로그램 선택"
            showSearch
            filterOption={(input, option) => {
              const label = option?.label as string | undefined
              return label ? label.toLowerCase().includes(input.toLowerCase()) : false
            }}
          >
            {mockPrograms.map(program => (
              <Option key={program.id} value={program.id}>
                {program.title}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedProgram && selectedProgram.rounds.length > 0 && (
          <Form.Item label="회차">
            <Select
              value={watch('roundId') || undefined}
              onChange={value => setValue('roundId', value || '')}
              placeholder="회차 선택 (선택사항)"
              allowClear
            >
              {selectedProgram.rounds.map(round => (
                <Option key={round.id} value={round.id}>
                  {round.roundNumber}회차
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item label="일정 제목" validateStatus={errors.title ? 'error' : ''} help={errors.title?.message}>
          <Input
            value={watch('title') || ''}
            onChange={e => setValue('title', e.target.value)}
            placeholder="일정 제목을 입력하세요"
          />
        </Form.Item>

        <Form.Item label="날짜" validateStatus={errors.date ? 'error' : ''} help={errors.date?.message}>
          <DatePicker
            value={watch('date') ? dayjs(watch('date')) : null}
            onChange={date => setValue('date', date ? date.format('YYYY-MM-DD') : '')}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Space style={{ width: '100%' }} size="middle">
          <Form.Item
            label="시작 시간"
            validateStatus={errors.startTime ? 'error' : ''}
            help={errors.startTime?.message}
            style={{ flex: 1 }}
          >
            <TimePicker
              value={watch('startTime') ? dayjs(watch('startTime'), 'HH:mm') : null}
              onChange={time => setValue('startTime', time ? time.format('HH:mm') : '')}
              format="HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="종료 시간"
            validateStatus={errors.endTime ? 'error' : ''}
            help={errors.endTime?.message}
            style={{ flex: 1 }}
          >
            <TimePicker
              value={watch('endTime') ? dayjs(watch('endTime'), 'HH:mm') : null}
              onChange={time => setValue('endTime', time ? time.format('HH:mm') : '')}
              format="HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Space>

        <Form.Item label="장소 (오프라인)">
          <Input
            value={watch('location') || ''}
            onChange={e => setValue('location', e.target.value)}
            placeholder="오프라인 장소를 입력하세요"
          />
        </Form.Item>

        <Form.Item
          label="온라인 링크"
          validateStatus={errors.onlineLink ? 'error' : ''}
          help={errors.onlineLink?.message}
        >
          <Input
            value={watch('onlineLink') || ''}
            onChange={e => setValue('onlineLink', e.target.value)}
            placeholder="https://..."
          />
        </Form.Item>

        <Form.Item label="강사 (선택사항)">
          <Select
            value={watch('instructorId') || undefined}
            onChange={value => setValue('instructorId', value || '')}
            placeholder="강사 선택 (선택사항)"
            allowClear
            showSearch
            filterOption={(input, option) => {
              const label = option?.label as string | undefined
              return label ? label.toLowerCase().includes(input.toLowerCase()) : false
            }}
          >
            {mockInstructors.map(instructor => (
              <Option key={instructor.id} value={instructor.id}>
                {instructor.name} ({instructor.region})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {schedule ? '수정' : '등록'}
            </Button>
            <Button onClick={onCancel}>취소</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}

