/**
 * 유관기관 로고 배너 수정 모달
 */

import { useCallback, useEffect, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { FooterRelatedLogo } from '@/entities/footer/model/types'
import {
  CmsButton,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  ContentModal,
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  FileSelectField,
  ThumbnailPlaceholder,
  FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  useCmsAlert,
} from '@/shared/ui'
import { HTTP_LINK_URL_FORMAT_ALERT, isValidHttpLinkUrl } from '@/shared/lib/http-link-url'

import './related-logo-form-modal.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_GUIDE_LINES = [
  '- 파일은 JPG, PNG 형식만 등록 가능하며, 최대 20MB까지 첨부할 수 있습니다.',
  '- 권장 배너 사이즈는 100 × 60px입니다.',
]

const MODAL_DESCRIPTION = [
  '유관기관의 로고 이미지와 텍스트를 설정해 주세요.',
  '기관명은 홈페이지에서 별도 노출되지 않습니다.',
].join('\n')

/** PUT FooterPartnerUpdateRequest.organizationName */
const ORGANIZATION_NAME_MAX_LENGTH = 200
/** PUT FooterPartnerUpdateRequest.externalUrl */
const EXTERNAL_URL_MAX_LENGTH = 2048

function coerceRadioBoolean(raw: unknown): boolean {
  if (raw === true || raw === 1) return true
  if (raw === false || raw === 0) return false
  if (typeof raw === 'string') {
    const s = raw.toLowerCase()
    if (s === 'true' || s === '1') return true
    if (s === 'false' || s === '0') return false
  }
  return Boolean(raw)
}

function isAllowedImageFile(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/jpeg' || type === 'image/png') return true
  const name = file.name.toLowerCase()
  return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}


export type RelatedLogoFormValues = {
  isActive: boolean
  name: string
  linkUrl: string
  logoUrl: string
  logoFileName?: string
  logoAssetId?: number
  logoFile?: File | null
}

type Props = {
  open: boolean
  initial: FooterRelatedLogo | null
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: RelatedLogoFormValues) => void
}

export function RelatedLogoFormModal({
  open,
  initial,
  confirmLoading = false,
  onCancel,
  onSubmit,
}: Props) {
  const { showAlert } = useCmsAlert()
  const [isActive, setIsActive] = useState(true)
  const [name, setName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFileName, setLogoFileName] = useState('')
  const [logoAssetId, setLogoAssetId] = useState<number | undefined>()
  const [logoFile, setLogoFile] = useState<File | null>(null)

  useEffect(() => {
    if (!open || !initial) return
    setIsActive(initial.isActive)
    setName(initial.name)
    setLinkUrl(initial.linkUrl)
    setLogoUrl(initial.logoUrl)
    setLogoFileName(initial.logoFileName ?? '')
    setLogoAssetId(initial.logoAssetId)
    setLogoFile(null)
  }, [open, initial])

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedImageFile(file)) {
        showAlert({
          title: '파일 형식 오류',
          content: '등록할 수 없는 파일 형식입니다.',
        })
        return
      }
      if (
        isFileSelectTotalSizeExceeded({
          incoming: [file],
          maxTotalBytes: FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
        })
      ) {
        notifyFileSelectTotalSizeExceeded(FILE_SELECT_IMAGE_MAX_TOTAL_BYTES)
        return
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        setLogoUrl(dataUrl)
        setLogoFileName(file.name)
        setLogoFile(file)
        setLogoAssetId(undefined)
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [showAlert]
  )

  const handleSubmit = useCallback(() => {
    const trimmedName = name.trim()
    const hasLogo = Boolean(logoUrl.trim() || logoFile || logoAssetId != null)
    // API: enabled+version 필수. enabled=true면 기관명·로고 필요. 연결 링크는 선택.
    if (isActive && (!trimmedName || !hasLogo)) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    const trimmedLink = linkUrl.trim()
    if (trimmedLink && !isValidHttpLinkUrl(trimmedLink)) {
      showAlert(HTTP_LINK_URL_FORMAT_ALERT)
      return
    }
    onSubmit({
      isActive,
      name: trimmedName,
      linkUrl: trimmedLink,
      logoUrl: logoUrl.trim(),
      logoFileName: logoFileName || undefined,
      logoAssetId: logoFile ? undefined : logoAssetId,
      logoFile,
    })
  }, [isActive, linkUrl, logoAssetId, logoFile, logoFileName, logoUrl, name, onSubmit, showAlert])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="유관기관 로고 배너 수정"
      description={MODAL_DESCRIPTION}
      size="default"
      className="footer-related-logo-form-modal"
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="h40"
            type="button"
            onClick={onCancel}
            disabled={confirmLoading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="h40"
            type="button"
            loading={confirmLoading}
            disabled={confirmLoading}
            onClick={handleSubmit}
          >
            저장
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm
        title="유관기관 로고"
        hideHeader
        mode="edit"
        className="footer-related-logo-form-modal__form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="사용 여부"
            required
            view={null}
            edit={
              <CmsRadioGroup
                size="medium"
                value={isActive}
                onChange={e => setIsActive(coerceRadioBoolean(e.target.value))}
              >
                <CmsRadio size="medium" value={true}>
                  사용
                </CmsRadio>
                <CmsRadio size="medium" value={false}>
                  미사용
                </CmsRadio>
              </CmsRadioGroup>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="로고 이미지"
            required
            view={null}
            edit={
              /* Figma 36:65433 Table / Common / Cell / File — 미리보기 72·모서리 8·흰 배경·간격 12 (공통 파일 칸) */
              <div className="file-select-image-cell">
                <div className="file-select-image-cell__preview">
                  {logoUrl ? <img src={logoUrl} alt="로고 미리보기" /> : <ThumbnailPlaceholder />}
                </div>
                <FileSelectField
                  multiple={false}
                  accept={IMAGE_ACCEPT}
                  buttonLabel="파일 추가"
                  fileNames={logoFileName ? [logoFileName] : []}
                  maxTotalBytes={FILE_SELECT_IMAGE_MAX_TOTAL_BYTES}
                  guideLines={IMAGE_GUIDE_LINES}
                  onFilesChange={files => {
                    void handleFilesChange(files)
                  }}
                  onRemoveFile={() => {
                    setLogoUrl('')
                    setLogoFileName('')
                    setLogoFile(null)
                    setLogoAssetId(undefined)
                  }}
                />
              </div>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="기관명"
            required
            view={null}
            edit={
              <CmsInput
                inputSize="small"
                width="100%"
                value={name}
                maxLength={ORGANIZATION_NAME_MAX_LENGTH}
                placeholder="기관명을 입력해 주세요"
                onChange={e => setName(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="연결 링크"
            view={null}
            edit={
              <CmsInput
                inputSize="small"
                width="100%"
                value={linkUrl}
                maxLength={EXTERNAL_URL_MAX_LENGTH}
                placeholder="연결할 주소를 입력해 주세요"
                onChange={e => setLinkUrl(e.target.value)}
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}
