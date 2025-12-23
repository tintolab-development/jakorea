/**
 * 스폰서 등록/수정 폼 페이지
 * Phase 1.3: 폼 페이지
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SponsorForm } from '@/features/sponsor/ui/sponsor-form'
import { useSponsorStore } from '@/features/sponsor/model/sponsor-store'
import type { SponsorFormData } from '@/entities/sponsor/model/schema'
import { message } from 'antd'

export function SponsorFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedSponsor, loading, fetchSponsorById, createSponsor, updateSponsor } = useSponsorStore()

  const isEdit = !!id

  useEffect(() => {
    if (id) {
      fetchSponsorById(id)
    }
  }, [id, fetchSponsorById])

  const handleSubmit = async (data: SponsorFormData) => {
    try {
      if (isEdit && id) {
        await updateSponsor(id, data)
        message.success('스폰서 정보가 수정되었습니다')
      } else {
        await createSponsor(data)
        message.success('스폰서가 등록되었습니다')
      }
      navigate('/sponsors')
    } catch {
      message.error(isEdit ? '수정 중 오류가 발생했습니다' : '등록 중 오류가 발생했습니다')
    }
  }

  const handleCancel = () => {
    navigate('/sponsors')
  }

  return (
    <div>
      <SponsorForm
        sponsor={isEdit ? selectedSponsor || undefined : undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  )
}

