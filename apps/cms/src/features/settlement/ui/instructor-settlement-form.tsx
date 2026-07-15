/**
 * 강사/봉사자 정산 제출 폼 컴포넌트
 * Phase 6.1.2: 강사/봉사자 정산 제출
 */
/* eslint-disable react-hooks/incompatible-library -- React Hook Form watch 사용 */

import { Form, Input, Select, Button, Space, Table, Upload, Alert, DatePicker } from 'antd'
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { Controller, useForm, useFieldArray, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { settlementSchema, type SettlementFormData } from '@/entities/settlement/model/schema'
import type { Settlement } from '@/types/domain'
import { mockPrograms, mockMatchings } from '@/data/mock'
import { calculateSettlementTotal } from '../lib/settlement-helpers'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useMemo } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import locale from 'antd/es/date-picker/locale/ko_KR'
import { fieldValidationHelp } from '@/shared/utils/error-handler'
import { CmsNumericInput } from '@/shared/ui/numeric-input'

const { Option } = Select
const { TextArea } = Input

interface InstructorSettlementFormProps {
  settlement?: Settlement
  onSubmit: (data: SettlementFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const itemTypeOptions = [
  { value: 'instructor_fee', label: '강사비' },
  { value: 'transportation', label: '교통비' },
  { value: 'accommodation', label: '숙박비' },
  { value: 'other', label: '기타' },
]

export function InstructorSettlementForm({
  settlement,
  onSubmit,
  onCancel,
  loading }: InstructorSettlementFormProps) {
  const { user } = useAuthStore()
  const instructorId = user?.instructorId || user?.id

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control } = useForm<SettlementFormData>({
    resolver: zodResolver(settlementSchema),
    defaultValues: (() => {
      if (settlement) {
        const status: SettlementFormData['status'] =
          settlement.status === 'review' ? 'calculated' : settlement.status
        return {
          programId: settlement.programId,
          instructorId: settlement.instructorId,
          matchingId: settlement.matchingId,
          period: settlement.period,
          items: settlement.items,
          status,
          notes: settlement.notes || '' }
      }
      return {
        items: [{ type: 'instructor_fee', description: '강사비', amount: 0 }],
        status: 'pending' as const,
        instructorId: instructorId || '' }
    })() })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items' })

  const selectedProgramId = watch('programId')

  // 본인이 담당한 프로그램만 필터링
  const availablePrograms = useMemo(() => {
    if (!instructorId) return []
    // 본인이 매칭된 프로그램만 필터링
    const myMatchings = mockMatchings.filter(m => m.instructorId === instructorId)
    const myProgramIds = new Set(myMatchings.map(m => m.programId))
    return mockPrograms.filter(p => myProgramIds.has(p.id))
  }, [instructorId])

  // 선택된 프로그램에 맞는 매칭 필터링 (본인 매칭만)
  const availableMatchings = useMemo(() => {
    if (!selectedProgramId || !instructorId) return []
    return mockMatchings.filter(
      m => m.programId === selectedProgramId && m.instructorId === instructorId
    )
  }, [selectedProgramId, instructorId])

  const onFormSubmit: SubmitHandler<SettlementFormData> = async (data) => {
    // 강사 ID 자동 설정
    if (!data.instructorId && instructorId) {
      data.instructorId = instructorId
    }
    // 상태는 pending으로 고정 (제출 시)
    data.status = 'pending'
    await onSubmit(data)
  }

  const totalAmount = calculateSettlementTotal(watch('items') || [])

  if (!instructorId) {
    return (
      <Alert
        description="정산을 제출하려면 로그인이 필요합니다."
        type="warning"
        showIcon
      />
    )
  }

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
      <Form.Item
        label="프로그램"
        validateStatus={errors.programId ? 'error' : ''}
        help={fieldValidationHelp(errors.programId)}
        required
      >
        <Select
          value={watch('programId')}
          onChange={value => {
            setValue('programId', value)
            // 프로그램 변경 시 매칭 초기화
            setValue('matchingId', '')
          }}
          placeholder="프로그램 선택"
          showSearch
          filterOption={(input, option) => {
            const children = option?.children as string | string[] | undefined
            if (typeof children === 'string') {
              return children.toLowerCase().includes(input.toLowerCase())
            }
            return false
          }}
          disabled={!!settlement}
        >
          {availablePrograms.map(program => (
            <Option key={program.id} value={program.id}>
              {program.title}
            </Option>
          ))}
        </Select>
        {availablePrograms.length === 0 && (
          <Alert
            description="정산을 제출할 프로그램이 없습니다. 관리자에게 문의하세요."
            type="info"
            showIcon
            style={{ marginTop: 8 }}
          />
        )}
      </Form.Item>

      <Form.Item
        label="매칭"
        validateStatus={errors.matchingId ? 'error' : ''}
        help={fieldValidationHelp(errors.matchingId) || '해당 프로그램의 매칭 정보를 선택하세요'}
        required
      >
        <Select
          value={watch('matchingId')}
          onChange={value => setValue('matchingId', value)}
          placeholder="매칭 선택"
          disabled={!selectedProgramId || !!settlement}
        >
          {availableMatchings.map(matching => (
            <Option key={matching.id} value={matching.id}>
              매칭 #{matching.id.slice(-6)}
            </Option>
          ))}
        </Select>
        {selectedProgramId && availableMatchings.length === 0 && (
          <Alert
            description="선택한 프로그램에 대한 매칭 정보가 없습니다."
            type="warning"
            showIcon
            style={{ marginTop: 8 }}
          />
        )}
      </Form.Item>

      <Form.Item
        label="기간"
        validateStatus={errors.period ? 'error' : ''}
        help={fieldValidationHelp(errors.period) || '기간을 선택하세요'}
        required
      >
        <DatePicker
          style={{ width: '100%' }}
          format="YYYY-MM-DD"
          locale={locale}
          placeholder="기간을 선택하세요"
          value={watch('period') ? (watch('period').includes('-') && watch('period').split('-').length === 2 ? dayjs(watch('period') + '-01') : dayjs(watch('period'))) : null}
          onChange={(date: Dayjs | null) => {
            if (date) {
              setValue('period', date.format('YYYY-MM-DD'))
            } else {
              setValue('period', '')
            }
          }}
        />
      </Form.Item>

      <Form.Item label="정산 항목" required>
        <div>
          <Table
            dataSource={fields}
            scroll={fields.length > 4 ? { y: 300 } : undefined}
            pagination={false}
            columns={[
              {
                title: '항목 타입',
                dataIndex: 'type',
                key: 'type',
                width: 150,
                render: (_: unknown, _record: unknown, index: number) => (
                  <Select
                    value={watch(`items.${index}.type`)}
                    onChange={value => {
                      setValue(`items.${index}.type`, value)
                      // 숙박비는 8만원 고정
                      if (value === 'accommodation') {
                        setValue(`items.${index}.amount`, 80000)
                        setValue(`items.${index}.description`, '숙박비')
                      }
                    }}
                    style={{ width: '100%' }}
                  >
                    {itemTypeOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                ) },
              {
                title: '설명',
                dataIndex: 'description',
                key: 'description',
                render: (_: unknown, _record: unknown, index: number) => (
                  <Input
                    value={watch(`items.${index}.description`)}
                    onChange={e => setValue(`items.${index}.description`, e.target.value)}
                    placeholder="항목 설명"
                  />
                ) },
              {
                title: '금액',
                dataIndex: 'amount',
                key: 'amount',
                width: 150,
                render: (_: unknown, _record: unknown, index: number) => {
                  const itemType = watch(`items.${index}.type`)
                  const isAccommodation = itemType === 'accommodation'
                  return (
                    <Controller
                      name={`items.${index}.amount`}
                      control={control}
                      render={({ field }) => (
                        <CmsNumericInput
                          mode="currency"
                          value={field.value == null ? '' : String(field.value)}
                          onBlur={field.onBlur}
                          onValueChange={raw => {
                            // 숙박비는 8만원 고정이므로 변경 불가
                            if (!isAccommodation) {
                              field.onChange(raw === '' ? undefined : Number(raw))
                            }
                          }}
                          min={0}
                          precision={0}
                          style={{ width: '100%' }}
                          disabled={isAccommodation}
                        />
                      )}
                    />
                  )
                } },
              {
                title: '작업',
                key: 'action',
                width: 80,
                render: (_: unknown, _record: unknown, index: number) => (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  />
                ) },
            ]}
            rowKey={(_record, index) => `item-${index}`}
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <strong>총액</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong>{totalAmount.toLocaleString('ko-KR')}원</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => append({ type: 'other', description: '', amount: 0 })}
            style={{ width: '100%', marginTop: 16 }}
          >
            항목 추가
          </Button>
        </div>
      </Form.Item>

      <Form.Item label="증빙 파일 (선택사항)">
        <Upload
          multiple
          beforeUpload={() => false}
          // TODO: 실제 파일 업로드 구현 필요
        >
          <Button icon={<UploadOutlined />}>파일 선택</Button>
        </Upload>
        <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
          교통비, 숙박비 등 증빙이 필요한 항목의 증빙 파일을 업로드하세요.
        </div>
      </Form.Item>

      <Form.Item label="비고">
        <TextArea {...register('notes')} rows={3} placeholder="비고를 입력하세요" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {settlement ? '수정' : '제출'}
          </Button>
          <Button onClick={onCancel}>취소</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

