/**
 * 봉사 프로그램 목록 페이지
 * Phase: 봉사단 관리 하위 뎁스 구현
 */

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Space, Card, Tabs, Table, Tag, Button, Typography, Alert } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { VolunteerRandomMatching } from '@/features/volunteer/ui/volunteer-random-matching'
import { VolunteerList } from '@/features/volunteer/ui/volunteer-list'
import { UserDetailDrawer } from '@/features/user/ui/user-detail-drawer'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import { getVolunteerPrograms } from '@/data/mock'
import { mockUsers } from '@/data/mock/users'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { Program } from '@/types/domain'
import type { User } from '@/types/user'
import { formatDate } from '@/shared/utils'
import { domainColorsHex } from '@/shared/constants/colors'
import {
  getProgramLifecycleLabel,
  getProgramLifecycleColor,
} from '@/shared/constants/status'

const { Title, Text } = Typography

export function VolunteerProgramListPage() {
  const { user: currentUser } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || (currentUser?.role === 'VOLUNTEER' ? '봉사단' : '봉사 프로그램')
  
  // 봉사 프로그램 목록 가져오기
  const volunteerPrograms = getVolunteerPrograms()

  const [selectedProgram, setSelectedProgram] = useState<Program | null>(volunteerPrograms[0] || null)
  const [detailOpen, setDetailOpen] = useState(false)

  const volunteers = useMemo(() => {
    return mockUsers
      .filter(u => u.role === 'VOLUNTEER')
      .map(u => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = u
        return userWithoutPassword
      })
  }, [])

  const [selectedUser, setSelectedUser] = useState<Omit<User, 'password'> | null>(null)
  const [userDrawerOpen, setUserDrawerOpen] = useState(false)

  const programColumns: ColumnsType<Program> = useMemo(() => [
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      ellipsis: true,
      render: (text: string, record: Program) => (
        <Tag
          color={domainColorsHex.program.primary}
          style={{
            maxWidth: 280,
            display: 'inline-block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            verticalAlign: 'middle',
            cursor: 'pointer',
          }}
          onClick={() => {
            setSelectedProgram(record)
            setDetailOpen(true)
          }}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: '형태',
      dataIndex: 'format',
      key: 'format',
      width: 120,
      render: (format: string) => {
        const formatLabels: Record<string, string> = {
          workshop: '워크샵',
          seminar: '세미나',
          course: '과정',
          lecture: '강의',
          other: '기타',
        }
        return <Tag>{formatLabels[format] || format}</Tag>
      },
    },
    {
      title: '시작일',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date: string) => formatDate(new Date(date)),
    },
    {
      title: '종료일',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (date: string) => formatDate(new Date(date)),
    },
    {
      title: '상태',
      dataIndex: 'lifecycleStatus',
      key: 'lifecycleStatus',
      width: 120,
      render: (_status: Program['lifecycleStatus'], record: Program) => {
        const lifecycle = record.lifecycleStatus
        const label = lifecycle
          ? getProgramLifecycleLabel(lifecycle)
          : '-'
        const color = lifecycle
          ? getProgramLifecycleColor(lifecycle)
          : 'default'
        return <Tag color={color}>{label}</Tag>
      },
    },
  ], [])

  const isVolunteer = currentUser?.role === 'VOLUNTEER'
  const isAdmin = currentUser?.role === 'ADMIN'

  // 역할별 기본 탭
  // - VOLUNTEER: 봉사단 목록(봉사자 전용 탭 존재)
  // - ADMIN/그 외: 프로그램 목록
  const defaultTabKey = isVolunteer ? 'volunteers' : 'list'

  const tabParam = searchParams.get('tab')
  const activeTabKey = tabParam || defaultTabKey

  const handleTabChange = (key: string) => {
    const newParams = new URLSearchParams(searchParams)
    // 탭 상태를 항상 URL에 유지 (관리자 화면에서 탭 지정 안정화)
    newParams.set('tab', key)
    setSearchParams(newParams, { replace: true })
  }

  const handleUserView = useCallback((user: Omit<User, 'password'>) => {
    setSelectedUser(user)
    setUserDrawerOpen(true)
  }, [])

  // 탭 항목 구성
  const tabItems = useMemo(() => [
    // 봉사자(VOLUNTEER): 봉사단 목록 탭 (기본)
    ...(isVolunteer ? [
      {
        key: 'volunteers',
        label: '봉사단 목록',
        children: (
          <Card>
            <VolunteerList
              data={volunteers}
              loading={false}
              onView={handleUserView}
            />
          </Card>
        ),
      },
      {
        key: 'apply',
        label: '봉사단 신청',
        children: (
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4} style={{ marginTop: 0, marginBottom: 8 }}>봉사단 활동 신청</Title>
                <Text type="secondary">
                  봉사단은 <Text strong>금요일</Text>에 활동하며, 학교 매칭 후 <Text strong>2인 1조</Text>로 순환 배치됩니다.
                </Text>
              </div>

              <Alert
                type="info"
                showIcon
                message="신청 플로우"
                description={
                  <div>
                    봉사 신청 → 확인/승인 → 봉사 프로그램 배치
                  </div>
                }
              />

              <Space wrap>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate('/interviews/apply?role=VOLUNTEER&fixedRole=1')}
                >
                  봉사 신청하기
                </Button>
                <Button
                  size="large"
                  onClick={() => navigate('/interviews/my')}
                >
                  내 신청/승인 현황 보기
                </Button>
              </Space>
            </Space>
          </Card>
        ),
      },
    ] : []),

    // 프로그램 목록 탭
    {
      key: 'list',
      label: '프로그램 목록',
      children: (
        <Card>
          <Table
            columns={programColumns}
            dataSource={volunteerPrograms}
            rowKey="id"
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `총 ${total}개`,
            }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedProgram(record)
                setDetailOpen(true)
              },
              style: { cursor: 'pointer' },
            })}
          />
        </Card>
      ),
    },
    // 관리자만 랜덤 배치 탭 표시
    ...(isAdmin ? [
      {
        key: 'matching',
        label: '봉사자 랜덤 배치',
        children: (
          <VolunteerRandomMatching
            programId={selectedProgram?.id || volunteerPrograms[0]?.id || 'program-1'}
            scheduleId="schedule-1"
            onMatchComplete={(pairs: any) => {
              console.log('매칭 완료:', pairs)
            }}
          />
        ),
      },
    ] : []),
  ], [
    isVolunteer,
    isAdmin,
    volunteers,
    programColumns,
    volunteerPrograms,
    selectedProgram?.id,
    navigate,
    handleUserView,
  ])

  // tab 쿼리파라미터가 없거나, 현재 역할에서 유효하지 않은 값이면 기본 탭으로 강제 세팅
  useEffect(() => {
    const validKeys = new Set(tabItems.map(t => t.key))
    const current = searchParams.get('tab')
    const next = current && validKeys.has(current) ? current : defaultTabKey

    // 이미 올바른 값이면 아무 것도 하지 않음
    if (current === next) return

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', next)
    setSearchParams(nextParams, { replace: true })
  }, [defaultTabKey, searchParams, setSearchParams, tabItems])

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
      </Space>

      <Tabs
        activeKey={activeTabKey}
        onChange={handleTabChange}
        items={tabItems}
      />

      <ProgramDetailDrawer
        open={detailOpen}
        program={selectedProgram}
        onClose={() => setDetailOpen(false)}
        onEdit={() => {
          if (selectedProgram) {
            navigate(`/programs/${selectedProgram.id}/edit`)
          }
        }}
        onDelete={() => {
          // 봉사 프로그램 화면에서는 삭제 액션을 숨기므로 noop 처리
        }}
        loading={false}
        hideActions
      />

      <UserDetailDrawer
        open={userDrawerOpen}
        user={selectedUser}
        onClose={() => {
          setUserDrawerOpen(false)
          setSelectedUser(null)
        }}
      />
    </div>
  )
}
