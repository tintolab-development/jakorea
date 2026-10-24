import { Buffer } from 'node:buffer'
import { expect, test } from '@playwright/test'
import {
  assertIsolatedNetwork,
  CS_ISOLATED_IDS,
  installCsIsolatedNetwork,
} from './install-cs-isolated-network'
import {
  completeAndCapture,
  createOverlay,
  fillInstitutionRecruitMedia,
  fillRegistrationThroughComplete,
  openCompanySchoolRecruitNav,
  openFreshWizard,
  VALUES_B,
} from './cs-isolated-helpers'

test.describe.configure({ mode: 'default' })

test.describe('CS-B06 미디어 업로드·바인딩 격리', () => {
  test('썸네일·첨부 업로드 후 CREATE programId에 바인딩되고 GET이 복원한다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page)
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await page.getByRole('button', { name: '모집 정보 돌아가기' }).click()
    await fillInstitutionRecruitMedia(page)
    await page.getByRole('button', { name: '신청 정보 작성하기' }).click()
    await completeAndCapture(page, log)
    assertIsolatedNetwork(log)

    expect(log.filePosts.length).toBeGreaterThan(0)
    expect(log.s3Puts.length).toBeGreaterThan(0)
    expect(log.fileConfirms.length).toBeGreaterThan(0)
    const firstFilePath = log.filePosts[0]?.path ?? ''
    const createIndex = log.mutations.findIndex(item => item.path === '/api/admin/programs')
    const firstFileIndex = log.mutations.findIndex(item => item.path.startsWith('/api/admin/files'))
    const thumbIndex = log.mutations.findIndex(item => item.path.endsWith('/thumbnail'))
    expect(firstFileIndex).toBeGreaterThanOrEqual(0)
    expect(createIndex).toBeGreaterThan(firstFileIndex)
    expect(thumbIndex).toBeGreaterThan(createIndex)
    expect(firstFilePath).toBe('/api/admin/files/upload-requests')

    const overlay = createOverlay(log)
    expect(JSON.stringify(log.createProgram?.body ?? {})).not.toContain('blob:')
    const thumbId = overlay['economyRecruit.detailInfo.thumbFileObjectId']
    const attachIds = overlay['economyRecruit.detailInfo.attachmentFileObjectIds']
    expect(typeof thumbId).toBe('number')
    expect(thumbId).toBeGreaterThan(0)
    expect(attachIds == null || Array.isArray(attachIds)).toBe(true)
    if (Array.isArray(attachIds)) {
      expect(attachIds.every(id => typeof id === 'number')).toBe(true)
    }

    const thumbBody = log.thumbnailPuts[0]?.body as { fileObjectId?: number }
    expect(log.thumbnailPuts[0]?.path).toBe(
      `/api/admin/programs/${CS_ISOLATED_IDS.PROGRAM_ID}/thumbnail`
    )
    expect(thumbBody.fileObjectId).toBe(thumbId)
    if (Array.isArray(attachIds) && attachIds.length > 0) {
      const attachBody = log.attachmentPuts[0]?.body as { fileObjectIds?: number[] }
      expect(attachBody.fileObjectIds).toEqual(attachIds)
    }

    await expect(page).toHaveURL(/programId=/, { timeout: 60_000 })
    await openCompanySchoolRecruitNav(page)
    await expect(page.getByText('cs-thumb.png').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(VALUES_B.title).first()).toBeVisible()
  })

  test('CREATE 실패 시 미디어 바인딩 PUT이 없다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page, { failMode: 'create' })
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await page.getByRole('button', { name: '모집 정보 돌아가기' }).click()
    await fillInstitutionRecruitMedia(page)
    await page.getByRole('button', { name: '신청 정보 작성하기' }).click()
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click()
    await expect.poll(() => log.createProgram, { timeout: 90_000 }).not.toBeNull()
    expect(log.thumbnailPuts).toHaveLength(0)
    expect(log.attachmentPuts).toHaveLength(0)
    expect(log.programDeletes).toHaveLength(0)
    assertIsolatedNetwork(log)
  })

  test('업로드 대기 중 CREATE가 나가지 않는다', async ({ page }) => {
    const log = await installCsIsolatedNetwork(page, { failMode: 'uploadSlow' })
    await openFreshWizard(page)
    await fillRegistrationThroughComplete(page)
    await page.getByRole('button', { name: '모집 정보 돌아가기' }).click()
    await page.getByRole('tab', { name: /참여 기관 모집|참여자 모집/ }).first().click().catch(() => undefined)
    const thumbRemove = page.locator('.thumbnail-upload-field').getByRole('button', { name: /삭제/ })
    if (await thumbRemove.first().isVisible().catch(() => false)) {
      await thumbRemove.first().click()
    }
    const thumb = page.locator('.thumbnail-upload-field input[type="file"]').first()
    await expect(thumb).toBeAttached({ timeout: 20_000 })
    await thumb.setInputFiles({
      name: 'cs-thumb-slow.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      ),
    })
    await page.getByRole('button', { name: '프로그램 등록 완료' }).click({ timeout: 5_000 }).catch(() => undefined)
    await page.waitForTimeout(1_500)
    expect(log.createProgram).toBeNull()
    expect(log.thumbnailPuts).toHaveLength(0)
    assertIsolatedNetwork(log)
  })
})
