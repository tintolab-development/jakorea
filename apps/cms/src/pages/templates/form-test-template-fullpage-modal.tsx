import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import type { FileUploadResult } from '@/entities/application/api/file-upload-service'
import { TemplateFullpageModal } from '@/shared/components/template/template-fullpage-modal'
import {
  TemplateCustomFieldsForm,
  TEMPLATE_FIELD_ORG_LOGO_02,
} from '@/shared/components/template/template-custom-fields-form'
import { FormTestCertificatePreview } from './form-test-certificate-preview'
import { saveFormTestTemplateSettings } from './form-test-template-api'

export interface FormTestTemplateFullpageModalProps {
  open: boolean
  onClose: () => void
}

export function FormTestTemplateFullpageModal({ open, onClose }: FormTestTemplateFullpageModalProps) {
  /** 인증서 미리보기용 — 자식 폼도 같은 파일에 대해 별도 object URL을 쓰므로, 왼쪽 미리보기 URL은 상위에서만 생성·해제 */
  const [orgLogo02File, setOrgLogo02File] = useState<File | null>(null)
  const [orgLogo02PreviewSrc, setOrgLogo02PreviewSrc] = useState<string | undefined>()
  /** `fileUploadService` 업로드 결과 — 저장 시 서버에 넘길 URL 등 */
  const [logoUploadResults, setLogoUploadResults] = useState<Record<string, FileUploadResult>>({})
  /** 우측 카드에서 선택한 커스텀 필드 — 캔버스 점선 프레임 연동 */
  const [activeFieldName, setActiveFieldName] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setOrgLogo02File(null)
      setLogoUploadResults({})
      setActiveFieldName(null)
    }
  }, [open])

  useEffect(() => {
    if (!orgLogo02File) {
      setOrgLogo02PreviewSrc(undefined)
      return
    }
    const url = URL.createObjectURL(orgLogo02File)
    setOrgLogo02PreviewSrc(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [orgLogo02File])

  const handleSave = useCallback(async () => {
    const hideLoading = message.loading('저장 중…', 0)
    try {
      await saveFormTestTemplateSettings({
        orgLogo: logoUploadResults.orgLogo,
        orgLogo02: logoUploadResults.orgLogo02,
      })
      message.success('양식 설정이 저장되었습니다.')
    } catch {
      message.error('저장에 실패했습니다.')
    } finally {
      hideLoading()
    }
  }, [logoUploadResults])

  return (
    <TemplateFullpageModal
      className="form-test-template-fullpage-modal"
      open={open}
      onClose={onClose}
      title="봉사활동인증서"
      description="* 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다."
      templateTabType="issuance"
      onPreview={() => {
        message.info('미리보기는 준비 중입니다.')
      }}
      onSave={handleSave}
      onDownloadDocument={() => {
        message.info('문서 다운로드는 준비 중입니다.')
      }}
      leftContent={
        <FormTestCertificatePreview
          orgLogo02PreviewSrc={orgLogo02PreviewSrc}
          activeFieldName={activeFieldName}
        />
      }
      rightNavigation={
        <TemplateCustomFieldsForm
          onFieldClick={field => setActiveFieldName(field.name)}
          onLogoFileSelected={(fieldName, file) => {
            if (fieldName === TEMPLATE_FIELD_ORG_LOGO_02) setOrgLogo02File(file)
          }}
          onLogoUploadResult={(fieldName, result) => {
            setLogoUploadResults(prev => ({ ...prev, [fieldName]: result }))
          }}
        />
      }
    />
  )
}
