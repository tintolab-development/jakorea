// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { SponsorManagerContactsView } from '@/features/program/shared/ui/sponsor-manager-inline-view'
import { ProgramSponsorHomepageView, ProgramSponsorLogoView } from './sponsor-assignment-info'

const DETAILS = {
  '99301': {
    homepageUrl: 'https://sponsor.example.test',
    logoFileObjectId: 99351,
    logoFileName: 'logo.png',
  },
}

function programWithContact(phone: string | null, email: string | null): Program {
  return {
    id: '99300',
    sponsorId: '99301',
    managerName: '모바일담당',
    generalCommonInfo: {
      sponsorManagementIds: ['99301'],
      sponsorManagerContactIds: ['99301::99311'],
      sponsorManagerContactNames: { '99301::99311': '모바일담당' },
      sponsorManagementNames: { '99301': '링크 후원사' },
      sponsorManagerContactDetails: {
        '99301::99311': { position: '팀장', phone, email },
      },
    },
  } as unknown as Program
}

describe('프로그램 상세 후원사 — 배정 응답 표시', () => {
  afterEach(cleanup)

  it('홈페이지 링크와 대표 로고 파일명을 보여 준다', () => {
    const homepage = render(<ProgramSponsorHomepageView sponsorIds={['99301']} details={DETAILS} />)
    const link = homepage.container.querySelector('a')
    expect(link?.getAttribute('href')).toBe('https://sponsor.example.test')
    cleanup()

    const logo = render(<ProgramSponsorLogoView sponsorIds={['99301']} details={DETAILS} />)
    expect(logo.getByRole('button', { name: 'logo.png 다운로드' })).toBeTruthy()
  })

  it('홈페이지·로고가 없으면 - 를 보여 준다', () => {
    const empty = {
      '99301': { homepageUrl: null, logoFileObjectId: null, logoFileName: null },
    }
    const homepage = render(<ProgramSponsorHomepageView sponsorIds={['99301']} details={empty} />)
    expect(homepage.container.textContent).toBe('-')
    cleanup()
    const logo = render(<ProgramSponsorLogoView sponsorIds={['99301']} details={empty} />)
    expect(logo.container.textContent).toBe('-')
  })

  it('담당자 전화·이메일을 배정 응답에서 마스킹해 보여 준다(정책 32·37 — 원문 표시 금지)', () => {
    const { container } = render(
      <SponsorManagerContactsView
        program={programWithContact('010-1111-2222', 'mobile@example.test')}
        sponsorRows={[]}
        contactsBySponsorId={{}}
      />
    )
    expect(container.textContent).toContain('모바일담당 팀장')
    expect(container.textContent).toContain('010-****-2222')
    expect(container.textContent).not.toContain('010-1111-2222')
    expect(container.textContent).toContain('mob***@example.test')
    expect(container.textContent).not.toContain('mobile@example.test')
  })

  it('nameTitle 조회는 이름 직책만 쉼표로 이어 붙이고 연락처는 숨긴다', () => {
    const { container } = render(
      <SponsorManagerContactsView
        program={
          {
            id: '99300',
            sponsorId: '99301',
            managerName: '모바일담당',
            generalCommonInfo: {
              sponsorManagementIds: ['99301', '99302'],
              sponsorManagerContactIds: ['99301::99311', '99302::99321'],
              sponsorManagerContactNames: {
                '99301::99311': '김제이',
                '99302::99321': '홍길동',
              },
              sponsorManagementNames: {
                '99301': '한국씨티은행',
                '99302': '스타벅스',
              },
              sponsorManagerContactDetails: {
                '99301::99311': {
                  position: '책임',
                  phone: '010-1111-2222',
                  email: 'a@example.test',
                },
                '99302::99321': { position: null, phone: '010-0000-0000', email: null },
              },
            },
          } as unknown as Program
        }
        sponsorRows={[]}
        sponsorNameById={{ '99301': '한국씨티은행', '99302': '스타벅스' }}
        contactsBySponsorId={{}}
        variant="nameTitle"
      />
    )
    expect(container.textContent).toBe('김제이 책임(한국씨티은행), 홍길동(스타벅스)')
  })

  it('권한 없음(전화·이메일 null)이면 - 를 보여 주고 contacts 캐시로 채우지 않는다', () => {
    const { container } = render(
      <SponsorManagerContactsView
        program={programWithContact(null, null)}
        sponsorRows={[]}
        contactsBySponsorId={{
          '99301': [
            {
              id: '99311',
              name: '모바일담당',
              position: '팀장',
              phone: '010-9999-9999',
            } as never,
          ],
        }}
      />
    )
    expect(container.textContent).toContain('모바일담당 팀장')
    expect(container.textContent).not.toContain('010-9999-9999')
    expect(container.textContent?.match(/-/g)?.length).toBeGreaterThanOrEqual(2)
  })
})
