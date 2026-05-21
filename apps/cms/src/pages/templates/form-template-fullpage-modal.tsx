import { useCallback, useRef, useState } from 'react'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import {
  type TemplateCustomFieldDef,
  TemplateCustomFieldsForm,
  TEMPLATE_FIELD_CERTIFICATE_BACKGROUND,
  TEMPLATE_FIELD_CHAIRMAN_SEAL,
  TEMPLATE_FIELD_ORG_LOGO,
  TEMPLATE_FIELD_ORG_LOGO_02,
} from '@/features/template/ui/template-management/template-custom-fields-form'
import { TemplatePreviewPageNavigator } from '@/features/template/ui/modal/template-preview-page-navigator'
import { generateFilename } from '@/shared/utils/file-download'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import {
  FormCertificatePreview,
  FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS,
} from './form-certificate-preview'
import { FormCertificatePdfExportOverlay } from './form-certificate-pdf-export-overlay'
import { saveFormTemplateSettings } from './form-template-api'
import { useFormCertificatePdfDownload } from './use-form-certificate-pdf-download'
import { useFormCertificatePreviewProps } from './use-form-certificate-preview-props'
import { useFormTemplateCertificateModalState } from './use-form-template-certificate-modal-state'
import '@/features/template/ui/modal/template-preview-modal.css'

export interface FormTemplateFullpageModalProps {
  open: boolean
  onClose: () => void
  title?: string
  initialStringValues?: Record<string, string>
  issueDate?: Date
  buildFilenameTitle?: string
}

export function FormTemplateFullpageModal({
  open,
  onClose,
  title = '봉사활동인증서',
  initialStringValues,
  issueDate,
  buildFilenameTitle,
}: FormTemplateFullpageModalProps) {
  const modalState = useFormTemplateCertificateModalState(open, initialStringValues)
  const {
    setOrgLogoFile,
    setOrgLogo02File,
    setCertificateBackgroundFile,
    setChairmanSealFile,
    logoUploadResults,
    setLogoUploadResults,
    activeFieldName,
    setActiveFieldName,
    setStringPreviewValues,
    participantRowVisibility,
    setParticipantRowVisibility,
  } = modalState

  const { interactive: certificatePreviewProps, pdfExport: certificatePdfExportProps } =
    useFormCertificatePreviewProps(modalState, issueDate)

  const pdfExportCanvasRef = useRef<HTMLDivElement>(null)
  const [certificatePreviewOpen, setCertificatePreviewOpen] = useState(false)
  const buildPdfFilename = useCallback(
    () => generateFilename(buildFilenameTitle ?? title, 'pdf'),
    [buildFilenameTitle, title]
  )

  const { downloadPdf, isDownloading: isPdfDownloading } = useFormCertificatePdfDownload({
    exportRootRef: pdfExportCanvasRef,
    buildFilename: buildPdfFilename,
  })

  const handlePreview = useCallback(() => {
    setCertificatePreviewOpen(true)
  }, [])

  const handleSave = useCallback(async () => {
    try {
      await saveFormTemplateSettings({
        orgLogo: logoUploadResults.orgLogo,
        orgLogo02: logoUploadResults.orgLogo02,
        certificateBackground: logoUploadResults.certificateBackground,
        chairmanSeal: logoUploadResults.chairmanSeal,
      })
    } catch {
      // 무음 처리
    }
  }, [logoUploadResults])

  return (
    <>
    <FormCertificatePdfExportOverlay visible={isPdfDownloading} />
    <TealHeaderModal
      open={certificatePreviewOpen}
      onCancel={() => setCertificatePreviewOpen(false)}
      title=""
      size="full"
      hideHeader
      className="template-preview-modal template-preview-modal--form-layout teal-header-modal--full form-certificate-user-preview-modal"
      zIndex={1100}
    >
      <div className="template-preview-modal__shell">
        <header className="template-preview-modal__title-row">
          <div className="template-preview-modal__title-left">
            <span className="template-preview-modal__title-text">{title}</span>
            <span className="template-preview-modal__badge">미리보기</span>
          </div>
        </header>

        <div className="template-preview-modal__body">
          <div className="template-preview-modal__notice">
            <div className="template-preview-modal__notice-text-wrap">
              <p className="template-preview-modal__notice-text">
                현재 화면은 미리보기 화면입니다.
              </p>
            </div>
            <button
              type="button"
              className="template-preview-modal__notice-close-btn"
              onClick={() => setCertificatePreviewOpen(false)}
            >
              미리보기 닫기
            </button>
          </div>

          <div className="template-preview-modal__pages">
            <div className="template-preview-modal__a4-stage">
              <div className="template-preview-modal__a4-stack">
                <div className="template-preview-modal__a4-frame">
                  <div className="template-preview-modal__a4-scale-inner">
                    <FormCertificatePreview {...certificatePdfExportProps} />
                  </div>
                </div>
              </div>
              <TemplatePreviewPageNavigator currentPage={1} totalPages={1} onPageChange={() => {}} />
            </div>
          </div>
        </div>
      </div>
    </TealHeaderModal>
    <TemplateFullpageModal
      className="form-template-fullpage-modal"
      open={open}
      onClose={onClose}
      title={title}
      description="* 해당 폼은 기존 항목의 삭제가 불가하며, 수정에 제한이 있습니다."
      templateTabType="issuance"
      onPreview={handlePreview}
      onSave={handleSave}
      onDownloadDocument={downloadPdf}
      downloadDocumentLoading={isPdfDownloading}
      leftContent={
        <>
          <FormCertificatePreview {...certificatePreviewProps} />
          <div className={FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS} aria-hidden>
            <FormCertificatePreview {...certificatePdfExportProps} canvasRef={pdfExportCanvasRef} />
          </div>
        </>
      }
      rightNavigation={
        <TemplateCustomFieldsForm
          key={open ? `form-template-fields-${title}` : 'form-template-fields-closed'}
          initialStringValues={initialStringValues}
          selectedFieldName={activeFieldName}
          onFieldClick={field => setActiveFieldName(field?.name ?? null)}
          onSecondaryValueChange={(field: TemplateCustomFieldDef, value: string) => {
            setStringPreviewValues(prev => ({ ...prev, [field.name]: value }))
          }}
          onLogoFileSelected={(fieldName, file) => {
            if (fieldName === TEMPLATE_FIELD_ORG_LOGO) setOrgLogoFile(file)
            if (fieldName === TEMPLATE_FIELD_ORG_LOGO_02) setOrgLogo02File(file)
            if (fieldName === TEMPLATE_FIELD_CERTIFICATE_BACKGROUND) setCertificateBackgroundFile(file)
            if (fieldName === TEMPLATE_FIELD_CHAIRMAN_SEAL) setChairmanSealFile(file)
          }}
          onLogoUploadResult={(fieldName, result) => {
            setLogoUploadResults(prev => ({ ...prev, [fieldName]: result }))
          }}
          participantRowVisibility={participantRowVisibility}
          onParticipantRowVisibilityChange={(index, checked) => {
            setParticipantRowVisibility(prev => {
              const next = [...prev]
              next[index] = checked
              return next
            })
          }}
        />
      }
    />
    </>
  )
}
