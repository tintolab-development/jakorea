/**
 * 프로그램 등록/수정 폼 컴포넌트
 * Phase 2.1: 복잡한 폼 (Steps로 분리, 기획자 요청)
 */
/* eslint-disable react-hooks/incompatible-library -- React Hook Form watch 사용 */

import { useState, useEffect, useMemo } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  Steps,
  DatePicker,
  Upload,
  Typography,
} from 'antd'
import { UploadOutlined, EditOutlined } from '@ant-design/icons'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { programSchema, type ProgramFormData } from '@/entities/program/model/schema'
import type { Program } from '@/types/domain'
import { mockSponsors } from '@/data/mock'
import { applicationPathService } from '@/entities/application-path/api/application-path-service'
import { programService } from '@/entities/program/api/program-service'
import { mockFileTemplates } from '@/data/mock/templates'
import { getFormTemplateByProgramId, formTemplatesByProgramId } from '@/data/mock/form-templates'
import type { FormFieldDef } from '@/types/form-template'
import { FormFieldEditor } from './form-field-editor'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

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
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false)

  const defaultValues = useMemo<ProgramFormData>(() => {
    if (program) {
      return {
        sponsorId: program.sponsorId,
        title: program.title,
        type: program.type,
        format: program.format,
        description: program.description || '',
        startDate:
          typeof program.startDate === 'string'
            ? program.startDate
            : program.startDate.toISOString(),
        endDate:
          typeof program.endDate === 'string' ? program.endDate : program.endDate.toISOString(),
        status: program.status,
        settlementRuleId: program.settlementRuleId || '',
        applicationPathId: program.applicationPathId || '',
        venue: program.venue || '',
        curriculum: program.curriculum || '',
        contactEmail: program.contactEmail || '',
        contactPhone: program.contactPhone || '',
        oneLineIntroduction: program.oneLineIntroduction || '',
        keyVisualImage: program.keyVisualImage || '',
        applicationFormTemplateId: program.applicationFormTemplateId || '',
        surveyFormTemplateId: program.surveyFormTemplateId || '',
        satisfactionFormTemplateId: program.satisfactionFormTemplateId || '',
        lectureReportFormTemplateId: program.lectureReportFormTemplateId || '',
        totalParticipants: program.totalParticipants || undefined,
        textbookName: program.textbookName || '',
        textbookNameEn: program.textbookNameEn || '',
        rounds: program.rounds.map(r => ({
          roundNumber: r.roundNumber,
          startDate: typeof r.startDate === 'string' ? r.startDate : r.startDate.toISOString(),
          endDate: typeof r.endDate === 'string' ? r.endDate : r.endDate.toISOString(),
          capacity: r.capacity,
          status: r.status,
        })),
      }
    }
    return {
      sponsorId: '',
      title: '',
      status: 'pending',
      type: 'offline',
      format: 'workshop',
      startDate: '',
      endDate: '',
      rounds: [{ roundNumber: 1, startDate: '', endDate: '', status: 'pending' }],
    }
  }, [program])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    trigger,
    reset,
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues,
  })

  // program prop이 변경될 때 폼 값 업데이트
  useEffect(() => {
    if (program) {
      reset({
        sponsorId: program.sponsorId,
        title: program.title,
        type: program.type,
        format: program.format,
        description: program.description || '',
        startDate:
          typeof program.startDate === 'string'
            ? program.startDate
            : program.startDate.toISOString(),
        endDate:
          typeof program.endDate === 'string' ? program.endDate : program.endDate.toISOString(),
        status: program.status,
        settlementRuleId: program.settlementRuleId || '',
        applicationPathId: program.applicationPathId || '',
        venue: program.venue || '',
        curriculum: program.curriculum || '',
        contactEmail: program.contactEmail || '',
        contactPhone: program.contactPhone || '',
        oneLineIntroduction: program.oneLineIntroduction || '',
        keyVisualImage: program.keyVisualImage || '',
        applicationFormTemplateId: program.applicationFormTemplateId || '',
        surveyFormTemplateId: program.surveyFormTemplateId || '',
        satisfactionFormTemplateId: program.satisfactionFormTemplateId || '',
        lectureReportFormTemplateId: program.lectureReportFormTemplateId || '',
        totalParticipants: program.totalParticipants || undefined,
        textbookName: program.textbookName || '',
        textbookNameEn: program.textbookNameEn || '',
        rounds: program.rounds.map(r => ({
          roundNumber: r.roundNumber,
          startDate: typeof r.startDate === 'string' ? r.startDate : r.startDate.toISOString(),
          endDate: typeof r.endDate === 'string' ? r.endDate : r.endDate.toISOString(),
          capacity: r.capacity,
          status: r.status,
        })),
      })
    } else {
      reset({
        title: '',
        status: 'pending',
        type: 'offline',
        format: 'workshop',
        rounds: [{ roundNumber: 1, startDate: '', endDate: '', status: 'pending' }],
      })
    }
  }, [program, reset])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rounds',
  })

  const programId = program?.id || 'new'
  const currentTemplate = getFormTemplateByProgramId(programId)
  const [customFields, setCustomFields] = useState<FormFieldDef[]>(currentTemplate.customFields)

  const handleSaveCustomFields = (fields: FormFieldDef[]) => {
    setCustomFields(fields)
    // 프로그램별 템플릿 저장 (프로그램 저장 시 함께 저장됨)
    // 실제로는 API 호출로 저장해야 함
    setCustomizeModalOpen(false)
  }

  const onFormSubmit = async (data: ProgramFormData) => {
    try {
      await onSubmit(data)
      // 프로그램 저장 후 커스텀 필드도 저장
      const savedProgramId = program?.id || `program-${Date.now()}`
      if (customFields.length > 0 || program) {
        formTemplatesByProgramId.set(savedProgramId, {
          programId: savedProgramId,
          customFields: customFields,
        })
      }
    } catch (e) {
      console.error('Failed to submit form:', e)
      // 에러는 상위에서 처리하되, 폼 에러 표시를 위해 에러 필드로 스크롤
      const firstErrorField = Object.keys(errors)[0]
      if (firstErrorField) {
        const element =
          document.querySelector(`[name="${firstErrorField}"]`) ||
          document.querySelector(`[id="${firstErrorField}"]`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  const steps = [
    {
      title: '기본 정보',
      content: (
        <div>
          <Form.Item
            label="스폰서"
            validateStatus={errors.sponsorId ? 'error' : ''}
            help={errors.sponsorId?.message}
            required
          >
            <Select
              value={watch('sponsorId')}
              onChange={value => setValue('sponsorId', value, { shouldValidate: true })}
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

          <Form.Item
            label="프로그램명"
            validateStatus={errors.title ? 'error' : ''}
            help={errors.title?.message}
            required
          >
            <Input
              value={watch('title') || ''}
              onChange={e => setValue('title', e.target.value, { shouldValidate: true })}
              placeholder="프로그램명을 입력해주세요"
            />
          </Form.Item>

          <Form.Item
            label="유형"
            validateStatus={errors.type ? 'error' : ''}
            help={errors.type?.message}
            required
          >
            <Select
              value={watch('type')}
              onChange={value =>
                setValue('type', value as ProgramFormData['type'], { shouldValidate: true })
              }
              placeholder="유형 선택"
            >
              {programTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="형태"
            validateStatus={errors.format ? 'error' : ''}
            help={errors.format?.message}
            required
          >
            <Select
              value={watch('format')}
              onChange={value =>
                setValue('format', value as ProgramFormData['format'], { shouldValidate: true })
              }
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
            <TextArea
              value={watch('description') || ''}
              onChange={e => setValue('description', e.target.value)}
              rows={4}
            />
          </Form.Item>

          <Form.Item
            label="시작일"
            validateStatus={errors.startDate ? 'error' : ''}
            help={errors.startDate?.message}
            required
          >
            <DatePicker
              value={watch('startDate') ? dayjs(watch('startDate')) : null}
              onChange={date =>
                setValue('startDate', date ? date.toISOString() : '', { shouldValidate: true })
              }
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="종료일"
            validateStatus={errors.endDate ? 'error' : ''}
            help={errors.endDate?.message}
            required
          >
            <DatePicker
              value={watch('endDate') ? dayjs(watch('endDate')) : null}
              onChange={date =>
                setValue('endDate', date ? date.toISOString() : '', { shouldValidate: true })
              }
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="상태"
            validateStatus={errors.status ? 'error' : ''}
            help={errors.status?.message}
            required
          >
            <Select
              value={watch('status')}
              onChange={value =>
                setValue('status', value as ProgramFormData['status'], { shouldValidate: true })
              }
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
                    {programTitle} -{' '}
                    {path.pathType === 'google_form' ? '구글폼' : '자동화 프로그램'}
                  </Option>
                )
              })}
            </Select>
          </Form.Item>

          <Form.Item label="한 줄 소개">
            <Input
              value={watch('oneLineIntroduction') || ''}
              onChange={e => setValue('oneLineIntroduction', e.target.value)}
              placeholder="프로그램을 한 줄로 소개해주세요"
              maxLength={100}
              showCount
            />
          </Form.Item>

          <Form.Item label="진행 장소">
            <Input
              value={watch('venue') || ''}
              onChange={e => setValue('venue', e.target.value)}
              placeholder="프로그램 진행 장소를 입력해주세요"
            />
          </Form.Item>

          <Form.Item label="커리큘럼">
            <TextArea
              value={watch('curriculum') || ''}
              onChange={e => setValue('curriculum', e.target.value)}
              rows={6}
              placeholder="프로그램 커리큘럼을 입력해주세요"
            />
          </Form.Item>

          <Space style={{ display: 'flex', width: '100%' }} size="middle">
            <Form.Item
              label="문의처 이메일"
              validateStatus={errors.contactEmail ? 'error' : ''}
              help={errors.contactEmail?.message}
              style={{ flex: 1 }}
            >
              <Input
                type="email"
                value={watch('contactEmail') || ''}
                onChange={e => setValue('contactEmail', e.target.value, { shouldValidate: true })}
                placeholder="example@email.com"
              />
            </Form.Item>

            <Form.Item label="문의처 연락처" style={{ flex: 1 }}>
              <Input
                value={watch('contactPhone') || ''}
                onChange={e => setValue('contactPhone', e.target.value)}
                placeholder="010-1234-5678"
              />
            </Form.Item>
          </Space>

          <Form.Item label="키비주얼 이미지">
            <Input
              value={watch('keyVisualImage') || ''}
              onChange={e => setValue('keyVisualImage', e.target.value)}
              placeholder="키비주얼 이미지 URL을 입력해주세요"
            />
            <Upload
              listType="picture"
              maxCount={1}
              beforeUpload={() => false}
              onChange={info => {
                if (info.file.originFileObj) {
                  // 실제 구현 시 파일 업로드 서비스 호출
                  const url = URL.createObjectURL(info.file.originFileObj)
                  setValue('keyVisualImage', url)
                }
              }}
            >
              <Button icon={<UploadOutlined />}>이미지 업로드</Button>
            </Upload>
          </Form.Item>

          <Card title="프로그램별 폼 템플릿" style={{ marginTop: 24 }}>
            <Form.Item
              label="신청서 폼 템플릿"
              help="템플릿 관리에서 등록한 신청서 폼 템플릿을 선택하거나 나중에 설정할 수 있습니다."
            >
              <Space.Compact style={{ width: '100%' }}>
                <Select
                  value={watch('applicationFormTemplateId') || undefined}
                  onChange={value => setValue('applicationFormTemplateId', value || '')}
                  placeholder="신청서 폼 템플릿 선택 (선택사항)"
                  allowClear
                  showSearch
                  style={{ flex: 1 }}
                  filterOption={(input, option) => {
                    const label = option?.label as string | undefined
                    return label ? label.toLowerCase().includes(input.toLowerCase()) : false
                  }}
                >
                  {mockFileTemplates
                    .filter(t => t.status === 'published')
                    .map(template => (
                      <Option key={template.id} value={template.id}>
                        {template.title}
                      </Option>
                    ))}
                </Select>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setCustomizeModalOpen(true)}
                  disabled={!watch('applicationFormTemplateId') && !program?.id}
                >
                  커스터마이징
                </Button>
              </Space.Compact>
            </Form.Item>

            <Form.Item
              label="설문 폼 템플릿"
              help="템플릿 관리에서 등록한 설문 폼 템플릿을 선택할 수 있습니다."
            >
              <Select
                value={watch('surveyFormTemplateId') || undefined}
                onChange={value => setValue('surveyFormTemplateId', value || '')}
                placeholder="설문 폼 템플릿 선택 (선택사항)"
                allowClear
                showSearch
                filterOption={(input, option) => {
                  const label = option?.label as string | undefined
                  return label ? label.toLowerCase().includes(input.toLowerCase()) : false
                }}
              >
                {mockFileTemplates
                  .filter(t => t.status === 'published')
                  .map(template => (
                    <Option key={template.id} value={template.id}>
                      {template.title}
                    </Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="만족도 조사 폼 템플릿"
              help="템플릿 관리에서 등록한 만족도 조사 폼 템플릿을 선택할 수 있습니다."
            >
              <Select
                value={watch('satisfactionFormTemplateId') || undefined}
                onChange={value => setValue('satisfactionFormTemplateId', value || '')}
                placeholder="만족도 조사 폼 템플릿 선택 (선택사항)"
                allowClear
                showSearch
                filterOption={(input, option) => {
                  const label = option?.label as string | undefined
                  return label ? label.toLowerCase().includes(input.toLowerCase()) : false
                }}
              >
                {mockFileTemplates
                  .filter(t => t.status === 'published')
                  .map(template => (
                    <Option key={template.id} value={template.id}>
                      {template.title}
                    </Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="강의보고서 폼 템플릿"
              help="템플릿 관리에서 등록한 강의보고서 폼 템플릿을 선택할 수 있습니다."
            >
              <Select
                value={watch('lectureReportFormTemplateId') || undefined}
                onChange={value => setValue('lectureReportFormTemplateId', value || '')}
                placeholder="강의보고서 폼 템플릿 선택 (선택사항)"
                allowClear
                showSearch
                filterOption={(input, option) => {
                  const label = option?.label as string | undefined
                  return label ? label.toLowerCase().includes(input.toLowerCase()) : false
                }}
              >
                {mockFileTemplates
                  .filter(t => t.status === 'published')
                  .map(template => (
                    <Option key={template.id} value={template.id}>
                      {template.title}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          </Card>

          {/* 교재 정보 자동 계산 (참가자 수 기반) */}
          <Card title="교재 정보 (자동 계산)" size="small" style={{ marginTop: 16 }}>
            <Form.Item label="총 참가자 수">
              <Input
                type="number"
                min={0}
                value={watch('totalParticipants') ?? ''}
                onChange={e => {
                  const count = Number.parseInt(e.target.value, 10) || 0
                  setValue('totalParticipants', count)
                }}
                placeholder="참가자 수를 입력하면 교재 수량이 자동 계산됩니다"
              />
            </Form.Item>
            <Form.Item label="교재명(국문)">
              <Input
                value={watch('textbookName') || ''}
                onChange={e => setValue('textbookName', e.target.value)}
                placeholder="교재명을 입력해주세요"
              />
            </Form.Item>
            <Form.Item label="교재명(영문)">
              <Input
                value={watch('textbookNameEn') || ''}
                onChange={e => setValue('textbookNameEn', e.target.value)}
                placeholder="교재명(영문)을 입력해주세요"
              />
            </Form.Item>
            {(() => {
              const totalParticipants = watch('totalParticipants')
              const rounds = watch('rounds')
              if (!totalParticipants || totalParticipants <= 0) return null
              return (
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#f0f9ff',
                    borderRadius: 4,
                    marginTop: 8,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    💡 참가자 수: {totalParticipants}명 → 교재 필요 수량: {totalParticipants}권
                    {rounds &&
                      Array.isArray(rounds) &&
                      rounds.length > 1 &&
                      ` (${rounds.length}회차 기준)`}
                  </Text>
                </div>
              )
            })()}
          </Card>
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
                required
              >
                <Input
                  type="number"
                  min={1}
                  {...register(`rounds.${index}.roundNumber`, {
                    valueAsNumber: true,
                  })}
                />
              </Form.Item>

              <Form.Item
                label="시작일"
                validateStatus={errors.rounds?.[index]?.startDate ? 'error' : ''}
                help={errors.rounds?.[index]?.startDate?.message}
                required
              >
                <DatePicker
                  value={
                    watch(`rounds.${index}.startDate`)
                      ? dayjs(watch(`rounds.${index}.startDate`))
                      : null
                  }
                  onChange={date => {
                    setValue(`rounds.${index}.startDate`, date ? date.toISOString() : '', {
                      shouldValidate: true,
                    })
                  }}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="종료일"
                validateStatus={errors.rounds?.[index]?.endDate ? 'error' : ''}
                help={errors.rounds?.[index]?.endDate?.message}
                required
              >
                <DatePicker
                  value={
                    watch(`rounds.${index}.endDate`)
                      ? dayjs(watch(`rounds.${index}.endDate`))
                      : null
                  }
                  onChange={date => {
                    setValue(`rounds.${index}.endDate`, date ? date.toISOString() : '', {
                      shouldValidate: true,
                    })
                  }}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="정원"
                validateStatus={errors.rounds?.[index]?.capacity ? 'error' : ''}
                help={errors.rounds?.[index]?.capacity?.message}
              >
                <Input
                  type="number"
                  min={1}
                  {...register(`rounds.${index}.capacity`, {
                    valueAsNumber: true,
                    setValueAs: value => (value === '' ? undefined : Number(value)),
                  })}
                />
              </Form.Item>

              <Form.Item
                label="상태"
                validateStatus={errors.rounds?.[index]?.status ? 'error' : ''}
                help={errors.rounds?.[index]?.status?.message}
                required
              >
                <Select
                  value={watch(`rounds.${index}.status`)}
                  onChange={value => {
                    setValue(
                      `rounds.${index}.status`,
                      value as ProgramFormData['rounds'][0]['status'],
                      { shouldValidate: true }
                    )
                  }}
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

          <Button
            type="dashed"
            onClick={() =>
              append({
                roundNumber: fields.length + 1,
                startDate: '',
                endDate: '',
                status: 'pending',
              })
            }
            style={{ width: '100%' }}
          >
            + 회차 추가
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Form layout="vertical" onFinish={handleSubmit(onFormSubmit)}>
      <Steps
        current={currentStep}
        items={steps.map(s => ({ title: s.title }))}
        style={{ marginBottom: 24 }}
      />

      <div style={{ minHeight: 400 }}>{steps[currentStep].content}</div>

      <Form.Item>
        <Space>
          {currentStep > 0 && <Button onClick={() => setCurrentStep(currentStep - 1)}>이전</Button>}
          {currentStep < steps.length - 1 ? (
            <Button
              type="primary"
              onClick={async () => {
                // 현재 단계의 필수 필드 검증
                if (currentStep === 0) {
                  // 기본 정보 단계 검증
                  const isValid = await trigger([
                    'sponsorId',
                    'title',
                    'type',
                    'format',
                    'startDate',
                    'endDate',
                    'status',
                  ])
                  if (isValid) {
                    setCurrentStep(currentStep + 1)
                  } else {
                    // 에러가 있으면 첫 번째 에러 필드로 스크롤
                    const firstErrorField = Object.keys(errors).find(key =>
                      [
                        'sponsorId',
                        'title',
                        'type',
                        'format',
                        'startDate',
                        'endDate',
                        'status',
                      ].includes(key)
                    )
                    if (firstErrorField) {
                      const element =
                        document.querySelector(`[name="${firstErrorField}"]`) ||
                        document.querySelector(`[id="${firstErrorField}"]`)
                      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }
                } else {
                  setCurrentStep(currentStep + 1)
                }
              }}
            >
              다음
            </Button>
          ) : (
            <>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                onClick={async e => {
                  // 제출 전 전체 검증
                  const isValid = await trigger()
                  if (!isValid) {
                    e.preventDefault()
                    // 에러가 있으면 첫 번째 에러 필드로 스크롤
                    const firstErrorField = Object.keys(errors)[0]
                    if (firstErrorField) {
                      const element =
                        document.querySelector(`[name="${firstErrorField}"]`) ||
                        document.querySelector(`[id="${firstErrorField}"]`)
                      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }
                }}
              >
                {program ? '수정' : '등록'}
              </Button>
              <Button onClick={onCancel}>취소</Button>
            </>
          )}
        </Space>
      </Form.Item>

      <FormFieldEditor
        open={customizeModalOpen}
        fields={customFields}
        onSave={handleSaveCustomFields}
        onCancel={() => setCustomizeModalOpen(false)}
      />
    </Form>
  )
}
