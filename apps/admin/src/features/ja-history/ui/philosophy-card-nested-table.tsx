/**
 * 교육 카드 값 셀 안 중첩 테이블 — 이미지(수정 모드에서 첨부) + 타이틀 + 텍스트
 * 규격: apps/admin/.cursor/rules/design/detail-info-nested-table.mdc
 */
import { useCallback } from 'react'
import type { JaHistoryPhilosophyCard } from '@/entities/ja-history/model/types'
import {
  FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
  FileSelectField,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  useCmsAlert,
} from '@/shared/ui'
import { InlineText, MediaPreview } from './chrome'
import { isAllowedJaHistoryImage, JA_HISTORY_IMAGE_ACCEPT, readJaHistoryImage } from './image-file'

const IMAGE_GUIDE_LINES = [
  '- 파일은 최대 20MB까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 권장 이미지 사이즈는 354 × 480px입니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

type PhilosophyCardNestedTableProps = {
  card: JaHistoryPhilosophyCard
  editing: boolean
  ariaLabel: string
  onChange: (
    patch: Partial<Pick<JaHistoryPhilosophyCard, 'title' | 'description' | 'image'>>,
  ) => void
}

export function PhilosophyCardNestedTable({
  card,
  editing,
  ariaLabel,
  onChange,
}: PhilosophyCardNestedTableProps) {
  const { showAlert } = useCmsAlert()
  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedJaHistoryImage(file)) {
        showAlert({
          title: '파일 형식 오류',
          content: 'JPG, PNG 형식의 이미지만 등록할 수 있습니다.',
        })
        return
      }
      if (
        isFileSelectTotalSizeExceeded({
          incoming: [file],
          maxTotalBytes: FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
        })
      ) {
        notifyFileSelectTotalSizeExceeded(FILE_SELECT_IMAGE_MAX_TOTAL_BYTES)
        return
      }
      try {
        const dataUrl = await readJaHistoryImage(file)
        onChange({
          image: { ...card.image, url: dataUrl, fileName: file.name, assetId: undefined },
        })
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [card.image, onChange, showAlert],
  )

  return (
    <div
      className="ja-history-philosophy-nested-table ja-history-philosophy-nested-table--card"
      role="group"
      aria-label={ariaLabel}
    >
      <div className="ja-history-philosophy-nested-table__cell">
        <div className="ja-history-philosophy-nested-table__label">이미지</div>
        <div className="ja-history-philosophy-nested-table__value ja-history-philosophy-nested-table__value--media">
          <div className="ja-history-editable-image">
            <MediaPreview media={card.image} size="thumb" />
            {editing ? (
              <FileSelectField
                className="ja-history-editable-image__field"
                multiple={false}
                accept={JA_HISTORY_IMAGE_ACCEPT}
                buttonLabel="파일 추가"
                fileNames={card.image.fileName ? [card.image.fileName] : []}
                maxTotalBytes={FILE_SELECT_IMAGE_MAX_TOTAL_BYTES}
                guideLines={IMAGE_GUIDE_LINES}
                onFilesChange={files => {
                  void handleFilesChange(files)
                }}
              />
            ) : (
              <span className="ja-history-locked-image__name">
                {card.image.fileName || '등록된 파일 없음'}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="ja-history-philosophy-nested-table__cell">
        <div className="ja-history-philosophy-nested-table__label">타이틀</div>
        <div className="ja-history-philosophy-nested-table__value">
          <InlineText
            editing={editing}
            value={card.title}
            rows={1}
            label={`${ariaLabel} 타이틀`}
            placeholder="타이틀을 입력하세요"
            onChange={title => onChange({ title })}
          />
        </div>
      </div>
      <div className="ja-history-philosophy-nested-table__cell">
        <div className="ja-history-philosophy-nested-table__label">텍스트</div>
        <div className="ja-history-philosophy-nested-table__value ja-history-philosophy-nested-table__value--textarea">
          <InlineText
            editing={editing}
            value={card.description}
            rows={2}
            label={`${ariaLabel} 텍스트`}
            placeholder="텍스트를 입력하세요"
            onChange={description => onChange({ description })}
          />
        </div>
      </div>
    </div>
  )
}
