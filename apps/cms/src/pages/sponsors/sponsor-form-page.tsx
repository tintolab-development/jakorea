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
import { MESSAGES } from '@/shared/constants'

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
        message.success(MESSAGES.success.sponsorUpdated)
      } else {
        await createSponsor(data)
        message.success(MESSAGES.success.sponsorCreated)
      }
      navigate('/sponsors')
    } catch {
      message.error(isEdit ? MESSAGES.error.update : MESSAGES.error.create)
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

