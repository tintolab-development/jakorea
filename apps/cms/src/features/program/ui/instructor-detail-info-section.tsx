/**
 * 강사 정보 탭 전용 상세 정보 섹션
 * - 썸네일 이미지, 프로그램 설명, 모집 안내, 지원 방법, 추가 내용, 기타사항, 첨부 파일
 * - 수정 모드: react-hook-form Controller + Toast UI Editor(추가 내용), 파일 선택 버튼 활성화
 */

import { useEffect, useRef, useState } from 'react'
import { Image, Input, message } from 'antd'
import { Controller } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '../model/program-detail-edit-schema'
import { FileSelectField } from '@/shared/ui/file-select-field'
import { fileUploadService } from '@/entities/application/api/file-upload-service'
import { useTemplateEditor } from '@/features/template/hooks/use-template-editor'
import {
  DEFAULT_ADDITIONAL_HTML,
  DEFAULT_PROGRAM_DESCRIPTION,
  DEFAULT_RECRUITMENT_GUIDE,
  getThumbnailFilename,
} from './program-detail-info-constants'
import './program-detail-info-tab.css'

const { TextArea } = Input

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

  const isFormEdit = isEditMode && form
  const thumbnailUrl =
    isFormEdit && form
      ? (form.watch('keyVisualImage') ?? form.watch('posterImage') ?? '') || undefined
      : program.keyVisualImage || program.posterImage
  const displayThumbnailUrl = thumbnailPreviewBlobUrl ?? thumbnailUrl
  const thumbnailFilename = thumbnailUrl ? getThumbnailFilename(thumbnailUrl) : ''
  const displayFileNames = isFormEdit
    ? (form.watch('attachmentFileNames') ?? [])
    : (program.attachmentFileNames ?? [])
  const applicationMethod = program.applicationMethod ?? '-'
  const otherNotes = program.otherNotes ?? program.oneLineIntroduction ?? '-'

  return (
    <>
      <div className="program-detail-info-tab__section-header-row">
        <h3 className="program-detail-info-tab__section-title">상세 정보</h3>
        <p className="program-detail-info-tab__detail-note">
          공란인 경우, 상세 페이지에서 항목 미노출 됩니다.
        </p>
      </div>
      <div className="program-detail-info-tab__table-wrapper">
        <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
          <colgroup>
            <col style={{ width: '200px' }} />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>
                썸네일 이미지
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
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
                      <div className="program-detail-info-tab__thumbnail-placeholder-box">
                        이미지 없음
                      </div>
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
                        emptyPlaceholder="파일을 선택해주세요"
                        guideLines={[
                          '파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다. / 가로 사이즈 500px 권장, 세로 사이즈 무관',
                          '첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
                        ]}
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
                                  message.success('썸네일 이미지가 업로드되었습니다.')
                                } catch (e) {
                                  URL.revokeObjectURL(blobUrl)
                                  setThumbnailPreviewBlobUrl(null)
                                  message.error(
                                    e instanceof Error ? e.message : '썸네일 이미지 업로드에 실패했습니다.'
                                  )
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
            <tr>
              <th>
                프로그램 설명
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <>
                    <Controller
                      name="description"
                      control={form.control}
                      render={({ field }) => (
                        <TextArea
                          {...field}
                          value={field.value ?? ''}
                          rows={6}
                          placeholder="프로그램 설명"
                          className="program-detail-info-tab__content-textarea"
                          status={form.formState.errors.description ? 'error' : undefined}
                        />
                      )}
                    />
                    {form.formState.errors.description?.message && (
                      <span className="program-detail-info-tab__field-error">
                        {form.formState.errors.description.message}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="program-detail-info-tab__content-block">
                    {program.description || DEFAULT_PROGRAM_DESCRIPTION}
                  </div>
                )}
              </td>
            </tr>
            <tr>
              <th>
                모집 안내
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <>
                    <Controller
                      name="recruitmentGuide"
                      control={form.control}
                      render={({ field }) => (
                        <TextArea
                          {...field}
                          value={field.value ?? ''}
                          rows={6}
                          placeholder="모집 안내"
                          className="program-detail-info-tab__content-textarea"
                          status={form.formState.errors.recruitmentGuide ? 'error' : undefined}
                        />
                      )}
                    />
                    {form.formState.errors.recruitmentGuide?.message && (
                      <span className="program-detail-info-tab__field-error">
                        {form.formState.errors.recruitmentGuide.message}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="program-detail-info-tab__content-block">
                    {program.recruitmentGuide || DEFAULT_RECRUITMENT_GUIDE}
                  </div>
                )}
              </td>
            </tr>
            <tr>
              <th>
                지원 방법
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <>
                    <Controller
                      name="applicationMethod"
                      control={form.control}
                      render={({ field }) => (
                        <TextArea
                          {...field}
                          value={field.value ?? ''}
                          rows={5}
                          placeholder="지원 방법"
                          className="program-detail-info-tab__content-textarea"
                          status={form.formState.errors.applicationMethod ? 'error' : undefined}
                        />
                      )}
                    />
                    {form.formState.errors.applicationMethod?.message && (
                      <span className="program-detail-info-tab__field-error">
                        {form.formState.errors.applicationMethod.message}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="program-detail-info-tab__content-block">
                    {applicationMethod}
                  </div>
                )}
              </td>
            </tr>
            <tr>
              <th>추가 내용</th>
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
                        src={
                          program.keyVisualImage ||
                          program.posterImage ||
                          'https://via.placeholder.com/600x200/f0f0f0/999?text=추가+내용+이미지'
                        }
                        alt="추가 내용"
                        className="program-detail-info-tab__additional-image"
                        preview={{ mask: '확대 보기' }}
                        fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='200' viewBox='0 0 600 200'%3E%3Crect fill='%23f5f5f5' width='600' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3E추가 내용 이미지%3C/text%3E%3C/svg%3E"
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
            <tr>
              <th>
                기타사항
                {isFormEdit ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <>
                    <Controller
                      name="otherNotes"
                      control={form.control}
                      render={({ field }) => (
                        <TextArea
                          {...field}
                          value={field.value ?? ''}
                          rows={3}
                          placeholder="기타사항"
                          className="program-detail-info-tab__content-textarea"
                          status={form.formState.errors.otherNotes ? 'error' : undefined}
                        />
                      )}
                    />
                    {form.formState.errors.otherNotes?.message && (
                      <span className="program-detail-info-tab__field-error">
                        {form.formState.errors.otherNotes.message}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="program-detail-info-tab__content-block">
                    {otherNotes}
                  </div>
                )}
              </td>
            </tr>
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
                  emptyPlaceholder="파일을 선택해주세요"
                  guideLines={[
                    '파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
                    '첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
                  ]}
                  onFilesChange={
                    isFormEdit
                      ? files => {
                          const current = form.getValues('attachmentFileNames') ?? []
                          form.setValue('attachmentFileNames', [
                            ...current,
                            ...files.map(f => f.name),
                          ])
                        }
                      : undefined
                  }
                  onRemoveFile={
                    isFormEdit
                      ? index => {
                          const list = form.getValues('attachmentFileNames') ?? []
                          form.setValue(
                            'attachmentFileNames',
                            list.filter((_, i) => i !== index)
                          )
                        }
                      : undefined
                  }
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
