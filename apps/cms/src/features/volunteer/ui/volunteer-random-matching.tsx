/**
 * 봉사자 랜덤 배치 컴포넌트
 * 참여 횟수 및 파트너 매칭 이력을 기반으로 중복되지 않도록 2인 1조로 랜덤 매칭
 */

import { useState } from 'react'
import { Card, Button, Table, Tag, Space, Alert, Typography, message } from 'antd'
import { SwapOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UUID } from '@/types/index'
import type { VolunteerPair, VolunteerRandomMatchingOptions } from '@/types/volunteer'
import {
  randomMatchVolunteers,
  getVolunteerIds,
} from '../lib/volunteer-matching'
import { VolunteerPairDetailModal } from './volunteer-pair-detail-modal'
import { MESSAGES } from '@/shared/constants'

const { Text } = Typography

interface VolunteerRandomMatchingProps {
  programId: UUID
  scheduleId: UUID
  onMatchComplete?: (pairs: VolunteerPair[]) => void
}

export function VolunteerRandomMatching({
  programId,
  scheduleId,
  onMatchComplete,
}: VolunteerRandomMatchingProps) {
  const [pairs, setPairs] = useState<VolunteerPair[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPair, setSelectedPair] = useState<VolunteerPair | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleRandomMatch = () => {
    setLoading(true)
    try {
      // 봉사자 ID 목록 가져오기
      const volunteerIds = getVolunteerIds()

      if (volunteerIds.length < 2) {
        message.warning(MESSAGES.warning.needAtLeastTwoVolunteers)
        setLoading(false)
        return
      }

      // 매칭 옵션 설정
      const options: VolunteerRandomMatchingOptions = {
        programId,
        scheduleId,
        maxPreviousMatches: 0, // 중복 방지: 과거에 함께 매칭된 적이 없어야 함
        prioritizeNewPairs: true, // 새로운 조합 우선
      }

      // TODO: 실제 매칭 이력 데이터 가져오기 (현재는 빈 배열)
      const matchingHistory: any[] = []

      // 랜덤 매칭 실행
      const matchedPairs = randomMatchVolunteers(volunteerIds, options, matchingHistory)

      if (matchedPairs.length === 0) {
        message.warning(MESSAGES.warning.noMatchingCombination)
        setLoading(false)
        return
      }

      setPairs(matchedPairs)
      message.success(`${matchedPairs.length}개의 조가 생성되었습니다.`)
      onMatchComplete?.(matchedPairs)
    } catch (error) {
      console.error('봉사자 매칭 실패:', error)
      message.error(MESSAGES.error.volunteerMatchingFailed)
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<VolunteerPair> = [
    {
      title: '조 번호',
      key: 'pairNumber',
      width: 80,
      align: 'center',
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '봉사자 1',
      key: 'volunteer1',
      width: 200,
      render: (_: unknown, record: VolunteerPair) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.volunteer1Name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            참여 횟수: {record.volunteer1ParticipationCount}회
          </Text>
        </div>
      ),
    },
    {
      title: '봉사자 2',
      key: 'volunteer2',
      width: 200,
      render: (_: unknown, record: VolunteerPair) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.volunteer2Name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            참여 횟수: {record.volunteer2ParticipationCount}회
          </Text>
        </div>
      ),
    },
    {
      title: '매칭 정보',
      key: 'matchingInfo',
      width: 150,
      render: (_: unknown, record: VolunteerPair) => (
        <Space direction="vertical" size="small">
          {record.isNewPair ? (
            <Tag color="green">새로운 조합</Tag>
          ) : (
            <Tag color="orange">
              과거 {record.previousMatchCount}회 매칭
            </Tag>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card
      title={
        <Space>
          <SwapOutlined />
          <span>봉사자 랜덤 배치</span>
        </Space>
      }
      extra={
        <Space>
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={handleRandomMatch}
            loading={loading}
          >
            랜덤 매칭
          </Button>
          {pairs.length > 0 && (
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRandomMatch}
              loading={loading}
            >
              다시 매칭
            </Button>
          )}
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          message="매칭 규칙"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>참여 횟수가 적은 봉사자 우선 매칭</li>
              <li>과거에 함께 매칭된 적이 없는 새로운 조합 우선</li>
              <li>참여 횟수가 비슷한 봉사자끼리 매칭</li>
              <li>2인 1조로 자동 배치</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {pairs.length > 0 ? (
          <>
            <div>
              <Text strong>총 {pairs.length}개의 조가 생성되었습니다.</Text>
            </div>
            <Table
              columns={columns}
              dataSource={pairs}
              rowKey={(_record, index) => `pair-${index}`}
              pagination={false}
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedPair(record)
                  setModalOpen(true)
                },
                style: { cursor: 'pointer' },
              })}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
            <SwapOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>랜덤 매칭 버튼을 클릭하여 봉사자를 2인 1조로 배치하세요.</div>
          </div>
        )}
      </Space>

      <VolunteerPairDetailModal
        open={modalOpen}
        pair={selectedPair}
        onClose={() => {
          setModalOpen(false)
          setSelectedPair(null)
        }}
      />
    </Card>
  )
}
