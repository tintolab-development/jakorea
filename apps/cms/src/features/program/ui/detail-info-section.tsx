/**
 * 상세 정보 섹션 (프로그램 상세 정보 탭)
 * - 프로그램 설명, 모집 안내, 학습 지원 내용, 추가 내용, 첨부 파일
 * - 수정 모드: react-hook-form Controller + Toast UI Editor(추가 내용)
 */

import { useEffect, useRef, useState } from 'react'
import { Image, Input } from 'antd'
import { Controller } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '../model/program-detail-edit-schema'
import { FileSelectField } from '@/shared/ui/file-select-field'
import { useTemplateEditor } from '@/features/template/hooks/use-template-editor'
import {
  DEFAULT_PROGRAM_DESCRIPTION,
  DEFAULT_RECRUITMENT_GUIDE,
  DEFAULT_LEARNING_SUPPORT,
  DEFAULT_ADDITIONAL_HTML,
} from './program-detail-info-constants'

const { TextArea } = Input

export interface DetailInfoSectionProps {
  program: Program
  isEditMode?: boolean
  /** 수정 모드일 때만 전달 */
  form?: UseFormReturn<ProgramDetailEditFormValues>
  /** 수정 모드에서 저장 시 추가 내용 HTML 수집용 getter 등록 */
  onRegisterGetAdditionalContentHtml?: (getter: () => string) => void
}

export function DetailInfoSection({
  program,
  isEditMode = false,
  form,
  onRegisterGetAdditionalContentHtml,
}: DetailInfoSectionProps) {
  const [editorOpen, setEditorOpen] = useState(false)
  useEffect(() => {
    if (!isEditMode) {
      setEditorOpen(false)
      return
    }
    // 에디터 마운트 지연 → 상단 버튼 포커스 유지 후 마운트해 스크롤 방지
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
  const displayFileNames = isFormEdit
    ? (form.watch('attachmentFileNames') ?? [])
    : (program.attachmentFileNames ?? [])

  return (
    <section className="program-detail-info-tab__section">
      <div className="program-detail-info-tab__section-header-row">
        <h3 className="program-detail-info-tab__section-title">상세 정보</h3>
        <p className="program-detail-info-tab__detail-note">
          필수 정보가 아닌 항목이 공란인 경우, 상세 페이지에서 항목 미노출 됩니다.
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
                프로그램 설명{isEditMode ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
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
                      />
                    )}
                  />
                ) : (
                  <div className="program-detail-info-tab__content-block">
                    {program.description || DEFAULT_PROGRAM_DESCRIPTION}
                  </div>
                )}
              </td>
            </tr>
            <tr>
              <th>
                모집 안내{isEditMode ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
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
                      />
                    )}
                  />
                ) : (
                  <div className="program-detail-info-tab__content-block">
                    {program.recruitmentGuide || DEFAULT_RECRUITMENT_GUIDE}
                  </div>
                )}
              </td>
            </tr>
            <tr>
              <th>
                학습 지원 내용{isEditMode ? <span className="program-detail-info-tab__required">*</span> : null}
              </th>
              <td>
                {isFormEdit ? (
                  <Controller
                    name="learningSupportContent"
                    control={form.control}
                    render={({ field }) => (
                      <TextArea
                        {...field}
                        value={field.value ?? ''}
                        rows={5}
                        placeholder="학습 지원 내용"
                        className="program-detail-info-tab__content-textarea program-detail-info-tab__content-textarea--sm"
                      />
                    )}
                  />
                ) : (
                  <div className="program-detail-info-tab__content-block program-detail-info-tab__content-block--sm">
                    {program.learningSupportContent || DEFAULT_LEARNING_SUPPORT}
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
              <th>첨부 파일</th>
              <td>
                <FileSelectField
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  multiple
                  disabled={!isEditMode}
                  className={isEditMode ? 'file-select-field--edit' : ''}
                  fileNames={displayFileNames}
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
    </section>
  )
}
