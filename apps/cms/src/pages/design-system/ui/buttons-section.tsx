import { useState } from 'react'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { CmsButton } from '@/shared/ui/cms-button'
import { ExcelButton } from '@/shared/ui/excel-button'
import { DsDemo, DsSection } from './section'

export function ButtonsSection() {
  const [loading, setLoading] = useState(false)
  const [listView, setListView] = useState(true)

  return (
    <DsSection
      id="buttons"
      title="Buttons"
      description="표준 버튼은 CmsButton입니다. loading 중에는 라벨을 숨기고 스피너만 표시합니다."
    >
      <p className="ds-note">
        <strong>Size</strong> — large 140×44 · medium 120×40 · small 100×32.
        <br />
        <strong>Large + icon</strong> — 180×44 · padding <code>6px 16px 6px 10px</code> (캘린더·엑셀
        등).
        <br />
        <strong>Variant</strong> — primary(솔리드) · secondary(민트 아웃라인) · default(회색) ·
        delete(레드 아웃라인). 「정보 수정」은 <code>secondary</code> + <code>large</code>(140).
        <br />
        <strong>용도</strong> — 테이블 상단 액션=<strong>large</strong> · 모달 푸터=
        <strong>large</strong> (140×44) · FileSelectField 내 버튼=medium ·{' '}
        <code>cms-button--action</code>은 텍스트 액션 폭 140 고정.
        <br />
        SSOT: <code>.cursor/rules/cms-admin-ui/cms-button-action-sizes.mdc</code>
      </p>

      <DsDemo label="CmsButton variants (large)">
        <div className="ds-demo__row">
          <CmsButton variant="primary" size="large">
            Primary
          </CmsButton>
          <CmsButton variant="secondary" size="large">
            Secondary
          </CmsButton>
          <CmsButton variant="default" size="large">
            Default
          </CmsButton>
          <CmsButton variant="delete" size="large">
            Delete
          </CmsButton>
          <CmsButton variant="primary" size="large" disabled>
            Disabled
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="CmsButton sizes">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          large 140×44 (툴바·모달 푸터) · medium 120×40 (FileSelect·행 액션) · small 100×32
        </p>
        <div className="ds-demo__row">
          <CmsButton variant="primary" size="large">
            Large
          </CmsButton>
          <CmsButton variant="primary" size="medium">
            Medium
          </CmsButton>
          <CmsButton variant="primary" size="small">
            Small
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="Large + icon (180×44)">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          <code>size=&quot;large&quot;</code> + <code>icon</code> → 자동 180폭 · padding 6 / 16 / 6 /
          10
        </p>
        <div className="ds-demo__row">
          <CmsButton variant="secondary" size="large" icon={<CalendarOutlined />}>
            캘린더 뷰로 보기
          </CmsButton>
          <CmsButton variant="secondary" size="large" icon={<UnorderedListOutlined />}>
            리스트 뷰로 보기
          </CmsButton>
          <ExcelButton onClick={() => undefined} />
        </div>
      </DsDemo>

      <DsDemo label="테이블 상단 툴바 (시안)">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          선택 반려 <code>delete</code> 140 · 선택 승인 <code>secondary</code> 140 · 뷰 토글{' '}
          <code>secondary</code>+icon 180 · 엑셀 <code>ExcelButton</code> primary 180
        </p>
        <div className="ds-demo__row">
          <CmsButton variant="delete" size="large" className="cms-button--action">
            선택 반려
          </CmsButton>
          <CmsButton variant="secondary" size="large" className="cms-button--action">
            선택 승인
          </CmsButton>
          <CmsButton
            variant="secondary"
            size="large"
            icon={listView ? <CalendarOutlined /> : <UnorderedListOutlined />}
            onClick={() => setListView(v => !v)}
          >
            {listView ? '캘린더 뷰로 보기' : '리스트 뷰로 보기'}
          </CmsButton>
          <ExcelButton onClick={() => undefined} />
        </div>
      </DsDemo>

      <DsDemo label="모달 푸터 (large 140×44)">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          Confirm / DeleteGuide / Alert / 등록 모달 푸터 — 취소 <code>secondary</code> · 확인{' '}
          <code>primary</code> 또는 <code>delete</code> · 모두 <code>size=&quot;large&quot;</code>.
          CSS: <code>.content-modal__footer-actions</code> 강제.
        </p>
        <div className="ds-demo__row">
          <CmsButton variant="secondary" size="large">
            취소
          </CmsButton>
          <CmsButton variant="primary" size="large">
            확인
          </CmsButton>
          <CmsButton variant="secondary" size="large">
            취소
          </CmsButton>
          <CmsButton variant="delete" size="large">
            삭제
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="Loading (spinner only)">
        <div className="ds-demo__row">
          <CmsButton
            variant="primary"
            size="large"
            loading={loading}
            onClick={() => {
              setLoading(true)
              window.setTimeout(() => setLoading(false), 1500)
            }}
          >
            저장
          </CmsButton>
          <CmsButton variant="secondary" size="large" loading>
            조회 중
          </CmsButton>
        </div>
      </DsDemo>

      <DsDemo label="ExcelButton">
        <p className="ds-demo__hint" style={{ marginTop: 0 }}>
          <code>ExcelButton</code> = primary · large · Download 아이콘 · 180×44 (직접 width 지정
          불필요)
        </p>
        <div className="ds-demo__row">
          <ExcelButton onClick={() => undefined} />
          <ExcelButton disabled />
        </div>
      </DsDemo>
    </DsSection>
  )
}
