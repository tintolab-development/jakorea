/**
 * 템플릿 관리 - 템플릿 목록 페이지
 * Phase: 관리자 페이지 카테고리 정리 및 뎁스 변경
 */

import { Space } from 'antd'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'

export function TemplateListPage() {
  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>템플릿 관리</h1>
      </Space>
      <ComingSoonPage 
        title="템플릿 관리" 
        description="템플릿 관리 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다."
      />
    </div>
  )
}
