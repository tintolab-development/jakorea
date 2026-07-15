import { DsSection } from './section'

export function DoDontSection() {
  return (
    <DsSection
      id="do-dont"
      title="Do / Don't"
      description="CMS 공통 UI 규칙 요약. 상세는 apps/cms/.cursor/rules 를 참고하세요."
    >
      <div className="ds-demo">
        <p className="ds-demo__label">Do</p>
        <ul className="ds-list">
          <li>
            동등 Cms* 래퍼가 있으면 Ant Design 원시 컨트롤 대신 <code>CmsButton</code>,{' '}
            <code>CmsInput</code>, <code>CmsSelect</code> 등을 사용합니다.
          </li>
          <li>
            목록은 <code>FilterTableLayout</code> + <code>TableFilterGroup</code> +{' '}
            <code>cms-data-table</code> 스택을 유지합니다.
          </li>
          <li>
            상세 정보 격자는 <code>DetailInfoForm</code> (view/edit)을 사용합니다.
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
            색·간격은 <code>var(--color-*)</code>, <code>var(--spacing-*)</code> 토큰을 우선합니다.
          </li>
          <li>
            상세·풀페이지는 <code>detail-fullpage-modal__loading</code> 스피너를 empty/not-found보다
            먼저 보여줍니다.
          </li>
        </ul>
      </div>

      <div className="ds-demo">
        <p className="ds-demo__label">Don&apos;t</p>
        <ul className="ds-list">
          <li>
            신규 화면에서 <code>AppButton</code> / <code>UnifiedFilterCard</code> /{' '}
            <code>ListPageFilters</code>를 쓰지 않습니다.
          </li>
          <li>
            antd <code>message</code> / <code>notification</code> 토스트를 쓰지 않습니다. 페이지에{' '}
            <code>AlertModal</code>을 직접 마운트하지 않습니다.
          </li>
          <li>
            모달을 메인 컬럼(사이드바 오른쪽) 기준으로 가운데 맞추지 마세요 — 전체 뷰포트 기준입니다.
          </li>
          <li>필터 칸을 flex-grow로 늘리지 말고 규격 폭(240×44) · 조회 160×44를 지킵니다.</li>
          <li>
            이 페이지에서 새 디자인 토큰을 창설하거나 <code>packages/ui</code>를 도입하지 않습니다 —
            CMS <code>shared/ui</code>가 소스 오브 트루스입니다.
          </li>
        </ul>
      </div>

      <div className="ds-demo">
        <p className="ds-demo__label">Deferred (DS 미포함)</p>
        <ul className="ds-list">
          <li>
            Calendar: <code>CalendarSet</code>, 도메인 SubRight / item-list / tooltip
          </li>
          <li>
            Domain-only: <code>InquiryModal</code>, <code>ProfileEditModal</code>,{' '}
            <code>ProgramHistoryDeleteBlockedModal</code>
          </li>
          <li>
            Orphan: <code>BaseDetailDrawer</code>, <code>EditableCell</code>
          </li>
          <li>
            Legacy: <code>AppDatePicker</code>, <code>ListPageLayout</code> /{' '}
            <code>ViewModeController</code>
          </li>
          <li>
            Status 전수: Settlement / Delivery / Interview / PaymentOrderLine 등 도메인 배지
          </li>
        </ul>
      </div>

      <p className="ds-note">
        관련 규칙 경로:
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
      </p>
    </DsSection>
  )
}
