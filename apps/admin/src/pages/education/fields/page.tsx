/**
 * 사업분야 관리
 */

import { useCallback, useMemo, useState } from 'react'
import { Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { EducationBusinessField } from '@/entities/education-business-field/model/types'
import {
  useEducationBusinessFieldDocument,
  useReorderEducationBusinessFields,
  useSaveEducationBusinessFieldDocument,
  useSetEducationBusinessFieldActive,
} from '@/features/education-business-field/api/hooks'
import { educationBusinessFieldQueryKeys } from '@/features/education-business-field/api/query-keys'
import { EDUCATION_BUSINESS_FIELDS_CHANGED_EVENT } from '@/features/education-business-field/api/store'
import {
  EducationBusinessFieldDragHandle,
  EducationBusinessFieldsSortableTable,
} from '@/features/education-business-field/ui/sortable-table'
import { useInvalidateOnWindowEvent } from '@/shared/lib/use-invalidate-on-window-event'
import { CmsButton, CmsInput, CmsTextArea, useCmsAlert } from '@/shared/ui'
import { CMS_TABLE_NO_COL_CLASS, CMS_TABLE_SORT_COL_CLASS, CMS_TABLE_USAGE_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'

import './page.css'
type DraftRow = {
  name: string
  description: string
  guideText: string
}

type DraftState = {
  mainText: string
  rows: Record<string, DraftRow>
}

function buildDraft(mainText: string, fields: EducationBusinessField[]): DraftState {
  return {
    mainText,
    rows: Object.fromEntries(
      fields.map(row => [
        row.id,
        {
          name: row.name,
          description: row.description,
          guideText: row.guideText,
        },
      ])
    ),
  }
}

const GUIDE_PLACEHOLDER = '작성된 안내사항이 없습니다'

export function EducationFieldsPage() {
  const { showAlert } = useCmsAlert()
  const docQuery = useEducationBusinessFieldDocument()
  const reorderMutation = useReorderEducationBusinessFields()
  const setActiveMutation = useSetEducationBusinessFieldActive()
  const saveMutation = useSaveEducationBusinessFieldDocument()

  const fields = useMemo(() => docQuery.data?.fields ?? [], [docQuery.data?.fields])
  const introMainText = docQuery.data?.intro.mainText ?? ''

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<DraftState | null>(null)

  useInvalidateOnWindowEvent(
    EDUCATION_BUSINESS_FIELDS_CHANGED_EVENT,
    educationBusinessFieldQueryKeys.all
  )

  const displayMainText = isEditing && draft ? draft.mainText : introMainText

  const handleRowsReorder = useCallback(
    (reorderedRows: EducationBusinessField[]) => {
      void reorderMutation.mutateAsync(reorderedRows.map(row => row.id)).catch(() => {
        showAlert({
          title: '순서 변경 실패',
          content: '사업분야 순서 저장에 실패했습니다. 목록을 다시 불러옵니다.',
        })
        void docQuery.refetch()
      })
    },
    [docQuery, reorderMutation, showAlert]
  )

  const handleToggleActive = useCallback(
    (id: string, isActive: boolean) => {
      void setActiveMutation.mutateAsync({ id, isActive }).catch(() => {
        showAlert({
          title: '사용 여부 변경 실패',
          content: '사용 여부 변경에 실패했습니다. 다시 시도해 주세요.',
        })
        void docQuery.refetch()
      })
    },
    [docQuery, setActiveMutation, showAlert]
  )

  const handleStartEdit = useCallback(() => {
    setDraft(buildDraft(introMainText, fields))
    setIsEditing(true)
  }, [fields, introMainText])

  const handleCancelEdit = useCallback(() => {
    setDraft(null)
    setIsEditing(false)
  }, [])

  const handleMainTextChange = useCallback((value: string) => {
    setDraft(prev => (prev ? { ...prev, mainText: value } : prev))
  }, [])

  const handleRowFieldChange = useCallback(
    (id: string, field: keyof DraftRow, value: string) => {
      setDraft(prev => {
        if (!prev) return prev
        const current = prev.rows[id]
        if (!current) return prev
        return {
          ...prev,
          rows: {
            ...prev.rows,
            [id]: { ...current, [field]: value },
          },
        }
      })
    },
    []
  )

  const handleSave = useCallback(async () => {
    if (!draft) return
    try {
      await saveMutation.mutateAsync({
        mainText: draft.mainText,
        patches: fields.map(row => ({
          id: row.id,
          name: draft.rows[row.id]?.name ?? row.name,
          description: draft.rows[row.id]?.description ?? row.description,
          guideText: draft.rows[row.id]?.guideText ?? row.guideText,
        })),
      })
      setDraft(null)
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: '사업분야 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draft, fields, saveMutation, showAlert])

  const columns = useMemo<ColumnsType<EducationBusinessField>>(
    () => [
      {
        title: '순서',
        key: 'sort',
        width: TABLE_COLUMN_WIDTHS.sort,
        className: CMS_TABLE_SORT_COL_CLASS,
        render: () => <EducationBusinessFieldDragHandle />,
      },
      {
        title: 'No.',
        key: 'no',
        width: TABLE_COLUMN_WIDTHS.index,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_value, _record, index) => index + 1,
      },
      {
        title: '사용 여부',
        key: 'isActive',
        width: TABLE_COLUMN_WIDTHS.usage,
        className: CMS_TABLE_USAGE_COL_CLASS,
        render: (_value, record) => (
          <Switch
            checked={record.isActive}
            onChange={checked => handleToggleActive(record.id, checked)}
            aria-label={`${record.name} 사용 여부`}
          />
        ),
      },
      {
        title: '사업분야명',
        key: 'name',
        width: 160,
        render: (_value, record) => {
          const value = draft?.rows[record.id]?.name ?? record.name
          return (
            <CmsInput
              className={
                isEditing
                  ? 'education-fields-inline-field education-fields-inline-field--edit'
                  : 'education-fields-inline-field education-fields-inline-field--readonly'
              }
              inputSize="medium"
              width="100%"
              value={value}
              readOnly={!isEditing}
              tabIndex={isEditing ? 0 : -1}
              onChange={e => {
                if (!isEditing) return
                handleRowFieldChange(record.id, 'name', e.target.value)
              }}
              aria-label={`사업분야명 ${record.sortOrder}`}
            />
          )
        },
      },
      {
        title: '설명 텍스트',
        key: 'description',
        render: (_value, record) => {
          const value = draft?.rows[record.id]?.description ?? record.description
          return (
            <CmsTextArea
              className={
                isEditing
                  ? 'education-fields-inline-field education-fields-inline-field--edit cms-textarea--fixed-rows'
                  : 'education-fields-inline-field education-fields-inline-field--readonly'
              }
              inputSize="medium"
              width="100%"
              rows={isEditing ? 2 : 1}
              autoSize={isEditing ? false : { minRows: 1, maxRows: 2 }}
              value={value}
              readOnly={!isEditing}
              tabIndex={isEditing ? 0 : -1}
              onChange={e => {
                if (!isEditing) return
                handleRowFieldChange(record.id, 'description', e.target.value)
              }}
              aria-label={`설명 텍스트 ${record.sortOrder}`}
            />
          )
        },
      },
      {
        title: '안내사항',
        key: 'guideText',
        width: 280,
        render: (_value, record) => {
          const value = draft?.rows[record.id]?.guideText ?? record.guideText
          return (
            <CmsTextArea
              className={
                isEditing
                  ? 'education-fields-inline-field education-fields-inline-field--edit cms-textarea--fixed-rows'
                  : 'education-fields-inline-field education-fields-inline-field--readonly'
              }
              inputSize="medium"
              width="100%"
              rows={isEditing ? 2 : 1}
              autoSize={isEditing ? false : { minRows: 1, maxRows: 2 }}
              value={value}
              placeholder={GUIDE_PLACEHOLDER}
              readOnly={!isEditing}
              tabIndex={isEditing ? 0 : -1}
              onChange={e => {
                if (!isEditing) return
                handleRowFieldChange(record.id, 'guideText', e.target.value)
              }}
              aria-label={`안내사항 ${record.sortOrder}`}
            />
          )
        },
      },
    ],
    [draft, handleRowFieldChange, handleToggleActive, isEditing]
  )

  return (
    <div className="education-fields-page">
      <div className="admin-list-card education-fields-card">
        <div className="admin-list-toolbar">
          <div className="table-header-title--wrapper">
            <span className="table-title">사업분야 관리</span>
          </div>
          <div className="table-header-actions--wrapper">
            {isEditing ? (
              <>
                <CmsButton
                  variant="secondary"
                  size="large"
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saveMutation.isPending}
                >
                  취소
                </CmsButton>
                <CmsButton
                  variant="primary"
                  size="large"
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
              <CmsButton
                variant="primary"
                size="large"
                type="button"
                onClick={handleStartEdit}
                disabled={docQuery.isLoading || fields.length === 0}
              >
                수정
              </CmsButton>
            )}
          </div>
        </div>

        <div className="education-fields-page__body">
          <section className="education-fields-page__section" aria-labelledby="edu-fields-intro">
            <h2 id="edu-fields-intro" className="education-fields-page__section-title">
              소개글
            </h2>
            <DetailInfoForm
              title="소개글"
              hideHeader
              mode="edit"
              className="education-fields-page__intro-form"
            >
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="메인 텍스트"
                  labelWidth={200}
                  view={null}
                  edit={
                    <CmsInput
                      className={
                        isEditing
                          ? 'education-fields-inline-field education-fields-inline-field--edit'
                          : 'education-fields-inline-field education-fields-inline-field--readonly'
                      }
                      inputSize="large"
                      width="100%"
                      value={displayMainText}
                      readOnly={!isEditing}
                      tabIndex={isEditing ? 0 : -1}
                      onChange={e => {
                        if (!isEditing) return
                        handleMainTextChange(e.target.value)
                      }}
                      aria-label="메인 텍스트"
                    />
                  }
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          </section>

          <section className="education-fields-page__section" aria-labelledby="edu-fields-list">
            <h2 id="edu-fields-list" className="education-fields-page__section-title">
              사업분야
            </h2>
            <EducationBusinessFieldsSortableTable
              rows={fields}
              columns={columns}
              loading={docQuery.isLoading}
              onRowsReorder={handleRowsReorder}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
