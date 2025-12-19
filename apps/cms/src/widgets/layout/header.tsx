/**
 * 헤더 컴포넌트
 * Phase 1.1: Ant Design Header
 */

import { Layout } from 'antd'

const { Header: AntHeader } = Layout

export function Header() {
  return (
    <AntHeader className="app-header" style={{ padding: '20px 24px', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 500 }}>JAKorea CMS</h1>
        <div>{/* 향후: 사용자 메뉴, 알림 등 추가 */}</div>
      </div>
    </AntHeader>
  )
}
