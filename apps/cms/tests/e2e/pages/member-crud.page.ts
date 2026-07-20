import { type Locator, type Page, expect } from '@playwright/test'
import { fillByPlaceholder, selectByPlaceholder } from './form-helpers'

const MEMBER_NAME_PREFIX = '틴토랩'

/** 회원 목록 LNB 카테고리 (회원 권한 관리 제외) */
export type MemberListCrudKind = 'all' | 'institutions' | 'instructors' | 'admins'

type KindUi = {
  menuLabel: string
  kindQuery: MemberListCrudKind
  listTitle: string
  searchPlaceholder: string
  createButton: string
  createModalTitle: string
  createSubmitButton: string
  detailHeading: RegExp
  nameEditLabel: string
  deleteButton: string
  deleteGuideTitle: string
  deleteConfirmButton: string
  deleteDoneTitle: string
}

const KIND_UI: Record<MemberListCrudKind, KindUi> = {
  all: {
    menuLabel: '전체 회원',
    kindQuery: 'all',
    listTitle: '전체 회원 목록',
    searchPlaceholder: '회원명을 입력하세요',
    createButton: '회원 등록',
    createModalTitle: '회원 신규 등록',
    createSubmitButton: '신규 등록',
    detailHeading: /회원 상세/,
    nameEditLabel: '한글 성명',
    deleteButton: '회원 삭제',
    deleteGuideTitle: '회원 삭제 안내',
    deleteConfirmButton: '회원 삭제',
    deleteDoneTitle: '회원 삭제 완료',
  },
  institutions: {
    menuLabel: '학교(교사) 회원',
    kindQuery: 'institutions',
    listTitle: '학교(교사) 회원 목록',
    searchPlaceholder: '기관명을 입력하세요',
    createButton: '학교 등록',
    createModalTitle: '학교 신규 등록',
    createSubmitButton: '신규 등록',
    detailHeading: /학교 상세/,
    nameEditLabel: '기관명',
    deleteButton: '학교 삭제',
    deleteGuideTitle: '학교 삭제 안내',
    deleteConfirmButton: '학교 삭제',
    deleteDoneTitle: '학교 삭제 완료',
  },
  instructors: {
    menuLabel: '강사 회원',
    kindQuery: 'instructors',
    listTitle: '강사 회원 목록',
    searchPlaceholder: '강사명을 입력하세요',
    createButton: '강사 등록',
    createModalTitle: '강사 추가 등록',
    createSubmitButton: '추가 등록',
    detailHeading: /강사 상세/,
    nameEditLabel: '한글 성명',
    deleteButton: '강사 삭제',
    deleteGuideTitle: '강사 삭제 안내',
    deleteConfirmButton: '강사 삭제',
    deleteDoneTitle: '강사 삭제 완료',
  },
  admins: {
    menuLabel: '관리자 회원',
    kindQuery: 'admins',
    listTitle: '관리자 회원 목록',
    searchPlaceholder: '관리자명을 입력하세요',
    createButton: '관리자 등록',
    createModalTitle: '관리자 신규 등록',
    createSubmitButton: '신규 등록',
    detailHeading: /관리자 상세/,
    nameEditLabel: '한글 성명',
    // 목록 버튼은 «관리자 삭제», 확인 모달은 회원 도메인 카피 재사용
    deleteButton: '관리자 삭제',
    deleteGuideTitle: '회원 삭제 안내',
    deleteConfirmButton: '회원 삭제',
    deleteDoneTitle: '회원 삭제 완료',
  },
}

/**
 * 회원 관리 → 회원 목록 → kind별 CRUD
 * 표시명: 틴토랩-*
 *
 * 목록 이름은 마스킹되므로, 조회 후 **건수(총 N건)** 와 행 존재로 검증합니다.
 * (회원 권한 관리 카테고리는 대상 아님)
 */
type MemberListCrudIdentity = {
  memberName: string
  memberNameUpdated: string
  englishName: string
  email: string
  phone: string
  birthDate: string
}

export class MemberListCrudPage {
  readonly kind: MemberListCrudKind
  readonly ui: KindUi
  readonly memberName: string
  readonly memberNameUpdated: string
  readonly englishName: string
  readonly email: string
  readonly phone: string
  readonly birthDate: string

  constructor(
    private readonly page: Page,
    kind: MemberListCrudKind = 'all',
    identity?: MemberListCrudIdentity
  ) {
    this.kind = kind
    this.ui = KIND_UI[kind]
    if (identity) {
      this.memberName = identity.memberName
      this.memberNameUpdated = identity.memberNameUpdated
      this.englishName = identity.englishName
      this.email = identity.email
      this.phone = identity.phone
      this.birthDate = identity.birthDate
      return
    }
    const stamp = Date.now()
    this.memberName = `${MEMBER_NAME_PREFIX}-${stamp}`
    this.memberNameUpdated = `${MEMBER_NAME_PREFIX}-수정-${stamp}`
    this.englishName = `Tintolab ${stamp}`
    this.email = `tintolab.e2e.${kind}.${stamp}@jakorea.test`
    this.phone = '01012345678'
    this.birthDate = '19900101'
  }

  /** 동일 식별자로 다른 kind 목록에서 이어서 CRUD (pre-register role 미전달 폴백) */
  asKind(kind: MemberListCrudKind) {
    return new MemberListCrudPage(this.page, kind, {
      memberName: this.memberName,
      memberNameUpdated: this.memberNameUpdated,
      englishName: this.englishName,
      email: this.email,
      phone: this.phone,
      birthDate: this.birthDate,
    })
  }

  private detailDialog() {
    return this.page
      .getByRole('dialog')
      .filter({ has: this.page.getByRole('heading', { name: this.ui.detailHeading }) })
  }

  /** 오버레이 모달이 없어야 목록 조회 가능 */
  private async expectNoBlockingModal() {
    await expect(this.detailDialog()).toBeHidden({ timeout: 15_000 })
    await expect(this.page.locator('.ant-modal-wrap:visible')).toHaveCount(0, {
      timeout: 15_000,
    })
  }

  private async waitCreateOk() {
    const createResponsePromise = this.page.waitForResponse(
      res => {
        if (res.request().method() !== 'POST') return false
        const pathname = new URL(res.url()).pathname
        if (this.kind === 'admins') {
          return /\/api\/admin\/admin-accounts\/?$/.test(pathname)
        }
        return /\/api\/admin\/users\/pre-register\/?$/.test(pathname)
      },
      { timeout: 60_000 }
    )
    return createResponsePromise
  }

  private async assertCreateOk(
    createResponse: Awaited<ReturnType<Page['waitForResponse']>>,
    label: string
  ) {
    if (!createResponse.ok()) {
      const body = await createResponse.text().catch(() => '')
      throw new Error(
        `${label} 등록 API 실패: HTTP ${createResponse.status()} ${body.slice(0, 400)}`
      )
    }
  }

  /** LNB: 회원 관리 → 회원 목록 → kind */
  async goViaMenu() {
    const membersMenu = this.page.getByRole('menuitem', { name: '회원 관리' })
    await expect(membersMenu).toBeVisible()
    if ((await membersMenu.getAttribute('aria-expanded')) !== 'true') {
      await membersMenu.click()
    }

    const listGroup = this.page.getByRole('menuitem', { name: '회원 목록' })
    await expect(listGroup).toBeVisible()
    if ((await listGroup.getAttribute('aria-expanded')) !== 'true') {
      await listGroup.click()
    }

    await this.page.getByRole('menuitem', { name: this.ui.menuLabel }).click()
    await expect(this.page).toHaveURL(
      new RegExp(`/users/list\\?.*kind=${this.ui.kindQuery}`)
    )
    await expect(this.page.getByText(this.ui.listTitle)).toBeVisible({ timeout: 30_000 })
    await expect(this.page.getByRole('button', { name: this.ui.createButton })).toBeVisible()
  }

  /** @deprecated use goViaMenu — 전체 회원 전용 별칭 */
  async goToAllMembersViaMenu() {
    await this.goViaMenu()
  }

  async openCreateModal() {
    await this.page.getByRole('button', { name: this.ui.createButton }).click()
    const dialog = this.page.getByRole('dialog').filter({ hasText: this.ui.createModalTitle })
    await expect(dialog).toBeVisible()
    return dialog
  }

  /**
   * 학교 등록 — 도로명 주소.
   * 행안부 JUSO 키가 없거나 검색이 실패하면 Ant Form 에 직접 주입합니다.
   */
  private async fillSchoolRoadAddress(registerDialog: Locator) {
    const fallbackAddress = '서울특별시 강서구 마곡중앙로 171'

    await registerDialog.getByPlaceholder('건물명, 도로명 또는 지번').click()
    const addressModal = this.page.getByRole('dialog').filter({ hasText: '주소 검색' })
    await expect(addressModal).toBeVisible({ timeout: 15_000 })
    await addressModal
      .getByPlaceholder('예) 마곡중앙로 171, 분당 주공, 백현동')
      .fill('마곡중앙로 171')
    await addressModal.getByRole('button', { name: '검색' }).click()

    const firstResult = addressModal
      .getByLabel('주소 검색 결과')
      .locator('.address-search__result-card-body')
      .first()
    const searchFailed = addressModal.getByText('주소 검색에 실패했습니다.')
    const noResults = addressModal.getByText('검색 결과가 없습니다.')

    try {
      await expect(firstResult.or(searchFailed).or(noResults)).toBeVisible({ timeout: 15_000 })
      if (await firstResult.isVisible().catch(() => false)) {
        await firstResult.click()
        await expect(addressModal).toBeHidden({ timeout: 15_000 })
        return
      }
    } catch {
      /* fall through — Form 직접 주입 */
    }

    await addressModal.getByRole('button', { name: '닫기' }).click().catch(async () => {
      await this.page.keyboard.press('Escape')
    })
    await expect(addressModal).toBeHidden({ timeout: 15_000 })
    await this.injectSchoolRoadAddress(fallbackAddress)
  }

  /** Ant Design Form.setFieldsValue 로 소속 학교명 주입 (NEIS 키/검색 실패 폴백) */
  private async injectAffiliationSchoolName(schoolName: string) {
    await this.page.evaluate(name => {
      const formEl = document.getElementById('cms-member-register-modal-form')
      if (!formEl) throw new Error('회원 등록 폼을 찾지 못했습니다.')

      type Fiber = {
        memoizedProps?: { form?: { setFieldsValue?: (v: Record<string, unknown>) => void } }
        pendingProps?: { form?: { setFieldsValue?: (v: Record<string, unknown>) => void } }
        return?: Fiber | null
      }

      const fiberKey = Object.keys(formEl).find(k => k.startsWith('__reactFiber$'))
      if (!fiberKey) throw new Error('React fiber 를 찾지 못했습니다.')

      let fiber = (formEl as unknown as Record<string, Fiber>)[fiberKey] as Fiber | null
      for (let i = 0; i < 50 && fiber; i += 1) {
        const formInst =
          fiber.memoizedProps?.form ?? fiber.pendingProps?.form
        if (formInst && typeof formInst.setFieldsValue === 'function') {
          formInst.setFieldsValue({ schoolName: name })
          return
        }
        fiber = fiber.return ?? null
      }
      throw new Error('Ant Form 인스턴스를 찾지 못했습니다.')
    }, schoolName)

    await expect(
      this.page
        .getByRole('dialog')
        .filter({ hasText: '회원 신규 등록' })
        .locator(`input[value="${schoolName.replace(/"/g, '\\"')}"]`)
        .first()
    ).toBeVisible({ timeout: 5_000 })
  }

  /**
   * 전체 회원 등록 — 소속 학교명.
   * NEIS 키가 없거나 검색이 실패하면 Ant Form 에 직접 주입합니다.
   */
  private async fillAffiliationSchoolName(registerDialog: Locator) {
    const fallbackSchoolName = '서울초등학교'

    await registerDialog.getByPlaceholder('소속 학교명').click()
    const schoolModal = this.page.getByRole('dialog').filter({ hasText: '학교 검색' })
    await expect(schoolModal).toBeVisible({ timeout: 15_000 })

    await selectByPlaceholder(this.page, '시/도', '서울특별시')
    await schoolModal.getByPlaceholder('학교명을 입력해 주세요').fill('초등학교')
    await schoolModal.getByRole('button', { name: '검색' }).click()

    const firstSelectButton = schoolModal
      .getByLabel('학교 검색 결과')
      .getByRole('button', { name: '선택' })
      .first()
    const searchFailed = schoolModal.getByText(/NEIS API 키가 설정되지 않았습니다/)
    const noResults = schoolModal.getByText('검색 결과가 없습니다.')

    try {
      await expect(firstSelectButton.or(searchFailed).or(noResults)).toBeVisible({
        timeout: 15_000,
      })
      if (await firstSelectButton.isVisible().catch(() => false)) {
        await firstSelectButton.click()
        await expect(schoolModal).toBeHidden({ timeout: 15_000 })
        return
      }
    } catch {
      /* fall through — Form 직접 주입 */
    }

    await schoolModal.getByRole('button', { name: '닫기' }).click().catch(async () => {
      await this.page.keyboard.press('Escape')
    })
    await expect(schoolModal).toBeHidden({ timeout: 15_000 })
    await this.injectAffiliationSchoolName(fallbackSchoolName)
  }

  /** Ant Design Form.setFieldsValue 로 도로명 주소 주입 (JUSO 키/검색 실패 폴백) */
  private async injectSchoolRoadAddress(address: string) {
    await this.page.evaluate(addr => {
      const formEl = document.getElementById('cms-school-register-modal-form')
      if (!formEl) throw new Error('학교 등록 폼을 찾지 못했습니다.')

      type Fiber = {
        memoizedProps?: { form?: { setFieldsValue?: (v: Record<string, unknown>) => void } }
        pendingProps?: { form?: { setFieldsValue?: (v: Record<string, unknown>) => void } }
        return?: Fiber | null
      }

      const fiberKey = Object.keys(formEl).find(k => k.startsWith('__reactFiber$'))
      if (!fiberKey) throw new Error('React fiber 를 찾지 못했습니다.')

      let fiber = (formEl as unknown as Record<string, Fiber>)[fiberKey] as Fiber | null
      for (let i = 0; i < 50 && fiber; i += 1) {
        const formInst =
          fiber.memoizedProps?.form ?? fiber.pendingProps?.form
        if (formInst && typeof formInst.setFieldsValue === 'function') {
          formInst.setFieldsValue({ roadAddress: addr })
          return
        }
        fiber = fiber.return ?? null
      }
      throw new Error('Ant Form 인스턴스를 찾지 못했습니다.')
    }, address)

    await expect(
      this.page
        .getByRole('dialog')
        .filter({ hasText: '학교 신규 등록' })
        .locator(`input[value="${address.replace(/"/g, '\\"')}"]`)
        .first()
    ).toBeVisible({ timeout: 5_000 })
  }

  /** Create — kind별 필수 필드 입력 후 등록 (실 API) */
  async createMember() {
    const dialog = await this.openCreateModal()
    const createResponsePromise = this.waitCreateOk()

    if (this.kind === 'all') {
      await fillByPlaceholder(dialog, '성명', this.memberName)
      await fillByPlaceholder(dialog, '생년월일 8자리', this.birthDate)
      await this.fillAffiliationSchoolName(dialog)
      await dialog.getByText('학년').click()
      await dialog.getByText('1학년').click()
      await fillByPlaceholder(dialog, '연락처', this.phone)
      await fillByPlaceholder(dialog, '이메일', this.email)
      await fillByPlaceholder(dialog, '건물명, 도로명 또는 지번', '서울특별시 강서구 마곡중앙로 171')
    } else if (this.kind === 'institutions') {
      await fillByPlaceholder(dialog, '기관명', this.memberName)
      await this.fillSchoolRoadAddress(dialog)
      await fillByPlaceholder(dialog, '상세 주소', 'E2E 테스트')
    } else if (this.kind === 'instructors') {
      await fillByPlaceholder(dialog, '한글 성명', this.memberName)
      await fillByPlaceholder(dialog, '영문 성명', this.englishName)
      await fillByPlaceholder(dialog, '이메일', this.email)
    } else {
      await fillByPlaceholder(dialog, '한글 성명', this.memberName)
      await fillByPlaceholder(dialog, '생년월일 8자리', this.birthDate)
      await fillByPlaceholder(dialog, '연락처', this.phone)
      await fillByPlaceholder(dialog, '이메일', this.email)
    }

    await dialog.getByRole('button', { name: this.ui.createSubmitButton }).click()

    const createResponse = await createResponsePromise
    await this.assertCreateOk(createResponse, this.ui.menuLabel)
    await expect(dialog).toBeHidden({ timeout: 30_000 })
  }

  /** 이름 필터 + 조회 */
  async searchByMemberName(name: string) {
    await this.expectNoBlockingModal()
    await this.page.getByPlaceholder(this.ui.searchPlaceholder).fill(name)
    await this.page.getByRole('button', { name: '조회' }).click()
    await this.page
      .waitForResponse(
        res =>
          res.request().method() === 'GET' &&
          /\/api\/admin\/users/.test(new URL(res.url()).pathname) &&
          res.ok(),
        { timeout: 30_000 }
      )
      .catch(() => undefined)
  }

  firstDataRow() {
    return this.page.locator('tbody.ant-table-tbody tr.ant-table-row').first()
  }

  async expectMemberInList(name: string) {
    await this.searchByMemberName(name)
    await expect(async () => {
      await expect(this.page.getByText('총 1건')).toBeVisible()
      await expect(this.firstDataRow()).toBeVisible()
    }).toPass({ timeout: 30_000 })
  }

  /**
   * kind 목록에 노출되는지 짧게 확인.
   * pre-register 가 role 을 보내지 않아 학교·강사·관리자 탭에 안 뜨는 경우를 감지합니다.
   */
  async tryFindMemberInList(name: string, timeoutMs = 12_000): Promise<boolean> {
    await this.searchByMemberName(name)
    try {
      await expect(async () => {
        await expect(this.page.getByText('총 1건')).toBeVisible()
        await expect(this.firstDataRow()).toBeVisible()
      }).toPass({ timeout: timeoutMs })
      return true
    } catch {
      return false
    }
  }

  async expectMemberNotInList(name: string) {
    await this.searchByMemberName(name)
    await expect(async () => {
      await expect(this.page.getByText('총 0건')).toBeVisible()
    }).toPass({ timeout: 30_000 })
  }

  /** Read — 검색 후 첫 행 클릭 → 상세 */
  async openMemberDetail(name: string) {
    await this.expectMemberInList(name)
    await this.firstDataRow().click()
    await expect(this.detailDialog()).toBeVisible({ timeout: 30_000 })
    await expect(this.page.getByRole('button', { name: '정보 수정' })).toBeVisible()
  }

  /** Update — 정보 수정 → 표시명 변경 → 저장 */
  async updateMemberName() {
    await this.page.getByRole('button', { name: '정보 수정' }).click()
    const nameInput = this.page.getByLabel(this.ui.nameEditLabel)
    await expect(nameInput).toBeVisible()
    await nameInput.fill(this.memberNameUpdated)

    const patchPromise = this.page.waitForResponse(
      res =>
        res.request().method() === 'PATCH' &&
        /\/api\/admin\/users\/[^/]+\/?$/.test(new URL(res.url()).pathname),
      { timeout: 60_000 }
    )

    await this.page.getByRole('button', { name: '저장' }).click()
    const patchResponse = await patchPromise
    if (!patchResponse.ok()) {
      const body = await patchResponse.text().catch(() => '')
      throw new Error(
        `회원 수정 API 실패: HTTP ${patchResponse.status()} ${body.slice(0, 400)}`
      )
    }

    await expect(this.page.getByRole('button', { name: '정보 수정' })).toBeVisible({
      timeout: 30_000,
    })
  }

  async closeDetail() {
    await this.detailDialog().getByRole('button', { name: '닫기' }).click()
    await expect(this.detailDialog()).toBeHidden({ timeout: 30_000 })
    await expect(this.page.getByRole('button', { name: this.ui.createButton })).toBeVisible()
  }

  /**
   * Delete — 목록에서 체크 후 삭제
   * (상세 탈퇴보다 모달 스택이 단순해 E2E에 안정적)
   */
  async deleteMemberFromList(name: string) {
    await this.expectMemberInList(name)
    const row = this.firstDataRow()
    await row.locator('input.ant-checkbox-input').check({ force: true })

    await this.page.getByRole('button', { name: this.ui.deleteButton }).click()
    const guide = this.page.getByRole('dialog').filter({ hasText: this.ui.deleteGuideTitle })
    await expect(guide).toBeVisible()
    await guide
      .getByPlaceholder('삭제하시려면 해당란에 [삭제]를 입력해 주세요.')
      .fill('삭제')

    const deletePromise = this.page.waitForResponse(
      res =>
        res.request().method() === 'POST' &&
        /\/api\/admin\/users\/[^/]+\/delete\/?$/.test(new URL(res.url()).pathname),
      { timeout: 60_000 }
    )

    await guide.getByRole('button', { name: this.ui.deleteConfirmButton }).click()
    const deleteResponse = await deletePromise
    if (!deleteResponse.ok()) {
      const body = await deleteResponse.text().catch(() => '')
      throw new Error(
        `회원 삭제 API 실패: HTTP ${deleteResponse.status()} ${body.slice(0, 400)}`
      )
    }

    const done = this.page.getByRole('dialog').filter({ hasText: this.ui.deleteDoneTitle })
    await expect(done).toBeVisible({ timeout: 30_000 })
    await done.getByRole('button', { name: '확인' }).click()
    await expect(done).toBeHidden({ timeout: 15_000 })
    await this.expectNoBlockingModal()
  }
}

/** 전체 회원 CRUD — 기존 스펙 호환 */
export class MemberCrudPage extends MemberListCrudPage {
  constructor(page: Page) {
    super(page, 'all')
  }
}
