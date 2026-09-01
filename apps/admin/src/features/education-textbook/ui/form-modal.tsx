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
} from '@/features/education-textbook/api/store'
import { useNoticeWysiwygEditor } from '@/features/notices/hooks/use-notice-wysiwyg-editor'
import { RichTextEditor, RichTextViewer } from '@/shared/rich-text'
import {
  CmsButton,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  CmsSelect,
  CmsTextArea,
  ConfirmModal,
  ContentModal,
  FileSelectField,
  useCmsAlert,
} from '@/shared/ui'

import './form-modal.css'

dayjs.locale('ko')

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const MAX_BYTES = 15 * 1024 * 1024
const IMAGE_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 썸네일 권장 사이즈는 226*320입니다.',
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
  const d = dayjs(iso)
  if (!d.isValid()) return '-'
  return d.format('YYYY.MM.DD(ddd) HH:mm')
}

function ThumbnailFileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M5.5 2.5h6.2L14.5 5.3V16.5a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 2.5V5.8H14.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M7 9.5h6M7 12.5h4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ImagePlaceholderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
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

  /** view↔edit 전환 시 에디터 리셋 금지 — 엔티티 id 기준 */
  const editorResetKey = useMemo(
    () => (initial?.id != null ? initial.id : 'new'),
    [initial?.id]
  )

  const editorEnabled = canEdit
  const { editor, editorMinHeight, getMarkdown } = useNoticeWysiwygEditor(
    editorEnabled,
    initialMarkdown,
    editorResetKey,
    { placeholder: '단원 소개 내용을 입력하세요', height: '280px' }
  )

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
    const available =
      mode === 'create'
        ? businessFields.filter(f => f.isActive)
        : businessFields
    // 상세/수정 시 현재 선택 분야가 미사용이어도 옵션에 유지
    const options = available.map(f => ({ value: f.id, label: f.name }))
    if (
      businessFieldId &&
      !options.some(o => o.value === businessFieldId)
    ) {
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
          content: 'JPG, PNG 형식만 등록할 수 있습니다.',
        })
        return
      }
      if (file.size > MAX_BYTES) {
        showAlert({
          title: '파일 용량',
          content: '파일은 최대 15MB까지 등록 가능합니다.',
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
      showAlert({ title: '입력 확인', content: '사업분야를 선택해 주세요.' })
      return
    }
    if (educationTargetIds.length === 0) {
      showAlert({ title: '입력 확인', content: '교육 대상을 선택해 주세요.' })
      return
    }
    if (!educationEffect.trim()) {
      showAlert({ title: '입력 확인', content: '교육 효과를 입력해 주세요.' })
      return
    }
    if (!title.trim()) {
      showAlert({ title: '입력 확인', content: '교재명을 입력해 주세요.' })
      return
    }
    if (!description.trim()) {
      showAlert({ title: '입력 확인', content: '교재 설명을 입력해 주세요.' })
      return
    }
    const units = Number(unitCount)
    if (!Number.isFinite(units) || units <= 0) {
      showAlert({ title: '입력 확인', content: '총 단원 수를 입력해 주세요.' })
      return
    }
    if (!unitSessionText.trim()) {
      showAlert({ title: '입력 확인', content: '교육 차시 설명을 입력해 주세요.' })
      return
    }

    const unitIntroMarkdown = canEdit ? getMarkdown() : (initial?.unitIntroMarkdown ?? '')

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
    getMarkdown,
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

  const modalTitle =
    mode === 'create' ? '교재 등록' : mode === 'edit' ? '교재 수정' : '교재 상세'

  const footer = (
    <div className="education-textbook-form-modal__footer">
      {!isCreate ? (
        <CmsButton
          variant="delete"
          size="large"
          type="button"
          loading={deleteLoading}
          disabled={confirmLoading || deleteLoading}
          onClick={() => setDeleteConfirmOpen(true)}
        >
          교재 삭제
        </CmsButton>
      ) : null}
      <div className="education-textbook-form-modal__footer-end">
        <CmsButton
          variant="secondary"
          size="large"
          type="button"
          onClick={onCancel}
          disabled={confirmLoading || deleteLoading}
        >
          취소
        </CmsButton>
        {isView ? (
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            onClick={onRequestEdit}
            disabled={deleteLoading}
          >
            수정
          </CmsButton>
        ) : (
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            loading={confirmLoading}
            disabled={confirmLoading || deleteLoading}
            onClick={handleSubmit}
          >
            {isCreate ? '교재 등록' : '저장'}
          </CmsButton>
        )}
      </div>
    </div>
  )

  const registeredMeta =
    mode !== 'create' && initial
      ? {
          dateTime: formatRegisteredDateTime(initial.createdAt),
          author: initial.authorName || DEFAULT_TEXTBOOK_AUTHOR,
        }
      : null

  const unitIntroContent =
    mode === 'view' ? (initial?.unitIntroMarkdown ?? '').trim() : ''

  const fieldLabel = businessFieldId
    ? (fieldNameById.get(businessFieldId) ?? '-')
    : '-'
  const targetsLabel =
    educationTargetIds.length > 0
      ? educationTargetIds.map(id => targetNameById.get(id) ?? id).join(', ')
      : '-'

  const previewUrl = thumbnailUrl || (isView ? DEFAULT_TEXTBOOK_THUMBNAIL : '')
  const thumbFileLabel =
    thumbnailFileName?.trim() || (previewUrl ? '기본 썸네일' : '-')

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
          시안 분리:
          1) 등록일시 — 단독 테이블
          2) 사용 여부·사업분야·교육 대상·교육 효과·교재명·설명·썸네일 — (상세·수정 동일)
          3) 교육 정보 — 별도 섹션 테이블
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

            {/* ① 등록일시 단독 테이블 (상세·수정) */}
            {registeredMeta ? (
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
                  label="사용 여부"
                  required={!isView}
                  view={<span>{isActive ? '사용' : '미사용'}</span>}
                  edit={
                    <CmsRadioGroup
                      size="large"
                      value={isActive}
                      onChange={e => setIsActive(coerceRadioBoolean(e.target.value))}
                    >
                      <CmsRadio size="large" value={true}>
                        사용
                      </CmsRadio>
                      <CmsRadio size="large" value={false}>
                        미사용
                      </CmsRadio>
                    </CmsRadioGroup>
                  }
                />
                <DetailInfoForm.Field
                  label="사업분야"
                  required={!isView}
                  view={<span>{fieldLabel}</span>}
                  edit={
                    <CmsSelect
                      inputSize="large"
                      width="100%"
                      placeholder="사업분야를 선택하세요"
                      value={businessFieldId}
                      options={activeFieldOptions}
                      onChange={value => setBusinessFieldId(String(value))}
                    />
                  }
                />
              </DetailInfoForm.Row>

              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="교육 대상"
                  required={!isView}
                  view={<span>{targetsLabel}</span>}
                  edit={
                    <CmsSelect
                      mode="multiple"
                      inputSize="large"
                      width="100%"
                      withAllOption={false}
                      placeholder="교육 대상을 선택하세요"
                      value={educationTargetIds}
                      options={targetOptions}
                      onChange={value =>
                        setEducationTargetIds(
                          (Array.isArray(value) ? value : [value]).map(String)
                        )
                      }
                    />
                  }
                />
                <DetailInfoForm.Field
                  label="교육 효과"
                  required={!isView}
                  view={<span>{educationEffect || '-'}</span>}
                  edit={
                    <CmsInput
                      inputSize="large"
                      width="100%"
                      placeholder="교육 효과를 입력하세요"
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
                  label="교재명"
                  required={!isView}
                  view={<span>{title || '-'}</span>}
                  edit={
                    <CmsInput
                      inputSize="large"
                      width="100%"
                      placeholder="교재명을 입력하세요"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                    />
                  }
                />
              </DetailInfoForm.Row>

              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="교재 설명"
                  required={!isView}
                  view={
                    <span className="education-textbook-form-modal__preline">
                      {description || '-'}
                    </span>
                  }
                  edit={
                    <CmsTextArea
                      inputSize="large"
                      width="100%"
                      rows={3}
                      autoSize={false}
                      className="cms-textarea--fixed-rows"
                      placeholder="교재 설명을 입력하세요"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  }
                />
              </DetailInfoForm.Row>

              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="썸네일"
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
                    <div className="education-textbook-form-modal__image-row">
                      <div className="education-textbook-form-modal__preview">
                        {previewUrl ? (
                          <img src={previewUrl} alt="썸네일 미리보기" />
                        ) : (
                          <ImagePlaceholderIcon />
                        )}
                      </div>
                      <FileSelectField
                        className="education-textbook-form-modal__file-field"
                        multiple={false}
                        accept={IMAGE_ACCEPT}
                        buttonLabel="파일 추가"
                        fileNames={thumbnailFileName ? [thumbnailFileName] : []}
                        onFilesChange={files => {
                          void handleFilesChange(files)
                        }}
                        onRemoveFile={handleRemoveFile}
                        guideLines={IMAGE_GUIDE_LINES}
                      />
                    </div>
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
                  label="교육 차시"
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
                        inputSize="large"
                        width={80}
                        value={unitCount}
                        onChange={e => setUnitCount(e.target.value.replace(/[^\d]/g, ''))}
                        aria-label="총 단원 수"
                      />
                      <span className="education-textbook-form-modal__session-suffix">
                        단원
                      </span>
                      <DetailInfoForm.TdDivider />
                      <CmsInput
                        className="education-textbook-form-modal__session-text"
                        inputSize="large"
                        width="100%"
                        placeholder="상세 차시 설명을 입력하세요"
                        value={unitSessionText}
                        onChange={e => setUnitSessionText(e.target.value)}
                      />
                    </div>
                  }
                />
              </DetailInfoForm.Row>

              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="단원 소개"
                  view={
                    unitIntroContent ? (
                      <div className="education-textbook-form-modal__rt-view">
                        <RichTextViewer
                          content={unitIntroContent}
                          contentFormat="markdown"
                        />
                      </div>
                    ) : isView ? (
                      <span>-</span>
                    ) : null
                  }
                  edit={
                    <div
                      className="education-textbook-form-modal__rt-edit"
                      style={{ minHeight: editorMinHeight }}
                    >
                      <RichTextEditor editor={editor} />
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
        warningMessage="삭제된 항목은 복구할 수 없습니다."
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
    mode === 'create'
      ? 'textbook-form-create'
      : `textbook-form-${initial?.id ?? 'unknown'}`

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
