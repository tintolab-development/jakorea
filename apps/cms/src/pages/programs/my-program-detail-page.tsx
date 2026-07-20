/**
 * 본인 프로그램 상세 페이지 (강사/봉사자용)
 * Phase 5.2.2: 본인 프로그램 조회
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Tag, Table, Space, Spin } from 'antd'
import { ProgramCategoryBadge } from '@/shared/components/program-category-badge'
import {
  HeartOutlined,
  HeartFilled,
  ArrowLeftOutlined,
  CalendarOutlined,
  FormOutlined,
} from '@ant-design/icons'
import { SatisfactionSurveyModal } from '@/features/program/general/ui/satisfaction-survey-modal'
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
  getStatusConfigAccentColor,
} from '@/shared/constants/status'
import { StatusBadge } from '@/shared/components/status-badge'
import { LAYOUT_CONSTANTS } from '@/shared/constants'
import { CmsButton, EmptyState } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import dayjs from 'dayjs'

export function MyProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [program, setProgram] = useState<MyProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorite, setFavorite] = useState(false) // 찜하기 상태 (Mock)
  const [satisfactionModalOpen, setSatisfactionModalOpen] = useState(false)

  const loadProgram = useCallback(async () => {
    const userId = user?.instructorId || user?.id
    if (!id || !userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await getMyProgramDetail(userId, id)
      if (!data) {
        navigate('/programs/my/active')
        return
      }
      setProgram(data)
    } catch (error) {
      console.error('프로그램 로드 실패:', error)
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
    if (!id) {
      setLoading(false)
      return
    }
    const userId = user?.instructorId || user?.id
    if (userId) {
      void loadProgram()
      return
    }
    setLoading(false)
  }, [id, user?.instructorId, user?.id, loadProgram])

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
      } else {
        await addFavoriteProgram(userId, id)
      }
      setFavorite(!favorite)
    } catch (error) {
      console.error('관심 프로그램 토글 실패:', error)
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
      <div
        className="page-content-loading page-content-loading--viewport"
        role="status"
        aria-label="프로그램 불러오는 중"
      >
        <Spin size="large" />
      </div>
    )
  }

  if (!program) {
    return (
      <div>
        <CmsButton
          variant="default"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/programs/my/active')}
          style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg }}
        >
          목록으로
        </CmsButton>
        <EmptyState description="프로그램 정보를 찾을 수 없습니다." />
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
        <StatusBadge
          domain="custom"
          label={
            commonStatusStatusConfig[status as keyof typeof commonStatusStatusConfig]?.label ??
            status
          }
          accentColor={getStatusConfigAccentColor(
            commonStatusStatusConfig[status as keyof typeof commonStatusStatusConfig]?.color
          )}
        />
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
        <CmsButton
          variant="default"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/programs/my/active')}
        >
          목록으로
        </CmsButton>
        <Space>
          <CmsButton
            variant="default"
            onClick={() => navigate(`/programs/my/${program.id}/history`)}
          >
            이력/현황 보기
          </CmsButton>
          {canSubmitSatisfaction && (
            <CmsButton
              variant="primary"
              icon={<FormOutlined />}
              onClick={() => setSatisfactionModalOpen(true)}
            >
              만족도 조사
            </CmsButton>
          )}
          <CmsButton
            variant="default"
            icon={favorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            onClick={handleToggleFavorite}
          >
            {favorite ? '관심 해제' : '관심 등록'}
          </CmsButton>
        </Space>
      </Space>

      <Card title={program.title} style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg }}>
        <DetailInfoForm title="프로그램 정보" mode="view" hideHeader>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="상태"
              view={<Tag color={status.color}>{status.label}</Tag>}
            />
            <DetailInfoForm.Field
              label="카테고리"
              view={<ProgramCategoryBadge category={program.category} />}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="진행 기간"
              view={`${dayjs(program.startDate).format('YYYY-MM-DD')} ~ ${dayjs(program.endDate).format('YYYY-MM-DD')}`}
            />
            <DetailInfoForm.Field
              label="매칭일"
              view={dayjs(program.matchedAt).format('YYYY-MM-DD')}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field label="매칭 ID" view={program.matchingId} />
            <DetailInfoForm.Field label="일정 수" view={`${program.schedules.length}개`} />
          </DetailInfoForm.Row>
          {program.description ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="설명" view={program.description} fullRow />
            </DetailInfoForm.Row>
          ) : null}
        </DetailInfoForm>
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
          <EmptyState description="등록된 일정이 없습니다." />
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
            setSatisfactionModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
