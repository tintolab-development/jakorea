/**
 * 프로그램 소개 관리 — 단건 문서 폼 카드
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  ProgramIntroCategoryDocument,
  ProgramIntroImage,
  ProgramIntroItem,
} from '@/entities/education-program-intro/model/types'
import { useSaveProgramIntroCategory } from '@/features/education-program-intro/api/hooks'
import { cloneProgramIntroDocument } from '@/features/education-program-intro/lib/clone-document'
import {
  isAllowedProgramIntroImage,
  PROGRAM_INTRO_IMAGE_ACCEPT,
  PROGRAM_INTRO_IMAGE_MAX_BYTES,
  PROGRAM_INTRO_IMAGE_SLOTS,
  type ProgramIntroImageSlot,
} from '@/features/education-program-intro/lib/image-slots'
import { educationProgramIntroMutationFailureAlert } from '@/features/education-program-intro/lib/mutation-failure-alert'
import { CmsButton, CmsInput, CmsTextArea, FileSelectField, showSaveCompletedAlert, useCmsAlert } from '@/shared/ui'
import { FileTypeIcon } from '@/shared/ui/icons/FileTypeIcon'

import './form-card.css'

type Props = {
  data: ProgramIntroCategoryDocument
  /** 편집 모드 변경 시 부모(탭 비활성)에 알림 */
  onEditingChange?: (isEditing: boolean) => void
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="program-intro-section-title">
      <span className="program-intro-section-title__marker" aria-hidden />
      <span className="program-intro-section-title__text">{children}</span>
    </div>
  )
}

function PrelineView({ value }: { value: string }) {
  return <span className="program-intro-preline">{value || '-'}</span>
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function inlineFieldClass(isEditing: boolean): string {
  return isEditing
    ? 'program-intro-inline-field program-intro-inline-field--edit'
    : 'program-intro-inline-field program-intro-inline-field--readonly'
}

function ImageFileView({ image }: { image: ProgramIntroImage }) {
  if (!image) {
    return <span className="program-intro-file-empty">-</span>
  }
  return (
    <div className="program-intro-file-view">
      <FileTypeIcon fileName={image.fileName} size={20} className="program-intro-file-view__icon" />
      <span className="program-intro-file-view__name">{image.fileName}</span>
    </div>
  )
}

type ImageFieldProps = {
  isEditing: boolean
  image: ProgramIntroImage
  slot: ProgramIntroImageSlot
  sortOrder: number
  onChange: (next: ProgramIntroImage) => void
}

function ImageFieldControl({ isEditing, image, slot, sortOrder, onChange }: ImageFieldProps) {
  const { showAlert } = useCmsAlert()

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedProgramIntroImage(file)) {
        showAlert({
          title: '파일 형식',
          content: '등록할 수 없는 파일 형식입니다.',
        })
        return
      }
      if (file.size > PROGRAM_INTRO_IMAGE_MAX_BYTES) {
        showAlert({
          title: '파일 용량',
          content: '20MB를 초과한 파일은 등록할 수 없습니다.',
        })
        return
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        onChange({
          fileName: file.name,
          fileUrl: dataUrl,
          alt: image?.alt?.trim() || file.name,
          sortOrder: image?.sortOrder && image.sortOrder > 0 ? image.sortOrder : sortOrder,
          width: image?.width,
          height: image?.height,
          file,
        })
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [image, onChange, showAlert, sortOrder],
  )

  if (!isEditing) {
    return <ImageFileView image={image} />
  }

  return (
    <FileSelectField
      className="program-intro-file-field"
      multiple={false}
      accept={PROGRAM_INTRO_IMAGE_ACCEPT}
      buttonLabel="파일 추가"
      fileNames={image ? [image.fileName] : []}
      maxTotalBytes={PROGRAM_INTRO_IMAGE_MAX_BYTES}
      guideLines={slot.guideLines}
      onFilesChange={files => {
        void handleFilesChange(files)
      }}
      onRemoveFile={() => onChange(null)}
    />
  )
}

type ProgramSectionProps = {
  index: number
  title: string
  isEditing: boolean
  item: ProgramIntroItem
  draftItem: ProgramIntroItem
  onChange: (patch: Partial<ProgramIntroItem>) => void
  onImageChange: (imageIndex: number, next: ProgramIntroImage) => void
}

function ProgramSection({
  index,
  title,
  isEditing,
  item,
  draftItem,
  onChange,
  onImageChange,
}: ProgramSectionProps) {
  const slots = PROGRAM_INTRO_IMAGE_SLOTS[index] ?? []
  const display = isEditing ? draftItem : item

  const renderImageField = (imageIndex: number) => {
    const slot = slots[imageIndex]
    if (!slot) return null
    return (
      <DetailInfoForm.Field
        key={slot.label}
        label={slot.label}
        required={isEditing}
        view={null}
        edit={
          <ImageFieldControl
            isEditing={isEditing}
            image={display.images[imageIndex] ?? null}
            slot={slot}
            sortOrder={imageIndex + 1}
            onChange={next => onImageChange(imageIndex, next)}
          />
        }
      />
    )
  }

  return (
    <section className="program-intro-section" aria-label={title}>
      <SectionTitle>{title}</SectionTitle>
      <div className="program-intro-form-stack">
        <DetailInfoForm title={`${title} 유형`} hideHeader mode="edit" className="program-intro-form">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="프로그램 유형"
              required={isEditing}
              view={null}
              edit={
                <CmsInput
                  className={inlineFieldClass(isEditing)}
                  inputSize="small"
                  width="100%"
                  value={display.programType}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => {
                    if (!isEditing) return
                    onChange({ programType: e.target.value })
                  }}
                  aria-label={`${title} 프로그램 유형`}
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>

        <DetailInfoForm
          title={`${title} 유형 설명·이미지`}
          hideHeader
          mode="edit"
          className="program-intro-form"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="프로그램 유형 설명"
              required={isEditing}
              view={null}
              edit={
                isEditing ? (
                  <CmsTextArea
                    className={inlineFieldClass(true)}
                    inputSize="small"
                    width="100%"
                    rows={2}
                    autoSize={false}
                    value={draftItem.typeDescription}
                    onChange={e => onChange({ typeDescription: e.target.value })}
                    aria-label={`${title} 프로그램 유형 설명`}
                  />
                ) : (
                  <PrelineView value={item.typeDescription} />
                )
              }
            />
          </DetailInfoForm.Row>

          {slots.length === 1 ? (
            <DetailInfoForm.Row type="single">{renderImageField(0)}</DetailInfoForm.Row>
          ) : null}

          {slots.length === 2 ? (
            <DetailInfoForm.Row type="double">
              {renderImageField(0)}
              {renderImageField(1)}
            </DetailInfoForm.Row>
          ) : null}

          {slots.length >= 3 ? (
            <>
              <DetailInfoForm.Row type="single">{renderImageField(0)}</DetailInfoForm.Row>
              <DetailInfoForm.Row type="double">
                {renderImageField(1)}
                {renderImageField(2)}
              </DetailInfoForm.Row>
            </>
          ) : null}
        </DetailInfoForm>

        <DetailInfoForm
          title={`${title} 대표 프로그램`}
          hideHeader
          mode="edit"
          className="program-intro-form"
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="대표 프로그램"
              required={isEditing}
              view={null}
              edit={
                <CmsInput
                  className={inlineFieldClass(isEditing)}
                  inputSize="small"
                  width="100%"
                  value={display.representativeProgram}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => {
                    if (!isEditing) return
                    onChange({ representativeProgram: e.target.value })
                  }}
                  aria-label={`${title} 대표 프로그램`}
                />
              }
            />
            <DetailInfoForm.Field
              label="후원사명"
              required={isEditing}
              view={null}
              edit={
                <CmsInput
                  className={inlineFieldClass(isEditing)}
                  inputSize="small"
                  width="100%"
                  value={display.sponsorName}
                  readOnly={!isEditing}
                  tabIndex={isEditing ? 0 : -1}
                  onChange={e => {
                    if (!isEditing) return
                    onChange({ sponsorName: e.target.value })
                  }}
                  aria-label={`${title} 후원사명`}
                />
              }
            />
          </DetailInfoForm.Row>

          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="대표 프로그램 설명"
              required={isEditing}
              view={null}
              edit={
                isEditing ? (
                  <CmsTextArea
                    className={inlineFieldClass(true)}
                    inputSize="small"
                    width="100%"
                    rows={2}
                    autoSize={false}
                    value={draftItem.representativeDescription}
                    onChange={e => onChange({ representativeDescription: e.target.value })}
                    aria-label={`${title} 대표 프로그램 설명`}
                  />
                ) : (
                  <PrelineView value={item.representativeDescription} />
                )
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </section>
  )
}

export function ProgramIntroFormCard({ data, onEditingChange }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveProgramIntroCategory()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ProgramIntroCategoryDocument>(() =>
    cloneProgramIntroDocument(data),
  )

  useEffect(() => {
    onEditingChange?.(isEditing)
    return () => {
      onEditingChange?.(false)
    }
  }, [isEditing, onEditingChange])

  useEffect(() => {
    if (!isEditing) {
      setDraft(cloneProgramIntroDocument(data))
    }
  }, [data, isEditing])

  const handleEdit = useCallback(() => {
    setDraft(cloneProgramIntroDocument(data))
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(cloneProgramIntroDocument(data))
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    try {
      await saveMutation.mutateAsync({
        fieldCode: draft.fieldCode,
        mainText: draft.mainText,
        version: draft.version,
        sections: draft.sections,
      })
      setIsEditing(false)
      showSaveCompletedAlert()
    } catch (error) {
      showAlert(educationProgramIntroMutationFailureAlert(error))
    }
  }, [draft, saveMutation, showAlert])

  const updateMainText = useCallback((value: string) => {
    setDraft(prev => ({ ...prev, mainText: value }))
  }, [])

  const updateSection = useCallback((index: number, patch: Partial<ProgramIntroItem>) => {
    setDraft(prev => {
      const sections = [...prev.sections]
      const current = sections[index]
      if (!current) return prev
      sections[index] = { ...current, ...patch }
      return { ...prev, sections }
    })
  }, [])

  const updateSectionImage = useCallback(
    (sectionIndex: number, imageIndex: number, next: ProgramIntroImage) => {
      setDraft(prev => {
        const sections = [...prev.sections]
        const current = sections[sectionIndex]
        if (!current) return prev
        const images = [...current.images]
        images[imageIndex] = next
        sections[sectionIndex] = { ...current, images }
        return { ...prev, sections }
      })
    },
    [],
  )

  const displaySections = isEditing ? draft.sections : data.sections

  return (
    <div className="admin-list-card program-intro-card">
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">프로그램 소개 관리</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="medium"
                type="button"
                onClick={handleCancel}
                disabled={saveMutation.isPending} >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="medium"
                type="button"
                loading={saveMutation.isPending}
                onClick={() => {
                  void handleSave()
                }} >
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

      <div className="program-intro-card__body">
        <section className="program-intro-section" aria-label="소개글">
          <SectionTitle>소개글</SectionTitle>
          <DetailInfoForm title="소개글" hideHeader mode="edit" className="program-intro-form">
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="메인 텍스트"
                required={isEditing}
                view={null}
                edit={
                  isEditing ? (
                    <CmsTextArea
                      className={inlineFieldClass(true)}
                      inputSize="small"
                      width="100%"
                      rows={2}
                      autoSize={false}
                      value={draft.mainText}
                      onChange={e => updateMainText(e.target.value)}
                      aria-label="소개글 메인 텍스트"
                    />
                  ) : (
                    <PrelineView value={data.mainText} />
                  )
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </section>

        {displaySections.map((section, index) => (
          <ProgramSection
            key={section.sectionKey || `section-${index}`}
            index={index}
            title={`프로그램 ${String(index + 1).padStart(2, '0')}`}
            isEditing={isEditing}
            item={data.sections[index] ?? section}
            draftItem={draft.sections[index] ?? section}
            onChange={patch => updateSection(index, patch)}
            onImageChange={(imageIndex, next) => updateSectionImage(index, imageIndex, next)}
          />
        ))}
      </div>
    </div>
  )
}
