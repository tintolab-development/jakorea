/**
 * 주소 검색: CmsInput 클릭 시 ContentModal + 행안부/주소기반산업지원 도로명주소 검색 API
 * @see useJusoAddressSearch — `VITE_ADDRESS_API_KEY` 또는 `VITE_JUSO_CONFM_KEY`, 선택 `VITE_JUSO_ADDRESS_API_URL`
 */

import { useCallback, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { Flex, Pagination, Spin } from 'antd'
import { readJusoConfmKeyFromEnv, useJusoAddressSearch, type JusoAddressItem } from '@/shared/hooks'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui/cms-input'
import type { CmsInputProps } from '@/shared/ui/cms-input'
import './address-search.css'

const MODAL_SEARCH_PLACEHOLDER = '예) 판교역로 235, 분당 주공, 삼평동 681'

const ADDRESS_TIPS: { label: string; example: string }[] = [
  {
    label: '도로명 + 건물번호',
    example: '예) 판교역로 235, 제주 첨단로 242',
  },
  {
    label: '지역명(동/리) + 번지',
    example: '예) 삼평동 681, 제주 영평동 2181',
  },
  {
    label: '지역명(동/리) + 건물명(아파트명)',
    example: '예) 분당 주공, 연수동 주공3차',
  },
  {
    label: '사서함명 + 번호',
    example: '예) 분당우체국사서함 1~100',
  },
]

export interface AddressSearchProps extends Pick<
  CmsInputProps,
  'inputSize' | 'width' | 'disabled' | 'className'
> {
  value: string
  onChange: (next: string) => void
  /** 트리거 인풋 placeholder */
  placeholder?: string
  /** 미지정 시 `VITE_ADDRESS_API_KEY` 또는 `VITE_JUSO_CONFM_KEY` */
  confmKey?: string
  onSelect?: (item: JusoAddressItem) => void
}

export function AddressSearch({
  value,
  onChange,
  placeholder = '건물명, 도로명 또는 지번',
  inputSize = 'medium',
  width = '100%',
  disabled,
  className,
  confmKey: confmKeyProp,
  onSelect,
}: AddressSearchProps) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [hasQueried, setHasQueried] = useState(false)

  const confmKey = confmKeyProp ?? readJusoConfmKeyFromEnv()
  const countPerPage = 10

  const { addresses, totalCount, loading, error, search, reset } = useJusoAddressSearch({
    confmKey,
    countPerPage,
  })

  const closeModal = useCallback(() => {
    setOpen(false)
    setKeyword('')
    setPage(1)
    setHasQueried(false)
    reset()
  }, [reset])

  const openModal = () => {
    if (disabled) return
    setKeyword(value.trim())
    setPage(1)
    setHasQueried(false)
    reset()
    setOpen(true)
  }

  const runSearch = async (nextPage = 1) => {
    const trimmed = keyword.trim()
    if (!trimmed) {
      setHasQueried(false)
      await search('', 1)
      return
    }
    setHasQueried(true)
    setPage(nextPage)
    await search(trimmed, nextPage)
  }

  const handleSelect = (item: JusoAddressItem) => {
    const line = (item.roadAddr || item.jibunAddr).trim()
    onChange(line)
    onSelect?.(item)
    closeModal()
  }

  const showResultTable = addresses.length > 0

  return (
    <>
      <span className="address-search__trigger-wrap" style={{ width: width || '100%' }}>
        <CmsInput
          icon={<SearchOutlined />}
          value={value}
          readOnly
          onClick={openModal}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              openModal()
            }
          }}
          placeholder={placeholder}
          inputSize={inputSize}
          width={width}
          disabled={disabled}
          className={className}
          aria-haspopup="dialog"
        />
      </span>
      <ContentModal
        open={open}
        onCancel={closeModal}
        title="주소검색"
        width={760}
        className="address-search-modal"
      >
        <div className="address-search__body">
          <Flex className="address-search__search-row" gap={8} align="center">
            <span className="address-search__search-input-wrap">
              <CmsInput
                icon={<SearchOutlined />}
                value={keyword}
                onChange={event => setKeyword(event.target.value)}
                onPressEnter={() => void runSearch(1)}
                placeholder={MODAL_SEARCH_PLACEHOLDER}
                inputSize="medium"
                width="100%"
              />
            </span>
            <CmsButton type="button" variant="primary" size="medium" onClick={() => void runSearch(1)}>
              검색
            </CmsButton>
          </Flex>

          <div className="address-search__results">
            {error ? (
              <div className="address-search__result-empty">{error.message}</div>
            ) : loading ? (
              <Flex align="center" justify="center" style={{ minHeight: 120 }}>
                <Spin />
              </Flex>
            ) : (
              <>
                <div className="address-search__result-count">
                  검색 결과 {totalCount.toLocaleString()}건
                </div>
                {showResultTable ? (
                  <div className="address-search__result-table-wrap">
                    <table className="address-search__result-table cms-data-table">
                      <thead>
                        <tr>
                          <th>도로명주소</th>
                          <th>지번주소</th>
                          <th style={{ width: 100 }}>우편번호</th>
                        </tr>
                      </thead>
                      <tbody>
                        {addresses.map(item => (
                          <tr
                            key={`${item.roadAddr}-${item.zipNo}-${item.jibunAddr}`}
                            onClick={() => handleSelect(item)}
                          >
                            <td>{item.roadAddr || '-'}</td>
                            <td>{item.jibunAddr || '-'}</td>
                            <td>{item.zipNo || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : hasQueried && keyword.trim() ? (
                  <div className="address-search__result-empty">검색 결과가 없습니다.</div>
                ) : (
                  <div className="address-search__result-empty">
                    검색어를 입력한 뒤 검색 또는 Enter로 조회하거나, 아래 안내를 참고해 주세요.
                  </div>
                )}
                {totalCount > countPerPage && showResultTable ? (
                  <div className="address-search__pagination">
                    <Pagination
                      size="small"
                      current={page}
                      total={totalCount}
                      pageSize={countPerPage}
                      onChange={p => void runSearch(p)}
                      showSizeChanger={false}
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>

          <section className="address-search__tip" aria-label="주소 검색 안내">
            <p className="address-search__tip-title">tip</p>
            <p className="address-search__tip-lead">
              아래와 같은 조합으로 검색을 하시면 더욱 정확한 결과가 검색됩니다.
            </p>
            <ul className="address-search__tip-list">
              {ADDRESS_TIPS.map(row => (
                <li key={row.label}>
                  <span className="address-search__tip-item-label">{row.label}</span>
                  <p className="address-search__tip-item-example">{row.example}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </ContentModal>
    </>
  )
}
