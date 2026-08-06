/**
 * 운영원칙 관리 — 소개글 + 고정 5행 정렬 테이블
 *
 * 조회↔수정 UI shift 최소화:
 * - 셀/필드를 span↔input 으로 갈아끼우지 않음
 * - 동일 컨트롤을 유지하고 readOnly + 스타일만 전환
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type {
  OperatingPrinciple,
  OperatingPrinciplesDoc,
  OperatingPrinciplesIntro,
} from '@/entities/operating-principles/model/types'
import {
  useReorderOperatingPrinciples,
  useSaveOperatingPrinciples,
  useSetPrincipleActive,
} from '@/features/operating-principles/api/hooks'
import { operatingPrinciplesQueryKeys } from '@/features/operating-principles/api/query-keys'
import { PrincipleIcon } from '@/features/operating-principles/ui/principle-icon'
import {
  PrincipleDragHandle,
  PrinciplesSortableTable,
} from '@/features/operating-principles/ui/sortable-table'
import { CmsButton, CmsInput, CmsTextArea, useCmsAlert } from '@/shared/ui'

import './principles-form-card.css'

type Props = {
  data: OperatingPrinciplesDoc
}

type DraftTexts = Record<string, { title: string; subText: string }>

function SectionTitle({
  children,
  note,
}: {
  children: ReactNode
  note?: ReactNode
}) {
  return (
    <div className="principles-form-section-title">
      <span className="principles-form-section-title__marker" aria-hidden />
      <span className="principles-form-section-title__text">{children}</span>
      {note != null ? (
        <span className="principles-form-section-title__note">{note}</span>
      ) : null}
    </div>
  )
}

function buildDraftTexts(rows: OperatingPrinciple[]): DraftTexts {
  return Object.fromEntries(
    rows.map(row => [row.id, { title: row.title, subText: row.subText }])
  )
}

function cloneIntro(intro: OperatingPrinciplesIntro): OperatingPrinciplesIntro {
  return {
    topSubText: intro.topSubText,
    mainText: intro.mainText,
  }
}

function fieldClass(isEditing: boolean, ...extra: Array<string | false | undefined>) {
  return [
    'principles-inline-field',
    isEditing ? 'principles-inline-field--edit' : 'principles-inline-field--readonly',
    ...extra,
  ]
    .filter(Boolean)
    .join(' ')
}

export function PrinciplesFormCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const reorderMutation = useReorderOperatingPrinciples()
  const setActiveMutation = useSetPrincipleActive()
  const saveMutation = useSaveOperatingPrinciples()

  const rows = data.principles
  const [isEditing, setIsEditing] = useState(false)
  const [draftIntro, setDraftIntro] = useState<OperatingPrinciplesIntro>(() =>
    cloneIntro(data.intro)
  )
  const [draftTexts, setDraftTexts] = useState<DraftTexts>(() => buildDraftTexts(rows))

  /** 조회 중 서버 데이터 변경 시 draft 동기화 (컨트롤 유지용) */
  useEffect(() => {
    if (isEditing) return
    setDraftIntro(cloneIntro(data.intro))
    setDraftTexts(buildDraftTexts(data.principles))
  }, [data, isEditing])

  const refetchDoc = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: operatingPrinciplesQueryKeys.all })
  }, [queryClient])

  const handleEdit = useCallback(() => {
    setDraftIntro(cloneIntro(data.intro))
    setDraftTexts(buildDraftTexts(rows))
    setIsEditing(true)
  }, [data.intro, rows])

  const handleCancel = useCallback(() => {
    setDraftIntro(cloneIntro(data.intro))
    setDraftTexts(buildDraftTexts(rows))
    setIsEditing(false)
  }, [data.intro, rows])

  const handleSave = useCallback(async () => {
    try {
      await saveMutation.mutateAsync({
        intro: draftIntro,
        principles: rows.map(row => ({
          id: row.id,
          title: draftTexts[row.id]?.title ?? row.title,
          subText: draftTexts[row.id]?.subText ?? row.subText,
        })),
      })
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: '운영원칙 저장에 실패했습니다. 다시 시도해 주세요.',
      })
      refetchDoc()
    }
  }, [draftIntro, draftTexts, rows, saveMutation, showAlert, refetchDoc])

  const handleRowsReorder = useCallback(
    (reorderedRows: OperatingPrinciple[]) => {
      void reorderMutation.mutateAsync(reorderedRows.map(row => row.id)).catch(() => {
        showAlert({
          title: '순서 변경 실패',
          content: '운영 원칙 순서 저장에 실패했습니다. 목록을 다시 불러옵니다.',
        })
        refetchDoc()
      })
    },
    [reorderMutation, showAlert, refetchDoc]
  )

  const handleToggleActive = useCallback(
    (id: string, isActive: boolean) => {
      void setActiveMutation.mutateAsync({ id, isActive }).catch(() => {
        showAlert({
          title: '사용 여부 변경 실패',
          content: '사용 여부 변경에 실패했습니다. 다시 시도해 주세요.',
        })
        refetchDoc()
      })
    },
    [setActiveMutation, showAlert, refetchDoc]
  )

  const handleDraftTextChange = useCallback(
    (id: string, field: 'title' | 'subText', value: string) => {
      setDraftTexts(prev => {
        const base = prev[id] ?? { title: '', subText: '' }
        return {
          ...prev,
          [id]: {
            title: field === 'title' ? value : base.title,
            subText: field === 'subText' ? value : base.subText,
          },
        }
      })
    },
    []
  )

  const columns = useMemo<ColumnsType<OperatingPrinciple>>(
    () => [
      {
        title: '순서',
        key: 'sort',
        width: 72,
        align: 'center',
        render: () => <PrincipleDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: 72,
        align: 'center',
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '사용 여부',
        key: 'isActive',
        width: 100,
        align: 'center',
        render: (_value, record) => (
          <Switch
            checked={record.isActive}
            onChange={checked => handleToggleActive(record.id, checked)}
            aria-label={`${record.title} 사용 여부`}
          />
        ),
      },
      {
        title: '아이콘',
        key: 'icon',
        width: 88,
        align: 'center',
        render: (_value, record) => <PrincipleIcon iconKey={record.iconKey} size={40} />,
      },
      {
        title: '타이틀',
        key: 'title',
        width: 280,
        render: (_value, record) => {
          const value = draftTexts[record.id]?.title ?? record.title
          return (
            <CmsInput
              className={fieldClass(isEditing)}
              inputSize="medium"
              width="100%"
              value={value}
              readOnly={!isEditing}
              tabIndex={isEditing ? 0 : -1}
              onChange={e => {
                if (!isEditing) return
                handleDraftTextChange(record.id, 'title', e.target.value)
              }}
              placeholder="타이틀을 입력하세요"
              aria-label={`타이틀 ${record.sortOrder}`}
            />
          )
        },
      },
      {
        title: '서브 텍스트',
        key: 'subText',
        render: (_value, record) => {
          const value = draftTexts[record.id]?.subText ?? record.subText
          return (
            <CmsTextArea
              className={fieldClass(isEditing, 'cms-textarea--fixed-rows')}
              inputSize="medium"
              width="100%"
              rows={3}
              value={value}
              readOnly={!isEditing}
              tabIndex={isEditing ? 0 : -1}
              onChange={e => {
                if (!isEditing) return
                handleDraftTextChange(record.id, 'subText', e.target.value)
              }}
              placeholder="서브 텍스트를 입력하세요"
              aria-label={`서브 텍스트 ${record.sortOrder}`}
            />
          )
        },
      },
    ],
    [draftTexts, handleDraftTextChange, handleToggleActive, isEditing]
  )

  return (
    <div
      className={
        isEditing
          ? 'admin-list-card principles-form-card principles-form-card--editing'
          : 'admin-list-card principles-form-card'
      }
    >
      <div className="admin-list-toolbar">
        <div className="table-header-title--wrapper">
          <span className="table-title">운영원칙 관리</span>
        </div>
        <div className="table-header-actions--wrapper">
          {isEditing ? (
            <>
              <CmsButton
                variant="secondary"
                size="medium"
                type="button"
                onClick={handleCancel}
                disabled={saveMutation.isPending}
              >
                취소
              </CmsButton>
              <CmsButton
                variant="primary"
                size="medium"
                type="button"
                loading={saveMutation.isPending}
                onClick={() => {
                  void handleSave()
                }}
              >
                저장
              </CmsButton>
            </>
          ) : (
            <CmsButton variant="primary" size="medium" type="button" onClick={handleEdit}>
              수정
            </CmsButton>
          )}
        </div>
      </div>

      <div className="principles-form-card__body">
        <section className="principles-form-section">
          <SectionTitle>소개글</SectionTitle>
          {/*
            mode 항상 edit — view/edit 슬롯 스왑으로 인한 언마운트·행 높이 점프 방지.
            조회 시 readOnly + readonly 스타일만 적용.
          */}
          <DetailInfoForm title="소개글" hideHeader mode="edit">
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="상단 서브 텍스트"
                view={null}
                edit={
                  <CmsTextArea
                    className={fieldClass(isEditing, 'cms-textarea--fixed-rows')}
                    inputSize="medium"
                    width="100%"
                    rows={1}
                    value={draftIntro.topSubText}
                    readOnly={!isEditing}
                    tabIndex={isEditing ? 0 : -1}
                    onChange={e => {
                      if (!isEditing) return
                      setDraftIntro(prev => ({ ...prev, topSubText: e.target.value }))
                    }}
                    placeholder="상단 서브 텍스트를 입력하세요"
                  />
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="메인 텍스트"
                view={null}
                edit={
                  <CmsTextArea
                    className={fieldClass(isEditing, 'cms-textarea--fixed-rows')}
                    inputSize="medium"
                    width="100%"
                    rows={2}
                    value={draftIntro.mainText}
                    readOnly={!isEditing}
                    tabIndex={isEditing ? 0 : -1}
                    onChange={e => {
                      if (!isEditing) return
                      setDraftIntro(prev => ({ ...prev, mainText: e.target.value }))
                    }}
                    placeholder="메인 텍스트를 입력하세요"
                  />
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </section>

        <section className="principles-form-section principles-form-section--table">
          <SectionTitle note="아이콘 이미지는 수정 및 삭제가 불가합니다.">
            운영 원칙
          </SectionTitle>
          <PrinciplesSortableTable
            rows={rows}
            columns={columns}
            onRowsReorder={handleRowsReorder}
          />
        </section>
      </div>
    </div>
  )
}
