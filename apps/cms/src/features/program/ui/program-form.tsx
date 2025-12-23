/**
 * 프로그램 등록/수정 폼 컴포넌트
 * Phase 2.1: 복잡한 폼 (Steps로 분리, 기획자 요청)
 */

import { useState } from 'react'
import { Form, Input, Select, Button, Card, Space, Steps, DatePicker } from 'antd'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { programSchema, type ProgramFormData } from '@/entities/program/model/schema'
import type { Program } from '@/types/domain'
import { mockSponsors } from '@/data/mock'
import { applicationPathService } from '@/entities/application-path/api/application-path-service'
import { programService } from '@/entities/program/api/program-service'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

interface ProgramFormProps {
  program?: Program
  onSubmit: (data: ProgramFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const programTypes = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '하이브리드' },
]

const programFormats = [
  { value: 'workshop', label: '워크샵' },
  { value: 'seminar', label: '세미나' },
  { value: 'course', label: '과정' },
  { value: 'lecture', label: '강의' },
  { value: 'other', label: '기타' },
]

const statusOptions = [
  { value: 'active', label: '활성' },
  { value: 'pending', label: '대기' },
  { value: 'inactive', label: '비활성' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled', label: '취소' },
]

export function ProgramForm({ program, onSubmit, onCancel, loading }: ProgramFormProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: program
      ? {
          sponsorId: program.sponsorId,
          title: program.title,
          type: program.type,
          format: program.format,
          description: program.description || '',
          startDate: typeof program.startDate === 'string' ? program.startDate : program.startDate.toISOString(),
          endDate: typeof program.endDate === 'string' ? program.endDate : program.endDate.toISOString(),
          status: program.status,
          settlementRuleId: program.settlementRuleId || '',
          applicationPathId: program.applicationPathId || '',
          rounds: program.rounds.map(r => ({
            roundNumber: r.roundNumber,
            startDate: typeof r.startDate === 'string' ? r.startDate : r.startDate.toISOString(),
            endDate: typeof r.endDate === 'string' ? r.endDate : r.endDate.toISOString(),
            capacity: r.capacity,
            status: r.status,
          })),
        }
      : {
          rounds: [{ roundNumber: 1, startDate: '', endDate: '', status: 'pending' }],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rounds',
  })

  const onFormSubmit = async (data: ProgramFormData) => {
    await onSubmit(data)
  }

  const steps = [
    {
      title: '기본 정보',
      content: (
        <div>
          <Form.Item label="스폰서" validateStatus={errors.sponsorId ? 'error' : ''} help={errors.sponsorId?.message}>
            <Select
              value={watch('sponsorId')}
              onChange={value => setValue('sponsorId', value)}
              placeholder="스폰서 선택"
              showSearch
              filterOption={(input, option) => {
                const label = option?.label as string | undefined
                return label ? label.toLowerCase().includes(input.toLowerCase()) : false
              }}
            >
              {mockSponsors.map(sponsor => (
                <Option key={sponsor.id} value={sponsor.id}>
                  {sponsor.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="프로그램명" validateStatus={errors.title ? 'error' : ''} help={errors.title?.message}>
            <Input {...register('title')} />
          </Form.Item>

          <Form.Item label="유형" validateStatus={errors.type ? 'error' : ''} help={errors.type?.message}>
            <Select
              value={watch('type')}
              onChange={value => setValue('type', value as ProgramFormData['type'])}
              placeholder="유형 선택"
            >
              {programTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="형태" validateStatus={errors.format ? 'error' : ''} help={errors.format?.message}>
            <Select
              value={watch('format')}
              onChange={value => setValue('format', value as ProgramFormData['format'])}
              placeholder="형태 선택"
            >
              {programFormats.map(format => (
                <Option key={format.value} value={format.value}>
                  {format.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="설명">
            <TextArea {...register('description')} rows={4} />
          </Form.Item>

          <Form.Item label="시작일" validateStatus={errors.startDate ? 'error' : ''} help={errors.startDate?.message}>
            <DatePicker
              value={watch('startDate') ? dayjs(watch('startDate')) : null}
              onChange={date => setValue('startDate', date ? date.toISOString() : '')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="종료일" validateStatus={errors.endDate ? 'error' : ''} help={errors.endDate?.message}>
            <DatePicker
              value={watch('endDate') ? dayjs(watch('endDate')) : null}
              onChange={date => setValue('endDate', date ? date.toISOString() : '')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="상태" validateStatus={errors.status ? 'error' : ''} help={errors.status?.message}>
            <Select
              value={watch('status')}
              onChange={value => setValue('status', value as ProgramFormData['status'])}
              placeholder="상태 선택"
            >
              {statusOptions.map(status => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="신청 경로"
            help="기존 신청 경로를 선택하거나, 프로그램 상세에서 나중에 설정할 수 있습니다."
          >
            <Select
              value={watch('applicationPathId') || undefined}
              onChange={value => setValue('applicationPathId', value || '')}
              placeholder="신청 경로 선택 (선택사항)"
              allowClear
              showSearch
              filterOption={(input, option) => {
                const label = option?.label as string | undefined
                return label ? label.toLowerCase().includes(input.toLowerCase()) : false
              }}
            >
              {applicationPathService.getAllSync().map(path => {
                const programTitle = programService.getNameById(path.programId)
                return (
                  <Option key={path.id} value={path.id}>
                    {programTitle} - {path.pathType === 'google_form' ? '구글폼' : '자동화 프로그램'}
                  </Option>
                )
              })}
            </Select>
          </Form.Item>
        </div>
      ),
    },
    {
      title: '회차 정보',
      content: (
        <div>
          {fields.map((field, index) => (
            <Card key={field.id} title={`회차 ${index + 1}`} style={{ marginBottom: 16 }}>
              <Form.Item
                label="회차 번호"
                validateStatus={errors.rounds?.[index]?.roundNumber ? 'error' : ''}
                help={errors.rounds?.[index]?.roundNumber?.message}
              >
                <Input
                  type="number"
                  {...register(`rounds.${index}.roundNumber`, { valueAsNumber: true })}
                />
              </Form.Item>

              <Form.Item
                label="시작일"
                validateStatus={errors.rounds?.[index]?.startDate ? 'error' : ''}
                help={errors.rounds?.[index]?.startDate?.message}
              >
                <DatePicker
                  value={watch(`rounds.${index}.startDate`) ? dayjs(watch(`rounds.${index}.startDate`)) : null}
                  onChange={date =>
                    setValue(`rounds.${index}.startDate`, date ? date.toISOString() : '')
                  }
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="종료일"
                validateStatus={errors.rounds?.[index]?.endDate ? 'error' : ''}
                help={errors.rounds?.[index]?.endDate?.message}
              >
                <DatePicker
                  value={watch(`rounds.${index}.endDate`) ? dayjs(watch(`rounds.${index}.endDate`)) : null}
                  onChange={date => setValue(`rounds.${index}.endDate`, date ? date.toISOString() : '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item label="정원">
                <Input
                  type="number"
                  {...register(`rounds.${index}.capacity`, { valueAsNumber: true })}
                />
              </Form.Item>

              <Form.Item
                label="상태"
                validateStatus={errors.rounds?.[index]?.status ? 'error' : ''}
                help={errors.rounds?.[index]?.status?.message}
              >
                <Select
                  value={watch(`rounds.${index}.status`)}
                  onChange={value =>
                    setValue(`rounds.${index}.status`, value as ProgramFormData['rounds'][0]['status'])
                  }
                >
                  {statusOptions.map(status => (
                    <Option key={status.value} value={status.value}>
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {fields.length > 1 && (
                <Button danger onClick={() => remove(index)}>
                  회차 삭제
                </Button>
              )}
            </Card>
          ))}

          <Button type="dashed" onClick={() => append({ roundNumber: fields.length + 1, startDate: '', endDate: '', status: 'pending' })} style={{ width: '100%' }}>
            + 회차 추가
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Card title={program ? '프로그램 수정' : '프로그램 등록'}>
      <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
        <Steps current={currentStep} items={steps.map(s => ({ title: s.title }))} style={{ marginBottom: 24 }} />

        <div style={{ minHeight: 400 }}>{steps[currentStep].content}</div>

        <Form.Item>
          <Space>
            {currentStep > 0 && (
              <Button onClick={() => setCurrentStep(currentStep - 1)}>이전</Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
                다음
              </Button>
            ) : (
              <>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {program ? '수정' : '등록'}
                </Button>
                <Button onClick={onCancel}>취소</Button>
              </>
            )}
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}

