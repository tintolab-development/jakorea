/**
 * 게시글 작성 모달
 * 수강 프로그램 상세 > 게시글 탭 > "게시글 작성" 버튼 클릭 시 노출
 * 스크린샷·persona 기준: 공개 범위(담당교사/강사진/학생), 게시글 내용, 첨부 파일, 하단 닫기
 */

import { useState } from 'react'
import { Checkbox, Input } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import { FileSelectField } from '@/shared/ui/file-select-field'
import './post-write-modal.css'

const { TextArea } = Input

const AUDIENCE_OPTIONS = [
  { label: '담당교사', value: 'teacher' },
  { label: '강사진', value: 'instructor' },
  { label: '학생', value: 'student' },
]

export interface PostWriteModalProps {
  open: boolean
  onCancel: () => void
}

export function PostWriteModal({ open, onCancel }: PostWriteModalProps) {
  const [audience, setAudience] = useState<string[]>(['teacher', 'instructor', 'student'])
  const [content, setContent] = useState('')
  const [fileNames, setFileNames] = useState<string[]>([])

  const handleFilesChange = (files: File[]) => {
    setFileNames(prev => [...prev, ...files.map(f => f.name)])
  }

  const handleRemoveFile = (index: number) => {
    setFileNames(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <TealHeaderModal
      open={open}
      onCancel={onCancel}
      title="게시글 작성"
      width={800}
      className="post-write-modal"
      footer={
        <AppButton variant="cancel" size="large" onClick={onCancel}>
          닫기
        </AppButton>
      }
    >
      <div className="post-write-modal__body">
        {/* 게시글 공개 범위 */}
        <div className="post-write-modal__field">
          <label className="post-write-modal__label">
            게시글 공개 범위 <span className="post-write-modal__required" aria-hidden>*</span>
          </label>
          <Checkbox.Group
            options={AUDIENCE_OPTIONS}
            value={audience}
            onChange={vals => setAudience(vals as string[])}
            className="post-write-modal__checkbox-group"
          />
        </div>

        {/* 게시글 내용 */}
        <div className="post-write-modal__field">
          <TextArea
            placeholder="게시글 내용을 작성하세요"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="post-write-modal__textarea"
          />
        </div>

        {/* 첨부 파일: 좌측 라벨 | 우측 FileSelectField(파일 목록 + 파일 선택 버튼 + 안내) */}
        <div className="post-write-modal__field">
          <div className="post-write-modal__attachment">
            <div className="post-write-modal__attachment-row">
              <span className="post-write-modal__attachment-label">첨부 파일</span>
              <div className="post-write-modal__attachment-body">
                <FileSelectField
                  accept=".jpg,.jpeg,.png,.JPG,.JPEG,.PNG"
                  multiple
                  fileNames={fileNames}
                  onFilesChange={handleFilesChange}
                  onRemoveFile={handleRemoveFile}
                  buttonLabel="파일 선택"
                  guideLines={[
                    '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
                    '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
                  ]}
                  className="post-write-modal__file-select file-select-field--edit"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </TealHeaderModal>
  )
}
