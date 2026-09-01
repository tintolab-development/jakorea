import { useEffect, useMemo, useState } from 'react'
import {
  buildCertificateLogoPreviewUrls,
  parseCertificateFormSettings,
  resolveCertificateStringPreviewValues,
  type CertificateFormSettingsState,
} from '@/features/template/lib/certificate-form-settings'
import { loadWritingFormTemplateDraft } from '@/features/template/lib/writing-form-template-local-save'
import {
  useFormTemplateCertificateModalState,
  type CertificateModalInitialHydration,
} from '@/pages/templates/use-form-template-certificate-modal-state'

export type UseCertificateTemplateModalStateArgs = {
  open: boolean
  templateCode?: string
  fallbackTitleName?: string
  /** API 로드 전·templateCode 없을 때 보조 초기값 (양식 관리) */
  prefillStringValues?: Record<string, string>
  /** API 템플릿 위에 덮어쓸 런타임 필드 (프로그램 발급) */
  runtimeStringValues?: Record<string, string>
  runtimeStringOverrideKeys?: readonly string[]
}

export function useCertificateTemplateModalState(args: UseCertificateTemplateModalStateArgs) {
  const {
    open,
    templateCode,
    fallbackTitleName,
    prefillStringValues,
    runtimeStringValues,
    runtimeStringOverrideKeys,
  } = args

  const [hydratedSettings, setHydratedSettings] = useState<CertificateFormSettingsState | null>(null)

  useEffect(() => {
    if (!open) {
      setHydratedSettings(null)
      return
    }

    if (templateCode == null || templateCode === '') {
      setHydratedSettings(parseCertificateFormSettings(undefined, fallbackTitleName))
      return
    }

    let cancelled = false
    void loadWritingFormTemplateDraft(templateCode).then(saved => {
      if (cancelled) return
      setHydratedSettings(parseCertificateFormSettings(saved?.settingsJson, fallbackTitleName))
    })

    return () => {
      cancelled = true
    }
  }, [open, templateCode, fallbackTitleName])

  const resolvedStringPreviewValues = useMemo(
    () =>
      resolveCertificateStringPreviewValues({
        hydrated: hydratedSettings,
        fallbackTitleName,
        prefillStringValues,
        runtimeStringValues,
        runtimeStringOverrideKeys,
        templateCode,
        open,
      }),
    [
      hydratedSettings,
      fallbackTitleName,
      prefillStringValues,
      runtimeStringValues,
      runtimeStringOverrideKeys,
      templateCode,
      open,
    ]
  )

  const initialHydration = useMemo((): CertificateModalInitialHydration | undefined => {
    if (hydratedSettings == null) return undefined
    return {
      logoUploadResults: hydratedSettings.logoUploadResults,
      participantRowVisibility: hydratedSettings.participantRowVisibility,
    }
  }, [hydratedSettings])

  const initialLogoPreviewUrls = useMemo(
    () => buildCertificateLogoPreviewUrls(hydratedSettings?.logoUploadResults ?? {}),
    [hydratedSettings?.logoUploadResults]
  )

  const modalState = useFormTemplateCertificateModalState(
    open,
    resolvedStringPreviewValues,
    initialHydration
  )

  return {
    ...modalState,
    initialLogoPreviewUrls,
    isTemplateSettingsLoaded: hydratedSettings != null,
  }
}
