/**
 * 스폰서 상세 페이지
 * Phase 1.3: 상세 페이지
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SponsorDetail } from '@/features/sponsor/ui/sponsor-detail'
import { useSponsorStore } from '@/features/sponsor/model/sponsor-store'
import { message } from 'antd'

export function SponsorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedSponsor, loading, fetchSponsorById, deleteSponsor } = useSponsorStore()

  useEffect(() => {
    if (id) {
      fetchSponsorById(id)
    }
  }, [id, fetchSponsorById])

  const handleEdit = () => {
    if (id) {
      navigate(`/sponsors/${id}/edit`)
    }
  }

  const handleDelete = async () => {
    if (!id || !selectedSponsor) return

    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteSponsor(id)
        message.success('스폰서가 삭제되었습니다')
        navigate('/sponsors')
      } catch {
        message.error('삭제 중 오류가 발생했습니다')
      }
    }
  }

  if (loading) {
    return <div>로딩 중...</div>
  }

  if (!selectedSponsor) {
    return <div>스폰서를 찾을 수 없습니다</div>
  }

  return <SponsorDetail sponsor={selectedSponsor} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />
}

