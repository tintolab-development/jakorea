/**
 * 양식 테스트 > 테이블 컴포넌트(가로형)
 * — 폼/목록에 쓰는 테이블 UI를 한곳에 배치·검토하는 용도
 */

import { HorizontalTableFormEditor } from '@/features/template/ui/form-set/horizontal-table-form-editor'
import './form-test-table-components-page.css'

export function FormTestTableComponentsPage() {
  return (
    <div className="template-form-tab__content form-test-table-components-page">
      <section className="form-test-table-components-page__section" aria-labelledby="form-test-horizontal-table-heading">
        <h2 id="form-test-horizontal-table-heading" className="form-test-table-components-page__section-title">
          가로형 테이블 (에디터 · 커스텀 필드)
        </h2>
        <p className="form-test-table-components-page__section-desc">
          작성 양식 신규 등록과 동일한 좌측 카드·우측 커스텀 필드 패널로 동작합니다.
        </p>
        <HorizontalTableFormEditor variant="embedded" />
      </section>
    </div>
  )
}

export default FormTestTableComponentsPage
