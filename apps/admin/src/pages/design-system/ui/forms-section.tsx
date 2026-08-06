import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import {
  CmsDatePicker,
  CmsDateRangePicker,
  CmsInput,
  CmsRadio,
  CmsRadioGroup,
  FileSelectField,
} from '@/shared/ui'
import { DsDemo, DsSection } from './section'

function coerceRadioBoolean(raw: unknown): boolean {
  if (raw === true || raw === 1) return true
  if (raw === false || raw === 0) return false
  if (typeof raw === 'string') {
    const s = raw.toLowerCase()
    if (s === 'true' || s === '1') return true
    if (s === 'false' || s === '0') return false
  }
  return Boolean(raw)
}

export function FormsSection() {
  const [active, setActive] = useState(true)
  const [fileNames, setFileNames] = useState<string[]>([])
  const [date, setDate] = useState<Dayjs | null>(null)
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  return (
    <DsSection
      id="forms"
      title="Forms"
      description="CmsInput · CmsRadio · CmsDatePicker · FileSelectField. 배너·팝업·보고서 등록 모달과 동일 패턴."
    >
      <p className="ds-note">
        FileSelect + DetailInfoForm 규약:{' '}
        <code>.cursor/rules/cms-admin-ui/file-select-detail-form.mdc</code>
        <br />
        Field edit 에 FileSelect 넣을 때 runtime CSS(
        <code>display:flex; align-items:center</code>) 를 스코프에서 원복할 것.
      </p>
      <DsDemo label="CmsInput">
        <div className="ds-demo__stack">
          <CmsInput inputSize="large" width="100%" placeholder="상단 문구를 입력하세요" />
          <CmsInput inputSize="medium" width="100%" placeholder="medium" />
        </div>
      </DsDemo>

      <DsDemo label="CmsRadioGroup">
        <CmsRadioGroup
          size="medium"
          value={active}
          onChange={e => setActive(coerceRadioBoolean(e.target.value))}
        >
          <CmsRadio size="medium" value={true}>
            사용
          </CmsRadio>
          <CmsRadio size="medium" value={false}>
            미사용
          </CmsRadio>
        </CmsRadioGroup>
      </DsDemo>

      <DsDemo label="CmsDatePicker / CmsDateRangePicker">
        <div className="ds-demo__stack">
          <CmsDatePicker
            inputSize="large"
            width="100%"
            value={date}
            onChange={v => setDate(v)}
          />
          <CmsDateRangePicker
            inputSize="large"
            width="100%"
            value={range}
            onChange={v => setRange(v ?? null)}
          />
        </div>
        <p className="ds-note">
          단일·기간 시작/종료 모두 <code>CmsDatePicker</code> (
          <code>inputSize=&quot;large&quot;</code>, placeholder <code>날짜를 선택하세요</code>).
          필터 등 분할 기간 UI는 <code>CmsDateRangePicker</code>.
        </p>
      </DsDemo>

      <DsDemo label="FileSelectField (등록 모달 패턴)">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          버튼: secondary <code>medium</code> (120×40). 모달 푸터 취소/등록은{' '}
          <code>large</code> (140×44) — 혼동 금지.
          <code>buttonLabel=&quot;파일 추가&quot;</code> · <code>multiple=&#123;false&#125;</code> ·
          액션 행 = 버튼 + 가이드(가로, wrap 허용).
        </p>
        <div className="ds-demo__stack">
          <FileSelectField
            multiple={false}
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            buttonLabel="파일 추가"
            fileNames={fileNames}
            guideLines={[
              '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
              '- 권장 배너 사이즈는 1920*1080입니다.',
            ]}
            onFilesChange={files => setFileNames(files.map(f => f.name))}
            onRemoveFile={() => setFileNames([])}
          />
        </div>
      </DsDemo>
    </DsSection>
  )
}
