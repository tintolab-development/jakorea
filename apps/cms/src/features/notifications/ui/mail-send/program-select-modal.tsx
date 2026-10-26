import { useMemo, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ContentModal, CmsButton, CmsCompactPagination, CmsInput, CmsSelect } from '@/shared/ui'
import { CMS_TABLE_EMPTY_COPY } from '@/shared/ui/cms-table-empty-copy'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  listMailSendProgramPickerRows,
  programYearLabel,
  uniqueProgramYears,
} from '@/features/notifications/model/mail-send/programs'
import { MAIL_SEND_PICKER_PAGE_SIZE, type MailSendProgram } from '@/features/notifications/model/mail-send/types'
import './program-select-modal.css'

type ProgramSelectModalProps = {
  open: boolean
  programs: MailSendProgram[]
  selectedId?: string
  onClose: () => void
  onSelect: (program: MailSendProgram) => void
  zIndex?: number
}

export function ProgramSelectModal({
  open,
  programs,
  selectedId,
  onClose,
  onSelect,
  zIndex,
}: ProgramSelectModalProps) {
  const [year, setYear] = useState<number | '' | undefined>(undefined)
  const [keyword, setKeyword] = useState('')
  const [appliedYear, setAppliedYear] = useState<number | ''>('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [page, setPage] = useState(1)

  const yearOptions = useMemo(
    () => uniqueProgramYears(programs).map(value => ({ value, label: programYearLabel(value) })),
    [programs]
  )

  const filtered = useMemo(
    () => listMailSendProgramPickerRows(programs, { year: appliedYear, keyword: appliedKeyword }),
    [appliedKeyword, appliedYear, programs]
  )

  const totalPages = Math.ceil(filtered.length / MAIL_SEND_PICKER_PAGE_SIZE)
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paged = filtered.slice(
    (currentPage - 1) * MAIL_SEND_PICKER_PAGE_SIZE,
    currentPage * MAIL_SEND_PICKER_PAGE_SIZE
  )
  const hasResults = filtered.length > 0

  const handleSearch = () => {
    setAppliedYear(year === undefined ? '' : year)
    setAppliedKeyword(keyword.trim())
    setHasSearched(true)
    setPage(1)
  }

  const handleYearChange = (value: string | number | null | undefined) => {
    if (value == null) {
      setYear(undefined)
      return
    }
    if (value === '') {
      setYear('')
      return
    }
    setYear(Number(value))
  }

  const columns: ColumnsType<MailSendProgram> = [
    {
      title: '진행년도',
      dataIndex: 'year',
      key: 'year',
      width: 140,
      align: 'center',
      render: value => programYearLabel(value) || '-',
    },
    {
      title: '프로그램명',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      ellipsis: true,
    },
  ]

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="대상 프로그램 선택"
      size="default"
      className="mail-send-program-select-modal"
      titleBodyGap="always"
      zIndex={zIndex}
    >
      <div className="mail-send-program-select-modal__body">
        <div className="mail-send-program-select-modal__search">
          <CmsSelect
            inputSize="large"
            placeholder="년도"
            value={year}
            onChange={handleYearChange}
            options={yearOptions}
            style={{ width: 140 }}
          />
          <span className="mail-send-program-select-modal__search-input">
            <CmsInput
              icon={<SearchOutlined />}
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              onPressEnter={handleSearch}
              placeholder="프로그램명을 입력해 주세요"
              inputSize="large"
              width="100%"
              allowClear
            />
          </span>
          <CmsButton type="button" variant="primary" size="large" onClick={handleSearch}>
            검색
          </CmsButton>
        </div>

        {hasSearched && hasResults ? (
          <>
            <div className="mail-send-program-select-modal__table-section">
              <p className="mail-send-program-select-modal__count">총 {filtered.length}건</p>
              <CmsDataTable
                className="cms-data-table cms-data-table--skip-auto-no-col mail-send-program-select-modal__table"
                columns={columns}
                dataSource={paged}
                rowKey="id"
                pagination={false}
                rowClassName={record =>
                  record.id === selectedId ? 'mail-send-program-select-modal__row--selected' : ''
                }
                onRow={record => ({
                  onClick: () => onSelect(record),
                })}
              />
            </div>
            <div className="mail-send-program-select-modal__pagination">
              <CmsCompactPagination
                variant="modal"
                currentPage={currentPage}
                totalPages={Math.max(totalPages, 1)}
                onPageChange={setPage}
                ariaLabel="대상 프로그램 선택 페이지 이동"
              />
            </div>
          </>
        ) : null}
        {hasSearched && !hasResults ? (
          <div className="mail-send-program-select-modal__empty" role="status">
            <p className="mail-send-program-select-modal__empty-title">
              {CMS_TABLE_EMPTY_COPY['no-search'].title}
            </p>
            <p className="mail-send-program-select-modal__empty-description">
              {CMS_TABLE_EMPTY_COPY['no-search'].description}
            </p>
          </div>
        ) : null}
      </div>
    </ContentModal>
  )
}
