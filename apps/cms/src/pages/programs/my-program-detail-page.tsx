/**
 * 본인 프로그램 상세 페이지 (강사/봉사자용)
 * Phase 5.2.2: 본인 프로그램 조회
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Table, Space, Empty, Spin, message } from 'antd'
import { ProgramCategoryBadge } from '@/shared/components/program-category-badge'
import {
  HeartOutlined,
  HeartFilled,
  ArrowLeftOutlined,
  CalendarOutlined,
  FormOutlined,
} from '@ant-design/icons'
import { SatisfactionSurveyModal } from '@/features/program/ui/satisfaction-survey-modal'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  getMyProgramDetail,
  type MyProgram,
} from '@/entities/program/api/instructor-program-service'
import {
  addFavoriteProgram,
  removeFavoriteProgram,
  isFavoriteProgram,
} from '@/entities/program/api/favorite-program-service'
import {
  commonStatusStatusConfig,
  getCommonStatusLabel,
  getCommonStatusColor,
} from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { MESSAGES, LAYOUT_CONSTANTS } from '@/shared/constants'
import dayjs from 'dayjs'

export function MyProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [program, setProgram] = useState<MyProgram | null>(null)
  const [loading, setLoading] = useState(false)
  const [favorite, setFavorite] = useState(false) // 찜하기 상태 (Mock)
  const [satisfactionModalOpen, setSatisfactionModalOpen] = useState(false)

  const loadProgram = useCallback(async () => {
    const userId = user?.instructorId || user?.id
    if (!id || !userId) return

    setLoading(true)
    try {
      const data = await getMyProgramDetail(userId, id)
      if (!data) {
        message.error(MESSAGES.error.programNotFound)
        navigate('/programs/my/active')
        return
      }
      setProgram(data)
    } catch (error) {
      console.error('프로그램 로드 실패:', error)
      message.error(MESSAGES.error.programLoadFailed)
    } finally {
      setLoading(false)
    }
  }, [id, navigate, user?.id, user?.instructorId])

  const loadFavoriteStatus = useCallback(
    async (userId: string) => {
      if (!id) return

      try {
        const isFavorite = await isFavoriteProgram(userId, id)
        setFavorite(isFavorite)
      } catch (error) {
        console.error('관심 프로그램 상태 로드 실패:', error)
      }
    },
    [id]
  )

  useEffect(() => {
    if (id && user?.instructorId) {
      loadProgram()
    }
  }, [id, user?.instructorId, loadProgram])

  useEffect(() => {
    const userId = user?.instructorId || user?.id
    if (id && userId) {
      loadFavoriteStatus(userId)
    }
  }, [id, user, loadFavoriteStatus])

  const handleToggleFavorite = async () => {
    const userId = user?.instructorId || user?.id
    if (!id || !userId) return

    try {
      if (favorite) {
        await removeFavoriteProgram(userId, id)
        message.success(MESSAGES.success.removedFromFavorites)
      } else {
        await addFavoriteProgram(userId, id)
        message.success(MESSAGES.success.addedToFavorites)
      }
      setFavorite(!favorite)
    } catch (error) {
      console.error('관심 프로그램 토글 실패:', error)
      message.error(MESSAGES.error.favoriteProgramProcessFailed)
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
    return {
      label: getCommonStatusLabel(program.status),
      color: getCommonStatusColor(program.status),
    }
  }

  // 만족도 조사 가능 여부 (완료된 프로그램)
  // status가 'completed'이거나 종료일이 지난 경우
  const canSubmitSatisfaction =
    program?.status === 'completed' ||
    (program?.endDate && dayjs(program.endDate).isBefore(dayjs()))

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
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/programs/my/active')}
          style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg }}
        >
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
        <StatusBadge status={status} statusConfig={commonStatusStatusConfig} />
      ),
    },
  ]

  return (
    <div>
      <Space
        style={{
          marginBottom: LAYOUT_CONSTANTS.margins.lg,
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/programs/my/active')}>
          목록으로
        </Button>
        <Space>
          <Button onClick={() => navigate(`/programs/my/${program.id}/history`)}>
            이력/현황 보기
          </Button>
          {canSubmitSatisfaction && (
            <Button
              type="primary"
              icon={<FormOutlined />}
              onClick={() => setSatisfactionModalOpen(true)}
            >
              만족도 조사
            </Button>
          )}
          <Button
            icon={favorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            onClick={handleToggleFavorite}
          >
            {favorite ? '관심 해제' : '관심 등록'}
          </Button>
        </Space>
      </Space>

      <Card title={program.title} style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg }}>
        <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }}>
          <Descriptions.Item label="상태">
            <Tag color={status.color}>{status.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="카테고리">
            <ProgramCategoryBadge category={program.category} />
          </Descriptions.Item>
          <Descriptions.Item label="진행 기간">
            {dayjs(program.startDate).format('YYYY-MM-DD')} ~{' '}
            {dayjs(program.endDate).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="매칭일">
            {dayjs(program.matchedAt).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="매칭 ID">{program.matchingId}</Descriptions.Item>
          <Descriptions.Item label="일정 수">{program.schedules.length}개</Descriptions.Item>
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

      {/* 만족도 조사 모달 */}
      {program && (
        <SatisfactionSurveyModal
          open={satisfactionModalOpen}
          program={program}
          onCancel={() => setSatisfactionModalOpen(false)}
          onSuccess={() => {
            // 만족도 조사 제출 후 처리
            message.success(MESSAGES.success.satisfactionSurveySubmitted)
            setSatisfactionModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
