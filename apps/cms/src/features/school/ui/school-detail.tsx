/**
 * 학교 상세 컴포넌트
 * Phase 1.4: 상세 정보 표시
 * 회원 관리: 해당 학교에 소속된 교사 회원 리스트 추가
 */

import { useEffect, useState, useMemo } from 'react'
import { Card, Descriptions, Tag, Space, Button, Table, Tabs } from 'antd'
import type { School } from '@/types/domain'
import type { User } from '@/types/user'
import { domainColorsHex } from '@/shared/constants/colors'
import { useUserStore } from '@/features/user/model/user-store'
import { mockApplications } from '@/data/mock'
import { mockProgramsMap } from '@/data/mock'
import { RoleBadge } from '@/shared/ui'
import { formatDate } from '@/shared/utils'
import type { ColumnsType } from 'antd/es/table'

interface SchoolDetailProps {
  school: School
  onEdit: () => void
  onDelete: () => void
  loading?: boolean
}

export function SchoolDetail({ school, onEdit, onDelete, loading }: SchoolDetailProps) {
  // 스토어에서 정규화된 데이터 구독
  const usersById = useUserStore(state => state.usersById)
  const userIds = useUserStore(state => state.userIds)
  const fetchUsers = useUserStore(state => state.fetchUsers)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // 해당 학교에 소속된 교사 회원(학생) 목록
  const schoolTeachers = useMemo(() => {
    // Program의 schoolId가 해당 학교 ID인 경우, 그 프로그램에 신청한 학생들
    const schoolProgramIds = Array.from(mockProgramsMap.values())
      .filter(program => program.schoolId === school.id)
      .map(program => program.id)

    // 해당 학교의 프로그램에 신청한 Application들
    const programApplications = mockApplications.filter(app =>
      schoolProgramIds.includes(app.programId)
    )

    // Application에서 subjectType이 'student'인 경우 subjectId가 학생(교사 회원) ID
    // 또는 subjectType이 'school'이고 subjectId가 해당 학교 ID인 경우도 포함
    const studentIds = new Set<string>()

    programApplications.forEach(app => {
      if (app.subjectType === 'student') {
        // subjectId가 학생 ID
        studentIds.add(app.subjectId)
      } else if (app.subjectType === 'school' && app.subjectId === school.id) {
        // 학교 신청의 경우, 해당 학교에 소속된 모든 학생을 찾기 어려우므로
        // 일단은 제외하고 student 타입만 처리
      }
    })

    // User에서 role이 'INDIVIDUAL'이고 해당 ID를 가진 사용자들
    const teachers = userIds
      .map(id => usersById[id])
      .filter(user => user && user.role === 'INDIVIDUAL' && studentIds.has(user.id))

    return teachers
  }, [school.id, usersById, userIds])

  const teacherColumns: ColumnsType<Omit<User, 'password'>> = [
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '권한',
      dataIndex: 'role',
      key: 'role',
      render: role => <RoleBadge role={role} size="small" variant="tag" />,
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>{isActive ? '활성' : '비활성'}</Tag>
      ),
    },
    {
      title: '마지막 로그인',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string | undefined) => (date ? formatDate(new Date(date)) : '-'),
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(new Date(date)),
    },
  ]

  const tabItems = [
    {
      key: 'info',
      label: '기본 정보',
      children: (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="지역">{school.region}</Descriptions.Item>
          {school.address && <Descriptions.Item label="주소">{school.address}</Descriptions.Item>}
          <Descriptions.Item label="담당자">{school.contactPerson}</Descriptions.Item>
          {school.contactPhone && (
            <Descriptions.Item label="연락처">{school.contactPhone}</Descriptions.Item>
          )}
          {school.contactEmail && (
            <Descriptions.Item label="이메일">{school.contactEmail}</Descriptions.Item>
          )}
          <Descriptions.Item label="등록일">
            {new Date(school.createdAt).toLocaleDateString('ko-KR')}
          </Descriptions.Item>
          <Descriptions.Item label="수정일">
            {new Date(school.updatedAt).toLocaleDateString('ko-KR')}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'teachers',
      label: `교사 회원 (${schoolTeachers.length})`,
      children: (
        <Table
          dataSource={schoolTeachers}
          columns={teacherColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ]

  return (
    <Card
      title={
        <Space>
          <Tag color={domainColorsHex.school.primary} style={{ fontSize: 16, padding: '4px 12px' }}>
            {school.name}
          </Tag>
        </Space>
      }
      extra={
        <Space>
          <Button onClick={onEdit}>수정</Button>
          <Button danger onClick={onDelete} loading={loading}>
            삭제
          </Button>
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Card>
  )
}
