import { useState } from 'react'
import {
  CmsButton,
  type CmsButtonResolvedSize,
  type CmsButtonResolvedVariant,
} from '@/shared/ui/cms-button'
import { ExcelButton } from '@/shared/ui/excel-button'
import { DsDemo, DsSection } from './section'

import {
  ButtonCalendarIcon,
  ButtonDownloadIcon,
  ButtonListIcon,
} from '@/shared/ui/icons/ButtonIcons'

const BUTTON_SIZES: CmsButtonResolvedSize[] = ['h52', 'h44', 'h40', 'h36', 'h32']

const BUTTON_STATES: { key: string; variant: CmsButtonResolvedVariant; disabled?: boolean }[] = [
  { key: 'primary', variant: 'primary' },
  { key: 'secondary', variant: 'secondary' },
  { key: 'default', variant: 'default' },
  { key: 'error', variant: 'error' },
  { key: 'disabled', variant: 'primary', disabled: true },
]

const ICON_ROWS: { key: string; label: string; icon: boolean; iconPosition?: 'start' | 'end' }[] = [
  { key: 'none', label: '아이콘 없음', icon: false },
  { key: 'start', label: '왼쪽 아이콘', icon: true, iconPosition: 'start' },
  { key: 'end', label: '오른쪽 아이콘', icon: true, iconPosition: 'end' },
]

export function ButtonsSection() {
  const [loading, setLoading] = useState(false)
  const [listView, setListView] = useState(true)

  return (
    <DsSection
      id="buttons"
      title="Buttons"
      description="표준 버튼은 CmsButton입니다. hover·focus 효과와 로딩 스피너는 없습니다."
    >
      <p className="ds-note">
        <strong>Size</strong> — h52 · h44(기본) · h40 · h36 · h32. radius h52 10 · h44·h40 8 ·
        h36·h32 6 · font-weight 600. 폭은 사이즈별 min-width(h44 140 · h40 120 · h36 100 · h32 80,
        h52 없음)부터 라벨 길이만큼 늘어납니다. <code>width</code> prop은 없습니다.
        <br />
        <strong>별칭</strong> — <code>large</code>=h44 · <code>medium</code>=h40 ·{' '}
        <code>small</code>=h32 · <code>delete</code>=error · <code>cancel</code>=default. 새 코드는
        h·error 이름을 사용합니다.
        <br />
        <strong>Variant</strong> — primary · secondary · default · error. disabled는{' '}
        <code>disabled</code> prop(모든 variant 공통 회색).
        <br />
        <strong>아이콘</strong> — <code>icon</code> + <code>iconPosition</code>(start | end). 크기
        h52·h44 24 · h40·h36 20 · h32 16.
        <br />
        SSOT: <code>.cursor/rules/cms-admin-ui/cms-button-action-sizes.mdc</code>
      </p>

      {BUTTON_SIZES.map(size => (
        <DsDemo key={size} label={`CmsButton ${size}`}>
          <div className="ds-demo__stack">
            {ICON_ROWS.map(row => (
              <div key={row.key} className="ds-demo__row">
                {BUTTON_STATES.map(state => (
                  <CmsButton
                    key={state.key}
                    size={size}
                    variant={state.variant}
                    disabled={state.disabled}
                    icon={row.icon ? <ButtonDownloadIcon /> : undefined}
                    iconPosition={row.iconPosition}
                    aria-label={`${size} ${state.key} ${row.label}`} >
                    text
                  </CmsButton>
                ))}
              </div>
            ))}
          </div>
        </DsDemo>
      ))}

      <DsDemo label="아이콘 + 긴 라벨">
        <div className="ds-demo__row">
          <CmsButton variant="secondary" icon={<ButtonCalendarIcon />}>
            캘린더 뷰로 보기
          </CmsButton>
          <CmsButton variant="secondary" icon={<ButtonListIcon />}>
            리스트 뷰로 보기
          </CmsButton>
          <ExcelButton onClick={() => undefined} />
        </div>
      </DsDemo>

      <DsDemo label="테이블 상단 툴바 (시안)">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          선택 반려 <code>error</code> 140 · 선택 승인 <code>secondary</code> 140 · 뷰 토글{' '}
          <code>secondary</code>+icon · 엑셀 <code>ExcelButton</code>
        </p>
        <div className="ds-demo__row">
          <CmsButton variant="error" size="h44">
            선택 반려
          </CmsButton>
          <CmsButton variant="secondary" size="h44">
            선택 승인
          </CmsButton>
          <CmsButton
            variant="secondary"
            size="h44"
            icon={listView ? <ButtonCalendarIcon /> : <ButtonListIcon />}
            onClick={() => setListView(v => !v)} >
            {listView ? '캘린더 뷰로 보기' : '리스트 뷰로 보기'}
          </CmsButton>
          <ExcelButton onClick={() => undefined} />
        </div>
      </DsDemo>

      <DsDemo label="모달 푸터 (h44)">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          취소는 <code>default</code> 또는 <code>secondary</code> · 확인 <code>primary</code> 또는{' '}
          <code>error</code>. CSS: <code>.content-modal__footer-actions</code> 강제.
        </p>
        <div className="ds-demo__row">
          <CmsButton variant="default" size="h44">
            취소
          </CmsButton>
          <CmsButton variant="primary" size="h44">
            확인
          </CmsButton>
          <CmsButton variant="secondary" size="h44">
            취소
          </CmsButton>
          <CmsButton variant="error" size="h44">
            삭제
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="Loading (스피너 없음, 클릭만 차단)">
        <div className="ds-demo__row">
          <CmsButton
            variant="primary"
            size="h44"
            loading={loading}
            onClick={() => {
              setLoading(true)
              window.setTimeout(() => setLoading(false), 1500)
            }} >
            {loading ? '저장 중' : '저장'}
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="ExcelButton">
        <div className="ds-demo__row">
          <ExcelButton onClick={() => undefined} />
          <ExcelButton disabled />
        </div>
      </DsDemo>
    </DsSection>
  )
}
