import { CloseOutlined, DownloadOutlined } from '@ant-design/icons'
import { type ChangeEvent, useCallback, useEffect, useId, useRef, useState } from 'react'
import crimeConsentDefaultImage from '@/assets/images/template/성범좌 경력 조회.png'
import {
  AGREEMENT_CRIME_TEMPLATE_CODE,
  parseAgreementCrimeConsentSettings,
  readImageFileAsDataUrl,
} from '@/features/template/lib/agreement-crime-consent-settings'
import { loadWritingFormTemplateDraft } from '@/features/template/lib/writing-form-template-local-save'
import { CRIME_CONSENT_DOCUMENT_MODAL_HEADER_TITLE } from '@/features/template/ui/template-management/crime-record-consent-document-fullpage-modal'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { CRIME_CONSENT_DOCUMENT_FILE_REQUIRED_ALERT_MESSAGE } from '@/shared/constants/messages'
import { downloadBlob } from '@/shared/utils/file-download'
import '@/features/template/ui/template-management/crime-record-consent-document-fullpage-modal.css'
import './member-consent-crime-modal.css'

const MEMBER_CONSENT_MODAL_Z_INDEX = 1200
const DEFAULT_DOWNLOAD_FILENAME = '성범죄_경력조회_동의서.png'

import type { MemberConsentCrimeDraftSnapshot } from '@/features/user/shared/lib/member-register-consent-write-snapshot'

export interface MemberConsentCrimeModalProps {
  open: boolean
  savedSnapshot?: MemberConsentCrimeDraftSnapshot | null
  onSnapshotSave?: (snapshot: MemberConsentCrimeDraftSnapshot) => void
  onClose: () => void
  onComplete: () => void
}

export function MemberConsentCrimeModal({
  open,
  savedSnapshot,
  onSnapshotSave,
  onClose,
  onComplete,
}: MemberConsentCrimeModalProps) {
  const { showAlert } = useCmsAlert()
  const iconMaskId = `member-crime-consent-pen-mask-${useId().replace(/:/g, '')}`
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [displaySrc, setDisplaySrc] = useState<string>(crimeConsentDefaultImage)
  const [replacementFileName, setReplacementFileName] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    if (savedSnapshot) {
      setDisplaySrc(savedSnapshot.displaySrc)
      setReplacementFileName(savedSnapshot.replacementFileName)
      setUploadedFile(savedSnapshot.file ?? null)
      setHasUploadedDocument(true)
      return
    }

    let cancelled = false
    setHasUploadedDocument(false)
    setReplacementFileName(null)
    setUploadedFile(null)
    void loadWritingFormTemplateDraft(AGREEMENT_CRIME_TEMPLATE_CODE).then(saved => {
      if (cancelled) return
      const settings = parseAgreementCrimeConsentSettings(saved?.settingsJson)
      if (settings.documentImageUrl != null) {
        setDisplaySrc(settings.documentImageUrl)
      } else {
        setDisplaySrc(crimeConsentDefaultImage)
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, savedSnapshot])

  const handlePickDocument = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    void readImageFileAsDataUrl(file).then(dataUrl => {
      setDisplaySrc(dataUrl)
      setReplacementFileName(file.name)
      setUploadedFile(file)
      setHasUploadedDocument(true)
    })
  }, [])

  const handleDownload = useCallback(async () => {
    try {
      const res = await fetch(displaySrc)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      const filename =
        replacementFileName && replacementFileName.trim() !== ''
          ? replacementFileName
          : DEFAULT_DOWNLOAD_FILENAME
      downloadBlob(blob, filename)
    } catch (error) {
      console.debug('memberConsentCrime download failed', error)
    }
  }, [displaySrc, replacementFileName])

  const handleSubmit = useCallback(() => {
    if (!hasUploadedDocument) {
      showAlert({
        title: '안내',
        content: CRIME_CONSENT_DOCUMENT_FILE_REQUIRED_ALERT_MESSAGE,
      })
      return
    }
    onSnapshotSave?.({
      displaySrc,
      replacementFileName,
      file: uploadedFile ?? undefined,
    })
    onComplete()
  }, [
    displaySrc,
    hasUploadedDocument,
    onComplete,
    onSnapshotSave,
    replacementFileName,
    showAlert,
    uploadedFile,
  ])

  return (
    <TealHeaderModal
      open={open}
      onCancel={onClose}
      title={CRIME_CONSENT_DOCUMENT_MODAL_HEADER_TITLE}
      size="full"
      hideHeader
      zIndex={MEMBER_CONSENT_MODAL_Z_INDEX}
      className="crime-consent-doc-modal member-consent-crime-modal"
    >
      <div className="crime-consent-doc-modal__layout">
        <header className="crime-consent-doc-modal__topbar">
          <div className="crime-consent-doc-modal__title-row">
            <span className="crime-consent-doc-modal__title-text">
              {CRIME_CONSENT_DOCUMENT_MODAL_HEADER_TITLE}
            </span>
            <svg
              className="crime-consent-doc-modal__title-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
            >
              <g opacity="0.4">
                <mask
                  id={iconMaskId}
                  className="crime-consent-doc-modal__pen-mask"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="28"
                  height="28"
                >
                  <rect width="28" height="28" fill="#D9D9D9" />
                </mask>
                <g mask={`url(#${iconMaskId})`}>
                  <path
                    d="M4.08203 28.0007C3.60486 28.0007 3.19391 27.8301 2.84916 27.4891C2.50441 27.148 2.33203 26.7352 2.33203 26.2507C2.33203 25.7735 2.50441 25.3625 2.84916 25.0178C3.19391 24.673 3.60486 24.5007 4.08203 24.5007H23.9154C24.3925 24.5007 24.8035 24.6712 25.1482 25.0123C25.493 25.3533 25.6654 25.7661 25.6654 26.2507C25.6654 26.7278 25.493 27.1388 25.1482 27.4835C24.8035 27.8283 24.3925 28.0007 23.9154 28.0007H4.08203ZM6.9987 19.1498H8.44128L18.1246 9.48422L17.3911 8.73959L16.6642 8.02384L6.9987 17.7072V19.1498ZM5.2487 19.8451V17.4021C5.2487 17.2615 5.27223 17.1276 5.31928 17.0005C5.36653 16.8733 5.4447 16.7551 5.55378 16.6458L18.3267 3.9023C18.4957 3.73333 18.6875 3.60548 18.9022 3.51876C19.1167 3.43203 19.3383 3.38867 19.5672 3.38867C19.8036 3.38867 20.0284 3.43203 20.2415 3.51876C20.4546 3.60548 20.6517 3.73935 20.8327 3.92038L22.2348 5.34051C22.4158 5.50948 22.5467 5.70237 22.6274 5.91917C22.7083 6.13617 22.7487 6.3628 22.7487 6.59905C22.7487 6.81605 22.7083 7.03178 22.6274 7.24626C22.5467 7.46092 22.4158 7.65877 22.2348 7.8398L9.49128 20.5833C9.382 20.6926 9.26388 20.7726 9.13691 20.8233C9.00974 20.8743 8.87586 20.8998 8.73528 20.8998H6.30336C6.00256 20.8998 5.75163 20.7991 5.55057 20.5979C5.34932 20.3968 5.2487 20.1459 5.2487 19.8451ZM18.1246 9.48422L17.3911 8.73959L16.6642 8.02384L18.1246 9.48422Z"
                    fill="#3D3D3D"
                  />
                </g>
              </g>
            </svg>
          </div>
          <button
            type="button"
            className="crime-consent-doc-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseOutlined />
          </button>
        </header>

        <div className="crime-consent-doc-modal__body">
          <div className="crime-consent-doc-modal__toolbar">
            <div className="crime-consent-doc-modal__notice-wrap">
              <p className="crime-consent-doc-modal__notice">
                동의서 문서를 업로드한 후 제출해 주세요. 제출까지 완료되어야 동의된 것으로 간주됩니다.
              </p>
            </div>
            <div className="crime-consent-doc-modal__actions member-consent-crime-modal__actions">
              <CmsButton variant="secondary" size="medium" onClick={onClose}>
                닫기
              </CmsButton>
              <CmsButton
                variant="secondary"
                size="medium"
                icon={<DownloadOutlined />}
                onClick={() => void handleDownload()}
                className="crime-consent-doc-modal__download-btn"
              >
                문서 다운로드
              </CmsButton>
              <CmsButton variant="primary" size="medium" onClick={handlePickDocument}>
                문서 업로드
              </CmsButton>
              <CmsButton variant="primary" size="medium" width={140} onClick={handleSubmit}>
                제출
              </CmsButton>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="crime-consent-doc-modal__visually-hidden-file"
            onChange={handleFileChange}
            aria-label="동의서 문서 이미지 선택"
          />

          <div className="crime-consent-doc-modal__a4-outer">
            <img
              className="crime-consent-doc-modal__a4-img"
              src={displaySrc}
              alt={CRIME_CONSENT_DOCUMENT_MODAL_HEADER_TITLE}
              width={1146}
              height={1618}
            />
          </div>
        </div>
      </div>
    </TealHeaderModal>
  )
}
