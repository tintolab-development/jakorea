/**
 * 스폰서 목록 페이지
 * Phase 1.3: 목록 페이지
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { SponsorList } from '@/features/sponsor/ui/sponsor-list'
import { useSponsorStore } from '@/features/sponsor/model/sponsor-store'

export function SponsorListPage() {
  const navigate = useNavigate()
  const { sponsors, loading, fetchSponsors } = useSponsorStore()

  useEffect(() => {
    fetchSponsors()
  }, [fetchSponsors])

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>스폰서 관리</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sponsors/new')}>
          스폰서 등록
        </Button>
      </Space>
      <SponsorList data={sponsors} loading={loading} />
    </div>
  )
}

