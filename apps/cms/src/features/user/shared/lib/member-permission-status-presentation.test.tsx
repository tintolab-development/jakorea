import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { User } from '@/types/user'
import { getMemberPermissionStatusPresentation, getMemberPermissionApprovalFilterOptions } from './member-permission-status-presentation'
import { MemberPermissionStatusText } from '../ui/member-permission-status-text'
import { normalizePermissionApprovalStatus, permissionApprovalStatusTextView, PermissionApprovalStatusWithResend } from '../../detail/ui/user-basic-info/status'

const user = (status: string, revoked = false) => ({ id: 'presentation-test-user', permissionApprovalStatus: status, instructorApprovalStatus: revoked ? 'REVOKED' : undefined }) as Omit<User, 'password'>
const render = (status: 'PENDING' | 'APPROVED' | 'REJECTED', revoked = false) => renderToStaticMarkup(createElement(MemberPermissionStatusText, { status, revoked }))

describe('member permission application presentation', () => {
  it.each([
    ['PENDING', '승인 대기', 'var(--color-green, #1e8c29)'],
    ['APPROVED', '승인 완료', 'var(--main-BK, #3d3d3d)'],
    ['REJECTED', '신청 반려', '#c32f4a'],
  ] as const)('preserves canonical %s text/accent in list/detail renderer', (status, label, accentColor) => {
    expect(getMemberPermissionStatusPresentation(status)).toEqual({ label, accentColor })
    expect(render(status)).toContain(label)
    expect(render(status)).toContain(`--status-accent:${accentColor}`)
    expect(renderToStaticMarkup(permissionApprovalStatusTextView(user(status)))).toContain(label)
  })
  it('preserves permission revoked as derived display rather than converting the approval raw value', () => {
    expect(render('APPROVED', true)).toContain('권한 종료')
    expect(render('APPROVED', true)).toContain('--status-accent:#c32f4a')
    const input = user('APPROVED', true)
    expect(renderToStaticMarkup(permissionApprovalStatusTextView(input))).toContain('권한 종료')
    expect(input.permissionApprovalStatus).toBe('APPROVED')
  })
  it.each(['unknown', '', undefined, null, '승인 대기'])('keeps existing detail unknown/null policy: %s', status => {
    expect(normalizePermissionApprovalStatus(status as User['permissionApprovalStatus'])).toBe('PENDING')
  })
  it('preserves filter values/order and allocates fresh options', () => {
    expect(getMemberPermissionApprovalFilterOptions()).toEqual([
      { label: '전체', value: 'ALL' }, { label: '승인 대기', value: 'PENDING' },
      { label: '승인 완료', value: 'APPROVED' }, { label: '신청 반려', value: 'REJECTED' },
    ])
    expect(getMemberPermissionApprovalFilterOptions()).not.toBe(getMemberPermissionApprovalFilterOptions())
  })
  it('keeps existing resend CTA conditions without sending any notification', () => {
    const callback = () => { throw new Error('Render must never notify') }
    const html = (status: string, role: 'admin' | 'instructor', revoked = false) => renderToStaticMarkup(createElement(PermissionApprovalStatusWithResend, { user: user(status, revoked), notifyPermissionRole: role, onPermissionResendNotification: callback }))
    expect(html('PENDING', 'instructor')).not.toContain('<button')
    expect(html('REJECTED', 'admin')).not.toContain('<button')
    expect(html('APPROVED', 'instructor', true)).not.toContain('<button')
    expect(html('REJECTED', 'instructor')).toContain('<button')
    expect(html('APPROVED', 'admin')).toContain('<button')
  })
  it('removes independent permission status color CSS and local filter labels', () => {
    const source = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
    for (const p of ['../../permission-management/members-permission-list.css', '../../detail/ui/user-basic-info-section.css']) {
      expect(source(p)).not.toMatch(/approval-status--(?:pending|approved|rejected)\s*\{/)
    }
    const list = source('../../permission-management/members-permission-list.tsx')
    expect(list).toContain('getMemberPermissionApprovalFilterOptions()')
    expect(list).toContain("status === 'APPROVED' || status === 'REJECTED' ? status : 'PENDING'")
  })
})
