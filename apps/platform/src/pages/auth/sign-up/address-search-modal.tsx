import { useCallback, useState } from 'react'
import { readJusoConfmKeyFromEnv, useJusoAddressSearch } from '@/shared/hooks'
import type { JusoAddressItem } from '@/shared/hooks'
import { PFButton, PFModal, PFText, PFTextInput } from '@/shared/ui'
import styles from './sign-up-page.module.css'

type AddressSearchModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (address: string) => void
}

export function AddressSearchModal({ open, onClose, onSelect }: AddressSearchModalProps) {
  const [keyword, setKeyword] = useState('')
  const {
    addresses,
    totalCount,
    loading,
    error,
    search,
    reset,
  } = useJusoAddressSearch({
    confmKey: readJusoConfmKeyFromEnv(),
  })

  const handleClose = useCallback(() => {
    setKeyword('')
    reset()
    onClose()
  }, [onClose, reset])

  const handleSearch = () => {
    void search(keyword)
  }

  const handleSelect = (item: JusoAddressItem) => {
    onSelect(item.roadAddr || item.jibunAddr)
    handleClose()
  }

  return (
    <PFModal open={open} onClose={handleClose}>
      <div className={styles['address-modal']}>
        <PFText as="div" typo="hl-sm" color="black">
          주소 검색
        </PFText>
        <div className={styles['address-modal-search-row']}>
          <PFTextInput
            size="large"
            placeholder="예) 마곡중앙로 171, 분당 주공, 백현동"
            value={keyword}
            onValueChange={setKeyword}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                handleSearch()
              }
            }}
          />
          <PFButton size="large" onClick={handleSearch}>
            검색
          </PFButton>
        </div>
        <div className={styles['address-modal-results']}>
          {loading ? (
            <PFText typo="bd-sm-rg" color="neutral-warm-500">
              검색 중입니다.
            </PFText>
          ) : null}
          {error ? (
            <PFText typo="bd-sm-rg" color="error">
              주소 검색에 실패했습니다. 주소 API 설정을 확인해 주세요.
            </PFText>
          ) : null}
          {!loading && !error && totalCount > 0 ? (
            <PFText typo="bd-sm-rg" color="neutral-warm-500">
              검색 결과 {totalCount}건
            </PFText>
          ) : null}
          {!loading && !error && addresses.length === 0 ? (
            <PFText typo="bd-sm-rg" color="neutral-warm-500">
              주소를 검색해 주세요.
            </PFText>
          ) : null}
          {addresses.map(item => (
            <button
              className={styles['address-result-button']}
              type="button"
              key={`${item.zipNo}-${item.roadAddr}-${item.jibunAddr}`}
              onClick={() => handleSelect(item)}
            >
              <PFText as="span" typo="bd-sm-sb" color="primary-500">
                {item.zipNo || '-'}
              </PFText>
              <PFText as="span" typo="bd-sm-md" color="black">
                {item.roadAddr || item.jibunAddr}
              </PFText>
              {item.jibunAddr ? (
                <PFText as="span" typo="caption-rg" color="neutral-warm-500">
                  지번 {item.jibunAddr}
                </PFText>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </PFModal>
  )
}
