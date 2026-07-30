import { useState } from 'react'
import { AddressSearch } from '@/shared/ui/address-search'
import {
  SchoolSearch,
  type SchoolSearchSelectMeta,
  type SchoolSearchSelection,
} from '@/shared/ui/school-search'
import type { JusoAddressItem } from '@/shared/hooks'
import { DsDemo, DsSection } from './section'

export function SearchModalsSection() {
  const [address, setAddress] = useState('')
  const [addressHint, setAddressHint] = useState<string | null>(null)
  const [school, setSchool] = useState('')
  const [schoolHint, setSchoolHint] = useState<string | null>(null)

  const handleAddressSelect = (item: JusoAddressItem) => {
    setAddressHint(item.roadAddr || item.jibunAddr || null)
  }

  const handleSchoolSelect = (item: SchoolSearchSelection, meta: SchoolSearchSelectMeta) => {
    const region = [meta.regionSido, meta.regionSigungu].filter(Boolean).join(' ')
    setSchoolHint(region ? `${item.schulNm} · ${region}` : item.schulNm)
  }

  return (
    <DsSection
      id="search-modals"
      title="Search modals"
      description="인풋 클릭 시 내부 ContentModal이 열리고 외부 API(행안부 Juso / NEIS)로 검색합니다. open prop 없이 컴포넌트가 모달을 자체 제어합니다."
    >
      <p className="ds-note">
        주소: <code>VITE_ADDRESS_API_KEY</code> 또는 <code>VITE_JUSO_CONFM_KEY</code> · 학교:{' '}
        <code>VITE_NEIS_API_KEY</code>. 키가 없으면 모달 안에 missing-key 안내가 표시됩니다.
      </p>

      <DsDemo label="AddressSearch">
        <div className="ds-demo__stack">
          <AddressSearch
            value={address}
            onChange={setAddress}
            onSelect={handleAddressSelect}
            placeholder="건물명, 도로명 또는 지번"
          />
          {addressHint ? (
            <p className="ds-demo__hint" style={{ marginTop: 0 }}>
              선택: {addressHint}
            </p>
          ) : (
            <p className="ds-demo__hint" style={{ marginTop: 0 }}>
              <code>shared/ui/address-search</code> · 행안부 도로명주소 API
            </p>
          )}
        </div>
      </DsDemo>

      <DsDemo label="SchoolSearch">
        <div className="ds-demo__stack">
          <SchoolSearch
            value={school}
            onChange={setSchool}
            onSelect={handleSchoolSelect}
            placeholder="소속 학교명"
          />
          {schoolHint ? (
            <p className="ds-demo__hint" style={{ marginTop: 0 }}>
              선택: {schoolHint}
            </p>
          ) : (
            <p className="ds-demo__hint" style={{ marginTop: 0 }}>
              <code>shared/ui/school-search</code> · NEIS 학교정보 API · 학력 대학 입력에도 동일
              컴포넌트 사용
            </p>
          )}
        </div>
      </DsDemo>

      <p className="ds-note">
        <strong>Not catalogued</strong> — <code>UniversitySearch</code>는 없습니다. 대학 학력은
        현재 SchoolSearch(NEIS)로 처리하며, 학교 등록의 대학 검색 API는 추후입니다.
      </p>
    </DsSection>
  )
}
