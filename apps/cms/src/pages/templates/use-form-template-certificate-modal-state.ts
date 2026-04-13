import { useEffect, useState } from 'react'
import type { FileUploadResult } from '@/entities/application/api/file-upload-service'
import {
  createDefaultParticipantRowVisibility,
  DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
  DEFAULT_TEMPLATE_FIELD_TEXT_COLORS,
} from '@/shared/components/template/template-custom-fields-form'
import { useObjectUrlFromFile } from '@/shared/hooks/use-object-url-from-file'

export function useFormTemplateCertificateModalState(open: boolean) {
  const [orgLogoFile, setOrgLogoFile] = useState<File | null>(null)
  const [orgLogo02File, setOrgLogo02File] = useState<File | null>(null)
  const [certificateBackgroundFile, setCertificateBackgroundFile] = useState<File | null>(null)
  const [chairmanSealFile, setChairmanSealFile] = useState<File | null>(null)

  const orgLogoPreviewSrc = useObjectUrlFromFile(orgLogoFile)
  const orgLogo02PreviewSrc = useObjectUrlFromFile(orgLogo02File)
  const certificateBackgroundPreviewSrc = useObjectUrlFromFile(certificateBackgroundFile)
  const chairmanSealPreviewSrc = useObjectUrlFromFile(chairmanSealFile)

  const [logoUploadResults, setLogoUploadResults] = useState<Record<string, FileUploadResult>>({})
  const [activeFieldName, setActiveFieldName] = useState<string | null>(null)
  const [stringPreviewValues, setStringPreviewValues] = useState(
    () => ({ ...DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES })
  )
  const [participantRowVisibility, setParticipantRowVisibility] = useState(() =>
    createDefaultParticipantRowVisibility()
  )
  const [fieldTextColors, setFieldTextColors] = useState(
    () => ({ ...DEFAULT_TEMPLATE_FIELD_TEXT_COLORS })
  )

  useEffect(() => {
    if (!open) {
      // 모달 닫힘 시 미리보기·폼 상태 초기화
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when dialog closes
      setOrgLogoFile(null)
      setOrgLogo02File(null)
      setCertificateBackgroundFile(null)
      setChairmanSealFile(null)
      setLogoUploadResults({})
      setActiveFieldName(null)
      setStringPreviewValues({ ...DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES })
      setParticipantRowVisibility(createDefaultParticipantRowVisibility())
      setFieldTextColors({ ...DEFAULT_TEMPLATE_FIELD_TEXT_COLORS })
    }
  }, [open])

  return {
    orgLogoFile,
    setOrgLogoFile,
    orgLogo02File,
    setOrgLogo02File,
    certificateBackgroundFile,
    setCertificateBackgroundFile,
    chairmanSealFile,
    setChairmanSealFile,
    orgLogoPreviewSrc,
    orgLogo02PreviewSrc,
    certificateBackgroundPreviewSrc,
    chairmanSealPreviewSrc,
    logoUploadResults,
    setLogoUploadResults,
    activeFieldName,
    setActiveFieldName,
    stringPreviewValues,
    setStringPreviewValues,
    participantRowVisibility,
    setParticipantRowVisibility,
    fieldTextColors,
    setFieldTextColors,
  }
}
