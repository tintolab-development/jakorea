import { useCallback, useEffect, useState } from 'react'
import { Button, DatePicker, Input, Modal, Radio, Space, Typography, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import type { AwardDraft, AwardItem } from '../model/types'
import styles from './form-modal.module.css'

const { Paragraph } = Typography

function draftFromItem(item: AwardItem | null): AwardDraft {
  if (!item) {
    return {
      visibility: 'public',
      title: '',
      organization: '',
      awardedOn: null,
    }
  }
  return {
    visibility: item.visibility,
    title: item.title,
    organization: item.organization,
    awardedOn: item.awardedOn,
  }
}

export function AwardFormModal({
  open,
  mode,
  item,
  onCancel,
  onSubmit,
  onDelete,
}: {
  open: boolean
  mode: 'create' | 'edit'
  item: AwardItem | null
  onCancel: () => void
  onSubmit: (draft: AwardDraft) => void
  onDelete?: () => void
}) {
  const [draft, setDraft] = useState<AwardDraft>(() => draftFromItem(item))

  useEffect(() => {
    if (!open) return
    setDraft(draftFromItem(item))
  }, [open, item])

  const handleSubmit = useCallback(() => {
    if (!draft.awardedOn) {
      message.error('수상일을 선택해 주세요.')
      return
    }
    if (!draft.title.trim()) {
      message.error('상명을 입력해 주세요.')
      return
    }
    if (!draft.organization.trim()) {
      message.error('수여 기관명을 입력해 주세요.')
      return
    }
    onSubmit(draft)
  }, [draft, onSubmit])

  const isCreate = mode === 'create'
  const awardedValue: Dayjs | null = draft.awardedOn ? dayjs(draft.awardedOn) : null

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={isCreate ? '수상 등록' : '수상 수정'}
      width={560}
      destroyOnClose
      footer={
        <div className={styles.footer}>
          {!isCreate && onDelete ? (
            <Button danger onClick={onDelete}>
              수상 삭제
            </Button>
          ) : (
            <span />
          )}
          <Space>
            <Button onClick={onCancel}>취소</Button>
            <Button type="primary" onClick={handleSubmit}>
              {isCreate ? '수상 등록' : '수정'}
            </Button>
          </Space>
        </div>
      }
    >
      <div className={styles.form}>
        <div>
          <Paragraph className={styles.guide}>수상일과 상명, 수여 기관명을 기재해 주세요.</Paragraph>
          <Paragraph className={styles.guideNote}>
            수상일은 관리자 화면에서 일까지 노출되며, 홈페이지에서는 연도와 월까지만 노출됩니다.
          </Paragraph>
        </div>

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
            수상일 <span className={styles.required}>*</span>
          </div>
          <DatePicker
            value={awardedValue}
            placeholder="수상일을 선택하세요"
            style={{ width: '100%' }}
            onChange={date =>
              setDraft(prev => ({
                ...prev,
                awardedOn: date ? date.format('YYYY-MM-DD') : null,
              }))
            }
          />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>
            상명 <span className={styles.required}>*</span>
          </div>
          <Input
            value={draft.title}
            placeholder="상명을 입력하세요"
            onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>
            수여 기관명 <span className={styles.required}>*</span>
          </div>
          <Input
            value={draft.organization}
            placeholder="수여 기관명을 입력하세요"
            onChange={e => setDraft(prev => ({ ...prev, organization: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  )
}
