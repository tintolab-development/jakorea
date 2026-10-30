import { describe, expect, it } from 'vitest'
import { collectMenuRouteKeys, resolveSidebarSelectedKey } from './sidebar-selected-key'

const items = [
  { key: '/' },
  {
    key: 'programs-group',
    children: [
      { key: '/programs/general' },
      { key: '/programs/company-school' },
      { key: 'ujat-program-group', children: [{ key: '/programs/ujat' }, { key: '/programs/ujat/regions' }] },
      { key: '/programs/trained-teachers' },
    ],
  },
  { type: 'divider', key: 'divider-admin' },
  { key: 'posts-group', children: [{ key: '/admin/posts/inquiries' }] },
  null,
]

describe('sidebar selected key', () => {
  const keys = collectMenuRouteKeys(items)

  it('collects only route keys from nested menu items', () => {
    expect(keys).toEqual([
      '/',
      '/programs/general',
      '/programs/company-school',
      '/programs/ujat',
      '/programs/ujat/regions',
      '/programs/trained-teachers',
      '/admin/posts/inquiries',
    ])
  })

  it('keeps exact menu keys', () => {
    expect(resolveSidebarSelectedKey('/programs/general', keys)).toBe('/programs/general')
    expect(resolveSidebarSelectedKey('/', keys)).toBe('/')
    expect(resolveSidebarSelectedKey('/programs/ujat/regions', keys)).toBe('/programs/ujat/regions')
  })

  it('maps nested routes to the closest menu key', () => {
    expect(resolveSidebarSelectedKey('/programs/general/enrollment', keys)).toBe('/programs/general')
    expect(resolveSidebarSelectedKey('/programs/general/', keys)).toBe('/programs/general')
    expect(resolveSidebarSelectedKey('/programs/company-school/12/edit', keys)).toBe(
      '/programs/company-school'
    )
    expect(resolveSidebarSelectedKey('/programs/ujat/regions/3', keys)).toBe('/programs/ujat/regions')
    expect(resolveSidebarSelectedKey('/programs/ujat/45', keys)).toBe('/programs/ujat')
    expect(resolveSidebarSelectedKey('/admin/posts/inquiries/7', keys)).toBe('/admin/posts/inquiries')
  })

  it('does not prefix-match sibling names or the root key', () => {
    expect(resolveSidebarSelectedKey('/programs/general-extra', keys)).toBe('/programs/general-extra')
    expect(resolveSidebarSelectedKey('/unknown/page', keys)).toBe('/unknown/page')
  })
})
