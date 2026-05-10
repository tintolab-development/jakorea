import { CmsButton } from '@/shared/ui/cms-button'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'

const GRADE_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}학년`,
}))

function GradeStudentsLine({
  gradeClass,
  students,
}: {
  gradeClass: string
  students: string
}) {
  return (
    <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
      <CmsInput inputSize="medium" width={60} value={gradeClass} />
      <span>반</span>
      <CmsInput inputSize="medium" width={60} value={students} />
      <span>명</span>
      <DetailInfoForm.InputsSeparator />
    </div>
  )
}

/** UJAT 프로그램 학교 신청 폼 — 학년 별 신청 정보 */
export function UjatProgramApplicationGradeInfoParagraph() {
  return (
    <DetailInfoForm title="학년 별 신청 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="custom">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span className="form-editor-template-field-hint-text">
            학교에서 신청하는 모든 신청 학년 별 학급 수 및 반 별 학생 수를 작성해주세요.
          </span>
          <CmsButton variant="secondary" size="medium">
            + 신청 학년 추가
          </CmsButton>
        </div>
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="신청 학년 및 학급 수"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsSelect
                inputSize="medium"
                width={100}
                withAllOption={false}
                value="1"
                options={GRADE_OPTIONS}
              />
              <CmsInput inputSize="medium" width={100} value="8" />
              <span>학급</span>
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="학급 별 학생 수"
          fullRow
          edit={
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <GradeStudentsLine gradeClass="1" students="28" />
              <GradeStudentsLine gradeClass="2" students="28" />
              <GradeStudentsLine gradeClass="3" students="24" />
              <GradeStudentsLine gradeClass="4" students="" />
              <GradeStudentsLine gradeClass="" students="" />
              <GradeStudentsLine gradeClass="" students="" />
              <GradeStudentsLine gradeClass="" students="" />
              <GradeStudentsLine gradeClass="" students="" />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="신청 학년 및 학급 수"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsSelect
                inputSize="medium"
                width={120}
                withAllOption={false}
                placeholder="신청 학년"
                value={undefined}
                options={GRADE_OPTIONS}
              />
              <CmsInput inputSize="medium" width={120} placeholder="총 학급 수" />
              <span>학급</span>
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="학급 별 학생 수"
          fullRow
          edit={<CmsInput inputSize="medium" width="100%" placeholder="총 학급 수를 먼저 입력해 주세요." />}
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
