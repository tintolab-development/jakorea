/**
 * 대기 중인 작업 Row 위젯
 * 관리자 권한: 대기 중인 신청, 매칭, 정산을 한 레이어에 row 형태로 표시
 */

import { Row, Col } from 'antd'
import { PendingApplicationsCard } from './pending-applications-card'
import { PendingMatchingsCard } from './pending-matchings-card'
import { PendingSettlementsCard } from './pending-settlements-card'

export function PendingActionsRow() {
  return (
    <Row gutter={[16, 16]}>
      <Col span={8}>
        <PendingApplicationsCard />
      </Col>
      <Col span={8}>
        <PendingMatchingsCard />
      </Col>
      <Col span={8}>
        <PendingSettlementsCard />
      </Col>
    </Row>
  )
}
