import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { DetailInfoFormMode } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui/cms-input'
import { TextAreaFieldRow } from '@/shared/ui/text-area-field-row'
import { DsDemo, DsSection } from './section'

type TextAreaDemoForm = {
  description: string
}

const VERTICAL_TABLE_LABEL_WIDTH = 200 as const

export function DetailFormsSection() {
  const [mode, setMode] = useState<DetailInfoFormMode>('view')
  const [name, setName] = useState('홍길동')
  const [email, setEmail] = useState('hong@example.com')
  const [memo, setMemo] = useState('상세 폼 데모')
  const textAreaForm = useForm<TextAreaDemoForm>({
    defaultValues: { description: '프로그램의 목적과 주요 활동을 설명하는 기존 입력 패턴입니다.' },
  })
  const description = useWatch({ control: textAreaForm.control, name: 'description' })

  return (
    <DsSection
      id="detail-forms"
      title="Detail Forms"
      description="상세·회원 정보 등에서 쓰는 DetailInfoForm(Root / Row / Field) 격자 패턴입니다."
    >
      <p className="ds-note">
        <code>mode=&quot;view&quot; | &quot;edit&quot;</code>는 Root에 두고 Field의 <code>view</code>/
        <code>edit</code> 슬롯이 전환됩니다. 상위에 이미 제목이 있으면 <code>hideHeader</code>를
        사용합니다.
      </p>

      <DsDemo label="view / edit">
        <div className="ds-demo__row" style={{ marginBottom: 12 }}>
          <CmsButton
            variant={mode === 'view' ? 'primary' : 'secondary'}
            size="medium"
            onClick={() => setMode('view')}
          >
            view
          </CmsButton>
          <CmsButton
            variant={mode === 'edit' ? 'primary' : 'secondary'}
            size="medium"
            onClick={() => setMode('edit')}
          >
            edit
          </CmsButton>
        </div>

        <DetailInfoForm
          title="기본 정보"
          mode={mode}
          headerNote={<span style={{ color: 'var(--color-brand-primary)' }}>데모</span>}
          titleTrailing={
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>sample</span>
          }
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="이름"
              required
              view={name}
              edit={
                <CmsInput value={name} onChange={e => setName(e.target.value)} width="100%" />
              }
            />
            <DetailInfoForm.Field
              label="이메일"
              view={email}
              edit={
                <CmsInput value={email} onChange={e => setEmail(e.target.value)} width="100%" />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="메모"
              fullRow
              view={memo}
              edit={
                <CmsInput value={memo} onChange={e => setMemo(e.target.value)} width="100%" />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="식별자"
              readOnlyDisplay
              view="demo-user-001"
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </DsDemo>

      <DsDemo label="세로형 키-값 표 — 공통 labelWidth">
        <p className="ds-note" style={{ marginTop: 0 }}>
          라벨 1열 + 값 1열 구조는 일반 <code>table</code>이 아니라{' '}
          <code>DetailInfoForm.Row type=&quot;single&quot;</code>을 사용합니다. 라벨 길이와 관계없이
          한 표 안의 모든 행에 동일한 <code>labelWidth</code>를 적용합니다.
        </p>
        <DetailInfoForm title="세로형 테이블" mode="view">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="프로그램명"
              labelWidth={VERTICAL_TABLE_LABEL_WIDTH}
              view="JA Korea 경제교육 프로그램"
              fullRow
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="교육 대상 및 참여 인원"
              labelWidth={VERTICAL_TABLE_LABEL_WIDTH}
              view="중학생 24명"
              fullRow
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="운영 기간"
              labelWidth={VERTICAL_TABLE_LABEL_WIDTH}
              view="2026.07.21 – 2026.08.04"
              fullRow
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="담당자"
              labelWidth={VERTICAL_TABLE_LABEL_WIDTH}
              view="홍길동 매니저"
              fullRow
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </DsDemo>

      <DsDemo label="행 구조 비교 — single / double / hideHeader">
        <div className="ds-coverage-grid ds-coverage-grid--forms">
          <DetailInfoForm title="single — 2열" mode="view">
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="기관명" view="서울중학교" fullRow />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field label="지역" view="서울" fullRow />
            </DetailInfoForm.Row>
          </DetailInfoForm>
          <div className="ds-detail-form-blocks">
            <DetailInfoForm title="double — 4열" mode="view">
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field label="담당자" view="김담당" />
                <DetailInfoForm.Field label="연락처" view="010-1234-5678" />
              </DetailInfoForm.Row>
            </DetailInfoForm>
            <DetailInfoForm title="연속 정보 블록" hideHeader mode="view">
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="비고" view="상위 제목을 공유하는 연속 블록" fullRow />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          </div>
        </div>
      </DsDemo>

      <DsDemo label="TextAreaFieldRow — view / edit">
        <p className="ds-note" style={{ marginTop: 0 }}>
          독립 입력 컴포넌트가 아니라 상세 정보 표 내부의 행입니다. 동일한 API를 읽기/수정 상태로
          나란히 비교합니다.
        </p>
        <div className="ds-coverage-grid ds-coverage-grid--forms">
          <table className="ds-field-table">
            <tbody>
              <TextAreaFieldRow
                label="프로그램 설명"
                showRequiredStar
                isFormEdit={false}
                form={textAreaForm}
                name="description"
                placeholder="프로그램 설명"
                readContent={description}
              />
            </tbody>
          </table>
          <table className="ds-field-table">
            <tbody>
              <TextAreaFieldRow
                label="프로그램 설명"
                showRequiredStar
                isFormEdit
                form={textAreaForm}
                name="description"
                placeholder="프로그램 설명"
                readContent={description}
                rows={3}
              />
            </tbody>
          </table>
        </div>
      </DsDemo>
    </DsSection>
  )
}
