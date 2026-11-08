/**
 * 교재 등록 · 상세 · 수정 모달
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { EducationBusinessField } from '@/entities/education-business-field/model/types'
import type { EducationTarget } from '@/entities/education-target/model/types'
import type {
  EducationTextbook,
  EducationTextbookCreateInput,
} from '@/entities/education-textbook/model/types'
import {
  DEFAULT_TEXTBOOK_AUTHOR,
  DEFAULT_TEXTBOOK_THUMBNAIL,
} from '@/features/education-textbook/lib/defaults'
import { formatDateTimeDotWithKoreanWeekday } from '@/shared/lib/format-display'
import { useNoticeWysiwygEditor } from '@/features/notices/hooks/use-notice-wysiwyg-editor'
import {
  getRemoteRichTextBodyError,
  isEmptyAdminHtml,
  RichTextEditor,
  RichTextViewer,
} from '@/shared/rich-text'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  CmsButton,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  CmsSelect,
  CmsTextArea,
  ConfirmModal,
  CONTENT_MODAL_FOOTER_START_CLASS,
  ContentModal,
  FileSelectField,
  useCmsAlert,
} from '@/shared/ui'

import './form-modal.css'

dayjs.locale('ko')

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const MAX_BYTES = 20 * 1024 * 1024
const IMAGE_GUIDE_LINES = [
  '- 파일은 JPG, PNG 형식만 등록 가능하며, 최대 20MB까지 첨부할 수 있습니다.',
  '- 권장 배너 사이즈는 233 × 320px입니다.',
]

export type TextbookFormValues = EducationTextbookCreateInput

export type TextbookFormMode = 'create' | 'view' | 'edit'

type Props = {
  open: boolean
  mode: TextbookFormMode
  initial?: EducationTextbook | null
  businessFields: EducationBusinessField[]
  educationTargets: EducationTarget[]
  confirmLoading?: boolean
  deleteLoading?: boolean
  onCancel: () => void
  onSubmit: (values: TextbookFormValues) => void
  onRequestEdit?: () => void
  onDelete?: () => void
}

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

function formatRegisteredDateTime(iso: string): string {
  return formatDateTimeDotWithKoreanWeekday(iso)
}

/** Figma Table / Vertical / Cell / Medium header — * overlay on the label text box */
function TableHeaderLabel({ children, marked }: { children: string; marked: boolean }) {
  return (
    <span className="education-textbook-form-modal__th">
      {children}
      {marked ? (
        <span className="education-textbook-form-modal__th-star" aria-hidden>
          *
        </span>
      ) : null}
    </span>
  )
}

function looksLikeHtml(value: string): boolean {
  return /^\s*</.test(value)
}

function ThumbnailFileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="14"
      viewBox="0 0 10 14"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M5.65918 0C5.91646 0 6.16454 0.0996329 6.35059 0.277344L9.55566 3.33984C9.75314 3.52847 9.86517 3.78942 9.86523 4.0625V12.5C9.86523 13.0523 9.41752 13.5 8.86523 13.5H1C0.447715 13.5 0 13.0523 0 12.5V1C0.00023083 0.447912 0.447858 1.28764e-07 1 0H5.65918ZM2.61328 8.86914V10.9834C2.61328 11.2807 2.49224 11.4365 2.27148 11.4365C2.06412 11.4365 1.92962 11.2955 1.92578 11.0547H1.34961C1.34769 11.6533 1.74128 11.9422 2.24414 11.9424C2.80287 11.9424 3.18555 11.5717 3.18555 10.9834V8.86914H2.61328ZM7.09375 8.82715C6.36044 8.8273 5.7959 9.40575 5.7959 10.3896C5.79605 11.3483 6.3261 11.9423 7.10547 11.9424C7.80628 11.9424 8.30762 11.4567 8.30762 10.6611V10.2842H7.14746V10.7578H7.75098C7.74326 11.1388 7.50679 11.3836 7.10938 11.3857C6.66586 11.3836 6.38379 11.0215 6.38379 10.3809C6.38379 9.74442 6.67543 9.38593 7.10547 9.38379C7.40881 9.38588 7.61853 9.56002 7.69727 9.84473H8.28027C8.20339 9.24813 7.72153 8.82715 7.09375 8.82715ZM3.57715 8.86914V11.9004H4.15332V10.9131H4.65332C5.29432 10.9129 5.66309 10.4955 5.66309 9.89062C5.66296 9.29409 5.29955 8.86914 4.66797 8.86914H3.57715ZM4.56055 9.38379C4.9022 9.38588 5.06919 9.5893 5.06738 9.89062C5.0693 10.1963 4.90231 10.4062 4.56055 10.4062H4.15332V9.38379H4.56055ZM6.33301 4.04785C6.17608 3.83881 5.8635 3.83395 5.7002 4.03809L4.55762 5.4668C4.40876 5.65283 4.13148 5.66828 3.96289 5.5L3.72266 5.25977C3.55415 5.09126 3.27593 5.10605 3.12695 5.29199L2.18164 6.47461C1.97222 6.73651 2.15877 7.12402 2.49414 7.12402H7.83984C8.16942 7.12402 8.35782 6.74806 8.16016 6.48438L6.33301 4.04785ZM2.75195 2.59668C2.39063 2.59668 2.09766 2.88965 2.09766 3.25098C2.09775 3.61222 2.39069 3.90527 2.75195 3.90527C3.11322 3.90527 3.40616 3.61222 3.40625 3.25098C3.40625 2.88966 3.11327 2.59668 2.75195 2.59668Z"
        fill="currentColor"
      />
    </svg>
  )
}

function TextbookFormBody({
  open,
  mode,
  initial,
  businessFields,
  educationTargets,
  confirmLoading,
  deleteLoading,
  onCancel,
  onSubmit,
  onRequestEdit,
  onDelete,
}: Props) {
  const { showAlert } = useCmsAlert()
  const isView = mode === 'view'
  const isCreate = mode === 'create'
  const canEdit = mode === 'create' || mode === 'edit'

  const [isActive, setIsActive] = useState(true)
  const [businessFieldId, setBusinessFieldId] = useState<string | undefined>()
  const [educationTargetIds, setEducationTargetIds] = useState<string[]>([])
  const [educationEffect, setEducationEffect] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailFileName, setThumbnailFileName] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>()
  const [thumbnailAssetId, setThumbnailAssetId] = useState<number | undefined>()
  const [unitCount, setUnitCount] = useState('')
  const [unitSessionText, setUnitSessionText] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const initialMarkdown = useMemo(() => {
    if (initial) return initial.unitIntroMarkdown ?? ''
    return ''
  }, [initial])

  const editorContentFormat = useMemo<'markdown' | 'html'>(() => {
    const content = initialMarkdown.trim()
    return content.startsWith('<') || !content ? 'html' : 'markdown'
  }, [initialMarkdown])

  /** view↔edit 전환 시 mode 변경으로 리셋하지 않음 — 엔티티 id + 포맷 */
  const editorResetKey = useMemo(
    () => (initial?.id != null ? `${initial.id}-${editorContentFormat}` : `new-${editorContentFormat}`),
    [editorContentFormat, initial?.id]
  )

  const editorEnabled = open && canEdit
  const {
    editor,
    getHTML,
    editorMode,
    htmlSource,
    onEditorModeChange,
    onHtmlSourceChange,
    resolveImageSrc,
  } = useNoticeWysiwygEditor(editorEnabled, initialMarkdown, editorResetKey, {
    contentFormat: editorContentFormat,
    allowInlineMedia: true,
    placeholder: '단원 소개 내용을 입력해 주세요',
  })

  const resetFromInitial = useCallback(() => {
    if (initial) {
      setIsActive(initial.isActive)
      setBusinessFieldId(initial.businessFieldId)
      setEducationTargetIds([...initial.educationTargetIds])
      setEducationEffect(initial.educationEffect)
      setTitle(initial.title)
      setDescription(initial.description)
      setThumbnailUrl(initial.thumbnailUrl || DEFAULT_TEXTBOOK_THUMBNAIL)
      setThumbnailFileName(initial.thumbnailFileName ?? '')
      setThumbnailFile(undefined)
      setThumbnailAssetId(initial.thumbnailAssetId)
      setUnitCount(String(initial.unitCount || ''))
      setUnitSessionText(initial.unitSessionText)
    } else {
      setIsActive(true)
      setBusinessFieldId(undefined)
      setEducationTargetIds([])
      setEducationEffect('')
      setTitle('')
      setDescription('')
      setThumbnailUrl('')
      setThumbnailFileName('')
      setThumbnailFile(undefined)
      setThumbnailAssetId(undefined)
      setUnitCount('')
      setUnitSessionText('')
    }
  }, [initial])

  /**
   * 열릴 때·initial 변경 시에만 시드.
   * view↔edit 전환 시 mode만 바뀌고 initial 동일하면 리셋하지 않음.
   */
  useEffect(() => {
    if (!open) return
    resetFromInitial()
  }, [open, resetFromInitial])

  const activeFieldOptions = useMemo(() => {
    const available = mode === 'create' ? businessFields.filter(f => f.isActive) : businessFields
    // 상세/수정 시 현재 선택 분야가 미사용이어도 옵션에 유지
    const options = available.map(f => ({ value: f.id, label: f.name }))
    if (businessFieldId && !options.some(o => o.value === businessFieldId)) {
      const current = businessFields.find(f => f.id === businessFieldId)
      if (current) {
        options.unshift({ value: current.id, label: current.name })
      }
    }
    return options
  }, [businessFieldId, businessFields, mode])

  const targetOptions = useMemo(
    () => educationTargets.map(t => ({ value: t.id, label: t.name })),
    [educationTargets]
  )

  const fieldNameById = useMemo(
    () => new Map(businessFields.map(f => [f.id, f.name])),
    [businessFields]
  )
  const targetNameById = useMemo(
    () => new Map(educationTargets.map(t => [t.id, t.name])),
    [educationTargets]
  )

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedImageFile(file)) {
        showAlert({
          title: '파일 형식',
          content: '등록할 수 없는 파일 형식입니다.',
        })
        return
      }
      if (file.size > MAX_BYTES) {
        showAlert({
          title: '파일 용량',
          content: '20MB를 초과한 파일은 등록할 수 없습니다.',
        })
        return
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        setThumbnailUrl(dataUrl)
        setThumbnailFileName(file.name)
        setThumbnailFile(file)
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [showAlert]
  )

  const handleRemoveFile = useCallback(() => {
    setThumbnailUrl('')
    setThumbnailFileName('')
    setThumbnailFile(undefined)
    setThumbnailAssetId(undefined)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!businessFieldId) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    if (educationTargetIds.length === 0) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    if (!educationEffect.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    if (!title.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    if (!description.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    const unitIntroMarkdown = canEdit ? getHTML().trim() : (initial?.unitIntroMarkdown ?? '')
    if (canEdit && isEmptyAdminHtml(unitIntroMarkdown)) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    if (canEdit) {
      const bodyError = getRemoteRichTextBodyError(unitIntroMarkdown)
      if (bodyError) {
        showAlert({ title: '입력 확인', content: bodyError })
        return
      }
    }
    const units = Number(unitCount)
    if (!Number.isFinite(units) || units <= 0) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    if (!unitSessionText.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }

    onSubmit({
      isActive,
      businessFieldId,
      educationTargetIds,
      educationEffect: educationEffect.trim(),
      title: title.trim(),
      description: description.trim(),
      thumbnailUrl: thumbnailUrl.trim() || DEFAULT_TEXTBOOK_THUMBNAIL,
      thumbnailFileName: thumbnailFileName || undefined,
      thumbnailFile,
      thumbnailAssetId,
      unitCount: units,
      unitSessionText: unitSessionText.trim(),
      unitIntroMarkdown,
      authorName: initial?.authorName ?? DEFAULT_TEXTBOOK_AUTHOR,
    })
  }, [
    businessFieldId,
    canEdit,
    description,
    educationEffect,
    educationTargetIds,
    getHTML,
    initial?.authorName,
    initial?.unitIntroMarkdown,
    isActive,
    onSubmit,
    showAlert,
    thumbnailFileName,
    thumbnailFile,
    thumbnailAssetId,
    thumbnailUrl,
    title,
    unitCount,
    unitSessionText,
  ])

  const modalTitle = mode === 'create' ? '교재 등록' : mode === 'edit' ? '교재 수정' : '교재 상세'

  const footer = (
    <>
      {!isCreate ? (
        <CmsButton
          className={CONTENT_MODAL_FOOTER_START_CLASS}
          variant="delete"
          size="h40"
          type="button"
          loading={deleteLoading}
          disabled={confirmLoading || deleteLoading}
          onClick={() => setDeleteConfirmOpen(true)}
        >
          삭제
        </CmsButton>
      ) : null}
      <CmsButton
        variant="secondary"
        size="h40"
        type="button"
        onClick={onCancel}
        disabled={confirmLoading || deleteLoading}
      >
        취소
      </CmsButton>
      {isView ? (
        <CmsButton
          variant="primary"
          size="h40"
          type="button"
          onClick={onRequestEdit}
          disabled={deleteLoading}
        >
          수정
        </CmsButton>
      ) : (
        <CmsButton
          variant="primary"
          size="h40"
          type="button"
          loading={confirmLoading}
          disabled={confirmLoading || deleteLoading}
          onClick={handleSubmit}
        >
          {isCreate ? '교재 등록' : '저장'}
        </CmsButton>
      )}
    </>
  )

  const registeredMeta =
    mode !== 'create' && initial
      ? {
          dateTime: formatRegisteredDateTime(initial.createdAt),
          author: initial.authorName || DEFAULT_TEXTBOOK_AUTHOR,
        }
      : null

  const unitIntroContent = mode === 'view' ? (initial?.unitIntroMarkdown ?? '').trim() : ''

  const fieldLabel = businessFieldId ? (fieldNameById.get(businessFieldId) ?? '-') : '-'
  const targetsLabel =
    educationTargetIds.length > 0
      ? educationTargetIds.map(id => targetNameById.get(id) ?? id).join(', ')
      : '-'

  const previewUrl = thumbnailUrl || (isView ? DEFAULT_TEXTBOOK_THUMBNAIL : '')
  const thumbFileLabel = thumbnailFileName?.trim() || (previewUrl ? '기본 썸네일' : '-')

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title={modalTitle}
        size="large"
        className="education-textbook-form-modal"
        footer={footer}
      >
        {/*
          시안 2136:40850 (수정): 등록일시 없음 · 기본 정보 2테이블 · 교육 정보
          상세(view)만 등록일시 단독 테이블
        */}
        <div className="education-textbook-form-modal__scroll">
          <section
            className="education-textbook-form-modal__section"
            aria-labelledby="education-textbook-basic-heading"
          >
            <h3
              id="education-textbook-basic-heading"
              className="education-textbook-form-modal__section-title"
            >
              기본 정보
            </h3>

            {/* ① 등록일시 단독 테이블 (상세 view만) */}
            {isView && registeredMeta ? (
              <DetailInfoForm
                title="등록일시"
                hideHeader
                mode="view"
                className="education-textbook-form-modal__table education-textbook-form-modal__table--registered"
              >
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="등록일시"
                    view={
                      <span className="education-textbook-form-modal__registered">
                        <span>{registeredMeta.dateTime}</span>
                        <DetailInfoForm.TdDivider />
                        <span>{registeredMeta.author}</span>
                      </span>
                    }
                    edit={null}
                    readOnlyDisplay
                  />
                </DetailInfoForm.Row>
              </DetailInfoForm>
            ) : null}

            {/* ② 사용 여부|사업분야 · 교육 대상|교육 효과 — 등록일시와 분리된 테이블 */}
            <DetailInfoForm
              title="사용·대상"
              hideHeader
              mode={isView ? 'view' : 'edit'}
              className="education-textbook-form-modal__table education-textbook-form-modal__table--meta"
            >
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label={<TableHeaderLabel marked={!isView}>사용 여부</TableHeaderLabel>}
                  required={!isView}
                  view={<span>{isActive ? '사용' : '미사용'}</span>}
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
                <DetailInfoForm.Field
                  label={<TableHeaderLabel marked={!isView}>사업분야</TableHeaderLabel>}
                  required={!isView}
                  view={<span>{fieldLabel}</span>}
                  edit={
                    <CmsSelect
                      className="education-textbook-form-modal__table-select"
                      inputSize="small"
                      width={240}
                      placeholder="사업분야를 선택해 주세요"
                      value={businessFieldId}
                      options={activeFieldOptions}
                      onChange={value => setBusinessFieldId(String(value))}
                    />
                  }
                />
              </DetailInfoForm.Row>

              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label={<TableHeaderLabel marked={!isView}>교육 대상</TableHeaderLabel>}
                  required={!isView}
                  view={<span>{targetsLabel}</span>}
                  edit={
                    <CmsSelect
                      className="education-textbook-form-modal__table-select"
                      mode="multiple"
                      inputSize="small"
                      width={240}
                      withAllOption={false}
                      placeholder="교육 대상을 선택해 주세요"
                      value={educationTargetIds}
                      options={targetOptions}
                      onChange={value =>
                        setEducationTargetIds((Array.isArray(value) ? value : [value]).map(String))
                      }
                    />
                  }
                />
                <DetailInfoForm.Field
                  label={<TableHeaderLabel marked={!isView}>교육 효과</TableHeaderLabel>}
                  required={!isView}
                  view={<span>{educationEffect || '-'}</span>}
                  edit={
                    <CmsInput
                      inputSize="small"
                      width="100%"
                      placeholder="교육 효과를 입력해 주세요"
                      value={educationEffect}
                      onChange={e => setEducationEffect(e.target.value)}
                    />
                  }
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>

            {/* ③ 교재명 · 설명 · 썸네일 */}
            <DetailInfoForm
              title="교재 본문"
              hideHeader
              mode={isView ? 'view' : 'edit'}
              className="education-textbook-form-modal__table education-textbook-form-modal__table--content"
            >
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label={<TableHeaderLabel marked={!isView}>교재명</TableHeaderLabel>}
                  required={!isView}
                  view={<span>{title || '-'}</span>}
                  edit={
                    <CmsInput
                      inputSize="small"
                      width="100%"
                      placeholder="교재명을 입력해 주세요"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  }
                />
              </DetailInfoForm.Row>

              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label={<TableHeaderLabel marked={!isView}>교재 설명</TableHeaderLabel>}
                  required={!isView}
                  view={
                    <span className="education-textbook-form-modal__desc-view">
                      {description || '-'}
                    </span>
                  }
                  edit={
                    <CmsTextArea
                      className="education-textbook-form-modal__desc-input"
                      inputSize="small"
                      width="100%"
                      layout="fixed"
                      autoSize={{ minRows: 1, maxRows: 3 }}
                      placeholder="교재 설명을 입력해 주세요"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  }
                />
              </DetailInfoForm.Row>

              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label={<TableHeaderLabel marked={!isView}>썸네일</TableHeaderLabel>}
                  required={!isView}
                  view={
                    <div className="education-textbook-form-modal__thumb-view">
                      <ThumbnailFileIcon className="education-textbook-form-modal__thumb-icon" />
                      <span className="education-textbook-form-modal__thumb-name">
                        {thumbFileLabel}
                      </span>
                    </div>
                  }
                  edit={
                    <FileSelectField
                      className="education-textbook-form-modal__file-field"
                      multiple={false}
                      accept={IMAGE_ACCEPT}
                      buttonLabel="파일 추가"
                      fileNames={thumbnailFileName ? [thumbnailFileName] : []}
                      maxTotalBytes={MAX_BYTES}
                      onFilesChange={files => {
                        void handleFilesChange(files)
                      }}
                      onRemoveFile={handleRemoveFile}
                      guideLines={IMAGE_GUIDE_LINES}
                    />
                  }
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          </section>

          <section
            className="education-textbook-form-modal__section"
            aria-labelledby="education-textbook-edu-heading"
          >
            <h3
              id="education-textbook-edu-heading"
              className="education-textbook-form-modal__section-title"
            >
              교육 정보
            </h3>
            <DetailInfoForm
              title="교육 정보"
              hideHeader
              mode={isView ? 'view' : 'edit'}
              className="education-textbook-form-modal__table education-textbook-form-modal__table--education"
            >
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label={<TableHeaderLabel marked={!isView}>교육 차시</TableHeaderLabel>}
                  required={!isView}
                  view={
                    <span className="education-textbook-form-modal__session-view">
                      <span>총 {unitCount || '-'}단원</span>
                      {unitSessionText ? (
                        <>
                          <DetailInfoForm.TdDivider />
                          <span>{unitSessionText}</span>
                        </>
                      ) : null}
                    </span>
                  }
                  edit={
                    <div className="education-textbook-form-modal__session-row">
                      <CmsInput
                        className="education-textbook-form-modal__session-count"
                        inputSize="small"
                        width={120}
                        placeholder="총 단원"
                        value={unitCount}
                        onChange={e => setUnitCount(e.target.value.replace(/[^\d]/g, ''))}
                        aria-label="총 단원 수"
                      />
                      <span className="education-textbook-form-modal__session-suffix">단원</span>
                      <DetailInfoForm.TdDivider />
                      <CmsInput
                        className="education-textbook-form-modal__session-text"
                        inputSize="small"
                        width="100%"
                        placeholder="상세 차시 설명을 입력해 주세요"
                        value={unitSessionText}
                        onChange={e => setUnitSessionText(e.target.value)}
                      />
                    </div>
                  }
                />
              </DetailInfoForm.Row>

              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label={<TableHeaderLabel marked={!isView}>단원 소개</TableHeaderLabel>}
                  required={!isView}
                  view={
                    unitIntroContent ? (
                      <div className="education-textbook-form-modal__rt-view">
                        <RichTextViewer
                          content={unitIntroContent}
                          contentFormat={looksLikeHtml(unitIntroContent) ? 'html' : 'markdown'}
                        />
                      </div>
                    ) : isView ? (
                      <span>-</span>
                    ) : null
                  }
                  edit={
                    <div className="education-textbook-form-modal__rt-edit">
                      <RichTextEditor
                        editor={editor}
                        allowInlineMedia
                        allowRawHtmlBlock
                        resolveImageSrc={resolveImageSrc}
                        editorMode={editorMode}
                        htmlSource={htmlSource}
                        onEditorModeChange={onEditorModeChange}
                        onHtmlSourceChange={onHtmlSourceChange}
                      />
                    </div>
                  }
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          </section>
        </div>
      </ContentModal>

      <ConfirmModal
        open={deleteConfirmOpen}
        title="교재 삭제"
        content="선택한 교재를 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        danger
        confirmLoading={deleteLoading}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false)
          onDelete?.()
        }}
      />
    </>
  )
}

export function EducationTextbookFormModal({
  open,
  mode,
  initial,
  businessFields,
  educationTargets,
  confirmLoading,
  deleteLoading,
  onCancel,
  onSubmit,
  onRequestEdit,
  onDelete,
}: Props) {
  /**
   * view↔edit 전환 시 key 변경 금지 — 모달 전체 리마운트(닫혔다 켜짐) 방지.
   * create / 다른 교재 id 전환 시에만 리셋.
   */
  const formKey =
    mode === 'create' ? 'textbook-form-create' : `textbook-form-${initial?.id ?? 'unknown'}`

  return (
    <TextbookFormBody
      key={formKey}
      open={open}
      mode={mode}
      initial={initial}
      businessFields={businessFields}
      educationTargets={educationTargets}
      confirmLoading={confirmLoading}
      deleteLoading={deleteLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
      onRequestEdit={onRequestEdit}
      onDelete={onDelete}
    />
  )
}
