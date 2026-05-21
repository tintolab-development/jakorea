import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TEMPLATE_USER_PREVIEW_ACTIVE } from '@/features/template/lib/template-user-preview-url'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import type { TemplateFullpageModalFooterAction } from '@/features/template/ui/template-management/template-fullpage-modal'
import {
  UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY,
  normalizeUjatProgramRegistrationStepKey,
} from '@/features/program/ujat/model/ujat-program-registration-flow'
import { useUjatProgramRegistrationFlow } from '@/features/program/ujat/hooks/use-ujat-program-registration-flow'
import { UjatProgramRegistrationBodyHeader } from '@/features/program/ujat/ui/registration/ujat-program-registration-body-header'

const UJAT_REGISTRATION_MODAL_TITLE = 'UJAT 프로그램 등록'

export type UjatProgramRegistrationFullpageModalProps = {
  open: boolean
  onClose: () => void
  onProgramRegistrationSaved?: () => void
}

export function UjatProgramRegistrationFullpageModal({
  open,
  onClose,
  onProgramRegistrationSaved,
}: UjatProgramRegistrationFullpageModalProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialStep = useMemo(() => {
    const raw = searchParams.get(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
    return normalizeUjatProgramRegistrationStepKey(raw)
  }, [searchParams])

  const syncStepToUrl = useCallback(
    (step: string) => {
      const next = new URLSearchParams(searchParams)
      next.set(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, step)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    if (!open) return
    if (searchParams.has(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)) return
    const next = new URLSearchParams(searchParams)
    next.set(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, 'program')
    setSearchParams(next, { replace: true })
  }, [open, searchParams, setSearchParams])

  const flow = useUjatProgramRegistrationFlow(open, {
    initialStep,
    onProgramRegistrationSaved,
    onStepChange: syncStepToUrl,
  })

  const handleClose = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
    next.delete('userPreview')
    setSearchParams(next, { replace: true })
    onClose()
  }, [onClose, searchParams, setSearchParams])

  const handlePreview = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.set('userPreview', TEMPLATE_USER_PREVIEW_ACTIVE)
    setSearchParams(next, { replace: false })
    flow.handlePreview()
  }, [flow, searchParams, setSearchParams])

  const footerActions = useMemo((): TemplateFullpageModalFooterAction[] | undefined => {
    if (flow.phase === 'program') {
      return [
        {
          label: '모집 정보 작성하기',
          variant: 'primary',
          showArrow: true,
          onClick: () => flow.goToPhase('recruitment'),
        },
      ]
    }
    if (flow.phase === 'recruitment') {
      return [
        {
          label: '공통 정보 돌아가기',
          variant: 'secondary',
          onClick: () => flow.goToPhase('program'),
        },
        {
          label: '신청 정보 작성하기',
          variant: 'primary',
          showArrow: true,
          onClick: () => flow.goToPhase('application'),
        },
      ]
    }
    if (flow.phase === 'application') {
      return [
        {
          label: '모집 정보 돌아가기',
          variant: 'secondary',
          onClick: () => flow.goToPhase('recruitment'),
        },
        {
          label: '프로그램 등록 완료',
          variant: 'primary',
          showArrow: false,
          onClick: flow.handleCompleteRegistration,
        },
      ]
    }
    return undefined
  }, [flow])

  return (
    <TemplateFullpageModal
      open={open}
      onClose={handleClose}
      title={UJAT_REGISTRATION_MODAL_TITLE}
      titleReadOnly
      templateTabType="writing"
      registrationUserMode
      onPreview={handlePreview}
      onSave={flow.handleSave}
      bodyHeaderLeading={
        <UjatProgramRegistrationBodyHeader
          activeStep={flow.activeStep}
          onSelectStep={flow.selectStep}
        />
      }
      footerActions={footerActions}
      leftContent={flow.panels.leftContent}
      rightNavigation={flow.panels.rightNavigation}
    />
  )
}
