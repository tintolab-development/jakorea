/**
 * 신청 등록/수정 페이지
 * Phase 2.2: 신청 등록 폼
 */

import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ApplicationForm } from '@/features/application/ui/application-form'
import { useApplicationStore } from '@/features/application/model/application-store'
import type { ApplicationFormData } from '@/entities/application/model/schema'
import type { Application } from '@/types/domain'

export function ApplicationFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { applications, fetchApplications, createApplication, updateApplication } = useApplicationStore()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadApplication = async () => {
      if (!id || id === 'new') {
        setApplication(null)
        return
      }

      try {
        await fetchApplications()
        const found = applications.find(a => a.id === id)
        setApplication(found || null)
      } catch (error) {
        console.error('Failed to load application:', error)
      }
    }

    loadApplication()
  }, [id, fetchApplications, applications])

  const handleSubmit = async (data: ApplicationFormData) => {
    setLoading(true)
    try {
      if (application) {
        // 수정
        await updateApplication(application.id, data)
        navigate('/applications')
      } else {
        // 등록
        await createApplication(data)
        navigate('/applications')
      }
    } catch (error) {
      console.error('Failed to save application:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/applications')
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <ApplicationForm
        application={application || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  )
}


