/**
 * 본인 프로그램 상세 페이지 (강사/봉사자용)
 * Phase 5.2.2: 본인 프로그램 조회
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Table, Space, Empty, Spin, message } from 'antd'
import { HeartOutlined, HeartFilled, ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMyProgramDetail, type MyProgram } from '@/entities/program/api/instructor-program-service'
import {
  addFavoriteProgram,
  removeFavoriteProgram,
  isFavoriteProgram,
} from '@/entities/program/api/favorite-program-service'
import { getCommonStatusLabel, getCommonStatusColor } from '@/shared/constants/status'
import dayjs from 'dayjs'

export function MyProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [program, setProgram] = useState<MyProgram | null>(null)
  const [loading, setLoading] = useState(false)
  const [favorite, setFavorite] = useState(false) // 찜하기 상태 (Mock)

  useEffect(() => {
    if (id && user?.instructorId) {
      loadProgram()
    }
  }, [id, user?.instructorId])

  useEffect(() => {
    if (id && user?.id) {
      loadFavoriteStatus()
    }
  }, [id, user?.id])

  const loadProgram = async () => {
    if (!id || !user?.instructorId) return

    setLoading(true)
    try {
      const data = await getMyProgramDetail(user.instructorId, id)
      if (!data) {
        message.error('프로그램을 찾을 수 없습니다.')
        navigate('/programs/my')
        return
      }
      setProgram(data)
    } catch (error) {
      console.error('프로그램 로드 실패:', error)
      message.error('프로그램 정보를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadFavoriteStatus = async () => {
    if (!id || !user?.id) return

    try {
      const isFavorite = await isFavoriteProgram(user.id, id)
      setFavorite(isFavorite)
    } catch (error) {
      console.error('관심 프로그램 상태 로드 실패:', error)
    }
  }

  const handleToggleFavorite = async () => {
    if (!id || !user?.id) return

    try {
      if (favorite) {
        await removeFavoriteProgram(user.id, id)
        message.success('관심 프로그램에서 제거되었습니다.')
      } else {
        await addFavoriteProgram(user.id, id)
        message.success('관심 프로그램에 추가되었습니다.')
      }
      setFavorite(!favorite)
    } catch (error) {
      console.error('관심 프로그램 토글 실패:', error)
      message.error('관심 프로그램 처리 중 오류가 발생했습니다.')
    }
  }

  const getProgramStatus = (program: MyProgram) => {
    const now = dayjs()
    const startDate = dayjs(program.startDate)
    const endDate = dayjs(program.endDate)

    if (program.status === 'completed' || now.isAfter(endDate)) {
      return { label: '진행완료', color: 'default' }
    }
    if (now.isBefore(startDate)) {
      return { label: '진행 예정', color: 'blue' }
    }
    if (now.isAfter(startDate) && now.isBefore(endDate)) {
      return { label: '진행중', color: 'green' }
    }
    return { label: getCommonStatusLabel(program.status), color: getCommonStatusColor(program.status) }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!program) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/programs/my')} style={{ marginBottom: 16 }}>
          목록으로
        </Button>
        <Empty description="프로그램 정보를 찾을 수 없습니다." />
      </div>
    )
  }

  const status = getProgramStatus(program)

  const scheduleColumns = [
    {
      title: '일정명',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '일정 날짜',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '장소',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getCommonStatusColor(status)}>{getCommonStatusLabel(status)}</Tag>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/programs/my')}>
          목록으로
        </Button>
        <Button
          icon={favorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
          onClick={handleToggleFavorite}
        >
          {favorite ? '관심 해제' : '관심 등록'}
        </Button>
      </Space>

      <Card title={program.title} style={{ marginBottom: 16 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }}>
          <Descriptions.Item label="상태">
            <Tag color={status.color}>{status.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="카테고리">
            <Tag color={program.category === 'school' ? 'blue' : 'purple'}>
              {program.category === 'school' ? '학교 프로그램' : '개인 프로그램'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="진행 기간">
            {dayjs(program.startDate).format('YYYY-MM-DD')} ~ {dayjs(program.endDate).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="매칭일">
            {dayjs(program.matchedAt).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="매칭 ID">
            {program.matchingId}
          </Descriptions.Item>
          <Descriptions.Item label="일정 수">
            {program.schedules.length}개
          </Descriptions.Item>
          {program.description && (
            <Descriptions.Item label="설명" span={3}>
              {program.description}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card
        title={
          <Space>
            <CalendarOutlined />
            일정 정보 ({program.schedules.length}개)
          </Space>
        }
      >
        {program.schedules.length > 0 ? (
          <Table
            columns={scheduleColumns}
            dataSource={program.schedules}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <Empty description="등록된 일정이 없습니다." />
        )}
      </Card>
    </div>
  )
}

