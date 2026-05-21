/**
 * 프로그램 상세 정보 / 강사·봉사자 정보 탭 — 상세 정보 섹션 통합
 * - ProjectInfoDetailInfoSection: 풀페이지 모달 내 상세 블록 래퍼
 * - DetailInfoSection / InstructorDetailInfoSection / VolunteerDetailInfoSection
 */

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Image } from 'antd'
import type { Program } from '@/types/domain'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { FileSelectField } from '@/shared/ui/file-select-field'
import { TextAreaFieldRow } from '@/shared/ui/text-area-field-row'
import { fileUploadService } from '@/entities/application/api/file-upload-service'
import { useTemplateEditor } from '@/features/template/hooks/use-template-editor'
import {
  DEFAULT_ADDITIONAL_HTML,
  DEFAULT_LEARNING_SUPPORT,
  DEFAULT_PROGRAM_DESCRIPTION,
  DEFAULT_RECRUITMENT_GUIDE,
  getThumbnailFilename,
} from '@/features/program/shared/lib/program-detail-info-constants'
import './project-info-detail-info-section.css'

/** 참여자 정보 탭 등 파일 선택(FileSelectField) 우측 안내 — 썸네일·첨부 공통 */
const THUMBNAIL_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다. / 가로 사이즈 500px 권장, 세로 사이즈 무관',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const ATTACHMENT_GUIDE_LINES = [
  '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const PLACEHOLDER_ADDITIONAL_IMAGE =
  'https://via.placeholder.com/600x200/f0f0f0/999?text=추가+내용+이미지'
const FALLBACK_ADDITIONAL_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='200' viewBox='0 0 600 200'%3E%3Crect fill='%23f5f5f5' width='600' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3E추가 내용 이미지%3C/text%3E%3C/svg%3E"

function useDetailInfoEditorBlock(
  program: Program,
  isEditMode: boolean,
  form: UseFormReturn<ProgramDetailEditFormValues> | undefined,
  onRegisterGetAdditionalContentHtml?: (getter: () => string) => void
) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [thumbnailPreviewBlobUrl, setThumbnailPreviewBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditMode) {
      setEditorOpen(false)
      setThumbnailPreviewBlobUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      return
    }
    const t = setTimeout(() => setEditorOpen(true), 500)
    return () => clearTimeout(t)
  }, [isEditMode])

  const { editorHostRef, getHTML } = useTemplateEditor(
    editorOpen,
    '',
    program.additionalContentHtml ?? undefined
  )
  const getterRef = useRef<() => string>(() => '')

  useEffect(() => {
    getterRef.current = () => (editorOpen ? getHTML() : (program.additionalContentHtml ?? ''))
  }, [editorOpen, getHTML, program.additionalContentHtml])

  useEffect(() => {
    if (!isEditMode) return
    onRegisterGetAdditionalContentHtml?.(() => getterRef.current())
    return () => {
      onRegisterGetAdditionalContentHtml?.(() => '')
    }
  }, [isEditMode, onRegisterGetAdditionalContentHtml])

  const isFormEdit = Boolean(isEditMode && form)
  const displayFileNames = isFormEdit
    ? (form!.watch('attachmentFileNames') ?? [])
    : (program.attachmentFileNames ?? [])

  const thumbnailUrl =
    isFormEdit && form
      ? (form.watch('keyVisualImage') ?? form.watch('posterImage') ?? '') || undefined
      : program.keyVisualImage || program.posterImage
  const displayThumbnailUrl = thumbnailPreviewBlobUrl ?? thumbnailUrl
  const thumbnailFilename = thumbnailUrl ? getThumbnailFilename(thumbnailUrl) : ''

  return {
    editorOpen,
    editorHostRef,
    uploadingThumbnail,
    setUploadingThumbnail,
    setThumbnailPreviewBlobUrl,
    isFormEdit,
    displayFileNames,
    displayThumbnailUrl,
    thumbnailFilename,
    form,
  }
}

function DetailSectionHeader({
  title = '상세 정보',
  description,
}: {
  title?: string
  description?: string
}) {
  if (!title?.trim() && !description?.trim()) return null
  return (
    <header className="detail-info-form__header" style={{ marginBottom: 10 }}>
      <div className="detail-info-form__header-lead">
        {title?.trim() ? <h2 className="detail-info-form__title">{title.trim()}</h2> : null}
        {description?.trim() ? (
          <div className="detail-info-form__description">{description.trim()}</div>
        ) : null}
      </div>
    </header>
  )
}

function DetailInfoTableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="program-detail-info-tab__table-wrapper">
      <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
        <colgroup>
          <col style={{ width: '200px' }} />
          <col />
        </colgroup>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function ThumbnailImageRow({
  program,
  isEditMode,
  isFormEdit,
  form,
  uploadingThumbnail,
  setUploadingThumbnail,
  setThumbnailPreviewBlobUrl,
  displayThumbnailUrl,
  thumbnailFilename,
  guideLines,
  showRequiredStar,
}: {
  program: Program
  isEditMode: boolean
  isFormEdit: boolean
  form: UseFormReturn<ProgramDetailEditFormValues> | undefined
  uploadingThumbnail: boolean
  setUploadingThumbnail: (v: boolean) => void
  setThumbnailPreviewBlobUrl: React.Dispatch<React.SetStateAction<string | null>>
  displayThumbnailUrl: string | undefined
  thumbnailFilename: string
  guideLines: string[]
  showRequiredStar: boolean
}) {
  return (
    <tr>
      <th>
        썸네일 이미지
        {showRequiredStar ? <span className="program-detail-info-tab__required">*</span> : null}
      </th>
      <td className="program-detail-info-tab__cell--thumbnail">
        <div className="program-detail-info-tab__thumbnail-wrap">
          <div className="program-detail-info-tab__thumbnail-row">
            {displayThumbnailUrl ? (
              <Image
                src={displayThumbnailUrl}
                alt={program.title}
                className="program-detail-info-tab__thumbnail-img"
                preview={{ mask: '확대 보기' }}
              />
            ) : (
              <div className="program-detail-info-tab__thumbnail-placeholder-box">이미지 없음</div>
            )}
            <div className="program-detail-info-tab__thumbnail-meta">
              <FileSelectField
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                disabled={!isEditMode || uploadingThumbnail}
                buttonLabel={uploadingThumbnail ? '업로드 중…' : '파일 선택'}
                uploading={uploadingThumbnail}
                className={
                  isEditMode
                    ? 'program-detail-info-tab__file-select file-select-field--edit'
                    : 'program-detail-info-tab__file-select'
                }
                fileNames={thumbnailFilename ? [thumbnailFilename] : []}
                guideLines={guideLines}
                onFilesChange={
                  isFormEdit
                    ? async files => {
                        const file = files[0]
                        if (!file || !form) return
                        setThumbnailPreviewBlobUrl(prev => {
                          if (prev) URL.revokeObjectURL(prev)
                          return null
                        })
                        const blobUrl = URL.createObjectURL(file)
                        setThumbnailPreviewBlobUrl(blobUrl)
                        setUploadingThumbnail(true)
                        try {
                          const result = await fileUploadService.upload(file, 'image')
                          form.setValue('keyVisualImage', result.url)
                          form.setValue('posterImage', result.url)
                          } catch (e) {
                          URL.revokeObjectURL(blobUrl)
                          setThumbnailPreviewBlobUrl(null)
                          } finally {
                          setUploadingThumbnail(false)
                        }
                      }
                    : undefined
                }
                onRemoveFile={
                  isFormEdit
                    ? () => {
                        setThumbnailPreviewBlobUrl(prev => {
                          if (prev) URL.revokeObjectURL(prev)
                          return null
                        })
                        if (form) {
                          form.setValue('keyVisualImage', undefined)
                          form.setValue('posterImage', undefined)
                        }
                      }
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

function AdditionalContentRow({
  program,
  isEditMode,
  isFormEdit,
  editorOpen,
  editorHostRef,
  showRequiredOnTh,
}: {
  program: Program
  isEditMode: boolean
  isFormEdit: boolean
  editorOpen: boolean
  editorHostRef: React.RefObject<HTMLDivElement | null>
  showRequiredOnTh: boolean
}) {
  return (
    <tr>
      <th>
        추가 내용
        {showRequiredOnTh && isFormEdit ? (
          <span className="program-detail-info-tab__required">*</span>
        ) : null}
      </th>
      <td>
        {isEditMode ? (
          <div className="program-detail-info-tab__additional-content program-detail-info-tab__additional-content--edit">
            {editorOpen ? (
              <div ref={editorHostRef} className="program-detail-info-tab__editor-host" />
            ) : (
              <div className="program-detail-info-tab__editor-placeholder">로딩 중…</div>
            )}
          </div>
        ) : (
          <div className="program-detail-info-tab__additional-content">
            <div className="program-detail-info-tab__additional-image-wrap">
              <Image
                src={program.keyVisualImage || program.posterImage || PLACEHOLDER_ADDITIONAL_IMAGE}
                alt="추가 내용"
                className="program-detail-info-tab__additional-image"
                preview={{ mask: '확대 보기' }}
                fallback={FALLBACK_ADDITIONAL_SVG}
              />
            </div>
            <div
              className="program-detail-info-tab__editor-content toastui-editor-contents"
              dangerouslySetInnerHTML={{
                __html: program.additionalContentHtml || DEFAULT_ADDITIONAL_HTML,
              }}
            />
          </div>
        )}
      </td>
    </tr>
  )
}

function AttachmentRowStandard({
  isEditMode,
  isFormEdit,
  form,
  displayFileNames,
  guideLines,
}: {
  isEditMode: boolean
  isFormEdit: boolean
  form: UseFormReturn<ProgramDetailEditFormValues> | undefined
  displayFileNames: string[]
  guideLines: string[]
}) {
  return (
    <tr>
      <th>첨부 파일</th>
      <td>
        <FileSelectField
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          multiple
          disabled={!isEditMode}
          buttonLabel="파일 선택"
          className={isEditMode ? 'file-select-field--edit' : ''}
          fileNames={displayFileNames}
          guideLines={guideLines}
          onFilesChange={
            isFormEdit
              ? files => {
                  const current = form!.getValues('attachmentFileNames') ?? []
                  form!.setValue('attachmentFileNames', [...current, ...files.map(f => f.name)])
                }
              : undefined
          }
          onRemoveFile={
            isFormEdit
              ? index => {
                  const list = form!.getValues('attachmentFileNames') ?? []
                  form!.setValue(
                    'attachmentFileNames',
                    list.filter((_, i) => i !== index)
                  )
                }
              : undefined
          }
        />
      </td>
    </tr>
  )
}

export function ProjectInfoDetailInfoSection({ children }: { children: ReactNode }) {
  return <div className="program-detail-fullpage-modal__info-tab-block">{children}</div>
}

export interface DetailInfoSectionProps {
  program: Program
  isEditMode?: boolean
  /** 수정 모드일 때만 전달 */
  form?: UseFormReturn<ProgramDetailEditFormValues>
  /** 수정 모드에서 저장 시 추가 내용 HTML 수집용 getter 등록 */
  onRegisterGetAdditionalContentHtml?: (getter: () => string) => void
  /** 참여자 정보 탭 등에서 상세 정보 상단에 썸네일 이미지 행 노출 */
  showThumbnail?: boolean
  sectionTitle?: string
  sectionDescription?: string | null
  /** UJAT 프로그램 상세 — title만, description·기본 안내 문구 미노출 */
  sectionTitleOnly?: boolean
}

export function DetailInfoSection({
  program,
  isEditMode = false,
  form,
  onRegisterGetAdditionalContentHtml,
  showThumbnail = false,
  sectionTitle,
  sectionDescription,
  sectionTitleOnly = false,
}: DetailInfoSectionProps) {
  const {
    editorOpen,
    editorHostRef,
    uploadingThumbnail,
    setUploadingThumbnail,
    setThumbnailPreviewBlobUrl,
    isFormEdit,
    displayFileNames,
    displayThumbnailUrl,
    thumbnailFilename,
    form: f,
  } = useDetailInfoEditorBlock(program, isEditMode, form, onRegisterGetAdditionalContentHtml)

  const headerDescription = sectionTitleOnly
    ? undefined
    : (sectionDescription ??
      '필수 정보가 아닌 항목이 공란인 경우, 상세 페이지에서 항목 미노출 됩니다.')

  return (
    <>
      <DetailSectionHeader
        title={sectionTitle ?? '상세 정보'}
        description={headerDescription}
      />
      <DetailInfoTableFrame>
        {showThumbnail && (
          <ThumbnailImageRow
            program={program}
            isEditMode={isEditMode}
            isFormEdit={isFormEdit}
            form={f}
            uploadingThumbnail={uploadingThumbnail}
            setUploadingThumbnail={setUploadingThumbnail}
            setThumbnailPreviewBlobUrl={setThumbnailPreviewBlobUrl}
            displayThumbnailUrl={displayThumbnailUrl}
            thumbnailFilename={thumbnailFilename}
            guideLines={THUMBNAIL_GUIDE_LINES}
            showRequiredStar={isFormEdit}
          />
        )}
        <TextAreaFieldRow
          label="프로그램 설명"
          showRequiredStar={isFormEdit}
          isFormEdit={isFormEdit}
          form={f}
          name="description"
          rows={6}
          placeholder="프로그램 설명"
          textareaClassName="text-area-field-row__content-textarea program-detail-info-tab__edit-row-input"
          readContent={program.description || DEFAULT_PROGRAM_DESCRIPTION}
        />
        <TextAreaFieldRow
          label="모집 안내"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          name="recruitmentGuide"
          rows={6}
          placeholder="모집 안내"
          textareaClassName="text-area-field-row__content-textarea program-detail-info-tab__edit-row-input"
          readContent={program.recruitmentGuide || DEFAULT_RECRUITMENT_GUIDE}
        />
        <TextAreaFieldRow
          label="학습 지원 내용"
          showRequiredStar={isFormEdit}
          isFormEdit={isFormEdit}
          form={f}
          name="learningSupportContent"
          rows={5}
          placeholder="학습 지원 내용"
          textareaClassName="text-area-field-row__content-textarea program-detail-info-tab__edit-row-input"
          readContentWrapperClassName="text-area-field-row__content-block text-area-field-row__content-block--sm"
          readContent={program.learningSupportContent || DEFAULT_LEARNING_SUPPORT}
        />
        <AdditionalContentRow
          program={program}
          isEditMode={isEditMode}
          isFormEdit={isFormEdit}
          editorOpen={editorOpen}
          editorHostRef={editorHostRef}
          showRequiredOnTh={false}
        />
        <AttachmentRowStandard
          isEditMode={isEditMode}
          isFormEdit={isFormEdit}
          form={f}
          displayFileNames={displayFileNames}
          guideLines={THUMBNAIL_GUIDE_LINES}
        />
      </DetailInfoTableFrame>
    </>
  )
}

export interface InstructorDetailInfoSectionProps {
  program: Program
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
  onRegisterGetAdditionalContentHtml?: (getter: () => string) => void
}

export function InstructorDetailInfoSection({
  program,
  isEditMode = false,
  form,
  onRegisterGetAdditionalContentHtml,
}: InstructorDetailInfoSectionProps) {
  const {
    editorOpen,
    editorHostRef,
    uploadingThumbnail,
    setUploadingThumbnail,
    setThumbnailPreviewBlobUrl,
    isFormEdit,
    displayFileNames,
    displayThumbnailUrl,
    thumbnailFilename,
    form: f,
  } = useDetailInfoEditorBlock(program, isEditMode, form, onRegisterGetAdditionalContentHtml)

  const applicationMethod = program.applicationMethod ?? '-'
  const otherNotes = program.otherNotes ?? program.oneLineIntroduction ?? '-'

  return (
    <>
      <DetailSectionHeader description="공란인 경우, 상세 페이지에서 항목 미노출 됩니다." />
      <DetailInfoTableFrame>
        <ThumbnailImageRow
          program={program}
          isEditMode={isEditMode}
          isFormEdit={isFormEdit}
          form={f}
          uploadingThumbnail={uploadingThumbnail}
          setUploadingThumbnail={setUploadingThumbnail}
          setThumbnailPreviewBlobUrl={setThumbnailPreviewBlobUrl}
          displayThumbnailUrl={displayThumbnailUrl}
          thumbnailFilename={thumbnailFilename}
          guideLines={THUMBNAIL_GUIDE_LINES}
          showRequiredStar={isFormEdit}
        />
        <TextAreaFieldRow
          label="프로그램 설명"
          showRequiredStar={isFormEdit}
          isFormEdit={isFormEdit}
          form={f}
          name="description"
          rows={6}
          placeholder="프로그램 설명"
          textareaClassName="text-area-field-row__content-textarea program-detail-info-tab__edit-row-input"
          readContent={program.description || DEFAULT_PROGRAM_DESCRIPTION}
        />
        <TextAreaFieldRow
          label="모집 안내"
          showRequiredStar={isFormEdit}
          isFormEdit={isFormEdit}
          form={f}
          name="recruitmentGuide"
          rows={6}
          placeholder="모집 안내"
          textareaClassName="text-area-field-row__content-textarea program-detail-info-tab__edit-row-input"
          readContent={program.recruitmentGuide || DEFAULT_RECRUITMENT_GUIDE}
        />
        <TextAreaFieldRow
          label="지원 방법"
          showRequiredStar={isFormEdit}
          isFormEdit={isFormEdit}
          form={f}
          name="applicationMethod"
          rows={5}
          placeholder="지원 방법"
          textareaClassName="text-area-field-row__content-textarea program-detail-info-tab__edit-row-input"
          readContent={applicationMethod}
        />
        <AdditionalContentRow
          program={program}
          isEditMode={isEditMode}
          isFormEdit={isFormEdit}
          editorOpen={editorOpen}
          editorHostRef={editorHostRef}
          showRequiredOnTh={false}
        />
        <TextAreaFieldRow
          label="기타사항"
          showRequiredStar={isFormEdit}
          isFormEdit={isFormEdit}
          form={f}
          name="otherNotes"
          rows={3}
          placeholder="기타사항"
          textareaClassName="text-area-field-row__content-textarea program-detail-info-tab__edit-row-input"
          readContent={otherNotes}
        />
        <AttachmentRowStandard
          isEditMode={isEditMode}
          isFormEdit={isFormEdit}
          form={f}
          displayFileNames={displayFileNames}
          guideLines={[
            '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
            '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
          ]}
        />
      </DetailInfoTableFrame>
    </>
  )
}

export interface VolunteerDetailInfoSectionProps {
  program: Program
  isEditMode?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
  onRegisterGetAdditionalContentHtml?: (getter: () => string) => void
  sectionTitle?: string
  sectionDescription?: string | null
  sectionTitleOnly?: boolean
}

export function VolunteerDetailInfoSection({
  program,
  isEditMode = false,
  form,
  onRegisterGetAdditionalContentHtml,
  sectionTitle,
  sectionDescription,
  sectionTitleOnly = false,
}: VolunteerDetailInfoSectionProps) {
  const {
    editorOpen,
    editorHostRef,
    uploadingThumbnail,
    setUploadingThumbnail,
    setThumbnailPreviewBlobUrl,
    isFormEdit,
    displayFileNames,
    displayThumbnailUrl,
    thumbnailFilename,
    form: f,
  } = useDetailInfoEditorBlock(program, isEditMode, form, onRegisterGetAdditionalContentHtml)

  const applicationMethod = program.applicationMethod ?? '-'
  const otherNotes = program.otherNotes ?? program.oneLineIntroduction ?? '-'
  const headerDescription = sectionTitleOnly
    ? undefined
    : (sectionDescription ?? '공란인 경우, 상세 페이지에서 항목 미노출 됩니다.')

  return (
    <>
      <DetailSectionHeader
        title={sectionTitle ?? '상세 정보'}
        description={headerDescription}
      />
      <DetailInfoTableFrame>
        <ThumbnailImageRow
          program={program}
          isEditMode={isEditMode}
          isFormEdit={isFormEdit}
          form={f}
          uploadingThumbnail={uploadingThumbnail}
          setUploadingThumbnail={setUploadingThumbnail}
          setThumbnailPreviewBlobUrl={setThumbnailPreviewBlobUrl}
          displayThumbnailUrl={displayThumbnailUrl}
          thumbnailFilename={thumbnailFilename}
          guideLines={THUMBNAIL_GUIDE_LINES}
          showRequiredStar={isFormEdit}
        />
        <TextAreaFieldRow
          label="프로그램 설명"
          showRequiredStar={isFormEdit}
          isFormEdit={isFormEdit}
          form={f}
          name="description"
          rows={6}
          placeholder="프로그램 설명"
          textareaClassName="text-area-field-row__content-textarea program-detail-info-tab__edit-row-input"
          readContent={program.description || DEFAULT_PROGRAM_DESCRIPTION}
        />
        <TextAreaFieldRow
          label="모집 안내"
          showRequiredStar={isFormEdit}
          isFormEdit={isFormEdit}
          form={f}
          name="recruitmentGuide"
          rows={6}
          placeholder="모집 안내"
          textareaClassName="text-area-field-row__content-textarea program-detail-info-tab__edit-row-input"
          readContent={program.recruitmentGuide || DEFAULT_RECRUITMENT_GUIDE}
        />
        <TextAreaFieldRow
          label="지원 방법"
          showRequiredStar={false}
          isFormEdit={isFormEdit}
          form={f}
          name="applicationMethod"
          rows={3}
          placeholder="지원 방법"
          textareaClassName="text-area-field-row__content-textarea program-detail-info-tab__edit-row-input"
          readContent={applicationMethod}
        />
        <AdditionalContentRow
          program={program}
          isEditMode={isEditMode}
          isFormEdit={isFormEdit}
          editorOpen={editorOpen}
          editorHostRef={editorHostRef}
          showRequiredOnTh={false}
        />
        <TextAreaFieldRow
          label="기타사항"
          showRequiredStar={isFormEdit}
          isFormEdit={isFormEdit}
          form={f}
          name="otherNotes"
          rows={4}
          placeholder="기타사항"
          textareaClassName="text-area-field-row__content-textarea program-detail-info-tab__edit-row-input"
          readContent={otherNotes}
        />
        <tr>
          <th>첨부 파일</th>
          <td>
            {isEditMode ? (
              <FileSelectField
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                multiple
                disabled={false}
                buttonLabel="파일 선택"
                className="file-select-field--edit"
                fileNames={displayFileNames}
                guideLines={ATTACHMENT_GUIDE_LINES}
                onFilesChange={
                  isFormEdit
                    ? files => {
                        const current = f!.getValues('attachmentFileNames') ?? []
                        f!.setValue('attachmentFileNames', [...current, ...files.map(x => x.name)])
                      }
                    : undefined
                }
                onRemoveFile={
                  isFormEdit
                    ? index => {
                        const list = f!.getValues('attachmentFileNames') ?? []
                        f!.setValue(
                          'attachmentFileNames',
                          list.filter((_, i) => i !== index)
                        )
                      }
                    : undefined
                }
              />
            ) : (
              <div className="program-detail-info-tab__content-block">
                {displayFileNames.length > 0 ? displayFileNames.join(', ') : '-'}
              </div>
            )}
          </td>
        </tr>
      </DetailInfoTableFrame>
    </>
  )
}
