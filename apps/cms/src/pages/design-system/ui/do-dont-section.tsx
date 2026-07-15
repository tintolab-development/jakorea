import { DsSection } from './section'

export function DoDontSection() {
  return (
    <DsSection
      id="do-dont"
      title="Do / Don't"
      description="CMS 공통 UI 규칙 요약. 채택·커버리지 수치는 Impact audit 섹션과 동일 SSOT입니다."
    >
      <p className="ds-note">
        공통 수정 가능성·파일 수 스냅샷 →{' '}
        <a href="#impact-audit">Impact audit</a> (
        <code>data/impact-audit-metrics.ts</code>). 상세 규칙은{' '}
        <code>apps/cms/.cursor/rules</code>를 참고하세요.
      </p>

      <div className="ds-demo">
        <p className="ds-demo__label">Do</p>
        <ul className="ds-list">
          <li>
            동등 Cms* 래퍼가 있으면 Ant Design 원시 컨트롤 대신 <code>CmsButton</code>,{' '}
            <code>CmsInput</code>, <code>CmsSelect</code> 등을 사용합니다. Auth는{' '}
            <code>LoadingButton</code> 허용.
          </li>
          <li>
            목록은 <code>FilterTableLayout</code> + <code>TableFilterGroup</code> +{' '}
            <code>cms-data-table</code> 스택을 유지합니다.
          </li>
          <li>
            상세 정보 격자는 <code>DetailInfoForm</code> (view/edit)을 사용합니다.
          </li>
          <li>
            라벨-값 세로형은 <code>DetailInfoForm</code>, 목록형 가로 표는 Ant <code>Table</code> +{' '}
            <code>cms-data-table</code>, 행·열 교차표만 <code>CrossTable</code>을 사용합니다.
          </li>
          <li>
            캘린더는 <code>CalendarMain</code> + <code>CalendarSplitCardLayout</code>(+{' '}
            <code>CalendarMini</code>) 조합을 표준으로 둡니다. <code>CalendarSet</code>은 실사용이
            없습니다.
          </li>
          <li>
            피드백은 <code>useCmsAlert</code> / <code>cmsAlertModal</code> / Confirm / DeleteGuide /
            Permission / ActionResult 모달을 사용합니다.
          </li>
          <li>
            모달은 뷰포트 중앙 정렬(<code>getContainer=document.body</code>)을 유지하고, 표준
            컨텐츠는 <code>ContentModal</code>·풀페이지 상세는 <code>DetailFullPageModal</code> +{' '}
            <code>DetailModalSidebar</code>를 사용합니다.
          </li>
          <li>
            일반 모달 폭은 600 / 800 / 1000 / 1200 / 1400 티어를 사용하고, 전체 셸은 최대
            880px에서 헤더·푸터 고정 + 본문 스크롤을 적용합니다.
          </li>
          <li>
            색·간격은 <code>theme-provider</code>의 <code>var(--color-*)</code>,{' '}
            <code>var(--spacing-*)</code> 토큰을 우선합니다. 제품 룩 변경은 토큰·shared만 수정하고
            DS <code>page.css</code>는 데모 레이아웃에만 씁니다.
          </li>
          <li>
            CMS DS는 Platform·<code>packages/ui</code>와 무관합니다. 공통 반영은 CMS{' '}
            <code>shared</code> 채택 화면에서만 기대합니다.
          </li>
          <li>
            상세·풀페이지는 <code>detail-fullpage-modal__loading</code> 스피너를 empty/not-found보다
            먼저 보여줍니다.
          </li>
          <li>
            금액·수량·소수·숫자형 식별자는 의미에 맞는 <code>CmsNumericInput</code> 모드를
            사용하고, 직접 입력 날짜는 <code>CmsDateTextInput</code>으로 blur 시 정규화합니다.
          </li>
          <li>
            리치 텍스트는 <code>@/shared/rich-text</code>의 <code>RichTextEditor</code> /{' '}
            <code>RichTextViewer</code>를 사용합니다 (Toast UI 금지).
          </li>
        </ul>
      </div>

      <div className="ds-demo">
        <p className="ds-demo__label">Don&apos;t</p>
        <ul className="ds-list">
          <li>
            공통 UI와 동일한 역할의 별도 컴포넌트나 deprecated alias를 새로 만들지 않습니다. Current
            카탈로그의 컴포넌트를 사용합니다.
          </li>
          <li>
            antd <code>message</code> / <code>notification</code> 토스트를 쓰지 않습니다. 페이지에{' '}
            <code>AlertModal</code>을 직접 마운트하지 않습니다.
          </li>
          <li>
            모달을 메인 컬럼(사이드바 오른쪽) 기준으로 가운데 맞추지 마세요 — 전체 뷰포트 기준입니다.
          </li>
          <li>
            신규 화면에 raw antd <code>Modal</code>, 임의 폭, 임의 고정 높이를 추가하지 않습니다.
            공식 size 티어나 fullpage 셸을 선택합니다.
          </li>
          <li>필터 칸을 flex-grow로 늘리지 말고 규격 폭(240×44) · 조회 160×44를 지킵니다.</li>
          <li>
            이 페이지에서 새 디자인 토큰을 창설하거나 <code>packages/ui</code>를 도입하지 않습니다 —
            CMS <code>shared/ui</code>가 소스 오브 트루스입니다. 공통 룩 변경(Phase 5)은 채택·회귀
            검증 후 <code>theme-provider</code>/<code>shared</code>에서만 합니다.
          </li>
          <li>
            대시보드 위젯 본체·DnD 크롬을 shared로 승격하거나,{' '}
            <code>dashboard-widget-table</code> 스타일을 일반 목록·상세의 공통 컴포넌트처럼
            재사용하지 않습니다.             홈 패턴 데모는 <a href="#dashboard">Dashboard layouts</a>만 씁니다.
          </li>
          <li>
            빈 상태에 raw antd <code>Empty</code>를 늘리지 말고, 가능하면{' '}
            <code>EmptyState</code>(Feedback)를 씁니다. 대시보드 위젯 본체는 후속
            마이그입니다.
          </li>
          <li>
            숫자 입력에 <code>type=&quot;number&quot;</code>를 사용하거나, 금액을 plain text로
            받아 호출부마다 쉼표를 처리하지 않습니다.
          </li>
          <li>
            날짜의 한 자리 월·일을 입력 도중 즉시 <code>01</code>로 바꾸지 않습니다. 완성된
            날짜만 blur/확정 시 정규화합니다.
          </li>
        </ul>
      </div>

      <div className="ds-demo">
        <p className="ds-demo__label">Not catalogued (DS 미포함)</p>
        <ul className="ds-list">
          <li>
            Orphan: <code>CalendarSet</code>, <code>BaseDetailDrawer</code>,{' '}
            <code>ListPageLayout</code>, <code>EditableCell</code>
          </li>
          <li>
            Domain-only: <code>InquiryModal</code>, <code>ProfileEditModal</code>,{' '}
            <code>TemplateFullpageModal</code>, <code>ProgramHistoryDeleteBlockedModal</code>
          </li>
          <li>
            Dashboard 위젯 본체(<code>ProgramScheduleWidget</code>,{' '}
            <code>MenuShortcutWidget</code> 등) — 액션만 <code>CmsButton</code>/
            <code>LoadingButton</code>. 카탈로그된 패턴은{' '}
            <code>StatisticsCard</code>, <code>PendingActionCard</code>, 테이블 셸 (
            <a href="#dashboard">#dashboard</a>).
          </li>
          <li>
            Auth: antd 기본 룩이 필요할 때 <code>LoadingButton</code> 허용. 잔여 raw{' '}
            <code>Button</code>·폼 셸은 Impact audit 후속 목록 참고
          </li>
          <li>
            Internal-only: 상위 공개 컴포넌트 내부 조각과 도메인별 calendar item-list
          </li>
          <li>
            No shared implementation: CMS Pagination 래퍼, 알림 발송 전용 태그
          </li>
        </ul>
      </div>

      <p className="ds-note">
        관련 경로:
        <br />
        <code>apps/cms/src/pages/design-system/data/impact-audit-metrics.ts</code> (
        <a href="#impact-audit">#impact-audit</a>)
        <br />
        <code>apps/cms/docs/design-system/cms-shared-ssot-migration.md</code>
        <br />
        <code>apps/cms/docs/design-system/dashboard-widget-catalog-audit.md</code>
        <br />
        <code>apps/cms/.cursor/rules/coding/custom-ui-priority.md</code>
        <br />
        <code>apps/cms/.cursor/rules/design/styling-tokens.md</code>
        <br />
        <code>apps/cms/.cursor/rules/design/filter-area-layout.mdc</code>
        <br />
        <code>apps/cms/.cursor/rules/libraries/no-antd-message.mdc</code>
        <br />
        <code>apps/cms/.cursor/rules/libraries/cms-alert-modal.md</code>
        <br />
        <code>apps/cms/.cursor/rules/design/modal-viewport-centering.md</code>
        <br />
        <code>apps/cms/.cursor/rules/tables/table-implementation.md</code>
        <br />
        <code>apps/cms/.cursor/rules/design/detail-loading-before-empty.mdc</code>
        <br />
        <code>apps/cms/.cursor/rules/design/numeric-input-ux.mdc</code>
      </p>
    </DsSection>
  )
}
