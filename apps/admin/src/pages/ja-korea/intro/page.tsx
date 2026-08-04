import { useCallback, useEffect, useState } from 'react'
import { Button, Input, Space, Typography, message } from 'antd'
import {
  cloneIntroContent,
  useJaKoreaIntroStore,
  type JaKoreaIntroContent,
} from '@/features/ja-korea/intro'
import { EditSectionCard } from '@/shared/ui/edit-section-card'
import styles from './page.module.css'

const { Text, Paragraph } = Typography
const { TextArea } = Input

function Field({
  label,
  editing,
  value,
  onChange,
  rows = 3,
}: {
  label: string
  editing: boolean
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <div className={styles.field}>
      <Text className={styles.label}>{label}</Text>
      {editing ? (
        <TextArea
          value={value}
          rows={rows}
          onChange={e => onChange(e.target.value)}
          placeholder={`${label}을(를) 입력해 주세요`}
        />
      ) : (
        <Paragraph className={styles.preline}>{value.trim() ? value : '—'}</Paragraph>
      )}
    </div>
  )
}

/**
 * JA Korea > 기관 소개 > JA Korea 소개 관리
 * Notion: 1-1. JA Korea 소개 관리
 */
export function JaKoreaIntroPage() {
  const content = useJaKoreaIntroStore(s => s.content)
  const save = useJaKoreaIntroStore(s => s.save)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<JaKoreaIntroContent>(() => cloneIntroContent(content))

  useEffect(() => {
    if (!editing) setDraft(cloneIntroContent(content))
  }, [editing, content])

  const startEdit = useCallback(() => {
    setDraft(cloneIntroContent(content))
    setEditing(true)
  }, [content])

  const cancelEdit = useCallback(() => {
    setDraft(cloneIntroContent(content))
    setEditing(false)
  }, [content])

  const handleSave = useCallback(() => {
    if (!draft.section01.mainTitle.trim()) {
      message.error('소개글 섹션 01의 메인 타이틀을 입력해 주세요.')
      return
    }
    save(draft)
    setEditing(false)
    message.success('JA Korea 소개가 저장되었습니다.')
  }, [draft, save])

  const patch = useCallback((updater: (prev: JaKoreaIntroContent) => JaKoreaIntroContent) => {
    setDraft(prev => updater(prev))
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        {editing ? (
          <Space>
            <Button onClick={cancelEdit}>취소</Button>
            <Button type="primary" onClick={handleSave}>
              저장
            </Button>
          </Space>
        ) : (
          <Button type="primary" onClick={startEdit}>
            수정
          </Button>
        )}
      </div>

      <EditSectionCard title="소개글 섹션 01" hideActions>
        <div className={styles.fieldRow}>
          <Field
            label="메인 타이틀"
            editing={editing}
            value={draft.section01.mainTitle}
            onChange={v =>
              patch(prev => ({
                ...prev,
                section01: { ...prev.section01, mainTitle: v },
              }))
            }
          />
          <Field
            label="서브 타이틀"
            editing={editing}
            value={draft.section01.subTitle}
            onChange={v =>
              patch(prev => ({
                ...prev,
                section01: { ...prev.section01, subTitle: v },
              }))
            }
          />
        </div>
      </EditSectionCard>

      <EditSectionCard title="소개글 섹션 02" hideActions>
        <div className={styles.fieldRow}>
          <Field
            label="타이틀 문구"
            editing={editing}
            value={draft.section02.mainTitle}
            onChange={v =>
              patch(prev => ({
                ...prev,
                section02: { ...prev.section02, mainTitle: v },
              }))
            }
          />
          <Field
            label="서브 타이틀"
            editing={editing}
            value={draft.section02.subTitle}
            onChange={v =>
              patch(prev => ({
                ...prev,
                section02: { ...prev.section02, subTitle: v },
              }))
            }
          />
        </div>

        <div className={styles.nested}>
          <Text className={styles.blockTitle}>콘텐츠 01</Text>
          <div className={styles.fieldRow}>
            <Field
              label="타이틀"
              editing={editing}
              value={draft.section02.content01.title}
              onChange={v =>
                patch(prev => ({
                  ...prev,
                  section02: {
                    ...prev.section02,
                    content01: { ...prev.section02.content01, title: v },
                  },
                }))
              }
            />
            <Field
              label="설명글"
              editing={editing}
              value={draft.section02.content01.description}
              rows={4}
              onChange={v =>
                patch(prev => ({
                  ...prev,
                  section02: {
                    ...prev.section02,
                    content01: { ...prev.section02.content01, description: v },
                  },
                }))
              }
            />
          </div>
        </div>

        <div className={styles.nested}>
          <Text className={styles.blockTitle}>콘텐츠 02</Text>
          <div className={styles.fieldRow}>
            <Field
              label="타이틀"
              editing={editing}
              value={draft.section02.content02.title}
              onChange={v =>
                patch(prev => ({
                  ...prev,
                  section02: {
                    ...prev.section02,
                    content02: { ...prev.section02.content02, title: v },
                  },
                }))
              }
            />
            <Field
              label="설명글"
              editing={editing}
              value={draft.section02.content02.description}
              rows={4}
              onChange={v =>
                patch(prev => ({
                  ...prev,
                  section02: {
                    ...prev.section02,
                    content02: { ...prev.section02.content02, description: v },
                  },
                }))
              }
            />
          </div>
        </div>
      </EditSectionCard>

      <EditSectionCard title="Global Vision" hideActions>
        <div className={styles.fieldRow}>
          <Field
            label="상단 서브 텍스트"
            editing={editing}
            value={draft.globalVision.subText}
            onChange={v =>
              patch(prev => ({
                ...prev,
                globalVision: { ...prev.globalVision, subText: v },
              }))
            }
          />
          <Field
            label="메인 텍스트"
            editing={editing}
            value={draft.globalVision.mainText}
            onChange={v =>
              patch(prev => ({
                ...prev,
                globalVision: { ...prev.globalVision, mainText: v },
              }))
            }
          />
        </div>
      </EditSectionCard>

      <EditSectionCard title="Global Mission" hideActions>
        <div className={styles.fieldRow}>
          <Field
            label="상단 서브 텍스트"
            editing={editing}
            value={draft.globalMission.subText}
            onChange={v =>
              patch(prev => ({
                ...prev,
                globalMission: { ...prev.globalMission, subText: v },
              }))
            }
          />
          <Field
            label="메인 텍스트"
            editing={editing}
            value={draft.globalMission.mainText}
            onChange={v =>
              patch(prev => ({
                ...prev,
                globalMission: { ...prev.globalMission, mainText: v },
              }))
            }
          />
        </div>
      </EditSectionCard>
    </div>
  )
}
