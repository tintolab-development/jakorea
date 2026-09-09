import { memo, useEffect, useState, type RefObject } from 'react'
import type { InputRef } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput, FileSelectField } from '@/shared/ui'
import { RichTextEditor, type Editor } from '@/shared/rich-text'
import { MAIL_ATTACHMENT_GUIDE_LINES } from '@/features/notifications/model/mail-template/attachments'
import { SmsVariableTextField } from '@/features/notifications/ui/sms-template/variable-text-field'
import './compose-fields.css'

type ComposeFieldsProps = {
  editor: Editor | null
  editorMinHeight: string
  subject: string
  subjectMaxLength: number
  subjectInputRef: RefObject<InputRef | null>
  attachmentFileNames: string[]
  onSubjectChange: (value: string) => void
  onRememberSubjectRange: (el: HTMLInputElement | null) => void
  onAttachmentAdd: (files: File[]) => void
  onAttachmentRemove: (index: number) => void
  /** 발송 화면: 저장된 템플릿 미리보기만 (제목/본문 override API 없음) */
  readOnly?: boolean
}

export const ComposeFields = memo(function ComposeFields({
  editor,
  editorMinHeight,
  subject,
  subjectMaxLength,
  subjectInputRef,
  attachmentFileNames,
  onSubjectChange,
  onRememberSubjectRange,
  onAttachmentAdd,
  onAttachmentRemove,
  readOnly = false,
}: ComposeFieldsProps) {
  // 제목 타이핑은 로컬 state — 부모 setState 없이 입력 반응성 유지
  const [localSubject, setLocalSubject] = useState(subject)

  useEffect(() => {
    setLocalSubject(subject)
  }, [subject])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!readOnly)
    return () => {
      editor.setEditable(true)
    }
  }, [editor, readOnly])

  return (
    <>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="제목"
          required
          fullRow
          view={localSubject}
          edit={
            <div className="mail-template-compose__subject">
              <SmsVariableTextField
                value={localSubject}
                maxLength={subjectMaxLength}
                onValueChange={
                  readOnly
                    ? undefined
                    : next => {
                        setLocalSubject(next)
                        onSubjectChange(next)
                      }
                }
              >
                <CmsInput
                  ref={subjectInputRef}
                  inputSize="large"
                  width="100%"
                  allowClear={false}
                  maxLength={subjectMaxLength}
                  placeholder="제목을 작성하세요"
                  value={localSubject}
                  readOnly={readOnly}
                  onChange={event => {
                    if (readOnly) return
                    const next = event.target.value
                    setLocalSubject(next)
                    onSubjectChange(next)
                  }}
                  onFocus={event => onRememberSubjectRange(event.currentTarget)}
                  onBlur={event => onRememberSubjectRange(event.currentTarget)}
                  onSelect={event => onRememberSubjectRange(event.currentTarget)}
                  onClick={event => onRememberSubjectRange(event.currentTarget)}
                  onKeyUp={event => onRememberSubjectRange(event.currentTarget)}
                />
              </SmsVariableTextField>
              <span className="mail-template-compose__subject-count">
                {localSubject.length}/{subjectMaxLength}
              </span>
            </div>
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="내용"
          required
          fullRow
          view=""
          edit={
            <div className="mail-template-compose__editor-host">
              <RichTextEditor editor={editor} minHeight={editorMinHeight} />
            </div>
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="첨부파일"
          fullRow
          view=""
          edit={
            <FileSelectField
              className="mail-template-compose__file-field"
              multiple
              maxTotalBytes={0}
              buttonLabel="파일 추가"
              fileNames={attachmentFileNames}
              guideLines={
                readOnly
                  ? ['템플릿에 등록된 첨부만 발송됩니다.']
                  : MAIL_ATTACHMENT_GUIDE_LINES
              }
              disabled={readOnly}
              onFilesChange={onAttachmentAdd}
              onRemoveFile={onAttachmentRemove}
            />
          }
        />
      </DetailInfoForm.Row>
    </>
  )
})
