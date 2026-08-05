import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import { DsDemo, DsSection } from './section'

export function DetailFormsSection() {
  return (
    <DsSection
      id="detail-forms"
      title="Detail Forms"
      description="DetailInfoForm — CMS 라벨·값 격자 (@jakorea/form-template-runtime)."
    >
      <DsDemo label="DetailInfoForm (view, hideHeader)">
        <DetailInfoForm title="배너 텍스트 및 링크" hideHeader mode="view">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label="상단 문구" view="JA KOREA" />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="메인 타이틀"
              view="청소년의 가능성이 더 넓은 세상과 만납니다"
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label="연결 링크" view="연결된 링크가 없습니다" />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </DsDemo>
    </DsSection>
  )
}
