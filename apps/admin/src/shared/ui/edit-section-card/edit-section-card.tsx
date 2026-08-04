import { Button, Space, Typography } from 'antd'
import type { ReactNode } from 'react'
import styles from './edit-section-card.module.css'

const { Title } = Typography

/**
 * 수정 / 취소·저장 헤더가 있는 콘텐츠 섹션 카드
 * (메인 콘텐츠·JA Korea 소개 등 공통)
 */
export function EditSectionCard({
  title,
  editing,
  onEdit,
  onCancel,
  onSave,
  children,
  /** 페이지 단위 수정일 때 헤더 버튼 숨김 */
  hideActions = false,
}: {
  title: string
  editing?: boolean
  onEdit?: () => void
  onCancel?: () => void
  onSave?: () => void
  children: ReactNode
  hideActions?: boolean
}) {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <Title level={4} className={styles.title}>
          {title}
        </Title>
        {!hideActions && editing != null && onEdit && onCancel && onSave ? (
          editing ? (
            <Space>
              <Button onClick={onCancel}>취소</Button>
              <Button type="primary" onClick={onSave}>
                저장
              </Button>
            </Space>
          ) : (
            <Button type="primary" onClick={onEdit}>
              수정
            </Button>
          )
        ) : null}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
