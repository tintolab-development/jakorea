/**
 * 만족도 조사 페이지
 * Phase 4: 추가 기능 구현
 * 사용자 강사 권한용 프로그램 만족도 조사
 */

import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, Button, Space, Table, Tag, Spin } from 'antd'
import { ProgramCategoryBadge } from '@/shared/components/program-category-badge'
import { EmptyState } from '@/shared/ui'
import type { ColumnsType } from 'antd/es/table'
import { CheckCircleOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMyPrograms, type MyProgram } from '@/entities/program/api/instructor-program-service'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { SatisfactionSurveyModal } from '@/features/program/general/ui/satisfaction-survey-modal'
import dayjs from 'dayjs'

interface SatisfactionRecord {
  id: string
  programId: string
  programTitle: string
  programCategory: string
  ratings: {
    programRating: number
    contentRating: number
    instructorRating: number
    overallRating: number
    strengths?: string
    improvements?: string
    additionalComments?: string
  }
  submittedAt: string
  status: 'submitted' | 'completed'
}

// TODO: API 연동 필요
// Mock 데이터 (테스트용)
const mockSatisfactionRecords: SatisfactionRecord[] = [
  // 예시: 제출된 만족도 조사 기록이 있다면 여기에 추가
  // {
  //   id: 'satisfaction-1',
  //   programId: 'program-1',
  //   programTitle: '예시 프로그램',
  //   programCategory: 'school',
  //   ratings: {
  //     programRating: 5,
  //     contentRating: 4,
  //     instructorRating: 5,
  //     overallRating: 5,
  //     strengths: '좋은 프로그램이었습니다.',
  //     improvements: '더 많은 시간이 필요합니다.',
  //   },
  //   submittedAt: new Date().toISOString(),
  //   status: 'submitted',
  // },
]

export function ProgramSatisfactionPage() {
  const { user } = useAuthStore()
  const location = useLocation()
  const [programs, setPrograms] = useState<MyProgram[]>([])
  const [loading, setLoading] = useState(false)
  const [submittedRecords, setSubmittedRecords] =
    useState<SatisfactionRecord[]>(mockSatisfactionRecords)
  const [selectedProgram, setSelectedProgram] = useState<MyProgram | null>(null)
  const [satisfactionModalOpen, setSatisfactionModalOpen] = useState(false)

  // 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '만족도 조사'

  const loadPrograms = useCallback(async () => {
    if (!user?.instructorId) return

    setLoading(true)
    try {
      // 진행 완료된 프로그램만 필터링 (status 필터 사용)
      const data = await getMyPrograms(user.instructorId, {
        status: 'completed',
        category: 'all',
      })
      setPrograms(data)
    } catch (error) {
      console.error('프로그램 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.instructorId])

  useEffect(() => {
    if (user?.instructorId) {
      loadPrograms()
    }
  }, [loadPrograms, user?.instructorId])

  const handleOpenModal = (program: MyProgram) => {
    setSelectedProgram(program)
    setSatisfactionModalOpen(true)
  }

  const handleModalSuccess = () => {
    // 제출 기록에 추가 (실제로는 API 응답에서 받아옴)
    if (selectedProgram) {
      const newRecord: SatisfactionRecord = {
        id: `satisfaction-${Date.now()}`,
        programId: selectedProgram.id,
        programTitle: selectedProgram.title,
        programCategory: selectedProgram.category,
        ratings: {
          programRating: 5,
          contentRating: 5,
          instructorRating: 5,
          overallRating: 5,
        },
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      }
      setSubmittedRecords([...submittedRecords, newRecord])
    }
    loadPrograms() // 목록 새로고침
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  const columns: ColumnsType<MyProgram> = [
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (title: string, record: MyProgram) => (
        <Button
          type="link"
          onClick={() => handleOpenModal(record)}
          style={{ padding: 0, fontWeight: 500 }}
        >
          {title}
        </Button>
      ),
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: string) => <ProgramCategoryBadge category={category} />,
    },
    {
      title: '진행 기간',
      key: 'period',
      width: 200,
      render: (_, record) =>
        `${dayjs(record.startDate).format('YYYY-MM-DD')} ~ ${dayjs(record.endDate).format('YYYY-MM-DD')}`,
    },
    {
      title: '만족도 조사 상태',
      key: 'satisfactionStatus',
      width: 150,
      render: (_, record) => {
        const submitted = submittedRecords.find(r => r.programId === record.id)
        return submitted ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            제출 완료
          </Tag>
        ) : (
          <Tag color="default">미제출</Tag>
        )
      },
    },
    {
      title: '평균점수',
      key: 'averageRating',
      width: 120,
      render: (_, record) => {
        const submitted = submittedRecords.find(r => r.programId === record.id)
        if (!submitted || !submitted.ratings) {
          return <span style={{ color: 'rgba(0, 0, 0, 0.25)' }}>-</span>
        }
        const { programRating, contentRating, instructorRating, overallRating } = submitted.ratings
        const average = (programRating + contentRating + instructorRating + overallRating) / 4
        return <span style={{ fontWeight: 500 }}>{average.toFixed(1)}</span>
      },
    },
    {
      title: '작업',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" onClick={() => handleOpenModal(record)}>
          {submittedRecords.find(r => r.programId === record.id) ? '수정' : '작성'}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
      </Space>

      <Card>
        {programs.length === 0 ? (
          <EmptyState description="만족도 조사를 작성할 수 있는 완료된 프로그램이 없습니다." />
        ) : (
          <Table
            columns={columns}
            dataSource={programs}
            rowKey="id"
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: total => `총 ${total}개`,
            }}
          />
        )}
      </Card>

      <SatisfactionSurveyModal
        open={satisfactionModalOpen}
        program={selectedProgram}
        existingRecord={
          selectedProgram
            ? submittedRecords.find(r => r.programId === selectedProgram.id)
            : undefined
        }
        onCancel={() => {
          setSatisfactionModalOpen(false)
          setSelectedProgram(null)
        }}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
