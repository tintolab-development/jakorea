/**
 * 사이트 정보 관리 — 조회/수정 폼
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { SiteInfo, SiteInfoSaveInput } from '@/entities/site-info/model/types'
import { useSaveSiteInfo } from '@/features/site-info/api/hooks'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  CmsButton,
  CmsInput,
  FileSelectField,
  FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  showUpdateCompletedAlert,
  useCmsAlert,
  ThumbnailPlaceholder,
} from '@/shared/ui'

import './site-info-form.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_GUIDE_LINES = [
  '- 파일은 JPG, PNG 형식만 등록 가능하며, 최대 20MB까지 첨부할 수 있습니다.',
]

const TOOLBAR_DESCRIPTION =
  '설정한 사이트명은 브라우저탭명에, 사이트 소개글은 링크 공유 시 설명 텍스트에 동일하게 적용됩니다.'

type Props = {
  data: SiteInfo
}

type DraftState = SiteInfo & {
  ogImageFile?: File | null
  faviconFile?: File | null
}

function cloneInfo(data: SiteInfo): DraftState {
  return {
    siteName: data.siteName,
    siteDescription: data.siteDescription,
    ogImageUrl: data.ogImageUrl,
    ogImageFileName: data.ogImageFileName,
    ogAssetId: data.ogAssetId,
    ogImageFile: null,
    faviconUrl: data.faviconUrl,
    faviconFileName: data.faviconFileName,
    faviconAssetId: data.faviconAssetId,
    faviconFile: null,
    updatedAt: data.updatedAt,
    version: data.version,
  }
}

function toSaveInput(data: DraftState): SiteInfoSaveInput {
  return {
    siteName: data.siteName,
    siteDescription: data.siteDescription,
    ogImageUrl: data.ogImageUrl,
    ogImageFileName: data.ogImageFileName,
    ogAssetId: data.ogImageFile ? undefined : data.ogAssetId,
    ogImageFile: data.ogImageFile,
    faviconUrl: data.faviconUrl,
    faviconFileName: data.faviconFileName,
    faviconAssetId: data.faviconFile ? undefined : data.faviconAssetId,
    faviconFile: data.faviconFile,
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


const SiteInfoTextField = memo(function SiteInfoTextField({
  sourceValue,
  isEditing,
  placeholder,
  ariaLabel,
  error,
  onDraftChange,
  onClearError,
}: {
  sourceValue: string
  isEditing: boolean
  placeholder: string
  ariaLabel: string
  error?: string
  onDraftChange: (value: string) => void
  onClearError?: () => void
}) {
  const [localValue, setLocalValue] = useState(sourceValue)

  useEffect(() => {
    if (isEditing) return
    setLocalValue(sourceValue)
  }, [isEditing, sourceValue])

  return (
    <div>
      <CmsInput
        className={
          isEditing
            ? 'site-info-inline-field site-info-inline-field--edit'
            : 'site-info-inline-field site-info-inline-field--readonly'
        }
        inputSize="small"
        width="100%"
        placeholder={placeholder}
        value={localValue}
        readOnly={!isEditing}
        tabIndex={isEditing ? 0 : -1}
        aria-label={ariaLabel}
        onChange={e => {
          if (!isEditing) return
          const next = e.target.value
          setLocalValue(next)
          onDraftChange(next)
          if (error && next.trim()) onClearError?.()
        }}
      />
      {error ? (
        <p className="site-info-form__field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})

/** 조회: Figma 230:3424 — 테두리 없이 이미지 그대로(링크 공유 이미지 높이 60 · 탭 아이콘 30×30), 파일명 없음 */
function ImageView({
  url,
  alt,
  variant = 'default',
}: {
  url: string
  alt: string
  variant?: 'default' | 'favicon'
}) {
  if (!url) {
    return <span className="site-info-form__text-view">-</span>
  }
  return (
    <div className="site-info-form__image-view">
      <img
        className={
          variant === 'favicon'
            ? 'site-info-form__view-image site-info-form__view-image--favicon'
            : 'site-info-form__view-image'
        }
        src={url}
        alt={alt}
      />
    </div>
  )
}

type ImageEditFieldProps = {
  imageUrl: string
  fileName: string
  alt: string
  variant?: 'default' | 'favicon'
  onChange: (url: string, fileName: string, file: File) => void
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
        onChange(dataUrl, file.name, file)
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [onChange, showAlert]
  )

  return (
    /* Figma 2100:61384·2100:61385 Table / Common / Cell / File — 공통 파일 칸(미리보기 72 · 간격 12 · 파일 추가) */
    <div className="file-select-image-cell">
      <div className="file-select-image-cell__preview">
        {imageUrl ? <img src={imageUrl} alt={alt} /> : <ThumbnailPlaceholder />}
      </div>
      <FileSelectField
        multiple={false}
        accept={IMAGE_ACCEPT}
        buttonLabel="파일 추가"
        fileNames={fileName ? [fileName] : []}
        onFilesChange={files => {
          void handleFilesChange(files)
        }}
        onRemoveFile={onRemove}
        guideLines={[
          ...IMAGE_GUIDE_LINES,
          `- 권장 ${variant === 'favicon' ? '아이콘' : '이미지'} 사이즈는 ${
            variant === 'favicon' ? '512 × 512px' : '1200 × 630px'
          }입니다.`,
        ]}
        maxTotalBytes={FILE_SELECT_IMAGE_MAX_TOTAL_BYTES}
      />
    </div>
  )
}

export function SiteInfoFormCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveSiteInfo()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<DraftState>(() => cloneInfo(data))
  const [nameError, setNameError] = useState<string | undefined>()
  const textDraftRef = useRef({ siteName: data.siteName, siteDescription: data.siteDescription })

  useEffect(() => {
    if (isEditing) return
    textDraftRef.current = { siteName: data.siteName, siteDescription: data.siteDescription }
  }, [data.siteDescription, data.siteName, isEditing])

  const handleEdit = useCallback(() => {
    textDraftRef.current = { siteName: data.siteName, siteDescription: data.siteDescription }
    setDraft(cloneInfo(data))
    setNameError(undefined)
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    textDraftRef.current = { siteName: data.siteName, siteDescription: data.siteDescription }
    setDraft(cloneInfo(data))
    setNameError(undefined)
    setIsEditing(false)
  }, [data])

  const handleSiteNameChange = useCallback((value: string) => {
    textDraftRef.current = { ...textDraftRef.current, siteName: value }
  }, [])

  const handleSiteDescriptionChange = useCallback((value: string) => {
    textDraftRef.current = { ...textDraftRef.current, siteDescription: value }
  }, [])

  const clearNameError = useCallback(() => {
    setNameError(undefined)
  }, [])

  const handleSave = useCallback(async () => {
    const siteName = textDraftRef.current.siteName
    const siteDescription = textDraftRef.current.siteDescription
    if (!siteName.trim()) {
      setNameError('사이트명을 입력해 주세요.')
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    if (!siteDescription.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    const hasOgImage = Boolean(draft.ogImageUrl.trim() || draft.ogImageFile || draft.ogAssetId)
    const hasFavicon = Boolean(draft.faviconUrl.trim() || draft.faviconFile || draft.faviconAssetId)
    if (!hasOgImage || !hasFavicon) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    setNameError(undefined)
    try {
      await saveMutation.mutateAsync(toSaveInput({ ...draft, siteName, siteDescription }))
      setIsEditing(false)
      showUpdateCompletedAlert()
    } catch (error) {
      if (error instanceof Error && error.message === 'SITE_NAME_REQUIRED') {
        showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
        return
      }
      showAlert({
        title: '저장 실패',
        content: '사이트 정보 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draft, saveMutation, showAlert])

  const updateDraft = useCallback((patch: Partial<DraftState>) => {
    setDraft(prev => ({ ...prev, ...patch }))
  }, [])

  const image = isEditing ? draft : data

  return (
    <div className="admin-list-card site-info-form-card">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title-20">사이트 정보 관리</span>
          <span className="table-description">{TOOLBAR_DESCRIPTION}</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="medium"
                type="button"
                onClick={handleCancel}
                disabled={saveMutation.isPending}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="medium"
                type="button"
                loading={saveMutation.isPending}
                disabled={saveMutation.isPending}
                onClick={() => {
                  void handleSave()
                }}
              >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton variant="primary" size="medium" type="button" onClick={handleEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <div className="site-info-form-card__body">
        <DetailInfoForm title="사이트 정보" hideHeader mode="edit" className="site-info-form">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="사이트명"
              required={isEditing}
              view={null}
              edit={
                <SiteInfoTextField
                  sourceValue={data.siteName}
                  isEditing={isEditing}
                  placeholder="사이트명을 입력해 주세요"
                  ariaLabel="사이트명"
                  error={nameError}
                  onDraftChange={handleSiteNameChange}
                  onClearError={clearNameError}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="사이트 소개글"
              required={isEditing}
              view={null}
              edit={
                <SiteInfoTextField
                  sourceValue={data.siteDescription}
                  isEditing={isEditing}
                  placeholder="사이트 소개글을 입력해 주세요"
                  ariaLabel="사이트 소개글"
                  onDraftChange={handleSiteDescriptionChange}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="링크 공유용 이미지"
              required={isEditing}
              view={null}
              edit={
                isEditing ? (
                  <ImageEditField
                    imageUrl={draft.ogImageUrl}
                    fileName={draft.ogImageFileName ?? ''}
                    alt="링크 공유용 이미지 미리보기"
                    onChange={(url, fileName, file) =>
                      updateDraft({
                        ogImageUrl: url,
                        ogImageFileName: fileName,
                        ogImageFile: file,
                        ogAssetId: undefined,
                      })
                    }
                    onRemove={() =>
                      updateDraft({
                        ogImageUrl: '',
                        ogImageFileName: undefined,
                        ogImageFile: null,
                        ogAssetId: undefined,
                      })
                    }
                  />
                ) : (
                  <ImageView url={image.ogImageUrl} alt="링크 공유용 이미지" />
                )
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="브라우저탭 아이콘"
              required={isEditing}
              view={null}
              edit={
                isEditing ? (
                  <ImageEditField
                    imageUrl={draft.faviconUrl}
                    fileName={draft.faviconFileName ?? ''}
                    alt="브라우저탭 아이콘 미리보기"
                    variant="favicon"
                    onChange={(url, fileName, file) =>
                      updateDraft({
                        faviconUrl: url,
                        faviconFileName: fileName,
                        faviconFile: file,
                        faviconAssetId: undefined,
                      })
                    }
                    onRemove={() =>
                      updateDraft({
                        faviconUrl: '',
                        faviconFileName: undefined,
                        faviconFile: null,
                        faviconAssetId: undefined,
                      })
                    }
                  />
                ) : (
                  <ImageView url={image.faviconUrl} alt="브라우저탭 아이콘" variant="favicon" />
                )
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </div>
  )
}
