/**
 * 게시글 관리 - 게시글 목록 페이지
 * Phase: 관리자 페이지 카테고리 정리 및 뎁스 변경
 */

import { Space } from 'antd'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'

export function PostListPage() {
  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>게시글 관리</h1>
      </Space>
      <ComingSoonPage 
        title="게시글 관리" 
        description="게시글 관리 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다."
      />
    </div>
  )
}
