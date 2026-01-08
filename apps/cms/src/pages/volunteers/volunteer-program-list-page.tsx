/**
 * 봉사 프로그램 목록 페이지
 * Phase: 봉사단 관리 하위 뎁스 구현
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Space, Card, Tabs, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { VolunteerRandomMatching } from '@/features/volunteer/ui/volunteer-random-matching'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import { getVolunteerPrograms } from '@/data/mock'
import type { Program } from '@/types/domain'
import { formatDate } from '@/shared/utils'
import { domainColorsHex } from '@/shared/constants/colors'
import {
  getProgramLifecycleLabel,
  getProgramLifecycleColor,
} from '@/shared/constants/status'

export function VolunteerProgramListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  
  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '봉사 프로그램'
  
  // 봉사 프로그램 목록 가져오기
  const volunteerPrograms = getVolunteerPrograms()

  // 기본 선택 프로그램 설정
  useEffect(() => {
    if (volunteerPrograms.length > 0 && !selectedProgram) {
      setSelectedProgram(volunteerPrograms[0])
    }
  }, [volunteerPrograms, selectedProgram])

  const programColumns: ColumnsType<Program> = [
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
  ]

  const activeTabKey = searchParams.get('tab') || 'list'

  const handleTabChange = (key: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (key === 'list') {
      newParams.delete('tab')
    } else {
      newParams.set('tab', key)
    }
    setSearchParams(newParams, { replace: true })
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>{categoryName}</h1>
      </Space>

      <Tabs
        activeKey={activeTabKey}
        onChange={handleTabChange}
        items={[
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
          {
            key: 'matching',
            label: '봉사자 랜덤 배치',
            children: (
              <VolunteerRandomMatching
                programId={selectedProgram?.id || volunteerPrograms[0]?.id || 'program-1'}
                scheduleId="schedule-1"
                onMatchComplete={(pairs) => {
                  console.log('매칭 완료:', pairs)
                }}
              />
            ),
          },
        ]}
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
    </div>
  )
}
