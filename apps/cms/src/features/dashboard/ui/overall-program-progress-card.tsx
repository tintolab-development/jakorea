/**
 * 전체 강의 진행 현황 카드
 * Phase: 관리자 홈 화면
 * ProgramStatisticsCard 컴포넌트를 참고하여 공통 UI 패턴 적용
 */

import { Card, Row, Col, Statistic, Tag } from 'antd'
import { BookOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useProgramProgress } from '../hooks/use-program-progress'
import './overall-program-progress-card.css'

export function OverallProgramProgressCard() {
  const navigate = useNavigate()
  const { progress, loading } = useProgramProgress()

  const handleClick = () => {
    navigate('/programs')
  }

  if (!progress) {
    return (
      <Card
        hoverable
        onClick={handleClick}
        className="overall-program-progress-card"
        loading={loading}
      >
        <div className="overall-program-progress-card__placeholder" />
      </Card>
    )
  }

  const total = progress.applicationCompleted + progress.scheduled + progress.inProgress + progress.completed

  return (
    <Card
      hoverable
      onClick={handleClick}
      className="overall-program-progress-card"
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Statistic
            title="전체 프로그램 진행 현황"
            value={total}
            prefix={<BookOutlined />}
            suffix="개"
            valueStyle={{ color: '#000000', fontWeight: 'bold' }}
          />
        </Col>
        <Col span={24} className="overall-program-progress-card__status-row">
          <Row gutter={[8, 8]} wrap>
            <Col>
              <Tag color="blue">신청완료: {progress.applicationCompleted}</Tag>
            </Col>
            <Col>
              <Tag color="orange">진행예정: {progress.scheduled}</Tag>
            </Col>
            <Col>
              <Tag color="green">진행중: {progress.inProgress}</Tag>
            </Col>
            <Col>
              <Tag color="default">진행완료: {progress.completed}</Tag>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  )
}
