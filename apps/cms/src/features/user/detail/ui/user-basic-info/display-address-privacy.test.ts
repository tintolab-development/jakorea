import { describe, expect, it } from 'vitest'
import { isValidElement, type ReactElement } from 'react'
import type { User } from '@/types/user'
import { detailAddressView } from './display'

function baseUser(partial: Partial<Omit<User, 'password'>> = {}): Omit<User, 'password'> {
  return {
    id: 'u-1',
    memberId: 1,
    email: 'a@b.com',
    name: '테스트',
    role: 'INDIVIDUAL',
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...partial,
  }
}

function collectText(node: unknown): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(collectText).join('')
  if (!isValidElement(node)) return ''
  const el = node as ReactElement<{ children?: unknown }>
  return collectText(el.props.children)
}

function collectBlurText(node: unknown): string {
  if (node == null || typeof node === 'boolean') return ''
  if (Array.isArray(node)) return node.map(collectBlurText).join('')
  if (!isValidElement(node)) return ''
  const el = node as ReactElement<{ className?: string; children?: unknown }>
  const className = el.props.className ?? ''
  if (String(className).includes('address-privacy__blur')) {
    return collectText(el.props.children)
  }
  return collectBlurText(el.props.children)
}

function collectClearText(node: unknown): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(collectClearText).join('')
  if (!isValidElement(node)) return ''
  const el = node as ReactElement<{ className?: string; children?: unknown }>
  const className = el.props.className ?? ''
  if (String(className).includes('address-privacy__blur')) return ''
  return collectClearText(el.props.children)
}

describe('detailAddressView', () => {
  it('BE 마스킹으로 시·군·구만 오면 더미 블러 꼬리를 붙인다', () => {
    const view = detailAddressView(
      baseUser({ detailAddress: '서울특별시 금천구', detailAddressDetail: undefined }),
      false
    )
    expect(collectClearText(view).trim()).toBe('서울특별시 금천구')
    expect(collectBlurText(view).trim()).not.toBe('')
  })

  it('상세가 마스킹 플레이스홀더면 더미 블러 꼬리를 붙인다', () => {
    const view = detailAddressView(
      baseUser({ detailAddress: '서울특별시 광진구', detailAddressDetail: '마스킹' }),
      false
    )
    expect(collectClearText(view).trim()).toBe('서울특별시 광진구')
    expect(collectBlurText(view).trim()).not.toBe('')
  })

  it('주소가 없으면 블러 없이 - 를 노출한다', () => {
    expect(detailAddressView(baseUser(), false)).toBe('-')
  })

  it('시·군·구 + 상세가 있으면 상세는 항상 블러 꼬리로 노출한다', () => {
    const view = detailAddressView(
      baseUser({
        detailAddress: '서울특별시 금천구',
        detailAddressDetail: '독산로 123 101호',
      }),
      false
    )
    expect(collectClearText(view).trim()).toBe('서울특별시 금천구')
    expect(collectBlurText(view).trim()).toBe('독산로 123 101호')
  })

  it('도로명 본문이 길면 앞 2토큰만 노출하고 나머지·상세를 블러한다', () => {
    const view = detailAddressView(
      baseUser({
        detailAddress: '서울특별시 관악구 관악로 1',
        detailAddressDetail: '202호',
      }),
      false
    )
    expect(collectClearText(view).trim()).toBe('서울특별시 관악구')
    expect(collectBlurText(view).trim()).toBe('관악로 1 202호')
  })

  it('상세보기 후에는 원문 전체를 노출한다', () => {
    const view = detailAddressView(
      baseUser({
        detailAddress: '서울특별시 금천구',
        detailAddressDetail: '독산로 123',
      }),
      true
    )
    expect(view).toBe('서울특별시 금천구 독산로 123')
  })
})
