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
} from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  submitSettlement,
  getAvailableSettlements,
  type SettlementSubmitFormData,
} from '@/entities/settlement/api/instructor-settlement-submit-service'
import type { SettlementItem } from '@/types/domain'
import dayjs, { type Dayjs } from 'dayjs'
import locale from 'antd/es/date-picker/locale/ko_KR'
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

  // 강사비, 교통비, 숙박비 필드 값
  const instructorFee = Form.useWatch('instructorFee', form)
  const transportationFee = Form.useWatch('transportationFee', form)
  const hasAccommodation = Form.useWatch('hasAccommodation', form)
  
  // 숙박비는 스위치로 제어 (8만원 고정)
  const accommodationFee = hasAccommodation ? 80000 : 0

  // 총액 계산 (null/undefined 안전 처리)
  const totalAmount = 
    (typeof instructorFee === 'number' ? instructorFee : 0) +
    (typeof transportationFee === 'number' ? transportationFee : 0) +
    accommodationFee

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
    }
  }, [open, user?.instructorId, form, loadAvailableSettlements])

  const handleProgramChange = (matchingId: string) => {
    const program = availableSettlements.find(s => s.matchingId === matchingId)
    setSelectedProgram(program || null)
    
    if (program) {
      // 기간을 DatePicker 형식으로 변환 (YYYY-MM 형식에서 첫 번째 날로 설정)
      const periodDate = dayjs(program.period + '-01')
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
      // 입력값 검증
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

      // SettlementItem 배열 생성
      const items: SettlementItem[] = []
      
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

      // 총액 검증 (디버깅용)
      const calculatedTotal = items.reduce((sum, item) => sum + item.amount, 0)
      const expectedTotal = instructorFeeValue + transportationFeeValue + (hasAccommodationValue ? 80000 : 0)
      
      if (calculatedTotal !== expectedTotal) {
        console.error('총액 계산 불일치:', {
          calculatedTotal,
          expectedTotal,
          instructorFeeValue,
          transportationFeeValue,
          hasAccommodationValue,
          items,
        })
        message.error('총액 계산 중 오류가 발생했습니다. 다시 시도해주세요.')
        setSubmitting(false)
        return
      }

      // 기간을 YYYY-MM 형식으로 변환 (DatePicker에서 선택한 날짜의 월 기준)
      const periodValue = values.period
      const periodString = periodValue 
        ? (dayjs.isDayjs(periodValue) ? periodValue.format('YYYY-MM') : (typeof periodValue === 'string' ? periodValue.substring(0, 7) : selectedProgram.period))
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
      form.resetFields()
      setSelectedProgram(null)
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
    form.resetFields()
    setSelectedProgram(null)
    setCostItemsOpen(true)
    onCancel()
  }

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title="정산 제출"
      width={800}
      footer={null}
      destroyOnClose
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

