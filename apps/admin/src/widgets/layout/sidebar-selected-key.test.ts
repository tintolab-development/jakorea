/** 실행: pnpm --dir apps/admin exec tsx --test src/widgets/layout/sidebar-selected-key.test.ts */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { collectMenuRouteKeys, resolveSidebarSelectedKey } from './sidebar-selected-key.ts'

const items = [
  { key: '/main/popups' },
  {
    key: 'ja-korea',
    children: [
      { key: '/ja-korea/notices' },
      { key: 'recruit', children: [{ key: '/ja-korea/recruit/postings' }, { key: '/ja-korea/recruit/guide' }] },
    ],
  },
  { key: 'impact', children: [{ key: '/impact/stories' }] },
  { key: '/participate' },
]
const keys = collectMenuRouteKeys(items)

test('경로형 키만 수집', () => {
  assert.deepEqual(keys, [
    '/main/popups',
    '/ja-korea/notices',
    '/ja-korea/recruit/postings',
    '/ja-korea/recruit/guide',
    '/impact/stories',
    '/participate',
  ])
})

test('정확 일치는 그대로 (끝 슬래시 정규화)', () => {
  assert.equal(resolveSidebarSelectedKey('/ja-korea/notices', keys), '/ja-korea/notices')
  assert.equal(resolveSidebarSelectedKey('/participate/', keys), '/participate')
})

test('상세 경로는 가장 가까운 메뉴 키', () => {
  assert.equal(resolveSidebarSelectedKey('/ja-korea/notices/1', keys), '/ja-korea/notices')
  assert.equal(resolveSidebarSelectedKey('/ja-korea/recruit/postings/12', keys), '/ja-korea/recruit/postings')
  assert.equal(resolveSidebarSelectedKey('/impact/stories/3/edit', keys), '/impact/stories')
})

test('형제 접두/루트/미등록 경로는 매칭하지 않음', () => {
  assert.equal(resolveSidebarSelectedKey('/ja-korea/notices-extra', keys), '/ja-korea/notices-extra')
  assert.equal(resolveSidebarSelectedKey('/unknown/1', [...keys, '/']), '/unknown/1')
})
