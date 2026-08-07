/**
 * 사이트 정보 관리 — 조회/수정 폼
 */

import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { SiteInfo, SiteInfoSaveInput } from '@/entities/site-info/model/types'
import { useSaveSiteInfo } from '@/features/site-info/api/hooks'
import {
  CmsButton,
  CmsInput,
  FileSelectField,
  FILE_SELECT_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  useCmsAlert,
} from '@/shared/ui'

import './site-info-form.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const TOOLBAR_DESCRIPTION =
  '설정한 사이트명은 브라우저탭명에, 사이트 소개글은 링크 공유 시 설명 텍스트에 동일하게 적용됩니다.'

type Props = {
  data: SiteInfo
}

function cloneInfo(data: SiteInfo): SiteInfo {
  return {
    siteName: data.siteName,
    siteDescription: data.siteDescription,
    ogImageUrl: data.ogImageUrl,
    ogImageFileName: data.ogImageFileName,
    faviconUrl: data.faviconUrl,
    faviconFileName: data.faviconFileName,
    updatedAt: data.updatedAt,
  }
}

function toSaveInput(data: SiteInfo): SiteInfoSaveInput {
  return {
    siteName: data.siteName,
    siteDescription: data.siteDescription,
    ogImageUrl: data.ogImageUrl,
    ogImageFileName: data.ogImageFileName,
    faviconUrl: data.faviconUrl,
    faviconFileName: data.faviconFileName,
  }
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

function ImagePlaceholderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <rect x="6" y="10" width="36" height="28" rx="3" stroke="#BDBDBD" strokeWidth="2" />
      <circle cx="17" cy="20" r="3" fill="#BDBDBD" />
      <path
        d="M8 32L18 24L24 29L32 20L40 32"
        stroke="#BDBDBD"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TextView({ value }: { value: string }) {
  return <span className="site-info-form__text-view">{value || '-'}</span>
}

function ImageView({
  url,
  fileName,
  alt,
  variant = 'default',
}: {
  url: string
  fileName?: string
  alt: string
  variant?: 'default' | 'favicon'
}) {
  if (!url) {
    return <span className="site-info-form__text-view">-</span>
  }
  return (
    <div className="site-info-form__image-view">
      <div
        className={
          variant === 'favicon'
            ? 'site-info-form__preview site-info-form__preview--favicon'
            : 'site-info-form__preview'
        }
      >
        <img src={url} alt={alt} />
      </div>
      {fileName ? <span className="site-info-form__file-name">{fileName}</span> : null}
    </div>
  )
}

type ImageEditFieldProps = {
  imageUrl: string
  fileName: string
  alt: string
  variant?: 'default' | 'favicon'
  onChange: (url: string, fileName: string) => void
  onRemove: () => void
}

function ImageEditField({
  imageUrl,
  fileName,
  alt,
  variant = 'default',
  onChange,
  onRemove,
}: ImageEditFieldProps) {
  const { showAlert } = useCmsAlert()

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedImageFile(file)) {
        showAlert({
          title: '파일 형식 오류',
          content: 'JPG, PNG 형식의 이미지만 등록할 수 있습니다.',
        })
        return
      }
      if (
        isFileSelectTotalSizeExceeded({
          incoming: [file],
          maxTotalBytes: FILE_SELECT_MAX_TOTAL_BYTES,
        })
      ) {
        notifyFileSelectTotalSizeExceeded()
        return
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        onChange(dataUrl, file.name)
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [onChange, showAlert]
  )

  const previewClass =
    variant === 'favicon'
      ? 'site-info-form__preview site-info-form__preview--favicon'
      : 'site-info-form__preview'

  return (
    <div className="site-info-form__image-row">
      <div className={previewClass}>
        {imageUrl ? <img src={imageUrl} alt={alt} /> : <ImagePlaceholderIcon />}
      </div>
      <FileSelectField
        className="site-info-form__file-field"
        multiple={false}
        accept={IMAGE_ACCEPT}
        buttonLabel="파일 선택"
        fileNames={fileName ? [fileName] : []}
        onFilesChange={files => {
          void handleFilesChange(files)
        }}
        onRemoveFile={onRemove}
        guideLines={IMAGE_GUIDE_LINES}
      />
    </div>
  )
}

export function SiteInfoFormCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveSiteInfo()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<SiteInfo>(() => cloneInfo(data))
  const [nameError, setNameError] = useState<string | undefined>()

  const handleEdit = useCallback(() => {
    setDraft(cloneInfo(data))
    setNameError(undefined)
    setIsEditing(true)
  }, [data])

  const handleSave = useCallback(async () => {
    if (!draft.siteName.trim()) {
      setNameError('사이트명을 입력해 주세요.')
      showAlert({
        title: '필수 항목 누락',
        content: '사이트명을 입력해 주세요.',
      })
      return
    }
    setNameError(undefined)
    try {
      await saveMutation.mutateAsync(toSaveInput(draft))
      setIsEditing(false)
    } catch (error) {
      if (error instanceof Error && error.message === 'SITE_NAME_REQUIRED') {
        setNameError('사이트명을 입력해 주세요.')
        return
      }
      showAlert({
        title: '저장 실패',
        content: '사이트 정보 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draft, saveMutation, showAlert])

  const updateDraft = useCallback((patch: Partial<SiteInfoSaveInput>) => {
    setDraft(prev => ({ ...prev, ...patch }))
  }, [])

  const mode = isEditing ? 'edit' : 'view'
  const current = isEditing ? draft : data

  return (
    <div className="admin-list-card site-info-form-card">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">사이트 정보 관리</span>
          <span className="table-description">{TOOLBAR_DESCRIPTION}</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <CmsButton
              variant="primary"
              size="large"
              type="button"
              loading={saveMutation.isPending}
              disabled={saveMutation.isPending}
              onClick={() => {
                void handleSave()
              }}
            >
              저장
            </CmsButton>
          ) : (
            <CmsButton variant="primary" size="large" type="button" onClick={handleEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <div className="site-info-form-card__body">
        <DetailInfoForm
          title="사이트 정보"
          hideHeader
          mode={mode}
          className="site-info-form"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="사이트명"
              required
              view={<TextView value={current.siteName} />}
              edit={
                <div>
                  <CmsInput
                    inputSize="large"
                    width="100%"
                    placeholder="사이트명을 입력하세요"
                    value={draft.siteName}
                    onChange={e => {
                      updateDraft({ siteName: e.target.value })
                      if (e.target.value.trim()) setNameError(undefined)
                    }}
                  />
                  {nameError ? (
                    <p className="site-info-form__field-error" role="alert">
                      {nameError}
                    </p>
                  ) : null}
                </div>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="사이트 소개글"
              view={<TextView value={current.siteDescription} />}
              edit={
                <CmsInput
                  inputSize="large"
                  width="100%"
                  placeholder="사이트 소개글을 입력하세요"
                  value={draft.siteDescription}
                  onChange={e => updateDraft({ siteDescription: e.target.value })}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="링크 공유용 이미지"
              view={
                <ImageView
                  url={current.ogImageUrl}
                  fileName={current.ogImageFileName}
                  alt="링크 공유용 이미지"
                />
              }
              edit={
                <ImageEditField
                  imageUrl={draft.ogImageUrl}
                  fileName={draft.ogImageFileName ?? ''}
                  alt="링크 공유용 이미지 미리보기"
                  onChange={(url, fileName) =>
                    updateDraft({ ogImageUrl: url, ogImageFileName: fileName })
                  }
                  onRemove={() => updateDraft({ ogImageUrl: '', ogImageFileName: undefined })}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="브라우저탭 아이콘"
              view={
                <ImageView
                  url={current.faviconUrl}
                  fileName={current.faviconFileName}
                  alt="브라우저탭 아이콘"
                  variant="favicon"
                />
              }
              edit={
                <ImageEditField
                  imageUrl={draft.faviconUrl}
                  fileName={draft.faviconFileName ?? ''}
                  alt="브라우저탭 아이콘 미리보기"
                  variant="favicon"
                  onChange={(url, fileName) =>
                    updateDraft({ faviconUrl: url, faviconFileName: fileName })
                  }
                  onRemove={() => updateDraft({ faviconUrl: '', faviconFileName: undefined })}
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </div>
  )
}
