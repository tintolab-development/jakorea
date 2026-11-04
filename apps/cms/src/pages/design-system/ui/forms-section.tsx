import { useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { CmsCheckbox, type CmsCheckboxSize } from '@/shared/ui/cms-checkbox'
import type { CmsControlSize } from '@/shared/ui/cms-control-size'
import { CmsTimePicker } from '@/shared/ui/cms-time-picker'
import { CmsDatePicker, CmsDateRangePicker } from '@/shared/ui/cms-datepicker'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsInputSearch } from '@/shared/ui/cms-input-search'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, type CmsRadioSize } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsSelectMultiple } from '@/shared/ui/cms-select-multiple'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { CmsToggle, type CmsToggleSize } from '@/shared/ui/cms-toggle'
import { FileSelectField } from '@/shared/ui/file-select-field'
import { FILE_SELECT_MAX_FILE_BYTES } from '@/shared/ui/file-select-field-limits'
import { ThumbnailUploadField } from '@/shared/ui/thumbnail-upload-field'
import { FileTypeIcon, type FileTypeIconType } from '@/shared/ui/icons/FileTypeIcon'
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

const INPUT_FIELD_SIZES: { size: CmsControlSize; label: string }[] = [
  { size: 'xlarge', label: 'xlarge (52px)' },
  { size: 'large', label: 'large (44px, 기본)' },
  { size: 'medium', label: 'medium (40px)' },
  { size: 'small', label: 'small (36px)' },
]

const DEMO_TIME = dayjs('2026-01-01 09:30')

const CHECKBOX_SIZES: CmsCheckboxSize[] = ['large', 'medium']

const RADIO_SIZES: CmsRadioSize[] = ['large', 'medium', 'small']

const TOGGLE_SIZES: CmsToggleSize[] = ['large', 'medium']

const FILE_TYPE_ICON_DEMO: { type: FileTypeIconType; label: string }[] = [
  { type: 'jpg', label: 'jpg' },
  { type: 'png', label: 'png' },
  { type: 'ai', label: 'ai' },
  { type: 'pdf', label: 'pdf' },
  { type: 'word', label: 'word' },
  { type: 'excel', label: 'excel' },
  { type: 'ppt', label: 'ppt' },
  { type: 'hwp', label: 'hwp' },
  { type: 'net', label: 'net' },
  { type: 'clip', label: 'clip' },
]

const FILE_SELECT_DEMO_GUIDE_LINES = [
  '- 파일은 총 최대 15MB까지 업로드 가능합니다.',
  '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const THUMBNAIL_DEMO_GUIDE_LINES = [
  '- 파일은 최대 20MB까지 JPG, PNG 형식만 등록 가능합니다.',
  '- 첨부 파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

export function FormsSection() {
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [select, setSelect] = useState<string | undefined>()
  const [multi, setMulti] = useState<string[]>([])
  const [radio, setRadio] = useState('a')
  const [radioGroup, setRadioGroup] = useState('general')
  const [checked, setChecked] = useState(true)
  const [checkboxGroup, setCheckboxGroup] = useState<string[]>(['general'])
  const [toggle, setToggle] = useState(false)
  const [date, setDate] = useState<Dayjs | null>(null)
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [fileNames, setFileNames] = useState<string[]>([])
  const [thumbDemo, setThumbDemo] = useState<{ url: string; name: string } | null>(null)
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
      <DsDemo label="입력 컴포넌트 sizes · states (Input / Select / Time / Search / Date)">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          XL 52 · L 44 · M 40 · S 36 / 기본 너비 240px / 라벨 – 6px – 박스 – 6px – 메세지(선택) ·
          라벨 #525252 500/140% · 필수 * #C32F4A 700 · 메세지 12px 500/150% #85969D(에러 시 #C32F4A)
          · 테두리 기본 #E0E0E0 · hover/focus #00A0AF · 에러 #C32F4A · 값 있을 때 X는 hover/focus만
        </p>
        {INPUT_FIELD_SIZES.map(({ size, label }) => (
          <div key={size} className="ds-demo__stack" style={{ maxWidth: 'none' }}>
            <span className="ds-demo__label">{label}</span>
            <div className="ds-demo__row" style={{ alignItems: 'flex-start' }}>
              <CmsInput
                inputSize={size}
                label="라벨"
                required
                placeholder="텍스트를 입력해 주세요"
                message="메세지"
              />
              <CmsInput
                inputSize={size}
                label="라벨"
                defaultValue="입력된 텍스트"
                message="메세지"
              />
              <CmsInput
                inputSize={size}
                label="라벨"
                disabled
                defaultValue="비활성"
                message="메세지"
              />
              <CmsInput
                inputSize={size}
                label="라벨"
                error
                defaultValue="에러 상태"
                message="에러 메세지"
              />
            </div>
            <div className="ds-demo__row" style={{ alignItems: 'flex-start' }}>
              <CmsSelect
                inputSize={size}
                label="Select"
                placeholder="선택하세요"
                options={SELECT_OPTIONS}
                withAllOption={false}
                allowClear
                defaultValue="active"
              />
              <CmsTimePicker inputSize={size} label="Time" defaultValue={DEMO_TIME} />
              <CmsInputSearch
                inputSize={size}
                label="Search"
                placeholder="검색어를 입력해 주세요"
                options={['서울 강남 프로그램', '부산 해운대 프로그램']}
              />
              <CmsDatePicker inputSize={size} label="Date" error message="날짜를 선택하세요" />
            </div>
          </div>
        ))}
      </DsDemo>

      <DsDemo label="CmsInput / CmsInputSearch / CmsTextArea">
        <div className="ds-demo__stack">
          <CmsInput
            placeholder="이름을 입력해 주세요"
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
            placeholder="내용을 입력해 주세요"
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
          입력 중에는 한 자리 월·일을 유지하고, 완성된 유효 날짜만 blur 시 두 자리로 정규화합니다.
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

      <DsDemo label="CmsToggle sizes · states">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          large(기본) 트랙 50px · 썸 20×20 · 라벨 16px/500/130% / medium 트랙 42px · 썸 16×16 · 라벨
          14px/500/125% · 라벨–토글 8px · 켜짐 #00A0AF · 꺼짐 #BDC6C9
        </p>
        {TOGGLE_SIZES.map(size => (
          <div key={size} className="ds-demo__stack">
            <span className="ds-demo__label">{size}</span>
            <div className="ds-demo__row">
              <CmsToggle size={size} checked label="켜짐" />
              <CmsToggle size={size} checked={false} label="꺼짐" />
              <CmsToggle size={size} checked disabled label="비활성 켜짐" />
              <CmsToggle size={size} checked={false} disabled label="비활성 꺼짐" />
            </div>
          </div>
        ))}
      </DsDemo>

      <DsDemo label="CmsCheckbox sizes · states">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          large(기본) 박스 20×20 · 라벨 16px/500/130% · 간격 8 / medium 박스 18×18 · 라벨
          14px/500/125% · 간격 6 · 그룹 항목 간격 16px(가로, large·medium 동일)
        </p>
        {CHECKBOX_SIZES.map(size => (
          <div key={size} className="ds-demo__stack">
            <span className="ds-demo__label">{size}</span>
            <div className="ds-demo__row">
              <CmsCheckbox checkboxSize={size} checked={false}>
                미선택
              </CmsCheckbox>
              <CmsCheckbox checkboxSize={size} checked>
                선택
              </CmsCheckbox>
              <CmsCheckbox checkboxSize={size} indeterminate>
                일부 선택
              </CmsCheckbox>
              <CmsCheckbox checkboxSize={size} checked={false} disabled>
                비활성 미선택
              </CmsCheckbox>
              <CmsCheckbox checkboxSize={size} checked disabled>
                비활성 선택
              </CmsCheckbox>
            </div>
          </div>
        ))}
        <div className="ds-demo__stack">
          <span className="ds-demo__label">CmsCheckbox.Group (medium)</span>
          <CmsCheckbox.Group
            checkboxSize="medium"
            options={MULTI_OPTIONS}
            value={checkboxGroup}
            onChange={values => setCheckboxGroup(values as string[])}
          />
        </div>
      </DsDemo>

      <DsDemo label="CmsRadio sizes · states">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          CmsCheckbox와 동일 규격 — large(기본) 원 20×20 · 라벨 16px/500/130% · 간격 8 / medium 원
          18×18 · 라벨 14px/500/125% · 간격 6 · 그룹 항목 간격 16px(가로)
        </p>
        {RADIO_SIZES.map(size => (
          <div key={size} className="ds-demo__stack">
            <span className="ds-demo__label">{size}</span>
            <div className="ds-demo__row">
              <CmsRadio size={size} checked={false}>
                미선택
              </CmsRadio>
              <CmsRadio size={size} checked>
                선택
              </CmsRadio>
              <CmsRadio size={size} checked={false} disabled>
                비활성 미선택
              </CmsRadio>
              <CmsRadio size={size} checked disabled>
                비활성 선택
              </CmsRadio>
            </div>
          </div>
        ))}
        <div className="ds-demo__stack">
          <span className="ds-demo__label">CmsRadio.Group (medium)</span>
          <CmsRadio.Group
            size="medium"
            options={MULTI_OPTIONS}
            value={radioGroup}
            onChange={e => setRadioGroup(e.target.value)}
          />
        </div>
      </DsDemo>

      <DsDemo label="CmsCheckbox.Group / CmsRadio.Group label">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          label · required prop — 라벨 14px(large 15px)/500/140% · #525252 · 라벨과 그룹 사이 4px ·
          그룹 높이 40px · 항목 간격 16px
        </p>
        {CHECKBOX_SIZES.map(size => (
          <div key={`checkbox-${size}`} className="ds-demo__stack">
            <span className="ds-demo__label">CmsCheckbox.Group ({size})</span>
            <div className="ds-demo__row">
              <CmsCheckbox.Group
                label="필수 라벨"
                required
                checkboxSize={size}
                options={MULTI_OPTIONS}
                value={checkboxGroup}
                onChange={values => setCheckboxGroup(values as string[])}
              />
              <CmsCheckbox.Group
                label="선택 라벨"
                checkboxSize={size}
                options={MULTI_OPTIONS}
                value={checkboxGroup}
                onChange={values => setCheckboxGroup(values as string[])}
              />
            </div>
          </div>
        ))}
        {RADIO_SIZES.map(size => (
          <div key={`radio-${size}`} className="ds-demo__stack">
            <span className="ds-demo__label">CmsRadio.Group ({size})</span>
            <div className="ds-demo__row">
              <CmsRadio.Group
                label="필수 라벨"
                required
                size={size}
                options={MULTI_OPTIONS}
                value={radioGroup}
                onChange={e => setRadioGroup(e.target.value)}
              />
              <CmsRadio.Group
                label="선택 라벨"
                size={size}
                options={MULTI_OPTIONS}
                value={radioGroup}
                onChange={e => setRadioGroup(e.target.value)}
              />
            </div>
          </div>
        ))}
      </DsDemo>

      <DsDemo label="CmsDatePicker / CmsDateRangePicker">
        <div className="ds-demo__stack">
          <CmsDatePicker value={date} onChange={v => setDate(v)} style={{ width: '100%' }} />
          <CmsDateRangePicker value={range} onChange={v => setRange(v)} style={{ width: '100%' }} />
        </div>
      </DsDemo>

      <DsDemo label="FileSelectField">
        <div className="ds-demo__stack">
          <span className="ds-demo__label">선택 가능 (빈 상태에서 시작)</span>
          <FileSelectField
            accept=".pdf,.png,.jpg"
            fileNames={fileNames}
            guideLines={['파일은 총 최대 15MB까지 업로드 가능합니다. (PDF, PNG, JPG)']}
            onFilesChange={files => setFileNames(prev => [...prev, ...files.map(f => f.name)])}
            onRemoveFile={index => setFileNames(prev => prev.filter((_, i) => i !== index))}
          />
          <span className="ds-demo__label">파일 여러 개</span>
          <FileSelectField
            fileNames={['사업계획서.pdf', '참가자명단.xlsx', '안내문.hwp', '현장사진.jpg']}
            guideLines={FILE_SELECT_DEMO_GUIDE_LINES}
            onFilesChange={() => undefined}
            onRemoveFile={() => undefined}
          />
          <span className="ds-demo__label">disabled (보기 모드)</span>
          <FileSelectField
            fileNames={['사업계획서.pdf']}
            guideLines={FILE_SELECT_DEMO_GUIDE_LINES}
            disabled
          />
        </div>
        <p className="ds-note">
          기본 <code>multiple</code>·합계 <code>15MB</code>. <code>accept</code>·가이드는 케이스별.
          단건만 <code>multiple=&#123;false&#125;</code>. 파일 행(유형 아이콘·파일명·X)과 빈 상태
          「첨부된 파일이 없습니다.」는 <code>FileAttachmentRow</code>{' '}
          공통(썸네일·ParagraphFileUpload 동일). 버튼은 「파일 추가」 secondary h32, 가이드 12px ·
          버튼과 16px. DetailInfoForm Field edit 사용 시 layout override —{' '}
          <code>cms-admin-ui/file-select-detail-form</code>. 주소·학교 검색은{' '}
          <a href="#search-modals">Search modals</a>.
        </p>
      </DsDemo>

      <DsDemo label="FileTypeIcon">
        <div className="ds-demo__row" style={{ gap: 24 }}>
          {FILE_TYPE_ICON_DEMO.map(({ type, label }) => (
            <span
              key={type}
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <FileTypeIcon type={type} />
              <span className="ds-demo__label">{label}</span>
            </span>
          ))}
        </div>
        <p className="ds-note">
          <code>&lt;FileTypeIcon fileName=&quot;a.pdf&quot; /&gt;</code> — 확장자로 자동
          선택(jpeg→jpg, docx→word, xlsx·csv→excel, pptx→ppt, hwpx→hwp, http(s) URL→net). 매핑
          없으면 clip. 원본 <code>shared/assets/icons/file-types/file-icon-*.svg</code>
        </p>
      </DsDemo>

      <DsDemo label="ThumbnailUploadField">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          썸네일 72×72(클릭 시 확대 보기) · 파일명 14px/500/130% · 「파일 추가」 secondary
          small(h32) · 가이드 12px/500/150% · 버튼–가이드 16px · 파일이 있으면 버튼 비활성, X로 삭제
        </p>
        <div className="ds-demo__stack">
          <span className="ds-demo__label">빈 상태 · 파일 선택 가능</span>
          <ThumbnailUploadField
            previewUrl={thumbDemo?.url}
            fileName={thumbDemo?.name}
            guideLines={THUMBNAIL_DEMO_GUIDE_LINES}
            maxBytes={FILE_SELECT_MAX_FILE_BYTES}
            sizeExceededMessage="파일은 최대 20MB까지 업로드 가능합니다."
            onSelectFile={file =>
              setThumbDemo(prev => {
                if (prev) URL.revokeObjectURL(prev.url)
                return { url: URL.createObjectURL(file), name: file.name }
              })
            }
            onRemove={() =>
              setThumbDemo(prev => {
                if (prev) URL.revokeObjectURL(prev.url)
                return null
              })
            }
          />
          <span className="ds-demo__label">파일 있음 (placeholder 이미지)</span>
          <ThumbnailUploadField
            fileName="thumbnail.png"
            guideLines={THUMBNAIL_DEMO_GUIDE_LINES}
            onSelectFile={() => undefined}
            onRemove={() => undefined}
          />
          <span className="ds-demo__label">disabled (보기 모드)</span>
          <ThumbnailUploadField
            fileName="thumbnail.png"
            guideLines={THUMBNAIL_DEMO_GUIDE_LINES}
            disabled
          />
          <span className="ds-demo__label">disabled · 첨부 없음</span>
          <ThumbnailUploadField guideLines={THUMBNAIL_DEMO_GUIDE_LINES} disabled />
        </div>
      </DsDemo>
    </DsSection>
  )
}
