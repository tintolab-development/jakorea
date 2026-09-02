import { CloseOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildCertificateFormSettings,
  EMPTY_CERTIFICATE_SCHEMA_DRAFT,
} from '@/features/template/lib/certificate-form-settings'
import { useFormTemplateSaveFeedback } from '@/features/template/lib/form-template-save-feedback'
import { useCertificateTemplateModalState } from '@/features/template/hooks/use-certificate-template-modal-state'
import { persistWritingFormTemplateDraft } from '@/features/template/lib/writing-form-template-local-save'
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
import { CmsButton } from '@/shared/ui/cms-button'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { downloadIssuedCertificatePdf } from '@/features/program/shared/lib/apply-allocated-serial-for-pdf-capture'
import { getCertificateSerialAllocateErrorMessage } from '@/features/program/shared/api/certificate-serial-api'
import {
  CERTIFICATE_SERIAL_ISSUANCE_FORM_TEMPLATE,
  isAllowedCertificateSerialType,
  parseCertificateSerialInt64,
} from '@/features/program/shared/lib/certificate-serial'
import {
  FormCertificatePreview,
  FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS,
} from './form-certificate-preview'
import { FormCertificateEditScaleViewport } from './form-certificate-edit-scale-viewport'
import { FormCertificatePdfExportOverlay } from './form-certificate-pdf-export-overlay'
import { useFormCertificatePdfDownload } from './use-form-certificate-pdf-download'
import { useFormCertificatePreviewProps } from './use-form-certificate-preview-props'
import '@/features/template/ui/modal/template-preview-modal.css'

export interface FormTemplateFullpageModalProps {
  open: boolean
  onClose: () => void
  title?: string
  templateCode?: string
  onSaveConfirmed?: () => void
  initialStringValues?: Record<string, string>
  issueDate?: Date
  buildFilenameTitle?: string
  /** 프로그램 실발급 키. 없으면 양식 관리 샘플로 시퀀스만 발급 */
  serialProgramId?: string | number | null
  serialParticipantId?: string | number | null
}

export function FormTemplateFullpageModal({
  open,
  onClose,
  title = '봉사활동인증서',
  templateCode,
  onSaveConfirmed,
  initialStringValues,
  issueDate,
  buildFilenameTitle,
  serialProgramId,
  serialParticipantId,
}: FormTemplateFullpageModalProps) {
  const { showSaveSuccess, showSaveFailure } = useFormTemplateSaveFeedback()
  const { showAlert } = useCmsAlert()

  const modalState = useCertificateTemplateModalState({
    open,
    templateCode,
    fallbackTitleName: title,
    prefillStringValues: initialStringValues,
  })

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
    stringPreviewValues,
    initialLogoPreviewUrls,
    isTemplateSettingsLoaded,
  } = modalState

  const pdfExportCanvasRef = useRef<HTMLDivElement>(null)
  const [certificatePreviewOpen, setCertificatePreviewOpen] = useState(false)
  const [pdfSerialNumber, setPdfSerialNumber] = useState<string | undefined>()
  const [isAllocatingSerial, setIsAllocatingSerial] = useState(false)

  const { interactive: certificatePreviewProps, pdfExport: certificatePdfExportProps } =
    useFormCertificatePreviewProps(modalState, issueDate, pdfSerialNumber)

  useEffect(() => {
    if (!open) {
      setCertificatePreviewOpen(false)
      setPdfSerialNumber(undefined)
    }
  }, [open])

  const buildPdfFilename = useCallback(
    () => generateFilename(buildFilenameTitle ?? title, 'pdf'),
    [buildFilenameTitle, title]
  )

  const { downloadPdf, isDownloading: isPdfDownloading } = useFormCertificatePdfDownload({
    exportRootRef: pdfExportCanvasRef,
    buildFilename: buildPdfFilename,
  })

  const handleDownloadDocument = useCallback(async () => {
    if (isAllocatingSerial || isPdfDownloading) return
    setIsAllocatingSerial(true)
    try {
      if (templateCode != null && isAllowedCertificateSerialType(templateCode)) {
        const programId = parseCertificateSerialInt64(serialProgramId)
        const participantId = parseCertificateSerialInt64(serialParticipantId)
        await downloadIssuedCertificatePdf({
          subject:
            programId != null && participantId != null
              ? {
                  programId,
                  subjectId: participantId,
                  certificateType: templateCode,
                }
              : {
                  certificateType: templateCode,
                  issuanceSource: CERTIFICATE_SERIAL_ISSUANCE_FORM_TEMPLATE,
                },
          applySerial: setPdfSerialNumber,
          exportRoot: pdfExportCanvasRef.current,
          getExportRoot: () => pdfExportCanvasRef.current,
          downloadPdf,
        })
        return
      }
      await downloadPdf()
    } catch (error) {
      showAlert({
        title: '안내',
        content: getCertificateSerialAllocateErrorMessage(error),
      })
    } finally {
      setIsAllocatingSerial(false)
    }
  }, [
    downloadPdf,
    isAllocatingSerial,
    isPdfDownloading,
    serialParticipantId,
    serialProgramId,
    showAlert,
    templateCode,
  ])

  const handlePreview = useCallback(() => {
    setCertificatePreviewOpen(true)
  }, [])

  const handleClosePreview = useCallback(() => {
    setCertificatePreviewOpen(false)
  }, [])

  const handleSave = useCallback(() => {
    if (templateCode == null || templateCode === '') return

    void (async () => {
      try {
        await persistWritingFormTemplateDraft({
          templateId: templateCode,
          draft: EMPTY_CERTIFICATE_SCHEMA_DRAFT,
          settingsJson: buildCertificateFormSettings({
            stringPreviewValues,
            logoUploadResults,
            participantRowVisibility,
          }),
        })
        showSaveSuccess(onSaveConfirmed)
      } catch (error) {
        console.debug('certificateFormTemplate save failed', error)
        showSaveFailure()
      }
    })()
  }, [
    logoUploadResults,
    onSaveConfirmed,
    participantRowVisibility,
    showSaveFailure,
    showSaveSuccess,
    stringPreviewValues,
    templateCode,
  ])

  const customFieldsFormKey = open
    ? `form-template-fields-${title}-${templateCode ?? 'local'}-${isTemplateSettingsLoaded ? 'loaded' : 'pending'}`
    : 'form-template-fields-closed'

  return (
    <>
    <FormCertificatePdfExportOverlay visible={isPdfDownloading || isAllocatingSerial} />
    <TealHeaderModal
      open={open && certificatePreviewOpen}
      onCancel={handleClosePreview}
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
          <button
            type="button"
            className="template-preview-modal__title-close"
            onClick={handleClosePreview}
            aria-label="닫기"
          >
            <CloseOutlined />
          </button>
        </header>

        <div className="template-preview-modal__body">
          <div className="template-preview-modal__notice-wrap">
            <div className="template-preview-modal__notice">
              <span className="template-preview-modal__notice-text">
                현재 화면은 미리보기 화면입니다.
              </span>
              <div className="template-preview-modal__notice-actions">
                <CmsButton
                  type="button"
                  variant="secondary"
                  size="large"
                  width={140}
                  className="template-preview-modal__notice-close-btn"
                  onClick={handleClosePreview}
                >
                  미리보기 닫기
                </CmsButton>
              </div>
            </div>
          </div>

          <div className="template-preview-modal__pages">
            <div className="template-preview-modal__a4-stage">
              <div className="template-preview-modal__a4-stack">
                <div className="template-preview-modal__a4-frame">
                  <div className="template-preview-modal__a4-scale-inner">
                    <FormCertificatePreview {...certificatePdfExportProps} serialNumber={undefined} />
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
      onDownloadDocument={() => {
        void handleDownloadDocument()
      }}
      downloadDocumentLoading={isPdfDownloading || isAllocatingSerial}
      leftContent={
        <>
          <FormCertificateEditScaleViewport>
            <FormCertificatePreview {...certificatePreviewProps} />
          </FormCertificateEditScaleViewport>
          <div className={FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS} aria-hidden>
            <FormCertificatePreview {...certificatePdfExportProps} canvasRef={pdfExportCanvasRef} />
          </div>
        </>
      }
      rightNavigation={
        <TemplateCustomFieldsForm
          key={customFieldsFormKey}
          initialStringValues={stringPreviewValues}
          initialLogoPreviewUrls={initialLogoPreviewUrls}
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
