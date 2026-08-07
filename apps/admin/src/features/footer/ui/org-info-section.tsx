/**
 * 푸터 — 기관 정보
 */

import { useCallback, useEffect, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { FooterOrgInfo } from '@/entities/footer/model/types'
import { useFooterOrgInfo, useSaveFooterOrgInfo } from '@/features/footer/api/hooks'
import {
  CmsButton,
  CmsInput,
  FileSelectField,
  FILE_SELECT_MAX_TOTAL_BYTES,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  PageContentLoading,
  useCmsAlert,
} from '@/shared/ui'

import './org-info-section.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 권장 로고 사이즈는 195*60입니다.',
]

function fieldClass(isEditing: boolean) {
  return [
    'footer-org-inline-field',
    isEditing ? 'footer-org-inline-field--edit' : 'footer-org-inline-field--readonly',
  ].join(' ')
}

function cloneOrg(data: FooterOrgInfo): FooterOrgInfo {
  return { ...data }
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

export function FooterOrgInfoSection() {
  const { showAlert } = useCmsAlert()
  const query = useFooterOrgInfo()
  const saveMutation = useSaveFooterOrgInfo()
  const data = query.data

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<FooterOrgInfo | null>(null)

  useEffect(() => {
    if (!isEditing && data) {
      setDraft(cloneOrg(data))
    }
  }, [data, isEditing])

  const handleEdit = useCallback(() => {
    if (data) setDraft(cloneOrg(data))
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    if (data) setDraft(cloneOrg(data))
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    if (!draft) return
    if (!draft.name.trim()) {
      showAlert({ title: '입력 확인', content: '기관명을 입력해 주세요.' })
      return
    }
    if (!draft.email.trim()) {
      showAlert({ title: '입력 확인', content: '이메일을 입력해 주세요.' })
      return
    }
    try {
      await saveMutation.mutateAsync(draft)
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: '기관 정보 저장에 실패했습니다. 다시 시도해 주세요.',
      })
      void query.refetch()
    }
  }, [draft, query, saveMutation, showAlert])

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file || !draft) return
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
        setDraft(prev =>
          prev ? { ...prev, logoUrl: dataUrl, logoFileName: file.name } : prev
        )
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [draft, showAlert]
  )

  if (query.isLoading || !draft) {
    return (
      <section className="footer-org-section footer-org-section--loading">
        <PageContentLoading variant="default" />
      </section>
    )
  }

  if (!data) {
    return (
      <section className="footer-org-section page-content-error" role="alert">
        콘텐츠를 불러오지 못했습니다.
      </section>
    )
  }

  const patch = (partial: Partial<FooterOrgInfo>) => {
    if (!isEditing) return
    setDraft(prev => (prev ? { ...prev, ...partial } : prev))
  }

  return (
    <section
      className={
        isEditing
          ? 'footer-org-section footer-org-section--editing'
          : 'footer-org-section'
      }
    >
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">기관 정보</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="large"
                type="button"
                onClick={handleCancel}
                disabled={saveMutation.isPending}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="large"
                type="button"
                loading={saveMutation.isPending}
                onClick={() => {
                  void handleSave()
                }}
              >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton variant="primary" size="large" type="button" onClick={handleEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <div className="footer-org-section__body">
        <DetailInfoForm
          className="footer-org-section__form"
          title="기관 정보"
          hideHeader
          mode="edit"
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="기관명"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draft.name}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => patch({ name: e.target.value })}
                />
              }
            />
            <DetailInfoForm.Field
              label="기관 소재지"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draft.address}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => patch({ address: e.target.value })}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="우편번호"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draft.zipCode}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => patch({ zipCode: e.target.value })}
                />
              }
            />
            <DetailInfoForm.Field
              label="대표"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draft.representative}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => patch({ representative: e.target.value })}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="사업자번호"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draft.businessNumber}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => patch({ businessNumber: e.target.value })}
                />
              }
            />
            <DetailInfoForm.Field
              label="대표전화"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draft.phone}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => patch({ phone: e.target.value })}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="팩스"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draft.fax}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => patch({ fax: e.target.value })}
                />
              }
            />
            <DetailInfoForm.Field
              label="이메일"
              view={null}
              edit={
                <CmsInput
                  className={fieldClass(isEditing)}
                  inputSize="medium"
                  width="100%"
                  value={draft.email}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => patch({ email: e.target.value })}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="로고 이미지"
              view={null}
              edit={
                isEditing ? (
                  <div className="footer-org-section__image-row">
                    <div className="footer-org-section__preview">
                      {draft.logoUrl ? (
                        <img src={draft.logoUrl} alt="로고 미리보기" />
                      ) : (
                        <ImagePlaceholderIcon />
                      )}
                    </div>
                    <FileSelectField
                      className="footer-org-section__file-field"
                      multiple={false}
                      accept={IMAGE_ACCEPT}
                      buttonLabel="파일 추가"
                      fileNames={draft.logoFileName ? [draft.logoFileName] : []}
                      guideLines={IMAGE_GUIDE_LINES}
                      onFilesChange={files => {
                        void handleFilesChange(files)
                      }}
                      onRemoveFile={() =>
                        setDraft(prev =>
                          prev
                            ? { ...prev, logoUrl: '', logoFileName: undefined }
                            : prev
                        )
                      }
                    />
                  </div>
                ) : (
                  <div className="footer-org-section__logo-view">
                    {draft.logoUrl ? (
                      <img src={draft.logoUrl} alt="기관 로고" />
                    ) : (
                      <span className="footer-org-section__logo-empty">-</span>
                    )}
                  </div>
                )
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </section>
  )
}
