import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import { AddressSearch } from '@/shared/ui/address-search'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsDatePicker, CmsDateRangePicker } from '@/shared/ui/cms-datepicker'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsInputSearch } from '@/shared/ui/cms-input-search'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsSelectMultiple } from '@/shared/ui/cms-select-multiple'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { CmsToggle } from '@/shared/ui/cms-toggle'
import { FileSelectField } from '@/shared/ui/file-select-field'
import { DsDemo, DsSection } from './section'

const SELECT_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '진행 중', value: 'active' },
  { label: '완료', value: 'done' },
]

const MULTI_OPTIONS = [
  { value: 'general', label: '일반' },
  { value: 'ujat', label: 'UJAT' },
  { value: 'gemini', label: 'Gemini' },
]

export function FormsSection() {
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [select, setSelect] = useState<string | undefined>()
  const [multi, setMulti] = useState<string[]>([])
  const [radio, setRadio] = useState('a')
  const [checked, setChecked] = useState(true)
  const [toggle, setToggle] = useState(false)
  const [date, setDate] = useState<Dayjs | null>(null)
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [address, setAddress] = useState('')
  const [fileNames, setFileNames] = useState<string[]>([])
  const [integer, setInteger] = useState('')
  const [decimal, setDecimal] = useState('')
  const [currency, setCurrency] = useState('')
  const [numericText, setNumericText] = useState('00123')
  const [dateText, setDateText] = useState('')

  return (
    <DsSection
      id="forms"
      title="Forms"
      description="입력 컨트롤은 Cms* 래퍼를 표준으로 사용합니다. Ant Design 원시 Input/Select는 동등 Cms*가 있을 때 피합니다."
    >
      <DsDemo label="CmsInput sizes">
        <div className="ds-demo__stack">
          <CmsInput inputSize="large" placeholder="large (44px)" width="100%" />
          <CmsInput inputSize="medium" placeholder="medium (40px)" width="100%" />
          <CmsInput inputSize="small" placeholder="small (32px)" width="100%" />
        </div>
      </DsDemo>

      <DsDemo label="CmsInput / CmsInputSearch / CmsTextArea">
        <div className="ds-demo__stack">
          <CmsInput
            placeholder="이름을 입력하세요"
            value={text}
            onChange={e => setText(e.target.value)}
            width="100%"
          />
          <CmsInputSearch
            placeholder="프로그램명 검색 (자동완성)"
            options={['서울 강남 프로그램', '부산 해운대 프로그램', '대구 중구 프로그램']}
            value={search}
            onChange={setSearch}
            width="100%"
          />
          <CmsTextArea
            placeholder="내용을 입력하세요"
            value={area}
            onChange={e => setArea(e.target.value)}
            rows={3}
          />
        </div>
      </DsDemo>

      <DsDemo label="CmsNumericInput — integer / decimal / currency / numericText">
        <div className="ds-demo__stack">
          <CmsNumericInput
            mode="integer"
            min={0}
            value={integer}
            onValueChange={setInteger}
            placeholder="수량 (0 이상의 정수)"
            aria-label="정수 입력 예시"
            width="100%"
          />
          <CmsNumericInput
            mode="decimal"
            min={0}
            precision={1}
            value={decimal}
            onValueChange={setDecimal}
            placeholder="거리 (소수점 첫째 자리)"
            aria-label="소수 입력 예시"
            width="100%"
          />
          <CmsNumericInput
            mode="currency"
            min={0}
            value={currency}
            onValueChange={setCurrency}
            placeholder="금액"
            aria-label="금액 입력 예시"
            suffix="원"
            width="100%"
          />
          <CmsNumericInput
            mode="numericText"
            value={numericText}
            onValueChange={setNumericText}
            placeholder="계좌번호 등 숫자형 식별자"
            aria-label="숫자형 식별자 입력 예시"
            width="100%"
          />
        </div>
        <p className="ds-note">
          금액은 화면에 쉼표를 표시하지만 값은 <code>{currency || '(빈 값)'}</code>으로 유지합니다.
          숫자형 식별자는 <code>{numericText || '(빈 값)'}</code>처럼 선행 0을 보존합니다.
        </p>
      </DsDemo>

      <DsDemo label="CmsDateTextInput — 직접 입력 날짜">
        <CmsDateTextInput
          value={dateText}
          onValueChange={setDateText}
          placeholder="YYYY.MM.DD"
          aria-label="날짜 직접 입력 예시"
          width="100%"
        />
        <p className="ds-note">
          입력 중에는 한 자리 월·일을 유지하고, 완성된 유효 날짜만 blur 시 두 자리로
          정규화합니다.
        </p>
      </DsDemo>

      <DsDemo label="CmsSelect / CmsSelectMultiple">
        <div className="ds-demo__stack">
          <CmsSelect
            placeholder="상태 선택"
            options={SELECT_OPTIONS}
            value={select}
            onChange={v => setSelect(v)}
            allowClear
            withAllOption={false}
            width="100%"
          />
          <CmsSelectMultiple
            placeholder="프로그램 유형"
            options={MULTI_OPTIONS}
            value={multi}
            onChange={setMulti}
            style={{ width: '100%' }}
          />
        </div>
      </DsDemo>

      <DsDemo label="CmsRadio / CmsCheckbox / CmsToggle">
        <div className="ds-demo__stack">
          <CmsRadio.Group value={radio} onChange={e => setRadio(e.target.value)}>
            <CmsRadio value="a">옵션 A</CmsRadio>
            <CmsRadio value="b">옵션 B</CmsRadio>
            <CmsRadio value="c">옵션 C</CmsRadio>
          </CmsRadio.Group>
          <CmsCheckbox checked={checked} onChange={e => setChecked(e.target.checked)}>
            이용약관 동의
          </CmsCheckbox>
          <CmsToggle checked={toggle} onChange={setToggle} label="알림 수신" />
        </div>
      </DsDemo>

      <DsDemo label="CmsDatePicker / CmsDateRangePicker">
        <div className="ds-demo__stack">
          <CmsDatePicker value={date} onChange={v => setDate(v)} style={{ width: '100%' }} />
          <CmsDateRangePicker
            value={range}
            onChange={v => setRange(v)}
            style={{ width: '100%' }}
          />
        </div>
      </DsDemo>

      <DsDemo label="AddressSearch / FileSelectField">
        <div className="ds-demo__stack">
          <AddressSearch value={address} onChange={setAddress} />
          <FileSelectField
            accept=".pdf,.png,.jpg"
            fileNames={fileNames}
            guideLines={['PDF, PNG, JPG — 최대 10MB']}
            onFilesChange={files => setFileNames(files.map(f => f.name))}
            onRemoveFile={index => setFileNames(prev => prev.filter((_, i) => i !== index))}
          />
        </div>
      </DsDemo>
    </DsSection>
  )
}
