// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from './participant-recruitment-announcement-published-radios'

describe('ParticipantRecruitmentAnnouncementPublishedRadios', () => {
  afterEach(cleanup)

  it('참여 기관 모집 정보는 학생 명단 제출 여부와 같은 medium이다', () => {
    const { container } = render(
      <ParticipantRecruitmentAnnouncementPublishedRadios
        value="published"
        onChange={() => {}}
        size="medium"
      />
    )

    expect(container.querySelector('.app-radio-group--medium')).toBeTruthy()
    expect(container.querySelector('.app-radio--large')).toBeNull()
    expect(container.querySelectorAll('.app-radio--medium')).toHaveLength(2)
  })

  it('모집 양식 라디오 기본 크기는 medium(14px)이다', () => {
    const { container } = render(
      <ParticipantRecruitmentAnnouncementPublishedRadios value="unpublished" onChange={() => {}} />
    )

    expect(container.querySelector('.app-radio-group--medium')).toBeTruthy()
    expect(container.querySelector('.app-radio--large')).toBeNull()
    expect(container.querySelectorAll('.app-radio--medium')).toHaveLength(2)
  })
})
