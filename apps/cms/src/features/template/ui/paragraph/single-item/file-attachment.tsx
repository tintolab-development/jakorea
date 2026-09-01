import { useState } from 'react'
import type { FileAttachmentParagraph } from '@/features/template/model/writing-form-draft.schema'
import { ParagraphFileUpload } from '@/features/template/ui/shared/paragraph-file-upload'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import './file-attachment.css'

function FilePreviewIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.8714 3.59961H7C6.44771 3.59961 6 4.04732 6 4.59961V18.7996C6 19.3519 6.44772 19.7996 7 19.7996H16.8385C17.3907 19.7996 17.8385 19.3519 17.8385 18.7996V8.38885C17.8385 8.11568 17.7267 7.85441 17.5292 7.66573L13.5622 3.87649C13.3761 3.69877 13.1287 3.59961 12.8714 3.59961ZM9.30233 8.28515C9.73592 8.28515 10.0874 7.93366 10.0874 7.50007C10.0874 7.06648 9.73592 6.71499 9.30233 6.71499C8.86875 6.71499 8.51725 7.06648 8.51725 7.50007C8.51725 7.93366 8.86875 8.28515 9.30233 8.28515ZM13.5376 8.37421L15.8881 11.5082C16.0859 11.7719 15.8977 12.1482 15.5681 12.1482H8.82622C8.49082 12.1482 8.30435 11.7603 8.51387 11.4983L9.80833 9.88028C9.95726 9.69411 10.2349 9.67873 10.4035 9.84731L10.8183 10.2621C10.9868 10.4306 11.2645 10.4153 11.4135 10.2291L12.9053 8.36433C13.0686 8.16015 13.3807 8.16503 13.5376 8.37421ZM15.2363 15.4129H15.9367C15.8446 14.6969 15.2663 14.1919 14.5128 14.1919C13.6327 14.1919 12.9553 14.8853 12.9553 16.0662C12.9553 17.2169 13.5912 17.9304 14.5267 17.9304C15.3676 17.9304 15.969 17.3475 15.969 16.3928V15.9406H14.5774V16.5084H15.3008C15.2916 16.9656 15.0082 17.2596 14.5313 17.2621C13.999 17.2596 13.6603 16.8249 13.6603 16.0561C13.6603 15.2924 14.0106 14.8627 14.5267 14.8602C14.8907 14.8627 15.1418 15.0713 15.2363 15.4129ZM9.13582 14.2422V16.7797C9.13582 17.1364 8.99066 17.3224 8.7257 17.3224C8.47686 17.3224 8.31558 17.154 8.31097 16.8651H7.61976C7.61746 17.5837 8.08979 17.9304 8.69344 17.9304C9.36392 17.9304 9.82242 17.4857 9.82242 16.7797V14.2422H9.13582ZM10.9844 17.8801H10.2932V14.2422H11.6019C12.3599 14.2422 12.7953 14.7522 12.7953 15.4682C12.7953 16.1943 12.353 16.6943 11.5834 16.6943H10.9844V17.8801ZM10.9844 14.8602V16.0863H11.4728C11.8829 16.0863 12.0834 15.835 12.0811 15.4682C12.0834 15.1064 11.8829 14.8627 11.4728 14.8602H10.9844Z"
        fill="#3D3D3D"
      />
    </svg>
  )
}

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

  return (
    <div key={paragraph.id} className="paragraph-file-attachment">
      <div className="paragraph-file-attachment__label">첨부 파일</div>
      <div className="paragraph-file-attachment__body">
        {fileNames.length > 0 ? (
          <div className="paragraph-file-attachment__files">
            {fileNames.map((name, index) => (
              <span key={`${index}-${name}`} className="paragraph-file-attachment__file-chip">
                <FilePreviewIcon />
                <span className="paragraph-file-attachment__file-name">{name}</span>
                {isEditMode ? (
                  <ItemDeleteButton
                    className="item-delete-button paragraph-file-attachment__file-remove"
                    aria-label={`${name} 삭제`}
                    onClick={event => {
                      event.stopPropagation()
                      setFileNames(prev => prev.filter((_, i) => i !== index))
                    }}
                  />
                ) : null}
              </span>
            ))}
          </div>
        ) : null}

        <ParagraphFileUpload
          accept=".jpg,.jpeg,.png"
          multiple
          onFilesChange={files => setFileNames(prev => [...prev, ...files.map(file => file.name)])}
        />
      </div>
    </div>
  )
}
