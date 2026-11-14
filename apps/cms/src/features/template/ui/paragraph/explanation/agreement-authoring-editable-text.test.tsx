// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StaticDescriptionLinesParagraph } from '@/features/template/model/writing-form-draft.schema'
import { AgreementAdminProxyConfirmBlock } from './agreement-admin-proxy-confirm-block'
import { StaticDescriptionLines } from './static-description-lines'

const staticLinesParagraph: StaticDescriptionLinesParagraph = {
  id: 'agreement-notice-consent-static',
  kind: 'description',
  variant: 'static_description_lines',
  requiredMark: true,
  paragraphTitle: '정보주체(본인) 동의사항',
  paragraphDescription: '',
  participatesInTitleNumbering: true,
  lines: ['첫째 줄 안내', '둘째 줄 안내'],
}

describe('템플릿 관리 동의 양식 — 캔버스 문구 편집 (문구 수정 전부 가능)', () => {
  afterEach(cleanup)

  describe('AgreementAdminProxyConfirmBlock', () => {
    it('onConsentTextChange가 없으면(회원 화면·미리보기) 동의 문구를 정적으로 그린다', () => {
      const { getByText, queryByRole } = render(
        <AgreementAdminProxyConfirmBlock consentText="위 내용에 동의합니다." memberName="홍길동" />
      )
      expect(getByText('위 내용에 동의합니다.')).toBeInTheDocument()
      expect(queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('작성 모드에서 카드가 선택되면 동의 문구를 입력할 수 있다', () => {
      const onChange = vi.fn()
      const { getByRole } = render(
        <AgreementAdminProxyConfirmBlock
          consentText="위 내용에 동의합니다."
          memberName="이름예시"
          editable
          onConsentTextChange={onChange}
        />
      )
      const input = getByRole('textbox')
      expect(input).toBeEnabled()
      expect(input).toHaveValue('위 내용에 동의합니다.')
    })

    it('작성 모드라도 카드가 선택되지 않으면 보기 상태이고, 안내·이름 줄은 그대로 보인다', () => {
      const { getByText, queryByRole } = render(
        <AgreementAdminProxyConfirmBlock
          consentText="위 내용에 동의합니다."
          memberName="이름예시"
          editable={false}
          onConsentTextChange={vi.fn()}
        />
      )
      expect(getByText('위 내용에 동의합니다.')).toBeInTheDocument()
      expect(queryByRole('textbox')).not.toBeInTheDocument()
      expect(getByText(/관리자가 동의 확인 처리합니다/)).toBeInTheDocument()
      expect(getByText('이름예시')).toBeInTheDocument()
    })
  })

  describe('StaticDescriptionLines', () => {
    it('onChange가 없으면 줄을 정적으로 그린다', () => {
      const { getByText, queryByRole } = render(
        <StaticDescriptionLines paragraph={staticLinesParagraph} />
      )
      expect(getByText('첫째 줄 안내')).toBeInTheDocument()
      expect(getByText('둘째 줄 안내')).toBeInTheDocument()
      expect(queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('작성 모드에서 카드가 선택되면 줄마다 입력창이 되고 줄 수는 그대로다', () => {
      const { getAllByRole } = render(
        <StaticDescriptionLines paragraph={staticLinesParagraph} isEditMode onChange={vi.fn()} />
      )
      const inputs = getAllByRole('textbox')
      expect(inputs).toHaveLength(2)
      expect(inputs[0]).toHaveValue('첫째 줄 안내')
      expect(inputs[1]).toHaveValue('둘째 줄 안내')
    })
  })
})
