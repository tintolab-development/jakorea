import { useRef, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInputIconClick } from '@/shared/ui/cms-input-iconclick'
import { LabeledSearchInput } from '@/shared/ui/labeled-search-input'
import { DsDemo, DsSection } from './section'

export function FormsExtrasSection() {
  const [search, setSearch] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [title, setTitle] = useState('편집 가능한 제목')
  const [editing, setEditing] = useState(false)
  const [dateTime, setDateTime] = useState<Dayjs>(() => dayjs().second(0).millisecond(0))
  const [pickerOpen, setPickerOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)

  return (
    <DsSection
      id="forms-extras"
      title="Forms extras"
      description="필터·인라인 편집·일시 선택 등 Cms* 기본 폼을 보조하는 컨트롤입니다."
    >
      <DsDemo label="LabeledSearchInput">
        <div className="ds-demo__stack">
          <LabeledSearchInput
            label="검색"
            placeholder="프로그램명"
            value={search}
            onChange={setSearch}
            width="100%"
          />
          <LabeledSearchInput
            label="필터 검색"
            placeholder="필터 카드 높이(44px)"
            value={filterSearch}
            onChange={setFilterSearch}
            uiVariant="filter"
            width="100%"
          />
        </div>
      </DsDemo>

      <DsDemo label="CmsInputIconClick">
        <CmsInputIconClick
          value={title}
          editing={editing}
          onChange={setTitle}
          onRequestEdit={() => setEditing(true)}
          onCommitEdit={() => setEditing(false)}
          inputAriaLabel="제목"
          editButtonAriaLabel="제목 편집"
        />
      </DsDemo>

      <DsDemo label="DateTimePickerPopover">
        <div className="ds-demo__row">
          <CmsButton
            ref={anchorRef}
            variant="secondary"
            size="medium"
            onClick={() => setPickerOpen(true)}
          >
            일시 선택
          </CmsButton>
          <span style={{ fontSize: 14, color: 'var(--color-text-body)' }}>
            {dateTime.format('YYYY-MM-DD HH:mm')}
          </span>
        </div>
        <DateTimePickerPopover
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          anchorRef={anchorRef}
          value={dateTime}
          onChange={setDateTime}
          onApply={value => {
            setDateTime(value)
            setPickerOpen(false)
          }}
        />
      </DsDemo>
    </DsSection>
  )
}
