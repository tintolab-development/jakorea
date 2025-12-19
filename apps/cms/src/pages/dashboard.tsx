/**
 * 대시보드 페이지
 * Phase 1.1: 기본 대시보드 구조
 */

import { Card, Row, Col, Statistic } from 'antd'
import { mockPrograms, mockApplications, mockMatchings, mockInstructors } from '@/data/mock'

export function Dashboard() {
  const programCount = mockPrograms.length
  const applicationCount = mockApplications.length
  const matchingCount = mockMatchings.length
  const instructorCount = mockInstructors.length

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>대시보드</h1>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="프로그램" value={programCount} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="신청" value={applicationCount} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="매칭" value={matchingCount} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="강사" value={instructorCount} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
