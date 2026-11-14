// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { UserInfoParagraph } from '@/features/template/model/writing-form-draft.schema'
import { normalizeUserInfoGenderValue, UserInfo, userInfoAnswerDisplayValue } from './user-info'

const respondentParagraph = {
  id: 'survey-user-info',
  kind: 'single_item',
  variant: 'user_info',
  paragraphTitle: '설문자 정보',
  paragraphDescription: '',
  requiredMark: true,
  participatesInTitleNumbering: true,
  userFields: [
    { key: 'name', label: '이름' },
    { key: 'addressRegion', label: '자택 주소지' },
  ],
  selectedUserFieldKeys: ['name', 'addressRegion'],
} as unknown as UserInfoParagraph

afterEach(() => {
  cleanup()
})

describe('UserInfo — 강의평가 설문자 정보 (시안 14931:707129)', () => {
  it('puts two fields on one DetailInfoForm row', () => {
    const { container } = render(
      <UserInfo
        paragraph={respondentParagraph}
        isEditMode={false}
        layout="previewTable"
        surveyRespondentPreview
        lectureEvalRespondentDetailInfo
      />
    )
    const rows = container.querySelectorAll('.detail-info-form__row')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveClass('detail-info-form__row--double')
    expect(screen.getByText('설문자 이름')).toBeInTheDocument()
    expect(screen.getByText('설문자 자택 주소지')).toBeInTheDocument()
  })

  it('keeps inputs while writing — values feed submit validation and answers', () => {
    const onChange = vi.fn()
    render(
      <UserInfo
        paragraph={respondentParagraph}
        onChange={onChange}
        isEditMode
        layout="previewTable"
        answerEditable
        surveyRespondentPreview
        lectureEvalRespondentDetailInfo
      />
    )
    const nameInput = screen.getByPlaceholderText('이름을 입력해 주세요')
    fireEvent.change(nameInput, { target: { value: '김제이' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fieldAnswers: { name: '김제이' } })
    )
  })

  it('leaves other survey previews on the existing one-field-per-row layout', () => {
    const { container } = render(
      <UserInfo
        paragraph={respondentParagraph}
        isEditMode={false}
        layout="previewTable"
        surveyRespondentPreview
      />
    )
    expect(container.querySelectorAll('.detail-info-form__row--single')).toHaveLength(2)
  })
})

describe('user-info gender', () => {
  it('normalizes gender values to MALE/FEMALE and displays Korean labels', () => {
    expect(normalizeUserInfoGenderValue('남')).toBe('MALE')
    expect(normalizeUserInfoGenderValue('여자')).toBe('FEMALE')
    expect(normalizeUserInfoGenderValue('female')).toBe('FEMALE')
    expect(normalizeUserInfoGenderValue('')).toBe('')
    expect(userInfoAnswerDisplayValue('gender', 'MALE')).toBe('남자')
    expect(userInfoAnswerDisplayValue('name', 'MALE')).toBe('MALE')
  })

  it('renders gender as a select (not a text input) in answer mode', () => {
    const paragraph = {
      ...respondentParagraph,
      userFields: [{ key: 'gender', label: '성별' }],
      selectedUserFieldKeys: ['gender'],
    } as unknown as UserInfoParagraph
    render(
      <UserInfo
        paragraph={paragraph}
        isEditMode={false}
        layout="previewTable"
        answerEditable
        surveyRespondentPreview
        onChange={vi.fn()}
      />
    )
    expect(screen.queryByPlaceholderText('성별을 입력해 주세요')).toBeNull()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})
