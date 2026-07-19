import { type Locator, type Page, expect } from '@playwright/test'

/** Ant Design Select — placeholder가 있는 `.ant-select` 클릭 후 옵션 선택 */
export async function selectByPlaceholder(
  page: Page,
  placeholder: string,
  optionLabel?: string
) {
  await expect(async () => {
    const select = page
      .locator('.ant-select:visible')
      .filter({
        has: page.locator('.ant-select-selection-placeholder', { hasText: placeholder }),
      })
      .first()
    await expect(select).toBeVisible()
    await select.scrollIntoViewIfNeeded()
    await select.click({ force: true })

    const dropdown = page.locator('.ant-select-dropdown:visible').last()
    await expect(dropdown).toBeVisible({ timeout: 3_000 })

    const options = dropdown.locator(
      '.ant-select-item-option:not(.ant-select-item-option-disabled)'
    )
    await expect(options.first()).toBeVisible({ timeout: 5_000 })

    if (optionLabel) {
      const target = dropdown.locator('.ant-select-item-option-content', {
        hasText: optionLabel,
      })
      if ((await target.count()) > 0) {
        await target.first().scrollIntoViewIfNeeded().catch(() => undefined)
        await target.first().click()
        return
      }
    }

    const count = await options.count()
    for (let i = 0; i < count; i += 1) {
      const text = (await options.nth(i).innerText()).trim()
      if (text && text !== '전체') {
        await options.nth(i).click()
        return
      }
    }
    await options.first().click()
  }).toPass({ timeout: 30_000 })
}

/** 라벨 근처 Select (placeholder가 이미 값으로 바뀐 경우 대비) */
export async function selectNearLabel(page: Page, label: string, optionLabel?: string) {
  await expect(async () => {
    const field = page
      .locator('.detail-info-form__field')
      .filter({
        has: page.locator('.detail-info-form__field-label-text', {
          hasText: new RegExp(`^${escapeRegExp(label)}$`),
        }),
      })
      .first()
    await expect(field).toBeVisible()
    const select = field.locator('.ant-select').first()
    await expect(select).toBeVisible()
    await select.scrollIntoViewIfNeeded()
    await select.click({ force: true })

    const dropdown = page.locator('.ant-select-dropdown:visible').last()
    await expect(dropdown).toBeVisible({ timeout: 3_000 })
    const options = dropdown.locator(
      '.ant-select-item-option:not(.ant-select-item-option-disabled)'
    )
    await expect(options.first()).toBeVisible({ timeout: 5_000 })

    if (optionLabel) {
      const target = dropdown.locator('.ant-select-item-option-content', {
        hasText: optionLabel,
      })
      if ((await target.count()) > 0) {
        await target.first().click()
        return
      }
    }

    const count = await options.count()
    for (let i = 0; i < count; i += 1) {
      const text = (await options.nth(i).innerText()).trim()
      if (text && text !== '전체') {
        await options.nth(i).click()
        return
      }
    }
    await options.first().click()
  }).toPass({ timeout: 30_000 })
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 모달/패널 안에서 placeholder로 입력 */
export async function fillByPlaceholder(root: Page | Locator, placeholder: string, value: string) {
  await root.getByPlaceholder(placeholder).fill(value)
}
