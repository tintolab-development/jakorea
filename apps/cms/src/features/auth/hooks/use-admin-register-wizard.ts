import { useCallback, useState } from 'react'

import {
  ADMIN_REGISTER_TOTAL_STEPS,
  type AdminRegisterWizardData,
} from '@/types/admin-register'

interface UseAdminRegisterWizardOptions {
  redirectPath?: string
}

export function useAdminRegisterWizard(options: UseAdminRegisterWizardOptions = {}) {
  const { redirectPath } = options
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<AdminRegisterWizardData>({})

  const updateStepData = useCallback((partial: Partial<AdminRegisterWizardData>) => {
    setFormData(prev => ({ ...prev, ...partial }))
  }, [])

  const goNext = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, ADMIN_REGISTER_TOTAL_STEPS))
  }, [])

  const goPrev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }, [])

  const buildLoginPath = useCallback(() => {
    if (!redirectPath) {
      return '/login'
    }
    return `/login?redirect=${encodeURIComponent(redirectPath)}`
  }, [redirectPath])

  const buildCompletePath = useCallback(() => {
    if (!redirectPath) {
      return '/register/complete'
    }
    return `/register/complete?redirect=${encodeURIComponent(redirectPath)}`
  }, [redirectPath])

  return {
    currentStep,
    formData,
    updateStepData,
    goNext,
    goPrev,
    buildLoginPath,
    buildCompletePath,
    totalSteps: ADMIN_REGISTER_TOTAL_STEPS,
  }
}
