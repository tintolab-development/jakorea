import { type Locator, type Page, expect } from '@playwright/test'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isEmptySelectValue(text: string) {
  return (
    !text ||
    text === '전체' ||
    text === '해당 없음' ||
    text.includes('선택하세요') ||
    text.includes('선택해 주세요')
  )
}

async function getSelectSelectedText(select: Locator): Promise<string> {
  const item = select.locator('.ant-select-selection-item').first()
  if ((await item.count()) === 0) return ''
  return (await item.innerText()).trim()
}

async function isSelectOpen(select: Locator): Promise<boolean> {
  return select.evaluate(el => el.classList.contains('ant-select-open')).catch(() => false)
}

/** 열린 Ant Select 드롭다운에서 옵션 클릭 (가상 스크롤·비가시 옵션 대응) */
async function clickSelectOption(dropdown: Locator, optionLabel?: string) {
  const options = dropdown.locator(
    '.ant-select-item-option:not(.ant-select-item-option-disabled)'
  )
  await expect(options.first()).toBeAttached({ timeout: 10_000 })

  let option: Locator
  if (optionLabel) {
    const exact = options.filter({ hasText: new RegExp(`^${escapeRegExp(optionLabel)}$`) })
    option = (await exact.count()) > 0 ? exact.first() : options.filter({ hasText: optionLabel }).first()
  } else {
    option = options.first()
    const count = await options.count()
    for (let i = 0; i < count; i += 1) {
      const text = (await options.nth(i).innerText()).trim()
      if (text && !isEmptySelectValue(text)) {
        option = options.nth(i)
        break
      }
    }
  }

  await expect(option).toBeAttached({ timeout: 5_000 })
  await option.scrollIntoViewIfNeeded().catch(() => undefined)
  // rc-virtual-list 등으로 Playwright visible 체크가 실패할 수 있어 force 클릭
  await option.click({ force: true })
}

/**
 * Ant Select 드롭다운 열기.
 * Escape는 풀페이지 등록 모달까지 닫을 수 있어 사용하지 않는다.
 * 다른 Select 드롭다운이 열린 경우 한 번만 클릭해야 한다(두 번 클릭하면 방금 연 목록을 다시 닫음).
 */
async function openSelectDropdown(page: Page, select: Locator) {
  await select.scrollIntoViewIfNeeded()

  if (await isSelectOpen(select)) {
    const dropdown = page.locator('.ant-select-dropdown:visible').last()
    await expect(dropdown).toBeVisible({ timeout: 5_000 })
    return dropdown
  }

  // 다른 Select 드롭다운이 열려 있으면 이 Select를 한 번 클릭해 전환한다.
  await select.click({ force: true })

  if (!(await isSelectOpen(select))) {
    await select.click({ force: true })
  }

  const dropdown = page.locator('.ant-select-dropdown:visible').last()
  await expect(dropdown).toBeVisible({ timeout: 5_000 })
  await expect(
    dropdown.locator('.ant-select-item-option:not(.ant-select-item-option-disabled)').first()
  ).toBeAttached({ timeout: 10_000 })
  return dropdown
}

async function selectOnLocator(
  page: Page,
  select: Locator,
  optionLabel?: string
) {
  const current = await getSelectSelectedText(select)
  if (optionLabel) {
    if (current === optionLabel || current.includes(optionLabel)) return
  } else if (!isEmptySelectValue(current)) {
    return
  }

  const dropdown = await openSelectDropdown(page, select)
  await clickSelectOption(dropdown, optionLabel)

  // placeholder 기반 Locator는 선택 후 DOM이 바뀌어 무효화될 수 있으므로
  // 드롭다운 닫힘 + (옵션 지정 시) 선택값 노출로만 성공을 판정한다.
  await expect(page.locator('.ant-select-dropdown:visible'))
    .toHaveCount(0, { timeout: 5_000 })
    .catch(() => undefined)

  if (optionLabel) {
    await expect(
      page
        .locator('.ant-select-selection-item', {
          hasText: new RegExp(escapeRegExp(optionLabel)),
        })
        .first()
    ).toBeVisible({ timeout: 5_000 })
  }
}

/** Ant Design Select — placeholder가 있는 `.ant-select` 클릭 후 옵션 선택 */
export async function selectByPlaceholder(
  page: Page,
  placeholder: string,
  optionLabel?: string
) {
  await expect(async () => {
    const byPlaceholder = page
      .locator('.ant-select:visible')
      .filter({
        has: page.locator('.ant-select-selection-placeholder', { hasText: placeholder }),
      })
      .first()

    if ((await byPlaceholder.count()) > 0 && (await byPlaceholder.isVisible().catch(() => false))) {
      await selectOnLocator(page, byPlaceholder, optionLabel)
      return
    }

    // placeholder가 사라짐 = 이미 값이 선택된 상태
    if (!optionLabel) return

    const alreadyMatched = page
      .locator('.ant-select:visible')
      .filter({
        has: page.locator('.ant-select-selection-item', {
          hasText: new RegExp(escapeRegExp(optionLabel)),
        }),
      })
      .first()
    if (
      (await alreadyMatched.count()) > 0 &&
      (await alreadyMatched.isVisible().catch(() => false))
    ) {
      return
    }

    throw new Error(`Select placeholder를 찾을 수 없습니다: ${placeholder}`)
  }).toPass({ timeout: 30_000 })
}

/** placeholder Select가 보일 때만 선택 (없으면 skip) */
export async function selectByPlaceholderIfVisible(
  page: Page,
  placeholder: string,
  optionLabel?: string
) {
  const select = page
    .locator('.ant-select:visible')
    .filter({
      has: page.locator('.ant-select-selection-placeholder', { hasText: placeholder }),
    })
    .first()
  if ((await select.count()) === 0) return
  if (!(await select.isVisible().catch(() => false))) return
  await selectByPlaceholder(page, placeholder, optionLabel)
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
    await selectOnLocator(page, select, optionLabel)

    // 필드 기준 Locator는 선택 후에도 안정적 — 실제 값 반영을 확인
    await expect(async () => {
      const after = await getSelectSelectedText(field.locator('.ant-select').first())
      if (optionLabel) {
        expect(after === optionLabel || after.includes(optionLabel)).toBeTruthy()
      } else {
        expect(isEmptySelectValue(after)).toBeFalsy()
      }
    }).toPass({ timeout: 5_000 })
  }).toPass({ timeout: 30_000 })
}

export async function selectNearLabelIfVisible(
  page: Page,
  label: string,
  optionLabel?: string
) {
  const field = page
    .locator('.detail-info-form__field')
    .filter({
      has: page.locator('.detail-info-form__field-label-text', {
        hasText: new RegExp(`^${escapeRegExp(label)}$`),
      }),
    })
    .first()
  if ((await field.count()) === 0) return
  if (!(await field.isVisible().catch(() => false))) return
  await selectNearLabel(page, label, optionLabel)
}

/** 모달/패널 안에서 placeholder로 입력 */
export async function fillByPlaceholder(root: Page | Locator, placeholder: string, value: string) {
  await root.getByPlaceholder(placeholder).fill(value)
}

/** placeholder 입력이 보일 때만 채움 */
export async function fillByPlaceholderIfVisible(
  root: Page | Locator,
  placeholder: string,
  value: string
) {
  const input = root.getByPlaceholder(placeholder).first()
  if ((await input.count()) === 0) return
  if (!(await input.isVisible().catch(() => false))) return
  if (await input.isDisabled().catch(() => true)) return
  await input.fill(value)
}

/** 동일 placeholder를 가진 보이는 입력란을 모두 채움 (KPI·강사비 등) */
export async function fillAllByPlaceholder(
  page: Page,
  placeholder: string,
  value: string
) {
  const inputs = page.getByPlaceholder(placeholder)
  const count = await inputs.count()
  for (let i = 0; i < count; i += 1) {
    const input = inputs.nth(i)
    if (!(await input.isVisible().catch(() => false))) continue
    if (await input.isDisabled().catch(() => true)) continue
    await input.fill(value)
  }
}

/** 라디오 라벨 클릭 (보일 때만) */
export async function checkRadioIfVisible(page: Page, label: string | RegExp) {
  const radio = page.getByRole('radio', { name: label }).first()
  if ((await radio.count()) === 0) return
  if (!(await radio.isVisible().catch(() => false))) return
  await radio.check({ force: true })
}

/** 체크박스 라벨 체크 (보일 때만) */
export async function checkCheckboxIfVisible(page: Page, label: string | RegExp) {
  const checkbox = page.getByRole('checkbox', { name: label }).first()
  if ((await checkbox.count()) === 0) return
  if (!(await checkbox.isVisible().catch(() => false))) return
  if (await checkbox.isChecked().catch(() => false)) return
  await checkbox.check({ force: true })
}

/**
 * ParagraphDatePicker — placeholder 트리거 클릭 후 캘린더에서 날짜 선택·설정.
 * `range`: 시작·종료 2일, `single`: 1일.
 */
export async function fillParagraphDateByPlaceholder(
  page: Page,
  placeholder: string,
  mode: 'single' | 'range' = 'range'
) {
  const trigger = page
    .locator('.paragraph-date-picker__trigger:visible')
    .filter({ hasText: placeholder })
    .first()
  if ((await trigger.count()) === 0) return
  if (!(await trigger.isVisible().catch(() => false))) return

  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: '날짜 선택' })
  await expect(dialog).toBeVisible({ timeout: 10_000 })

  const days = dialog.locator(
    '.ant-picker-cell-in-view:not(.ant-picker-cell-disabled) .calendar-mini-cell'
  )
  await expect(days.first()).toBeVisible({ timeout: 5_000 })
  const dayCount = await days.count()
  await days.nth(0).click()
  if (mode === 'range' && dayCount > 1) {
    await days.nth(Math.min(4, dayCount - 1)).click()
  }

  await dialog.getByRole('button', { name: '설정' }).click()
  await expect(dialog).toBeHidden({ timeout: 10_000 })
}

/** 보이는 동일 placeholder 날짜 피커를 모두 채움 */
export async function fillAllParagraphDatesByPlaceholder(
  page: Page,
  placeholder: string,
  mode: 'single' | 'range' = 'range'
) {
  const triggers = page
    .locator('.paragraph-date-picker__trigger:visible')
    .filter({ hasText: placeholder })
  const count = await triggers.count()
  for (let i = 0; i < count; i += 1) {
    // 매번 첫 번째 남은 placeholder 트리거를 채움 (설정 후 텍스트가 바뀜)
    await fillParagraphDateByPlaceholder(page, placeholder, mode)
  }
}

/** 등록 LNB / 우측 네비 섹션 클릭 */
export async function clickSectionNavIfVisible(page: Page, label: string) {
  const nav = page.getByText(label, { exact: true }).first()
  if (!(await nav.isVisible().catch(() => false))) return
  await nav.click()
}

/** CmsTextTabs 탭 클릭 */
export async function clickRegistrationTabIfVisible(page: Page, label: string) {
  const tab = page.getByRole('tab', { name: label }).first()
  if ((await tab.count()) === 0) {
    const button = page.getByRole('button', { name: label }).first()
    if ((await button.count()) === 0) return
    if (!(await button.isVisible().catch(() => false))) return
    await button.click()
    return
  }
  if (!(await tab.isVisible().catch(() => false))) return
  await tab.click()
}

/** 보이는 textarea / contenteditable 채움 */
export async function fillVisibleFreeTextFields(page: Page, prefix: string) {
  const textareas = page.locator('textarea:visible')
  const taCount = await textareas.count()
  for (let i = 0; i < taCount; i += 1) {
    const el = textareas.nth(i)
    if (await el.isDisabled().catch(() => true)) continue
    await el.fill(`${prefix} ${i + 1}`)
  }

  const editors = page.locator(
    '.ProseMirror[contenteditable="true"]:visible, [contenteditable="true"]:visible'
  )
  const edCount = await editors.count()
  for (let i = 0; i < edCount; i += 1) {
    const el = editors.nth(i)
    await el.click({ force: true }).catch(() => undefined)
    await el.fill(`${prefix} 본문 ${i + 1}`).catch(async () => {
      await page.keyboard.type(`${prefix} 본문 ${i + 1}`)
    })
  }
}

/** 1x1 PNG 업로드 (보일 때) */
export async function uploadTinyPngIfPresent(page: Page) {
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  const inputs = page.locator('input[type="file"]:not([disabled])')
  const count = await inputs.count()
  for (let i = 0; i < count; i += 1) {
    const input = inputs.nth(i)
    await input
      .setInputFiles({
        name: `e2e-upload-${i + 1}.png`,
        mimeType: 'image/png',
        buffer: Buffer.from(pngBase64, 'base64'),
      })
      .catch(() => undefined)
  }
}
