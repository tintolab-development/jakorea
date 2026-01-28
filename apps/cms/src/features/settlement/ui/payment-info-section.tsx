/**
 * 지급정보 섹션 컴포넌트
 * V3 Phase 4: 개인정보 동의 확인 UI 및 지급정보 재사용 기능
 */

import { Descriptions, Tag, Alert, Space, Button, Checkbox, Typography } from 'antd'
import { ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import type { InstructorPaymentInfo } from '@/entities/settlement/model/payment-info'
import { getPaymentInfo, savePaymentInfo, initializePaymentInfoFromInstructor } from '@/entities/settlement/api/payment-info-service'
import { maskBankAccount, maskResidentRegistrationNumber, maskPhone } from '@/entities/settlement/model/payment-info'
import type { Instructor } from '@/types/domain'

const { Text } = Typography

interface PaymentInfoSectionProps {
  instructor: Instructor
  onPaymentInfoChange?: (info: Partial<InstructorPaymentInfo>) => void
  readOnly?: boolean
}

export function PaymentInfoSection({
  instructor,
  onPaymentInfoChange,
  readOnly = false,
}: PaymentInfoSectionProps) {
  const [paymentInfo, setPaymentInfo] = useState<InstructorPaymentInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [personalInfoConsent, setPersonalInfoConsent] = useState(false)

  useEffect(() => {
    loadPaymentInfo()
  }, [instructor.id])

  const loadPaymentInfo = async () => {
    setLoading(true)
    try {
      const info = await getPaymentInfo(instructor.id)
      if (info) {
        setPaymentInfo(info)
        setPersonalInfoConsent(info.personalInfoConsent)
        onPaymentInfoChange?.(info)
      } else {
        // 기존 정보가 없으면 강사 기본 정보로 초기화
        const initialInfo = await initializePaymentInfoFromInstructor(instructor.id)
        setPersonalInfoConsent(false)
        onPaymentInfoChange?.(initialInfo)
      }
    } catch (error) {
      console.error('Failed to load payment info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReusePaymentInfo = async () => {
    if (!paymentInfo) return
    
    setLoading(true)
    try {
      const updated = await savePaymentInfo(instructor.id, {
        name: paymentInfo.name,
        phone: paymentInfo.phone,
        bankAccount: paymentInfo.bankAccount,
        residentRegistrationNumber: paymentInfo.residentRegistrationNumber,
        personalInfoConsent,
        consentDate: paymentInfo.consentDate,
      })
      setPaymentInfo(updated)
      onPaymentInfoChange?.(updated)
    } catch (error) {
      console.error('Failed to reuse payment info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConsentChange = (checked: boolean) => {
    setPersonalInfoConsent(checked)
    if (paymentInfo) {
      const updated = { ...paymentInfo, personalInfoConsent: checked }
      setPaymentInfo(updated)
      onPaymentInfoChange?.(updated)
    }
  }

  const displayInfo = paymentInfo || {
    name: instructor.name,
    phone: instructor.contactPhone || '-',
    bankAccount: instructor.bankAccount || '-',
    residentRegistrationNumber: undefined,
    personalInfoConsent: false,
  }

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {paymentInfo && (
          <Alert
            message="저장된 지급정보가 있습니다"
            description={
              <Space>
                <Text type="secondary">
                  마지막 사용일: {paymentInfo.lastUsedAt ? new Date(paymentInfo.lastUsedAt).toLocaleDateString('ko-KR') : '-'}
                </Text>
                {!readOnly && (
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={handleReusePaymentInfo}
                    loading={loading}
                  >
                    재사용
                  </Button>
                )}
              </Space>
            }
            type="info"
            showIcon
          />
        )}

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="이름">
            <Text strong>{displayInfo.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="전화번호">
            {readOnly ? maskPhone(displayInfo.phone) : displayInfo.phone}
          </Descriptions.Item>
          <Descriptions.Item label="계좌번호">
            {readOnly ? maskBankAccount(displayInfo.bankAccount) : displayInfo.bankAccount}
          </Descriptions.Item>
          {displayInfo.residentRegistrationNumber && (
            <Descriptions.Item label="주민등록번호">
              {readOnly ? maskResidentRegistrationNumber(displayInfo.residentRegistrationNumber) : displayInfo.residentRegistrationNumber}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="개인정보 동의">
            <Tag color={displayInfo.personalInfoConsent ? 'green' : 'default'}>
              {displayInfo.personalInfoConsent ? '동의함' : '동의 안함'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {!readOnly && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Checkbox
              checked={personalInfoConsent}
              onChange={e => handleConsentChange(e.target.checked)}
            >
              개인정보 수집 및 이용에 동의합니다
            </Checkbox>
            {personalInfoConsent && (
              <Alert
                message={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <Text>개인정보 동의 완료</Text>
                  </Space>
                }
                type="success"
                showIcon={false}
                style={{ marginTop: 8 }}
              />
            )}
          </Space>
        )}
      </Space>
    </div>
  )
}
