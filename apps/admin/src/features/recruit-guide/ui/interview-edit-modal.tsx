import { useCallback, useState } from 'react'
import type { InterviewItem, InterviewSaveItem } from '@/entities/recruit-guide/model/types'
import { CmsButton, CmsInput, ContentModal, useCmsAlert } from '@/shared/ui'

import './interview-edit-modal.css'

type Props = {
  open: boolean
  item: InterviewItem
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (input: InterviewSaveItem) => void
}

export function InterviewEditModal({
  open,
  item,
  confirmLoading,
  onCancel,
  onSubmit,
}: Props) {
  const { showAlert } = useCmsAlert()
  const [title, setTitle] = useState(item.title)
  const [year, setYear] = useState(item.publishedYear == null ? '' : String(item.publishedYear))

  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      showAlert({ title: '입력 확인', content: '게시글 제목을 입력해 주세요.' })
      return
    }
    const normalizedYear = year.trim()
    if (normalizedYear && (!/^\d{4}$/.test(normalizedYear) || Number(normalizedYear) < 1900 || Number(normalizedYear) > 2200)) {
      showAlert({ title: '입력 확인', content: '연도는 1900년부터 2200년 사이로 입력해 주세요.' })
      return
    }
    onSubmit({
      title: title.trimEnd(),
      publishedYear: normalizedYear ? Number(normalizedYear) : null,
      version: item.version,
    })
  }, [item.version, onSubmit, showAlert, title, year])

  if (!open) return null

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title={`직무 인터뷰 ${item.id} 수정`}
      width={800}
      className="recruit-guide-interview-edit-modal"
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="large"
            type="button"
            onClick={onCancel}
            disabled={confirmLoading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            loading={confirmLoading}
            disabled={confirmLoading}
            onClick={handleSubmit}
          >
            저장
          </CmsButton>
        </>
      }
    >
      <div className="recruit-guide-interview-edit-modal__form">
        <label className="recruit-guide-interview-edit-modal__field">
          <span>스토리 키</span>
          <CmsInput inputSize="large" width="100%" value={item.storyKey} readOnly />
        </label>
        <label className="recruit-guide-interview-edit-modal__field">
          <span>게시글 제목</span>
          <CmsInput
            inputSize="large"
            width="100%"
            value={title}
            maxLength={300}
            onChange={event => setTitle(event.target.value)}
          />
        </label>
        <label className="recruit-guide-interview-edit-modal__field">
          <span>게시년도</span>
          <CmsInput
            inputSize="large"
            width="100%"
            value={year}
            maxLength={4}
            inputMode="numeric"
            placeholder="예: 2026"
            onChange={event => setYear(event.target.value.replace(/\D/g, ''))}
          />
        </label>
      </div>
    </ContentModal>
  )
}
