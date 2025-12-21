/**
 * 정산 등록/수정 폼 컴포넌트
 * Phase 4: react-hook-form + zod
 */

import { Form, Input, Select, Button, Space, Table, InputNumber } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { settlementSchema, type SettlementFormData } from '@/entities/settlement/model/schema'
import type { Settlement } from '@/types/domain'
import { mockPrograms, mockInstructors, mockMatchings } from '@/data/mock'

const { Option } = Select
const { TextArea } = Input

interface SettlementFormProps {
  settlement?: Settlement
  onSubmit: (data: SettlementFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const statusOptions = [
  { value: 'pending', label: '대기' },
  { value: 'calculated', label: '산출 완료' },
  { value: 'approved', label: '승인' },
  { value: 'paid', label: '지급 완료' },
  { value: 'cancelled', label: '취소' },
]

const itemTypeOptions = [
  { value: 'instructor_fee', label: '강사비' },
  { value: 'transportation', label: '교통비' },
  { value: 'accommodation', label: '숙박비' },
  { value: 'other', label: '기타' },
]

export function SettlementForm({ settlement, onSubmit, onCancel, loading }: SettlementFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<SettlementFormData>({
    resolver: zodResolver(settlementSchema),
    defaultValues: settlement
      ? {
          programId: settlement.programId,
          instructorId: settlement.instructorId,
          matchingId: settlement.matchingId,
          period: settlement.period,
          items: settlement.items,
          status: settlement.status,
          notes: settlement.notes || '',
        }
      : {
          items: [{ type: 'instructor_fee', description: '강사비', amount: 0 }],
          status: 'pending',
        },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const selectedProgramId = watch('programId')
  const selectedInstructorId = watch('instructorId')

  // 선택된 프로그램에 맞는 매칭 필터링
  const filteredMatchings = selectedProgramId
    ? mockMatchings.filter(m => m.programId === selectedProgramId)
    : []

  // 선택된 강사에 맞는 매칭 필터링
  const availableMatchings = selectedInstructorId
    ? filteredMatchings.filter(m => m.instructorId === selectedInstructorId)
    : filteredMatchings

  const onFormSubmit = async (data: SettlementFormData) => {
    await onSubmit(data)
  }

  const totalAmount = watch('items')?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
      <Form.Item
        label="프로그램"
        validateStatus={errors.programId ? 'error' : ''}
        help={errors.programId?.message}
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
            if (Array.isArray(children)) {
              return children.some((child: unknown) => 
                typeof child === 'string' && child.toLowerCase().includes(input.toLowerCase())
              )
            }
            return false
          }}
        >
          {mockPrograms.map(program => (
            <Option key={program.id} value={program.id}>
              {program.title}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="강사"
        validateStatus={errors.instructorId ? 'error' : ''}
        help={errors.instructorId?.message}
        required
      >
        <Select
          value={watch('instructorId')}
          onChange={value => {
            setValue('instructorId', value)
            // 강사 변경 시 매칭 초기화
            setValue('matchingId', '')
          }}
          placeholder="강사 선택"
          showSearch
          filterOption={(input, option) => {
            const children = option?.children as string | string[] | undefined
            if (typeof children === 'string') {
              return children.toLowerCase().includes(input.toLowerCase())
            }
            if (Array.isArray(children)) {
              return children.some((child: unknown) => 
                typeof child === 'string' && child.toLowerCase().includes(input.toLowerCase())
              )
            }
            return false
          }}
        >
          {mockInstructors.map(instructor => (
            <Option key={instructor.id} value={instructor.id}>
              {instructor.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="매칭"
        validateStatus={errors.matchingId ? 'error' : ''}
        help={errors.matchingId?.message}
        required
      >
        <Select
          value={watch('matchingId')}
          onChange={value => setValue('matchingId', value)}
          placeholder="매칭 선택"
          disabled={!selectedProgramId || !selectedInstructorId}
        >
          {availableMatchings.map(matching => (
            <Option key={matching.id} value={matching.id}>
              매칭 #{matching.id.slice(-6)}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="기간"
        validateStatus={errors.period ? 'error' : ''}
        help={errors.period?.message || '예: 2025-01'}
        required
      >
        <Input {...register('period')} placeholder="YYYY-MM 형식으로 입력" />
      </Form.Item>

      <Form.Item
        label="상태"
        validateStatus={errors.status ? 'error' : ''}
        help={errors.status?.message}
        required
      >
        <Select
          value={watch('status')}
          onChange={value => setValue('status', value)}
          placeholder="상태 선택"
        >
          {statusOptions.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="정산 항목" required>
        <div>
          <Table
            dataSource={fields}
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
                ),
              },
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
                ),
              },
              {
                title: '금액',
                dataIndex: 'amount',
                key: 'amount',
                width: 150,
                render: (_: unknown, _record: unknown, index: number) => {
                  const itemType = watch(`items.${index}.type`)
                  const isAccommodation = itemType === 'accommodation'
                  return (
                    <InputNumber
                      value={watch(`items.${index}.amount`)}
                      onChange={value => {
                        // 숙박비는 8만원 고정이므로 변경 불가
                        if (!isAccommodation) {
                          setValue(`items.${index}.amount`, value || 0)
                        }
                      }}
                      min={0}
                      style={{ width: '100%' }}
                      disabled={isAccommodation}
                      formatter={value => `${value || ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
                    />
                  )
                },
              },
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
                ),
              },
            ]}
            rowKey={(_record, index) => `item-${index}`}
            pagination={false}
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

      <Form.Item label="비고">
        <TextArea {...register('notes')} rows={3} placeholder="비고를 입력하세요" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {settlement ? '수정' : '등록'}
          </Button>
          <Button onClick={onCancel}>취소</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

