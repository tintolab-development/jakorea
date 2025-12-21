/**
 * 정산 산출 로직 설정 페이지
 * V3 Phase 4: 정산 산출 로직 설정
 */

import { useState, useEffect } from 'react'
import { Card, Space, Form, InputNumber, Switch, Radio, Button, message, Typography, Alert } from 'antd'
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import type { SettlementCalculationRule } from '@/types/settlement-calculation'

const { Title, Paragraph } = Typography

// Mock 데이터 (실제로는 API에서 가져와야 함)
const defaultRule: Partial<SettlementCalculationRule> = {
  name: '기본 정산 규칙',
  description: '전역 정산 산출 규칙',
  instructorFee: {
    defaultAmount: 200000,
  },
  transportation: {
    type: 'distance',
    distanceThreshold: 60,
    ratePerKm: 100,
    enabled: true,
  },
  accommodation: {
    type: 'fixed',
    fixedAmount: 80000,
    enabled: true,
  },
  enabled: true,
}

export function SettlementCalculationSettingsPage() {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Mock: 실제로는 API에서 가져와야 함
    form.setFieldsValue(defaultRule)
  }, [form])

  const handleSave = async () => {
    try {
      await form.validateFields()
      setSaving(true)

      // TODO: 실제 API 호출
      // const values = form.getFieldsValue()
      // await settlementCalculationService.updateRule(values)

      // Mock: 저장 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500))

      message.success('정산 산출 규칙이 저장되었습니다')
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return
      }
      console.error('Failed to save calculation rule:', error)
      message.error('저장 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    form.setFieldsValue(defaultRule)
    message.info('기본값으로 초기화되었습니다')
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 헤더 */}
        <div>
          <Title level={2} style={{ margin: 0 }}>
            정산 산출 로직 설정
          </Title>
          <Paragraph type="secondary" style={{ marginTop: 8 }}>
            정산 금액 자동 계산을 위한 규칙을 설정합니다. 실제 계산 로직은 담당자 확인 후 적용됩니다.
          </Paragraph>
        </div>

        {/* 안내 메시지 */}
        <Alert
          message="주의사항"
          description="이 설정은 정산 금액 자동 계산에 사용됩니다. 변경 시 기존 정산에 영향을 줄 수 있으니 신중하게 설정해주세요."
          type="warning"
          showIcon
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          {/* 기본 강사료 설정 */}
          <Card title="기본 강사료 설정" style={{ marginBottom: 16 }}>
            <Form.Item
              name={['instructorFee', 'defaultAmount']}
              label="기본 강사료"
              tooltip="프로그램별로 지정되지 않은 경우 사용되는 기본 강사료"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                suffix="원"
              />
            </Form.Item>
          </Card>

          {/* 교통비 계산 규칙 */}
          <Card title="교통비 계산 규칙" style={{ marginBottom: 16 }}>
            <Form.Item
              name={['transportation', 'enabled']}
              valuePropName="checked"
            >
              <Switch checkedChildren="활성화" unCheckedChildren="비활성화" />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.transportation?.enabled !== currentValues.transportation?.enabled
              }
            >
              {({ getFieldValue }) =>
                getFieldValue(['transportation', 'enabled']) ? (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Form.Item
                      name={['transportation', 'type']}
                      label="계산 방식"
                    >
                      <Radio.Group>
                        <Radio value="distance">거리 기준 (1419 사업)</Radio>
                        <Radio value="fixed">고정 금액</Radio>
                        <Radio value="none">지급 안함</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.transportation?.type !== currentValues.transportation?.type
                      }
                    >
                      {({ getFieldValue }) => {
                        const type = getFieldValue(['transportation', 'type'])
                        return (
                          <>
                            {type === 'distance' && (
                              <>
                                <Form.Item
                                  name={['transportation', 'distanceThreshold']}
                                  label="거리 기준 (km)"
                                  tooltip="이 거리를 초과하는 경우 교통비 지급 (기본: 60km)"
                                  rules={[{ required: true, message: '거리 기준을 입력해주세요' }]}
                                >
                                  <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    suffix="km"
                                  />
                                </Form.Item>
                                <Form.Item
                                  name={['transportation', 'ratePerKm']}
                                  label="km당 금액"
                                  tooltip="거리당 지급되는 금액"
                                  rules={[{ required: true, message: 'km당 금액을 입력해주세요' }]}
                                >
                                  <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    suffix="원/km"
                                  />
                                </Form.Item>
                                <Alert
                                  message="1419 사업 특수성"
                                  description="거주지 기준 60km 초과 시 거리 기준으로 교통비를 지급합니다."
                                  type="info"
                                  showIcon
                                  style={{ marginTop: 16 }}
                                />
                              </>
                            )}
                            {type === 'fixed' && (
                              <Form.Item
                                name={['transportation', 'fixedAmount']}
                                label="고정 교통비"
                                rules={[{ required: true, message: '고정 교통비를 입력해주세요' }]}
                              >
                                <InputNumber
                                  style={{ width: '100%' }}
                                  min={0}
                                  suffix="원"
                                />
                              </Form.Item>
                            )}
                          </>
                        )
                      }}
                    </Form.Item>
                  </Space>
                ) : null
              }
            </Form.Item>
          </Card>

          {/* 숙박비 계산 규칙 */}
          <Card title="숙박비 계산 규칙" style={{ marginBottom: 16 }}>
            <Form.Item
              name={['accommodation', 'enabled']}
              valuePropName="checked"
            >
              <Switch checkedChildren="활성화" unCheckedChildren="비활성화" />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.accommodation?.enabled !== currentValues.accommodation?.enabled
              }
            >
              {({ getFieldValue }) =>
                getFieldValue(['accommodation', 'enabled']) ? (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Form.Item
                      name={['accommodation', 'type']}
                      label="계산 방식"
                    >
                      <Radio.Group>
                        <Radio value="actual">실비 (타지역 이동 시)</Radio>
                        <Radio value="fixed">고정 금액</Radio>
                        <Radio value="none">지급 안함</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.accommodation?.type !== currentValues.accommodation?.type
                      }
                    >
                      {({ getFieldValue }) => {
                        const type = getFieldValue(['accommodation', 'type'])
                        return (
                          <>
                            {type === 'fixed' && (
                              <Form.Item
                                name={['accommodation', 'fixedAmount']}
                                label="고정 숙박비"
                                tooltip="기본값: 80,000원"
                                rules={[{ required: true, message: '고정 숙박비를 입력해주세요' }]}
                              >
                                <InputNumber
                                  style={{ width: '100%' }}
                                  min={0}
                                  suffix="원"
                                />
                              </Form.Item>
                            )}
                            {type === 'actual' && (
                              <Form.Item
                                name={['accommodation', 'maxAmount']}
                                label="최대 금액 (선택사항)"
                                tooltip="실비 지급 시 최대 지급 금액 제한"
                              >
                                <InputNumber
                                  style={{ width: '100%' }}
                                  min={0}
                                  suffix="원"
                                />
                              </Form.Item>
                            )}
                            <Alert
                              message="1419 사업 특수성"
                              description="타지역 이동 시 숙박비를 실비로 지급합니다. 고정 금액 선택 시 기본 80,000원이 적용됩니다."
                              type="info"
                              showIcon
                              style={{ marginTop: 16 }}
                            />
                          </>
                        )
                      }}
                    </Form.Item>
                  </Space>
                ) : null
              }
            </Form.Item>
          </Card>

          {/* 규칙 활성화 */}
          <Card title="규칙 설정">
            <Form.Item
              name="enabled"
              valuePropName="checked"
              label="규칙 활성화"
            >
              <Switch checkedChildren="활성화" unCheckedChildren="비활성화" />
            </Form.Item>
          </Card>

          {/* 저장 버튼 */}
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              초기화
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
              저장
            </Button>
          </Space>
        </Form>
      </Space>
    </div>
  )
}

