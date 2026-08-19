import type { RefObject } from 'react'
import type { InputRef } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput, FileSelectField } from '@/shared/ui'
import { RichTextEditor, type Editor } from '@/shared/rich-text'
import { MAIL_ATTACHMENT_GUIDE_LINES } from '@/features/notifications/model/mail-template/attachments'
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
}

export function ComposeFields({
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
}: ComposeFieldsProps) {
  return (
    <>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="제목"
          required
          fullRow
          view={subject}
          edit={
            <div className="mail-template-compose__subject">
              <CmsInput
                ref={subjectInputRef}
                inputSize="large"
                width="100%"
                allowClear={false}
                maxLength={subjectMaxLength}
                placeholder="제목을 작성하세요"
                value={subject}
                onChange={event => onSubjectChange(event.target.value)}
                onFocus={event => onRememberSubjectRange(event.currentTarget)}
                onBlur={event => onRememberSubjectRange(event.currentTarget)}
                onSelect={event => onRememberSubjectRange(event.currentTarget)}
                onClick={event => onRememberSubjectRange(event.currentTarget)}
                onKeyUp={event => onRememberSubjectRange(event.currentTarget)}
              />
              <span className="mail-template-compose__subject-count">
                {subject.length}/{subjectMaxLength}
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
              guideLines={MAIL_ATTACHMENT_GUIDE_LINES}
              onFilesChange={onAttachmentAdd}
              onRemoveFile={onAttachmentRemove}
            />
          }
        />
      </DetailInfoForm.Row>
    </>
  )
}
