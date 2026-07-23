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

async function getCmsMultiSelectedText(field: Locator): Promise<string> {
  const text = field.locator('.cms-select-multi__trigger-text').first()
  if ((await text.count()) === 0) return ''
  return (await text.innerText()).trim()
}

/** CmsSelect `mode="multiple"` — Popover + 체크박스 UI */
async function selectCmsMultiOnField(
  page: Page,
  field: Locator,
  optionLabel?: string
) {
  const trigger = field.locator('.cms-select-multi__trigger').first()
  await expect(trigger).toBeVisible({ timeout: 10_000 })

  const current = await getCmsMultiSelectedText(field)
  if (optionLabel) {
    if (current === optionLabel || current.includes(optionLabel)) return
  } else if (!isEmptySelectValue(current)) {
    return
  }

  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()

  const panel = page.locator('.cms-select-multi__panel').last()
  await expect(panel).toBeVisible({ timeout: 10_000 })

  const rows = panel.locator('.cms-select-multi__row')
  await expect(rows.first()).toBeVisible({ timeout: 10_000 })

  let row: Locator
  if (optionLabel) {
    const exact = rows.filter({
      has: page.locator('.cms-select-multi__label-pill', {
        hasText: new RegExp(`^${escapeRegExp(optionLabel)}$`),
      }),
    })
    row =
      (await exact.count()) > 0
        ? exact.first()
        : rows.filter({ hasText: optionLabel }).first()
  } else {
    row = rows.first()
    const count = await rows.count()
    for (let i = 0; i < count; i += 1) {
      const candidate = rows.nth(i)
      const checked = await candidate
        .locator('.ant-checkbox-checked')
        .count()
        .then(n => n > 0)
        .catch(() => false)
      if (checked) continue
      const text = (
        await candidate.locator('.cms-select-multi__label-pill').innerText()
      ).trim()
      if (text && !isEmptySelectValue(text)) {
        row = candidate
        break
      }
    }
  }

  await expect(row).toBeVisible({ timeout: 5_000 })
  const alreadyChecked = await row
    .locator('.ant-checkbox-checked')
    .count()
    .then(n => n > 0)
    .catch(() => false)
  if (!alreadyChecked) {
    await row.locator('.ant-checkbox-input, .cms-select-multi__checkbox').first().click()
  }

  // Popover 닫기 — Escape는 풀페이지 모달까지 닫을 수 있어 트리거 재클릭
  if (await panel.isVisible().catch(() => false)) {
    await trigger.click({ force: true }).catch(() => undefined)
  }

  await expect(async () => {
    const after = await getCmsMultiSelectedText(field)
    if (optionLabel) {
      expect(after === optionLabel || after.includes(optionLabel)).toBeTruthy()
    } else {
      expect(isEmptySelectValue(after)).toBeFalsy()
    }
  }).toPass({ timeout: 5_000 })
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

  const options = dropdown.locator(
    '.ant-select-item-option:not(.ant-select-item-option-disabled)'
  )
  const empty = dropdown.getByText(/No data|데이터 없음|검색 결과 없음/)
  await expect(async () => {
    if ((await options.count()) > 0) return
    if ((await empty.count()) > 0) {
      throw new Error('Select 드롭다운에 선택 가능한 옵션이 없습니다 (No data).')
    }
    throw new Error('Select 드롭다운 옵션 로딩 대기 중')
  }).toPass({ timeout: 10_000 })

  return dropdown
}

async function selectOnLocator(
  page: Page,
  select: Locator,
  optionLabel?: string,
  options?: { force?: boolean }
) {
  const force = options?.force === true
  const current = await getSelectSelectedText(select)
  if (!force) {
    if (optionLabel) {
      if (current === optionLabel || current.includes(optionLabel)) return
    } else if (!isEmptySelectValue(current)) {
      return
    }
  }

  // force: UI만 선택되어 있고 React state가 비는 경우 — 다른 옵션을 한 번 골라 onChange를 유발한 뒤 목표 선택
  if (force && !isEmptySelectValue(current)) {
    const dropdown = await openSelectDropdown(page, select)
    const optionNodes = dropdown.locator(
      '.ant-select-item-option:not(.ant-select-item-option-disabled)'
    )
    const count = await optionNodes.count()
    if (count >= 2) {
      let alternateIdx = -1
      for (let i = 0; i < count; i += 1) {
        const text = (await optionNodes.nth(i).innerText()).trim()
        if (!text || isEmptySelectValue(text)) continue
        if (text === current || current.includes(text) || text.includes(current)) continue
        alternateIdx = i
        break
      }
      if (alternateIdx >= 0) {
        await optionNodes.nth(alternateIdx).scrollIntoViewIfNeeded().catch(() => undefined)
        await optionNodes.nth(alternateIdx).click({ force: true })
        await expect(page.locator('.ant-select-dropdown:visible'))
          .toHaveCount(0, { timeout: 5_000 })
          .catch(() => undefined)
      }
    }
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

/** 라벨 근처 Select (placeholder가 이미 값으로 바뀐 경우 대비). CmsSelect multiple UI 포함. */
export async function selectNearLabel(
  page: Page,
  label: string,
  optionLabel?: string,
  options?: { force?: boolean }
) {
  await expect(async () => {
    const field = detailInfoField(page, label)
    await expect(field).toBeVisible()

    const multiTrigger = field.locator('.cms-select-multi__trigger').first()
    if ((await multiTrigger.count()) > 0 && (await multiTrigger.isVisible().catch(() => false))) {
      await selectCmsMultiOnField(page, field, optionLabel)
      return
    }

    const select = field.locator('.ant-select').first()
    await expect(select).toBeVisible()
    await selectOnLocator(page, select, optionLabel, options)

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
  // 후원사 연동 등 readOnly 자동입력 필드는 skip
  if (await input.evaluate(el => (el as HTMLInputElement).readOnly).catch(() => true)) return
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
    if (await input.evaluate(el => (el as HTMLInputElement).readOnly).catch(() => true)) continue
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

  // `날짜 선택` (ParagraphDatePicker) · `날짜·시간 선택` (DateTimePicker)
  const dialog = page.getByRole('dialog', { name: /날짜/ })
  await expect(dialog).toBeVisible({ timeout: 10_000 })

  const days = dialog.locator(
    '.ant-picker-cell-in-view:not(.ant-picker-cell-disabled) .calendar-mini-cell'
  )
  await expect(days.first()).toBeVisible({ timeout: 5_000 })
  const dayCount = await days.count()
  await days.nth(0).click({ force: true })
  if (mode === 'range' && dayCount > 1) {
    await days.nth(Math.min(4, dayCount - 1)).click({ force: true })
  }

  await dialog.getByRole('button', { name: '설정' }).click()
  await expect(dialog).toBeHidden({ timeout: 10_000 })
}

/** ParagraphTimePicker — placeholder 트리거 클릭 후 「설정」 */
export async function fillParagraphTimeIfVisible(
  page: Page,
  placeholder = '시간 선택'
) {
  const trigger = page
    .locator('.paragraph-time-picker__trigger:visible')
    .filter({ hasText: placeholder })
    .first()
  if ((await trigger.count()) === 0) return
  if (!(await trigger.isVisible().catch(() => false))) return

  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: '시간 설정' })
  await expect(dialog).toBeVisible({ timeout: 10_000 })
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

/** DetailInfoForm 필드 로케이터 (라벨 exact) */
export function detailInfoField(page: Page, label: string): Locator {
  return page
    .locator('.detail-info-form__field')
    .filter({
      has: page.locator('.detail-info-form__field-label-text', {
        hasText: new RegExp(`^${escapeRegExp(label)}$`),
      }),
    })
    .first()
}

/** 편집 중 Select 선택값 텍스트 (없으면 null). CmsSelect multiple 트리거 텍스트 포함. */
export async function readSelectTextNearLabel(page: Page, label: string): Promise<string | null> {
  const field = detailInfoField(page, label)
  if ((await field.count()) === 0) return null
  if (!(await field.isVisible().catch(() => false))) return null

  const multi = field.locator('.cms-select-multi__trigger-text').first()
  if ((await multi.count()) > 0) {
    const text = (await multi.innerText()).trim()
    return isEmptySelectValue(text) ? null : text
  }

  const text = await getSelectSelectedText(field.locator('.ant-select').first())
  return isEmptySelectValue(text) ? null : text
}

/** 편집 중 ParagraphDatePicker 트리거 표시 텍스트 */
export async function readDateTriggerNearLabel(page: Page, label: string): Promise<string | null> {
  const field = detailInfoField(page, label)
  if ((await field.count()) === 0) return null
  if (!(await field.isVisible().catch(() => false))) return null
  const trigger = field.locator('.paragraph-date-picker__trigger').first()
  if ((await trigger.count()) === 0) return null
  const text = (await trigger.innerText()).trim()
  return text.length > 0 ? text.replace(/\s+/g, ' ') : null
}

/**
 * 조회(view) 모드에서 라벨 옆 필드 내용이 expected를 포함하는지 확인.
 * 필드가 없거나 보이지 않으면 skip (시드/유형에 따라 섹션 생략 가능).
 */
export async function expectDetailInfoFieldContains(
  page: Page,
  label: string,
  expected: string | RegExp,
  options?: { required?: boolean; timeout?: number }
) {
  const field = detailInfoField(page, label)
  const required = options?.required ?? true
  const timeout = options?.timeout ?? 15_000

  if ((await field.count()) === 0 || !(await field.isVisible().catch(() => false))) {
    if (required) {
      throw new Error(`상세 필드 없음: "${label}"`)
    }
    return
  }

  const content = field.locator('.detail-info-form__field-content').first()
  await expect(content).toBeVisible({ timeout })

  if (typeof expected === 'string') {
    await expect(content).toContainText(expected, { timeout })
  } else {
    await expect(content).toContainText(expected, { timeout })
  }
}

