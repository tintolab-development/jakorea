/**
 * 개인정보 관리 페이지
 * Phase 2: 마이페이지 하위 구조 구현
 * 사용자 강사 권한용 개인정보 조회 및 수정 페이지
 */

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, Descriptions, Button, Space, Typography, Divider, Tag } from 'antd'
import { EditOutlined, HomeOutlined, BankOutlined, InfoCircleOutlined, ReadOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { ProfileEditModal } from '@/shared/ui'

const { Title, Text } = Typography

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
            {/* 상단 프로필 요약 */}
            <div style={{ padding: '0 24px' }}>
              <Space align="center" size="middle">
                <Title level={3} style={{ margin: 0 }}>{user?.name}</Title>
                <Tag color="blue">
                  {user?.role === 'INSTRUCTOR'
                    ? '강사'
                    : user?.role === 'INDIVIDUAL'
                      ? '개인(참여자)'
                      : user?.role === 'SCHOOL'
                        ? '학교'
                        : '관리자'}
                </Tag>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">{user?.email}</Text>
              </div>
              {user?.bio && (
                <div style={{ marginTop: 12 }}>
                  <Text italic>"{user.bio}"</Text>
                </div>
              )}
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* 상세 정보 섹션 */}
            <div style={{ padding: '0 24px' }}>
              <Space direction="vertical" size={32} style={{ width: '100%' }}>
                
                {/* 기본 정보 */}
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    <Title level={5} style={{ margin: 0 }}>기본 정보</Title>
                  </div>
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="이름">{user?.name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="이메일">{user?.email || '-'}</Descriptions.Item>
                    <Descriptions.Item label="전화번호">{user?.phone || '-'}</Descriptions.Item>
                  </Descriptions>
                </section>

                {/* 학교 정보 (학교 역할인 경우 표시) */}
                {/* Phase 0.1.1: SCHOOL 추가 */}
                {user?.role === 'SCHOOL' && user?.schoolInfo && (
                  <section style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <ReadOutlined style={{ color: '#1890ff' }} />
                      <Title level={5} style={{ margin: 0 }}>학교 정보</Title>
                    </div>
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="학교명">{user.schoolInfo.schoolName || '-'}</Descriptions.Item>
                      <Descriptions.Item label="주소">{user.schoolInfo.address || '-'}</Descriptions.Item>
                      <Descriptions.Item label="직책">{user.schoolInfo.position || '-'}</Descriptions.Item>
                    </Descriptions>
                  </section>
                )}

                {/* 주소지 정보 */}
                <section style={{ marginTop: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <HomeOutlined style={{ color: '#1890ff' }} />
                    <Title level={5} style={{ margin: 0 }}>주소지 정보</Title>
                  </div>
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="우편번호">{user?.zipCode || '-'}</Descriptions.Item>
                    <Descriptions.Item label="상세주소">{user?.detailAddress || '-'}</Descriptions.Item>
                  </Descriptions>
                </section>

                {/* 정산 정보 (강사만 표시) */}
                {user?.role === 'INSTRUCTOR' && (
                  <section style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <BankOutlined style={{ color: '#1890ff' }} />
                      <Title level={5} style={{ margin: 0 }}>정산 및 계좌 정보</Title>
                    </div>
                    <Card size="small" style={{ background: '#f0f5ff', border: '1px dashed #adc6ff' }}>
                      <Descriptions column={1} size="small" colon={false}>
                        <Descriptions.Item label={<Text strong>은행명</Text>}>{user?.instructorInfo?.bankName || '-'}</Descriptions.Item>
                        <Descriptions.Item label={<Text strong>예금주</Text>}>{user?.instructorInfo?.accountHolder || '-'}</Descriptions.Item>
                        <Descriptions.Item label={<Text strong>계좌번호</Text>}>
                          {user?.instructorInfo?.accountNumber ? (
                            <Text copyable={{ text: user.instructorInfo.accountNumber }}>
                              {user.instructorInfo.accountNumber.replace(/(\d{3})(\d{3,})(\d{4})/, '$1-****-$3')}
                            </Text>
                          ) : '-'}
                        </Descriptions.Item>
                      </Descriptions>
                      <div style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
                          * 정산 정보는 본인 확인 후 지급을 위해 정확히 입력해 주세요.
                        </Text>
                      </div>
                    </Card>
                  </section>
                )}

              </Space>
            </div>
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
