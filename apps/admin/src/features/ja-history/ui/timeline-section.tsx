import { useMemo, useState } from 'react'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { JaHistoryTimeline, JaHistoryTimelineEvent } from '@/entities/ja-history/model/types'
import {
  useSaveJaHistoryKoreaTimeline,
  useSaveJaHistoryWorldTimeline,
} from '@/features/ja-history/api/hooks'
import { CmsTextTabs, showSaveCompletedAlert, useCmsAlert } from '@/shared/ui'
import { HistoryCopy, MediaPreview, SectionFrame, jaHistorySaveAlert } from './chrome'
import { TimelineFormModal } from './timeline-form-modal'

const eventColumns: ColumnsType<JaHistoryTimelineEvent> = [
  { title: '연도', dataIndex: 'year', width: 200, align: 'center' },
  {
    title: '설명 텍스트',
    dataIndex: 'text',
    className: 'ja-history-col-text',
    ellipsis: false,
    render: (value: string) => <HistoryCopy value={value} align="center" />,
  },
]

type IntroRow = { key: 'intro' }

type Props = {
  title: string
  modalTitle: string
  timeline: JaHistoryTimeline
  variant: 'world' | 'korea'
}

export function TimelineSection({ title, modalTitle, timeline, variant }: Props) {
  const { showAlert } = useCmsAlert()
  const worldSave = useSaveJaHistoryWorldTimeline()
  const koreaSave = useSaveJaHistoryKoreaTimeline()
  const saveMutation = variant === 'world' ? worldSave : koreaSave
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState(timeline.periods[0]?.id ?? '')

  const active = useMemo(() => {
    const match = timeline.periods.find(period => period.id === activeId)
    return match ?? timeline.periods[0]
  }, [activeId, timeline.periods])

  const tabItems = useMemo(
    () => timeline.periods.map(period => ({ key: period.id, label: period.label })),
    [timeline.periods],
  )

  const introColumns = useMemo<ColumnsType<IntroRow>>(
    () => [
      {
        title: '이미지',
        key: 'image',
        width: 240,
        align: 'center',
        render: () => <MediaPreview media={timeline.image} size="wide" />,
      },
      {
        title: '타이틀',
        key: 'title',
        width: 320,
        align: 'center',
        ellipsis: false,
        render: () => <HistoryCopy value={timeline.title} align="center" />,
      },
      {
        title: '서브 텍스트',
        key: 'body',
        align: 'center',
        ellipsis: false,
        render: () => <HistoryCopy value={timeline.body} align="center" />,
      },
    ],
    [timeline.body, timeline.image, timeline.title]
  )

  return (
    <>
      <SectionFrame title={title} marker={false} onEdit={() => setOpen(true)}>
        <CmsDataTable<IntroRow>
          className="cms-data-table cms-data-table--skip-auto-no-col ja-history-table"
          columns={introColumns}
          dataSource={[{ key: 'intro' }]}
          pagination={false}
          rowKey="key"
        />

        <div className="ja-history-timeline-periods">
          <CmsTextTabs
            variant="list"
            ariaLabel={`${title} 기간`}
            activeKey={active?.id ?? ''}
            onChange={setActiveId}
            items={tabItems}
            wrap
          />

          {active ? (
            <div className="ja-history-timeline-period-panel">
              {active.events.length === 0 ? (
                <p className="ja-history-empty">이 기간에 등록된 연혁이 없습니다.</p>
              ) : (
                <CmsDataTable<JaHistoryTimelineEvent>
                  className="cms-data-table cms-data-table--skip-auto-no-col ja-history-table"
                  columns={eventColumns}
                  dataSource={active.events}
                  pagination={false}
                  rowKey={(_, index) => `${active.id}-${index}`}
                />
              )}
            </div>
          ) : (
            <p className="ja-history-empty">등록된 기간이 없습니다.</p>
          )}
        </div>
      </SectionFrame>
      <TimelineFormModal
        open={open}
        title={modalTitle}
        initial={timeline}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setOpen(false)}
        onSubmit={values => {
          void saveMutation.mutateAsync(values).then(
            () => {
              setOpen(false)
              showSaveCompletedAlert()
            },
            error => {
              showAlert(jaHistorySaveAlert(error, `${title} 저장에 실패했습니다. 다시 시도해 주세요.`))
            },
          )
        }}
      />
    </>
  )
}
