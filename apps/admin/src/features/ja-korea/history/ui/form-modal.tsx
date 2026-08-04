import { useCallback, useEffect, useState } from 'react'
import { Button, Input, InputNumber, Modal, Radio, Space, Typography, message } from 'antd'
import type { HistoryDraft, HistoryItem } from '../model/types'
import styles from './form-modal.module.css'

const { Text, Paragraph } = Typography
const { TextArea } = Input

function draftFromItem(item: HistoryItem | null): HistoryDraft {
  if (!item) {
    return {
      visibility: 'public',
      year: null,
      month: null,
      content: '',
    }
  }
  return {
    visibility: item.visibility,
    year: item.year,
    month: item.month,
    content: item.content,
  }
}

export function HistoryFormModal({
  open,
  mode,
  item,
  onCancel,
  onSubmit,
  onDelete,
}: {
  open: boolean
  mode: 'create' | 'edit'
  item: HistoryItem | null
  onCancel: () => void
  onSubmit: (draft: HistoryDraft) => void
  onDelete?: () => void
}) {
  const [draft, setDraft] = useState<HistoryDraft>(() => draftFromItem(item))

  useEffect(() => {
    if (!open) return
    setDraft(draftFromItem(item))
  }, [open, item])

  const handleSubmit = useCallback(() => {
    if (draft.year == null || !Number.isInteger(draft.year) || draft.year < 1900) {
      message.error('연혁 년도를 입력해 주세요.')
      return
    }
    if (draft.month == null || draft.month < 1 || draft.month > 12) {
      message.error('연혁 월(1–12)을 입력해 주세요.')
      return
    }
    if (!draft.content.trim()) {
      message.error('내용을 입력해 주세요.')
      return
    }
    onSubmit(draft)
  }, [draft, onSubmit])

  const isCreate = mode === 'create'

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={isCreate ? '연혁 등록' : '연혁 수정'}
      width={560}
      destroyOnClose
      footer={
        <div className={styles.footer}>
          {!isCreate && onDelete ? (
            <Button danger onClick={onDelete}>
              연혁 삭제
            </Button>
          ) : (
            <span />
          )}
          <Space>
            <Button onClick={onCancel}>취소</Button>
            <Button type="primary" onClick={handleSubmit}>
              {isCreate ? '연혁 등록' : '수정'}
            </Button>
          </Space>
        </div>
      }
    >
      <div className={styles.form}>
        <Paragraph className={styles.guide}>년도와 월, 내용을 기재해 주세요.</Paragraph>

        <div className={styles.field}>
          <div className={styles.label}>공개 여부</div>
          <Radio.Group
            value={draft.visibility}
            onChange={e => setDraft(prev => ({ ...prev, visibility: e.target.value }))}
          >
            <Radio value="public">공개</Radio>
            <Radio value="private">비공개</Radio>
          </Radio.Group>
        </div>

        <div className={styles.field}>
          <div className={styles.label}>
            연혁 년도/월 <span className={styles.required}>*</span>
          </div>
          <div className={styles.yearMonth}>
            <div className={styles.unitInput}>
              <InputNumber
                value={draft.year ?? undefined}
                min={1900}
                max={2100}
                precision={0}
                placeholder="년도"
                onChange={value =>
                  setDraft(prev => ({
                    ...prev,
                    year: typeof value === 'number' ? value : null,
                  }))
                }
              />
              <Text className={styles.unit}>년</Text>
            </div>
            <div className={styles.unitInput}>
              <InputNumber
                value={draft.month ?? undefined}
                min={1}
                max={12}
                precision={0}
                placeholder="월"
                onChange={value =>
                  setDraft(prev => ({
                    ...prev,
                    month: typeof value === 'number' ? value : null,
                  }))
                }
              />
              <Text className={styles.unit}>월</Text>
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.label}>
            내용 <span className={styles.required}>*</span>
          </div>
          <TextArea
            value={draft.content}
            rows={5}
            placeholder="내용을 입력하세요"
            onChange={e => setDraft(prev => ({ ...prev, content: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  )
}
