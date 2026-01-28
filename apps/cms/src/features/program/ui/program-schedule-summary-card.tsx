/**
 * 프로그램 일정 요약 카드 컴포넌트
 */

import { Card, Space, Typography } from 'antd'
import dayjs from 'dayjs'

const { Text } = Typography

interface ProgramScheduleSummaryCardProps {
  confirmedRounds: Array<{
    id: string
    roundNumber: number
    startDate: string
    endDate: string
    capacity?: number
  }>
  lifecycleStatus?: string
}

export function ProgramScheduleSummaryCard({
  confirmedRounds,
  lifecycleStatus,
}: ProgramScheduleSummaryCardProps) {
  // 조건부 렌더링: 매칭 완료 ~ 서류 처리 완료 단계에서만 노출 (7단계)
  if (
    confirmedRounds.length === 0 ||
    (lifecycleStatus &&
      ![
        'matching_completed',
        'education_before_textbook',
        'education_after_textbook',
        'education_completed',
        'document_processing_completed',
      ].includes(lifecycleStatus))
  ) {
    return null
  }

  return (
    <Card title="일정 요약">
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {confirmedRounds.slice(0, 3).map(round => (
          <div key={round.id}>
            <Text strong>{round.roundNumber}회차</Text>
            {' - '}
            <Text type="secondary">
              {dayjs(round.startDate).format('YYYY-MM-DD')} ~{' '}
              {dayjs(round.endDate).format('YYYY-MM-DD')}
            </Text>
            {round.capacity && (
              <>
                {' - '}
                <Text type="secondary">정원: {round.capacity}명</Text>
              </>
            )}
          </div>
        ))}
        {confirmedRounds.length > 3 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            외 {confirmedRounds.length - 3}개 회차
          </Text>
        )}
      </Space>
    </Card>
  )
}
