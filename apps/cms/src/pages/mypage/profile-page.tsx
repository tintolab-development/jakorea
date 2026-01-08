/**
 * 개인정보 관리 페이지
 * Phase 2: 마이페이지 하위 구조 구현
 * 사용자 강사 권한용 개인정보 조회 및 수정 페이지
 */

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, Descriptions, Button, Space, Avatar } from 'antd'
import { UserOutlined, EditOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { ProfileEditModal } from '@/shared/ui'


export function ProfilePage() {
  const { user } = useAuthStore()
  const location = useLocation()
  const [profileEditModalOpen, setProfileEditModalOpen] = useState(false)
  
  // 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 3) || '개인정보 관리'

  if (!user) {
    return <div>로그인이 필요합니다</div>
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setProfileEditModalOpen(true)}
          >
            수정하기
          </Button>
        </div>

        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 프로필 이미지 */}
            <div style={{ textAlign: 'center' }}>
              <Avatar size={120} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
            </div>

            {/* 개인정보 조회 */}
            <Descriptions bordered column={1} style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
              <Descriptions.Item label="이름">{user?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="이메일">{user?.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="전화번호">{'-'}</Descriptions.Item>
              <Descriptions.Item label="자기소개">{'-'}</Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>
      </Space>

      <ProfileEditModal
        open={profileEditModalOpen}
        onCancel={() => setProfileEditModalOpen(false)}
        onSuccess={() => {
          // 필요시 사용자 정보 새로고침
        }}
      />
    </div>
  )
}
