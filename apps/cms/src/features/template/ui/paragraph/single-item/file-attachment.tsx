import { useState } from 'react'
import {
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS,
  type FileAttachmentParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import './file-attachment.css'

/** 보고 양식 교육 사진 — JPG·PNG만 (QA 261113 #52) */
const EDUCATION_DOCUMENT_PHOTOS_ACCEPT = '.jpg,.jpeg,.png'

const EDUCATION_DOCUMENT_PHOTOS_GUIDE_LINES = [
  '- 파일은 JPG, PNG 형식만 등록 가능하며, 최대 10개(파일당 20MB, 총 100MB)까지 첨부할 수 있습니다.',
]

const EDUCATION_DOCUMENT_PHOTOS_PARAGRAPH_IDS = new Set<string>([
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.educationPhotos,
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationPhotos,
])

/** 파일 첨부형 — 첨부파일 라벨 + 파일 목록 + 파일 추가 버튼/가이드 */
export function FileAttachment({
  paragraph,
  isEditMode,
}: {
  paragraph: FileAttachmentParagraph
  onChange?: (next: FileAttachmentParagraph) => void
  isEditMode: boolean
}) {
  const [fileNames, setFileNames] = useState<string[]>([])
  const isEducationDocumentPhotos = EDUCATION_DOCUMENT_PHOTOS_PARAGRAPH_IDS.has(paragraph.id)

  return (
    <div key={paragraph.id} className="paragraph-file-attachment">
      <div className="paragraph-file-attachment__label">첨부 파일</div>
      <div className="paragraph-file-attachment__body">
        <ParagraphFileUpload
          accept={isEducationDocumentPhotos ? EDUCATION_DOCUMENT_PHOTOS_ACCEPT : '.jpg,.jpeg,.png'}
          guideLines={
            isEducationDocumentPhotos ? EDUCATION_DOCUMENT_PHOTOS_GUIDE_LINES : undefined
          }
          multiple
          disabled={!isEditMode}
          fileNames={fileNames}
          onRemoveFile={
            isEditMode
              ? index => setFileNames(prev => prev.filter((_, i) => i !== index))
              : undefined
          }
          onFilesChange={files => {
            if (!isEditMode) return
            setFileNames(prev => [...prev, ...files.map(file => file.name)])
            const owner = buildAdminFileOwner(
              ADMIN_FILE_OWNER.EDUCATION_JOURNAL,
              1,
              ADMIN_FILE_PURPOSE.EDUCATION_JOURNAL
            )
            void (async () => {
              for (const file of files) {
                await uploadAdminFileMaybeMock({ file, owner }).catch(() => undefined)
              }
            })()
          }}
        />
      </div>
    </div>
  )
}
