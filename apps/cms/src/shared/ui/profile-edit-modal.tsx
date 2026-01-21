/**
 * 개인정보 수정 모달 컴포넌트
 */

import { Modal, Form, Input, Button, message, Divider, Typography, Row, Col, Space } from 'antd'
import { SaveOutlined, HomeOutlined, BankOutlined, InfoCircleOutlined, ReadOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'

const { Text } = Typography

interface ProfileFormData {
  name: string
  email: string
  phone?: string
  bio?: string
  zipCode?: string
  address?: string
  detailAddress?: string
  schoolName?: string
  grade?: string
  bankName?: string
  accountHolder?: string
  accountNumber?: string
}

interface ProfileEditModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

export function ProfileEditModal({ open, onCancel, onSuccess }: ProfileEditModalProps) {
  const { user, updateUser } = useAuthStore()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        bio: user.bio || '',
        zipCode: user.zipCode || '',
        address: user.address || '',
        detailAddress: user.detailAddress || '',
        schoolName: user.schoolName || '',
        grade: user.grade || '',
        bankName: user.bankInfo?.bankName || '',
        accountHolder: user.bankInfo?.accountHolder || '',
        accountNumber: user.bankInfo?.accountNumber || '',
      })
    }
  }, [open, user, form])

  const handleSubmit = async (values: ProfileFormData) => {
    setSaving(true)
    try {
      // API 연동 전 Mock 업데이트
      updateUser({
        name: values.name,
        phone: values.phone,
        bio: values.bio,
        zipCode: values.zipCode,
        address: values.address,
        detailAddress: values.detailAddress,
        schoolName: values.schoolName,
        grade: values.grade,
        bankInfo: {
          bankName: values.bankName || '',
          accountHolder: values.accountHolder || '',
          accountNumber: values.accountNumber || '',
        }
      })
      
      message.success('개인정보가 수정되었습니다')
      onSuccess?.()
      onCancel()
    } catch (e) {
      console.error('Failed to update profile:', e)
      message.error('개인정보 수정 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  if (!user) {
    return null
  }

  return (
    <Modal
      open={open}
      title="개인정보 수정"
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 8 }}
      >
        {/* 기본 정보 */}
        <Divider orientation="left" style={{ margin: '32px 0 16px' }}>
          <Space><InfoCircleOutlined /> 기본 정보</Space>
        </Divider>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="이름"
              name="name"
              rules={[{ required: true, message: '이름을 입력해주세요' }]}
            >
              <Input placeholder="이름을 입력하세요" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="전화번호" name="phone">
              <Input placeholder="전화번호를 입력하세요" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="이메일"
          name="email"
          rules={[
            { required: true, message: '이메일을 입력해주세요' },
            { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
          ]}
        >
          <Input placeholder="이메일을 입력하세요" disabled />
        </Form.Item>

        <Form.Item label="자기소개" name="bio">
          <Input.TextArea rows={2} placeholder="자기소개를 입력하세요" />
        </Form.Item>

        {/* 학교 정보 (봉사자만 표시) */}
        {user?.role === 'VOLUNTEER' && (
          <>
            <Divider orientation="left" style={{ margin: '32px 0 16px' }}>
              <Space><ReadOutlined /> 학교 정보</Space>
            </Divider>

            <Row gutter={16}>
              <Col span={14}>
                <Form.Item label="학교명" name="schoolName">
                  <Input placeholder="재학 중인 학교명을 입력하세요" />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item label="학년" name="grade">
                  <Input placeholder="학년 (예: 3학년)" />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* 주소지 정보 */}
        <Divider orientation="left" style={{ margin: '32px 0 16px' }}>
          <Space><HomeOutlined /> 주소지 정보</Space>
        </Divider>

        <Row gutter={8}>
          <Col span={8}>
            <Form.Item label="우편번호" name="zipCode">
              <Input placeholder="우편번호" />
            </Form.Item>
          </Col>
          <Col span={16} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 24 }}>
            <Button>주소 검색</Button>
          </Col>
        </Row>
        
        <Form.Item label="주소" name="address">
          <Input placeholder="기본 주소를 입력하세요" />
        </Form.Item>
        
        <Form.Item label="상세주소" name="detailAddress">
          <Input placeholder="상세 주소를 입력하세요" />
        </Form.Item>

        {/* 정산 정보 (강사만 표시) */}
        {user?.role === 'INSTRUCTOR' && (
          <>
            <Divider orientation="left" style={{ margin: '32px 0 16px' }}>
              <Space><BankOutlined /> 정산 및 계좌 정보</Space>
            </Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="은행명" name="bankName">
                  <Input placeholder="은행명을 입력하세요" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="예금주" name="accountHolder">
                  <Input placeholder="예금주 성명을 입력하세요" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="계좌번호" name="accountNumber">
              <Input placeholder="계좌번호를 '-' 없이 입력하세요" />
            </Form.Item>
            
            <div style={{ background: '#fff7e6', padding: '8px 12px', borderRadius: 4, marginBottom: 24 }}>
              <Text style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.85)' }}>
                * 본인 명의의 계좌가 아닌 경우 정산이 제한될 수 있습니다.
              </Text>
            </div>
          </>
        )}

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={handleCancel}>취소</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
              저장
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}
