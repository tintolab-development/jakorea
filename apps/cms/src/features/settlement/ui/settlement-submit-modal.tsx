/**
 * 정산 제출 모달 컴포넌트 (강사/봉사자용)
 * Phase 6.1.2: 강사/봉사자 정산 제출
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Upload,
  Button,
  Space,
  Divider,
  Typography,
  message,
  Switch,
  DatePicker,
  Collapse,
  Card,
  Radio,
} from 'antd'
import { UploadOutlined, CalculatorOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  submitSettlement,
  getAvailableSettlements,
  type SettlementSubmitFormData,
} from '@/entities/settlement/api/instructor-settlement-submit-service'
import type { SettlementItem } from '@/types/domain'
import dayjs, { type Dayjs } from 'dayjs'
import locale from 'antd/es/date-picker/locale/ko_KR'
import { useSettlementCalculation } from '@/features/settlement/hooks/use-settlement-calculation'
import { SettlementCalculationSummary } from '@/features/settlement/ui/settlement-calculation-summary'
import './settlement-submit-modal.css'

const { Text } = Typography
const { TextArea } = Input

interface AvailableSettlement {
  matchingId: string
  programId: string
  programTitle: string
  period: string
  scheduleCount: number
}

interface SettlementSubmitModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

export function SettlementSubmitModal({ open, onCancel, onSuccess }: SettlementSubmitModalProps) {
  const { user } = useAuthStore()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [availableSettlements, setAvailableSettlements] = useState<AvailableSettlement[]>([])
  const [selectedProgram, setSelectedProgram] = useState<AvailableSettlement | null>(null)
  const [costItemsOpen, setCostItemsOpen] = useState(true) // 비용 항목 접기/펴기 상태
  const [calculationMode, setCalculationMode] = useState<'auto' | 'manual'>('auto') // 자동 산출 / 수동 입력

  // Phase 0.4.1: 자동 산출 훅
  const { result: calculationResult, calculate: calculateSettlement, reset: resetCalculation } = useSettlementCalculation()

  // 자동 산출 입력 필드
  const sessions = Form.useWatch('sessions', form)
  const distance = Form.useWatch('distance', form)
  const fuelCost = Form.useWatch('fuelCost', form)
  const tollFee = Form.useWatch('tollFee', form)
  const isBusinessIncome = Form.useWatch('isBusinessIncome', form)
  const hasAccommodation = Form.useWatch('hasAccommodation', form) ?? false // undefined일 경우 false로 처리

  // 수동 입력 필드 (기존)
  const instructorFee = Form.useWatch('instructorFee', form)
  const transportationFee = Form.useWatch('transportationFee', form)
  
  // 숙박비는 스위치로 제어 (8만원 고정)
  const accommodationFee = hasAccommodation ? 80000 : 0

  // 총액 계산 (자동 산출 모드면 계산 결과 사용, 수동 모드면 입력값 사용)
  const totalAmount = calculationMode === 'auto' && calculationResult
    ? calculationResult.netTotal
    : (typeof instructorFee === 'number' ? instructorFee : 0) +
      (typeof transportationFee === 'number' ? transportationFee : 0) +
      accommodationFee

  // 자동 산출 실행
  useEffect(() => {
    // 모달이 열려있고 자동 산출 모드일 때만 계산
    if (!open) {
      // 모달이 닫혀있으면 계산하지 않음
      return
    }
    
    if (calculationMode === 'auto' && sessions && distance !== undefined && fuelCost !== undefined && tollFee !== undefined) {
      try {
        // Form.useWatch가 즉시 반영되지 않을 수 있으므로 form.getFieldValue로 최신 값 가져오기
        const currentHasAccommodation = form.getFieldValue('hasAccommodation') ?? false
        const currentIsBusinessIncome = form.getFieldValue('isBusinessIncome') ?? false
        
        calculateSettlement({
          sessions: Number(sessions),
          distance: Number(distance),
          fuelCost: Number(fuelCost) || 0,
          tollFee: Number(tollFee) || 0,
          accommodationRequired: Boolean(currentHasAccommodation), // form에서 직접 가져온 최신 값 사용
          isBusinessIncome: Boolean(currentIsBusinessIncome),
        })
      } catch {
        // 에러는 무시 (입력 중일 수 있음)
      }
    } else if (calculationMode === 'auto') {
      // 필수 필드가 없으면 계산 결과 초기화
      resetCalculation()
    }
  }, [open, calculationMode, sessions, distance, fuelCost, tollFee, hasAccommodation, isBusinessIncome, calculateSettlement, form, resetCalculation])

  const loadAvailableSettlements = useCallback(async () => {
    if (!user?.instructorId) return

    try {
      const data = await getAvailableSettlements(user.instructorId)
      setAvailableSettlements(data)
    } catch (error) {
      console.error('제출 가능한 정산 목록 로드 실패:', error)
      message.error('제출 가능한 정산 목록을 불러오는 중 오류가 발생했습니다.')
    }
  }, [user?.instructorId])

  useEffect(() => {
    if (open && user?.instructorId) {
      loadAvailableSettlements()
      // 모달이 열릴 때 폼 초기화
      form.resetFields()
      setSelectedProgram(null)
      setCostItemsOpen(true) // 모달 열릴 때 비용 항목 펼침
      setCalculationMode('auto') // 계산 모드 초기화
      resetCalculation() // 계산 결과 초기화
    } else if (!open) {
      // 모달이 닫힐 때 모든 상태 초기화
      form.resetFields()
      setSelectedProgram(null)
      setCostItemsOpen(true)
      setCalculationMode('auto')
      resetCalculation() // 계산 결과 초기화
      setSubmitting(false) // 제출 상태 초기화
    }
  }, [open, user?.instructorId, form, loadAvailableSettlements, resetCalculation])

  const handleProgramChange = (matchingId: string) => {
    const program = availableSettlements.find(s => s.matchingId === matchingId)
    setSelectedProgram(program || null)
    
    if (program) {
      // 기간을 DatePicker 형식으로 변환 (YYYY-MM 또는 YYYY-MM-DD 형식 처리)
      let periodDate: Dayjs
      if (program.period.includes('-') && program.period.split('-').length === 2) {
        // YYYY-MM 형식인 경우 첫 번째 날로 설정
        periodDate = dayjs(program.period + '-01')
      } else {
        // YYYY-MM-DD 형식인 경우 그대로 사용
        periodDate = dayjs(program.period)
      }
      form.setFieldsValue({
        period: periodDate.isValid() ? periodDate : dayjs(),
      })
    }
  }

  const handlePeriodChange = (date: Dayjs | null) => {
    if (date) {
      form.setFieldsValue({ period: date })
    }
  }

  const handleSubmit = async (values: any) => {
    if (!user?.instructorId || !selectedProgram) return

    setSubmitting(true)
    try {
      // SettlementItem 배열 생성
      const items: SettlementItem[] = []

      if (calculationMode === 'auto') {
        // Phase 0.4.1: 자동 산출 모드
        if (!calculationResult) {
          message.error('산출 결과가 없습니다. 입력값을 확인해주세요.')
          setSubmitting(false)
          return
        }

        // 자동 산출 결과를 items로 변환
        items.push({
          type: 'instructor_fee',
          description: `강사비 (${calculationResult.breakdown.sessions}차시${calculationResult.breakdown.isLongDistance ? ', 장거리' : ''})`,
          amount: calculationResult.instructorFee,
        })

        if (calculationResult.transportFee > 0) {
          items.push({
            type: 'transportation',
            description: '교통비',
            amount: calculationResult.transportFee,
          })
        }

        // 숙박비는 accommodationFee가 0보다 크면 추가 (hasAccommodation 스위치가 켜져있을 때)
        // calculationResult.accommodationFee는 accommodationRequired가 true일 때만 80000이 됨
        // 추가 검증: form에서 직접 값을 가져와서 확인 (Form.useWatch가 반영되지 않을 수 있음)
        const currentHasAccommodation = form.getFieldValue('hasAccommodation') ?? false
        if (calculationResult.accommodationFee > 0 || currentHasAccommodation) {
          items.push({
            type: 'accommodation',
            description: '숙박비',
            amount: calculationResult.accommodationFee > 0 ? calculationResult.accommodationFee : 80000,
          })
        }
      } else {
        // 수동 입력 모드 (기존 로직)
        const instructorFeeValue = typeof values.instructorFee === 'number' ? values.instructorFee : 0
        const transportationFeeValue = typeof values.transportationFee === 'number' ? values.transportationFee : 0
        const hasAccommodationValue = Boolean(values.hasAccommodation)

        // 강사비 필수 검증
        if (!instructorFeeValue || instructorFeeValue <= 0) {
          message.error('강사비를 입력해주세요.')
          form.setFields([{ name: 'instructorFee', errors: ['강사비를 입력해주세요.'] }])
          setSubmitting(false)
          return
        }

        // 교통비 음수 검증
        if (transportationFeeValue < 0) {
          message.error('교통비는 0원 이상이어야 합니다.')
          form.setFields([{ name: 'transportationFee', errors: ['교통비는 0원 이상이어야 합니다.'] }])
          setSubmitting(false)
          return
        }

        // 강사비 (필수)
        items.push({
          type: 'instructor_fee',
          description: '강사비',
          amount: instructorFeeValue,
        })

        // 교통비 (선택)
        if (transportationFeeValue > 0) {
          items.push({
            type: 'transportation',
            description: '교통비',
            amount: transportationFeeValue,
          })
        }

        // 숙박비 (선택, 스위치로 제어)
        if (hasAccommodationValue) {
          items.push({
            type: 'accommodation',
            description: '숙박비',
            amount: 80000,
          })
        }
      }

      // 총액 검증 (수동 입력 모드에서만)
      if (calculationMode === 'manual') {
        const calculatedTotal = items.reduce((sum, item) => sum + item.amount, 0)
        const expectedTotal = (typeof instructorFee === 'number' ? instructorFee : 0) +
          (typeof transportationFee === 'number' ? transportationFee : 0) +
          (hasAccommodation ? 80000 : 0)
        
        if (calculatedTotal !== expectedTotal) {
          console.error('총액 계산 불일치:', {
            calculatedTotal,
            expectedTotal,
            instructorFee,
            transportationFee,
            hasAccommodation,
            items,
          })
          message.error('총액 계산 중 오류가 발생했습니다. 다시 시도해주세요.')
          setSubmitting(false)
          return
        }
      }

      // 기간을 YYYY-MM-DD 형식으로 변환 (DatePicker에서 선택한 날짜)
      const periodValue = values.period
      const periodString = periodValue 
        ? (dayjs.isDayjs(periodValue) ? periodValue.format('YYYY-MM-DD') : (typeof periodValue === 'string' ? periodValue : selectedProgram.period))
        : selectedProgram.period

      // Upload의 값 형태(배열/객체)를 모두 안전하게 처리
      const rawAttachments = values.attachments
      const uploadFileList = Array.isArray(rawAttachments)
        ? rawAttachments
        : rawAttachments?.fileList || []

      const formData: SettlementSubmitFormData = {
        programId: selectedProgram.programId,
        matchingId: selectedProgram.matchingId,
        period: periodString,
        items,
        notes: values.notes,
        attachments: uploadFileList
          .map((f: any) => f.originFileObj || f)
          .filter((f: any) => !!f && typeof f.name === 'string'),
      }

      await submitSettlement(user.instructorId, formData)
      message.success('정산이 제출되었습니다.')
      // 제출 성공 후 모든 상태 초기화
      form.resetFields()
      setSelectedProgram(null)
      setCalculationMode('auto')
      resetCalculation() // 계산 결과 초기화
      setCostItemsOpen(true)
      onSuccess?.()
      onCancel()
    } catch (error: any) {
      console.error('정산 제출 실패:', error)
      message.error(error.message || '정산 제출 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    // 모든 상태 초기화
    form.resetFields()
    setSelectedProgram(null)
    setCostItemsOpen(true)
    setCalculationMode('auto')
    resetCalculation() // 계산 결과 초기화
    setSubmitting(false)
    onCancel()
  }

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title="정산 제출"
      width={800}
      footer={null}
      destroyOnHidden
      className="settlement-submit-modal"
      style={{ top: 20 }}
      bodyStyle={{ paddingBottom: 24 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          instructorFee: undefined,
          transportationFee: undefined,
          hasAccommodation: false,
          isBusinessIncome: false,
        }}
      >
        <Form.Item
          label="프로그램/강의 선택"
          name="matchingId"
          rules={[{ required: true, message: '프로그램을 선택해주세요.' }]}
        >
          <Select
            placeholder="프로그램을 선택하세요"
            onChange={handleProgramChange}
            disabled={submitting}
          >
            {availableSettlements.map(settlement => (
              <Select.Option key={settlement.matchingId} value={settlement.matchingId}>
                {settlement.programTitle} ({settlement.period})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {selectedProgram && (
          <>
            <Form.Item 
              label="기간" 
              name="period"
              rules={[{ required: true, message: '기간을 선택해주세요.' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                format="YYYY-MM-DD"
                locale={locale}
                placeholder="기간을 선택하세요"
                disabled={submitting}
                onChange={handlePeriodChange}
                allowClear={false}
              />
            </Form.Item>

            <Divider style={{ margin: '16px 0' }} />

            {/* Phase 0.4.1: 자동 산출 / 수동 입력 모드 선택 */}
            <Form.Item label="입력 방식">
              <Radio.Group
                value={calculationMode}
                onChange={(e) => {
                  setCalculationMode(e.target.value)
                  if (e.target.value === 'auto') {
                    form.setFieldsValue({
                      instructorFee: undefined,
                      transportationFee: undefined,
                    })
                  } else {
                    form.setFieldsValue({
                      sessions: undefined,
                      distance: undefined,
                      fuelCost: undefined,
                      tollFee: undefined,
                    })
                  }
                }}
              >
                <Radio value="auto">
                  <Space>
                    <CalculatorOutlined />
                    <span>자동 산출 (차시/거리 기반)</span>
                  </Space>
                </Radio>
                <Radio value="manual">수동 입력</Radio>
              </Radio.Group>
            </Form.Item>

            <Divider style={{ margin: '16px 0' }} />

            {/* Phase 0.4.1: 자동 산출 모드 */}
            {calculationMode === 'auto' && (
              <>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Form.Item
                    label="차시 수"
                    name="sessions"
                    rules={[
                      { required: true, message: '차시 수를 선택해주세요.' },
                      { type: 'number', min: 1, max: 6, message: '1~6차시만 선택 가능합니다.' },
                    ]}
                  >
                    <Select placeholder="차시 수를 선택하세요" disabled={submitting}>
                      {[1, 2, 3, 4, 5, 6].map(session => (
                        <Select.Option key={session} value={session}>
                          {session}차시
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="편도 거리 (km)"
                    name="distance"
                    rules={[
                      { required: true, message: '거리를 입력해주세요.' },
                      { type: 'number', min: 0, message: '거리는 0 이상이어야 합니다.' },
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="편도 거리를 입력하세요"
                      min={0}
                      precision={1}
                      addonAfter="km"
                      disabled={submitting}
                    />
                  </Form.Item>

                  <Form.Item
                    label="주유비 (원)"
                    name="fuelCost"
                    rules={[
                      { type: 'number', min: 0, message: '주유비는 0 이상이어야 합니다.' },
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="주유비를 입력하세요"
                      min={0}
                      precision={0}
                      formatter={(value) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                      parser={(value) => {
                        if (!value) return 0 as any
                        const parsed = value.replace(/\$\s?|(,*)/g, '')
                        return (parsed === '' ? 0 : parseFloat(parsed) || 0) as any
                      }}
                      disabled={submitting}
                    />
                  </Form.Item>

                  <Form.Item
                    label="통행료 (원)"
                    name="tollFee"
                    rules={[
                      { type: 'number', min: 0, message: '통행료는 0 이상이어야 합니다.' },
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="통행료를 입력하세요"
                      min={0}
                      precision={0}
                      formatter={(value) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                      parser={(value) => {
                        if (!value) return 0 as any
                        const parsed = value.replace(/\$\s?|(,*)/g, '')
                        return (parsed === '' ? 0 : parseFloat(parsed) || 0) as any
                      }}
                      disabled={submitting}
                    />
                  </Form.Item>

                  <Form.Item
                    label="사업소득자 여부"
                    name="isBusinessIncome"
                    valuePropName="checked"
                  >
                    <Switch 
                      disabled={submitting}
                      onChange={(checked) => {
                        form.setFieldsValue({ isBusinessIncome: checked })
                        // Switch 변경 시 즉시 재계산을 위해 form 값 업데이트 후 강제 재계산
                        if (calculationMode === 'auto' && sessions && distance !== undefined && fuelCost !== undefined && tollFee !== undefined) {
                          const currentHasAccommodation = form.getFieldValue('hasAccommodation') ?? false
                          try {
                            calculateSettlement({
                              sessions: Number(sessions),
                              distance: Number(distance),
                              fuelCost: Number(fuelCost) || 0,
                              tollFee: Number(tollFee) || 0,
                              accommodationRequired: Boolean(currentHasAccommodation),
                              isBusinessIncome: Boolean(checked), // Switch의 최신 값 사용
                            })
                          } catch {
                            // 에러는 무시
                          }
                        }
                      }}
                    />
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                      사업소득자: 3.3% / 비사업소득자: 8.8%
                    </Text>
                  </Form.Item>

                  <Form.Item
                    label="숙박비"
                    name="hasAccommodation"
                    valuePropName="checked"
                  >
                    <Switch 
                      disabled={submitting}
                      onChange={(checked) => {
                        form.setFieldsValue({ hasAccommodation: checked })
                        // Switch 변경 시 즉시 재계산을 위해 form 값 업데이트 후 강제 재계산
                        if (calculationMode === 'auto' && sessions && distance !== undefined && fuelCost !== undefined && tollFee !== undefined) {
                          const currentIsBusinessIncome = form.getFieldValue('isBusinessIncome') ?? false
                          try {
                            calculateSettlement({
                              sessions: Number(sessions),
                              distance: Number(distance),
                              fuelCost: Number(fuelCost) || 0,
                              tollFee: Number(tollFee) || 0,
                              accommodationRequired: Boolean(checked), // Switch의 최신 값 사용
                              isBusinessIncome: Boolean(currentIsBusinessIncome),
                            })
                          } catch {
                            // 에러는 무시
                          }
                        }
                      }}
                    />
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                      해당 시 80,000원 일괄 적용
                    </Text>
                  </Form.Item>
                </Space>

                {/* 산출 결과 표시 */}
                {calculationResult && (
                  <>
                    <Divider style={{ margin: '24px 0' }} />
                    <Card title="산출 내역" size="small">
                      <SettlementCalculationSummary result={calculationResult} />
                    </Card>
                  </>
                )}
              </>
            )}

            {/* 수동 입력 모드 (기존) */}
            {calculationMode === 'manual' && (
              <Collapse
                activeKey={costItemsOpen ? ['cost-items'] : []}
                onChange={(keys) => setCostItemsOpen(keys.includes('cost-items'))}
                items={[
                  {
                    key: 'cost-items',
                    label: (
                      <Typography.Title level={5} style={{ margin: 0 }}>
                        비용 항목
                      </Typography.Title>
                    ),
                    children: (
                      <div className="settlement-cost-items-card">
              <div className="settlement-cost-item">
                <Form.Item
                  label="강사비"
                  name="instructorFee"
                  rules={[
                    { required: true, message: '강사비를 입력해주세요.' },
                    { 
                      type: 'number', 
                      min: 1, 
                      message: '강사비는 1원 이상이어야 합니다.' 
                    },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="강사비를 입력하세요"
                    min={0}
                    precision={0}
                    size="large"
                    controls
                    keyboard
                    formatter={(value?: string | number) =>
                      value ? `${value}`.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
                    }
                    parser={(raw?: string) => {
                      const value = raw ?? ''
                      const parsed = value.replace(/\$\s?|(,*)/g, '')
                      return parsed === '' ? 0 : Number(parsed)
                    }}
                    disabled={submitting}
                    onKeyPress={(e) => {
                      // 숫자와 일부 특수키만 허용
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                        e.preventDefault()
                      }
                    }}
                  />
                </Form.Item>
                <div className="settlement-help-text">
                  1~6시간 기준표에 따라 입력해주세요.
                </div>
              </div>

              <div className="settlement-cost-item">
                <Form.Item
                  label="교통비"
                  name="transportationFee"
                  rules={[
                    { 
                      type: 'number', 
                      min: 0, 
                      message: '교통비는 0원 이상이어야 합니다.' 
                    },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="교통비를 입력하세요 (선택사항)"
                    min={0}
                    precision={0}
                    size="large"
                    controls
                    keyboard
                    formatter={(value?: string | number) =>
                      value ? `${value}`.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
                    }
                    parser={(raw?: string) => {
                      const value = raw ?? ''
                      const parsed = value.replace(/\$\s?|(,*)/g, '')
                      return parsed === '' ? 0 : Number(parsed)
                    }}
                    disabled={submitting}
                    onKeyPress={(e) => {
                      // 숫자와 일부 특수키만 허용
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                        e.preventDefault()
                      }
                    }}
                  />
                </Form.Item>
                <div className="settlement-help-text">
                  왕복 60km 미만인 경우 미지급됩니다. 차량 기준(주유/톨비 포함)으로 입력해주세요.
                </div>
              </div>

              <div className="settlement-cost-item">
                <Form.Item
                  label="숙박비"
                  name="hasAccommodation"
                  valuePropName="checked"
                  style={{ marginBottom: 0 }}
                >
                  <div className="settlement-switch-wrapper">
                    <Switch 
                      checked={hasAccommodation} 
                      onChange={(checked) => {
                        form.setFieldsValue({ hasAccommodation: checked })
                      }}
                      disabled={submitting} 
                    />
                    <span className={`settlement-switch-label ${hasAccommodation ? 'active' : ''}`}>
                      {hasAccommodation ? '8만원 적용' : '미적용'}
                    </span>
                  </div>
                </Form.Item>
                <div className="settlement-help-text">
                  일괄 8만원입니다.
                </div>
              </div>
                    </div>
                  ),
                },
              ]}
              style={{ marginBottom: 16 }}
            />
            )}

            <div className="settlement-total-card">
              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text className="settlement-total-label">총액</Text>
                <Text className="settlement-total-amount">
                  {totalAmount.toLocaleString()}원
                </Text>
              </Space>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <Form.Item label="비고" name="notes">
              <TextArea
                rows={4}
                placeholder="추가 사항을 입력하세요 (선택사항)"
                disabled={submitting}
              />
            </Form.Item>

            <Form.Item
              label="증빙 파일"
              name="attachments"
              valuePropName="fileList"
            >
              <Upload
                multiple
                beforeUpload={() => false}
                disabled={submitting}
              >
                <Button icon={<UploadOutlined />} size="large">파일 선택</Button>
              </Upload>
              <div className="settlement-help-text" style={{ marginTop: 8 }}>
                정산에 필요한 증빙 파일을 업로드해주세요.
              </div>
            </Form.Item>

            <div className="settlement-actions">
              <Button onClick={handleCancel} disabled={submitting} size="large">
                취소
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting} size="large">
                제출하기
              </Button>
            </div>
          </>
        )}

        {availableSettlements.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(0, 0, 0, 0.45)' }}>
            제출 가능한 정산이 없습니다.
          </div>
        )}
      </Form>
    </Modal>
  )
}

