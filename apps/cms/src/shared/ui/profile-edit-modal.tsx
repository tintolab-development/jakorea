/**
 * 개인정보 수정 모달 컴포넌트
 */

import { Modal, Form, Input, Button, Upload, Avatar, message } from 'antd'
import { UserOutlined, UploadOutlined, SaveOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'

interface ProfileFormData {
  name: string
  email: string
  phone?: string
  bio?: string
}

interface ProfileEditModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

export function ProfileEditModal({ open, onCancel, onSuccess }: ProfileEditModalProps) {
  const { user } = useAuthStore()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: '', // TODO: 사용자 프로필 phone 필드 추가 필요
        bio: '', // TODO: 사용자 프로필 bio 필드 추가 필요
      })
    }
  }, [open, user, form])

  const handleSubmit = async (_values: ProfileFormData) => {
    setSaving(true)
    try {
      // TODO: API 연동 필요
      // await updateUserProfile(values)
      message.success('개인정보가 수정되었습니다')
      onSuccess?.()
      onCancel()
    } catch (error) {
      message.error('개인정보 수정 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (info: any) => {
    // TODO: 프로필 이미지 업로드 구현
    if (info.file.status === 'done') {
      message.success('프로필 이미지가 업로드되었습니다')
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
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 24 }}
      >
        {/* 프로필 이미지 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar size={100} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
          <div>
            <Upload
              name="avatar"
              showUploadList={false}
              onChange={handleAvatarChange}
              beforeUpload={() => false} // TODO: 실제 업로드 로직 구현
            >
              <Button icon={<UploadOutlined />} size="small">
                프로필 이미지 변경
              </Button>
            </Upload>
          </div>
        </div>

        <Form.Item
          label="이름"
          name="name"
          rules={[{ required: true, message: '이름을 입력해주세요' }]}
        >
          <Input placeholder="이름을 입력하세요" />
        </Form.Item>

        <Form.Item
          label="이메일"
          name="email"
          rules={[
            { required: true, message: '이메일을 입력해주세요' },
            { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
          ]}
        >
          <Input placeholder="이메일을 입력하세요" />
        </Form.Item>

        <Form.Item label="전화번호" name="phone">
          <Input placeholder="전화번호를 입력하세요" />
        </Form.Item>

        <Form.Item label="자기소개" name="bio">
          <Input.TextArea rows={4} placeholder="자기소개를 입력하세요" />
        </Form.Item>

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
