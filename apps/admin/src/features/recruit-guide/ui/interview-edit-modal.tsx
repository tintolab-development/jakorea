/**
 * 채용 안내 — 직무 인터뷰 제목/게시년도 수정 팝업
 *
 * 임팩트 스토리 연결값은 서버가 관리하는 읽기 전용 정보다.
 */

import { useCallback, useState } from 'react'
import type {
  InterviewItem,
  InterviewUpdateInput,
} from '@/entities/recruit-guide/model/types'
import { CmsButton, CmsInput, ContentModal, useCmsAlert } from '@/shared/ui'

import './interview-edit-modal.css'

const LINK_STATUS_LABEL: Record<string, string> = {
  LINKED: '정상 연결',
  LINKED_NOT_PUBLIC: '비공개 또는 공개 예정',
  LINKED_NOT_FOUND: '연결 스토리를 찾을 수 없음',
  UNRESOLVED: 'Impact Story 미연결',
}

type Props = {
  open: boolean
  item: InterviewItem | null
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (input: InterviewUpdateInput) => void
}

export function InterviewEditModal({
  open,
  item,
  confirmLoading,
  onCancel,
  onSubmit,
}: Props) {
  if (!open || !item) return null

  return (
    <InterviewEditModalBody
      key={`${item.id}-${item.version}`}
      item={item}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  )
}

type BodyProps = Omit<Props, 'open' | 'item'> & { item: InterviewItem }

function InterviewEditModalBody({
  item,
  confirmLoading,
  onCancel,
  onSubmit,
}: BodyProps) {
  const { showAlert } = useCmsAlert()
  const [title, setTitle] = useState(item.title)
  const [year, setYear] = useState(
    item.publishedYear == null ? '' : String(item.publishedYear)
  )

  const handleSubmit = useCallback(() => {
    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      showAlert({ title: '입력 확인', content: '인터뷰 제목을 확인해 주세요.' })
      return
    }

    const normalizedYear = year.trim()
    const publishedYear = normalizedYear === '' ? null : Number(normalizedYear)
    if (
      publishedYear != null &&
      (!Number.isInteger(publishedYear) || publishedYear < 1900 || publishedYear > 2200)
    ) {
      showAlert({ title: '입력 확인', content: '게시 연도를 확인해 주세요.' })
      return
    }

    onSubmit({ title: normalizedTitle, publishedYear })
  }, [onSubmit, showAlert, title, year])

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title="직무 인터뷰 수정"
      description="연결된 임팩트 스토리는 변경할 수 없습니다."
      width={720}
      className="recruit-guide-interview-edit-modal"
      footer={
        <div className="recruit-guide-interview-edit-modal__footer">
          <CmsButton
            variant="secondary"
            size="large"
            type="button"
            disabled={confirmLoading}
            onClick={onCancel}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            loading={confirmLoading}
            onClick={handleSubmit}
          >
            수정
          </CmsButton>
        </div>
      }
    >
      <div className="recruit-guide-interview-edit-modal__form">
        <div className="recruit-guide-interview-edit-modal__field">
          <span className="recruit-guide-interview-edit-modal__label">임팩트 스토리</span>
          <div className="recruit-guide-interview-edit-modal__readonly" aria-readonly="true">
            {item.imageUrl ? (
              <img
                className="recruit-guide-interview-edit-modal__cover"
                src={item.imageUrl}
                alt=""
              />
            ) : null}
            <strong>{item.impactStory?.title ?? '연결 정보 없음'}</strong>
            <span>
              ID {item.impactStoryId ?? '-'} · storyKey {item.storyKey ?? '-'}
            </span>
            <span>
              {item.linkStatus
                ? (LINK_STATUS_LABEL[item.linkStatus] ?? item.linkStatus)
                : '연결 상태 없음'}
            </span>
          </div>
        </div>

        <label className="recruit-guide-interview-edit-modal__field">
          <span className="recruit-guide-interview-edit-modal__label">인터뷰 제목</span>
          <CmsInput
            inputSize="large"
            width="100%"
            maxLength={300}
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="인터뷰 제목을 입력하세요"
          />
        </label>

        <label className="recruit-guide-interview-edit-modal__field">
          <span className="recruit-guide-interview-edit-modal__label">게시 연도</span>
          <CmsInput
            inputSize="large"
            width={180}
            value={year}
            inputMode="numeric"
            onChange={event => setYear(event.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="연도"
            suffix="년"
          />
        </label>
      </div>
    </ContentModal>
  )
}
