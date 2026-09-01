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
import { cloneProgramIntroDocument } from '@/features/education-program-intro/api/store'
import {
  isAllowedProgramIntroImage,
  PROGRAM_INTRO_IMAGE_ACCEPT,
  PROGRAM_INTRO_IMAGE_MAX_BYTES,
  PROGRAM_INTRO_IMAGE_SLOTS,
  type ProgramIntroImageSlot,
} from '@/features/education-program-intro/lib/image-slots'
import { CmsButton, CmsInput, CmsTextArea, FileSelectField, useCmsAlert } from '@/shared/ui'

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

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function inlineFieldClass(isEditing: boolean, withTextArea = false): string {
  const base = isEditing
    ? 'program-intro-inline-field program-intro-inline-field--edit'
    : 'program-intro-inline-field program-intro-inline-field--readonly'
  if (!withTextArea) return base
  return isEditing ? `${base} cms-textarea--fixed-rows` : base
}

function ImageFileView({ image }: { image: ProgramIntroImage }) {
  if (!image) {
    return <span className="program-intro-file-empty">-</span>
  }
  return (
    <div className="program-intro-file-view">
      <FileIcon className="program-intro-file-view__icon" />
      <span className="program-intro-file-view__name">{image.fileName}</span>
    </div>
  )
}

type ImageFieldProps = {
  isEditing: boolean
  image: ProgramIntroImage
  slot: ProgramIntroImageSlot
  onChange: (next: ProgramIntroImage) => void
}

function ImageFieldControl({ isEditing, image, slot, onChange }: ImageFieldProps) {
  const { showAlert } = useCmsAlert()

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedProgramIntroImage(file)) {
        showAlert({
          title: '파일 형식',
          content: 'JPG, PNG 형식만 등록할 수 있습니다.',
        })
        return
      }
      if (file.size > PROGRAM_INTRO_IMAGE_MAX_BYTES) {
        showAlert({
          title: '파일 용량',
          content: '파일은 최대 15MB까지 등록 가능합니다.',
        })
        return
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        onChange({ fileName: file.name, fileUrl: dataUrl })
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [onChange, showAlert]
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
      guideLines={slot.guideLines}
      onFilesChange={files => {
        void handleFilesChange(files)
      }}
      onRemoveFile={() => onChange(null)}
    />
  )
}

type ProgramSectionProps = {
  index: 0 | 1 | 2
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
  const slots = PROGRAM_INTRO_IMAGE_SLOTS[index]!
  const display = isEditing ? draftItem : item

  const renderImageField = (imageIndex: number) => {
    const slot = slots[imageIndex]!
    return (
      <DetailInfoForm.Field
        key={slot.label}
        label={slot.label}
        view={null}
        edit={
          <ImageFieldControl
            isEditing={isEditing}
            image={display.images[imageIndex] ?? null}
            slot={slot}
            onChange={next => onImageChange(imageIndex, next)}
          />
        }
      />
    )
  }

  return (
    <section className="program-intro-section" aria-label={title}>
      <SectionTitle>{title}</SectionTitle>
      <DetailInfoForm title={title} hideHeader mode="edit" className="program-intro-form">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="프로그램 유형"
            view={null}
            edit={
              <CmsInput
                className={inlineFieldClass(isEditing)}
                inputSize="medium"
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

        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="프로그램 유형 설명"
            view={null}
            edit={
              isEditing ? (
                <CmsTextArea
                  className={inlineFieldClass(true, true)}
                  inputSize="medium"
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

        {index === 0 ? (
          <DetailInfoForm.Row type="double">
            {renderImageField(0)}
            {renderImageField(1)}
          </DetailInfoForm.Row>
        ) : null}

        {index === 1 ? (
          <DetailInfoForm.Row type="single">{renderImageField(0)}</DetailInfoForm.Row>
        ) : null}

        {index === 2 ? (
          <>
            <DetailInfoForm.Row type="single">{renderImageField(0)}</DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              {renderImageField(1)}
              {renderImageField(2)}
            </DetailInfoForm.Row>
          </>
        ) : null}

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="대표 프로그램"
            view={null}
            edit={
              <CmsInput
                className={inlineFieldClass(isEditing)}
                inputSize="medium"
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
            view={null}
            edit={
              <CmsInput
                className={inlineFieldClass(isEditing)}
                inputSize="medium"
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
            view={null}
            edit={
              isEditing ? (
                <CmsTextArea
                  className={inlineFieldClass(true, true)}
                  inputSize="medium"
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
    </section>
  )
}

export function ProgramIntroFormCard({ data, onEditingChange }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveProgramIntroCategory()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ProgramIntroCategoryDocument>(() =>
    cloneProgramIntroDocument(data)
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
        categoryKey: draft.categoryKey,
        mainText: draft.mainText,
        programs: draft.programs,
      })
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: '프로그램 소개 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draft, saveMutation, showAlert])

  const updateMainText = useCallback((value: string) => {
    setDraft(prev => ({ ...prev, mainText: value }))
  }, [])

  const updateProgram = useCallback((index: 0 | 1 | 2, patch: Partial<ProgramIntroItem>) => {
    setDraft(prev => {
      const programs = [...prev.programs] as [
        ProgramIntroItem,
        ProgramIntroItem,
        ProgramIntroItem,
      ]
      programs[index] = { ...programs[index], ...patch }
      return { ...prev, programs }
    })
  }, [])

  const updateProgramImage = useCallback(
    (programIndex: 0 | 1 | 2, imageIndex: number, next: ProgramIntroImage) => {
      setDraft(prev => {
        const programs = [...prev.programs] as [
          ProgramIntroItem,
          ProgramIntroItem,
          ProgramIntroItem,
        ]
        const images = [...programs[programIndex].images]
        images[imageIndex] = next
        programs[programIndex] = { ...programs[programIndex], images }
        return { ...prev, programs }
      })
    },
    []
  )

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

      <div className="program-intro-card__body">
        <section className="program-intro-section" aria-label="소개글">
          <SectionTitle>소개글</SectionTitle>
          <DetailInfoForm title="소개글" hideHeader mode="edit" className="program-intro-form">
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="메인 텍스트"
                view={null}
                edit={
                  isEditing ? (
                    <CmsTextArea
                      className={inlineFieldClass(true, true)}
                      inputSize="medium"
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

        <ProgramSection
          index={0}
          title="프로그램 01"
          isEditing={isEditing}
          item={data.programs[0]}
          draftItem={draft.programs[0]}
          onChange={patch => updateProgram(0, patch)}
          onImageChange={(imageIndex, next) => updateProgramImage(0, imageIndex, next)}
        />
        <ProgramSection
          index={1}
          title="프로그램 02"
          isEditing={isEditing}
          item={data.programs[1]}
          draftItem={draft.programs[1]}
          onChange={patch => updateProgram(1, patch)}
          onImageChange={(imageIndex, next) => updateProgramImage(1, imageIndex, next)}
        />
        <ProgramSection
          index={2}
          title="프로그램 03"
          isEditing={isEditing}
          item={data.programs[2]}
          draftItem={draft.programs[2]}
          onChange={patch => updateProgram(2, patch)}
          onImageChange={(imageIndex, next) => updateProgramImage(2, imageIndex, next)}
        />
      </div>
    </div>
  )
}
