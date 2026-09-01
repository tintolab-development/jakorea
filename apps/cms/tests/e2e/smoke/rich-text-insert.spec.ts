import { test, expect } from '../fixtures/test'

test.describe('Rich text insert menu', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('inserts link, image, youtube, quote, table, and divider', async ({ page }) => {
    await page.goto('/design-system#editor')
    const demo = page.locator('.ds-editor-demo').first()
    await expect(demo.getByRole('button', { name: '삽입' })).toBeVisible()
    await demo.locator('.rich-text-content').click()

    page.once('dialog', dialog => dialog.accept('https://jakorea.test/inserted'))
    await demo.getByRole('button', { name: '삽입' }).click()
    await page.getByRole('menuitem', { name: '링크' }).click()
    await expect(
      demo.locator('.rich-text-content a[href="https://jakorea.test/inserted"]')
    ).toHaveCount(1)

    page.once('dialog', dialog => dialog.accept('https://jakorea.test/photo.png'))
    await demo.getByRole('button', { name: '삽입' }).click()
    await page.getByRole('menuitem', { name: '이미지 (URL)' }).click()
    await expect(demo.locator('.rich-text-content img[src="https://jakorea.test/photo.png"]')).toHaveCount(1)

    page.once('dialog', dialog => dialog.accept('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
    await demo.getByRole('button', { name: '삽입' }).click()
    await page.getByRole('menuitem', { name: 'YouTube 동영상' }).click()
    await expect(demo.locator('.rich-text-content iframe.rich-text-content__youtube')).toHaveCount(1)

    await demo.getByRole('button', { name: '삽입' }).click()
    await page.getByRole('menuitem', { name: '인용' }).click()

    await demo.getByRole('button', { name: '표' }).click()
    await expect(demo.locator('.rich-text-content table')).toHaveCount(1)

    await demo.getByRole('button', { name: '구분선' }).click()
    await expect(demo.locator('.rich-text-content hr')).toHaveCount(1)
  })
})
