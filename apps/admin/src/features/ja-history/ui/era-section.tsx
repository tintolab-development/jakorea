import { useEffect, useMemo, useState } from 'react'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { JaHistoryEra } from '@/entities/ja-history/model/types'
import { useSaveJaHistoryEras } from '@/features/ja-history/api/hooks'
import { useCmsAlert } from '@/shared/ui'
import { InlineText, MediaPreview, SectionFrame, jaHistorySaveAlert } from './chrome'

export function EraSection({ eras }: { eras: JaHistoryEra[] }) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveJaHistoryEras()
  const [editing, setEditing] = useState(false)
  const [drafts, setDrafts] = useState(eras)

  useEffect(() => {
    if (!editing) setDrafts(eras)
  }, [editing, eras])

  const columns = useMemo<ColumnsType<JaHistoryEra>>(
    () => [
      {
        title: '연도',
        dataIndex: 'year',
        width: 200,
        align: 'center',
      },
      {
        title: '이미지',
        key: 'image',
        width: 240,
        align: 'center',
        render: (_value, record) => <MediaPreview media={record.image} size="era" />,
      },
      {
        title: '설명 텍스트',
        key: 'caption',
        className: 'ja-history-col-text',
        ellipsis: false,
        render: (_value, record) => {
          const draft = drafts.find(item => item.year === record.year) ?? record
          return (
            <InlineText
              editing={editing}
              value={draft.caption}
              rows={3}
              label={`${record.year} 설명 텍스트`}
              placeholder="설명 텍스트를 입력하세요"
              onChange={caption => {
                setDrafts(prev => prev.map(item => (item.year === record.year ? { ...item, caption } : item)))
              }}
            />
          )
        },
      },
    ],
    [drafts, editing],
  )

  return (
    <SectionFrame
      title="글로벌 히스토리"
      note="연도 및 이미지는 수정이 불가합니다."
      editing={editing}
      saving={saveMutation.isPending}
      onEdit={() => setEditing(true)}
      onCancel={() => setEditing(false)}
      onSave={() => {
        void saveMutation
          .mutateAsync(drafts.map(item => ({ year: item.year, caption: item.caption })))
          .then(
            () => setEditing(false),
            error => {
              showAlert(jaHistorySaveAlert(error, '글로벌 히스토리 저장에 실패했습니다. 다시 시도해 주세요.'))
            },
          )
      }}
    >
      <CmsDataTable<JaHistoryEra>
        className="cms-data-table cms-data-table--skip-auto-no-col ja-history-table"
        columns={columns}
        dataSource={eras}
        pagination={false}
        rowKey="year"
      />
    </SectionFrame>
  )
}
