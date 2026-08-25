# 대시보드 설정 더미 시드 요청 (BE)

CMS **대시보드 홈 → 대시보드 설정** 모달·바로가기 위젯을 FE mock과 동일하게 검증할 수 있도록, 바로가기 카탈로그 25건 + 로컬 데모 관리자 preferences 1건(역할당)을 시드합니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-25 |
| **대상 화면** | 대시보드 홈 `/` → 「대시보드 설정」 |
| **조회 API** | `GET /api/admin/me/dashboard-preferences` · `GET /api/admin/dashboard/shortcuts` |
| **저장 API** | `PUT /api/admin/me/dashboard-preferences` |
| **모듈 플래그** | `VITE_REAL_API_MODULES=...,dashboard` |
| **FE SSOT** | [`dashboard-settings-store.ts`](../../src/features/dashboard/model/dashboard-settings-store.ts) `SHORTCUT_ITEMS` · [`dashboard-config.ts`](../../src/shared/config/dashboard-config.ts) `buildAdminDashboardWidgets(['general'])` |
| **BE 복붙 페이로드** | [`dashboard-settings-seed.payload.json`](./dashboard-settings-seed.payload.json) |

OpenAPI에 bulk create POST가 없습니다. local profile Flyway / `LocalDemoSeedRunner`로 insert 해 주세요.

---

## 0. 가능한가?

가능합니다. 설정은 목록 행이 아니라 **관리자별 1건**입니다.

- 카탈로그: `dashboard_shortcut` (바로가기 마스터, `use_yn=true` 25건)
- 개인화: `dashboard_user_shortcut` (전부 `is_visible=true`)
- 레이아웃: `dashboard_widget_layout` (아래 5위젯, `width_size=24`)
- 프로그램 필터: **행 없음** = FE mock `widgetProgramIds: {}` = 전체 선택
- envelope: `dashboard_user_preference` (`schema_version=1`, `revision=1`)

`GET /api/admin/me/dashboard-preferences` 응답이 payload의 `layout` + `settings` 와 같으면 됩니다.

---

## 1. FE mock 기본값 (시드 목표)

| 필드 | mock 기본 |
|------|-----------|
| `shortcutVisibility` | `SHORTCUT_ITEMS` 25개 id 전부 `true` |
| `widgetProgramFilters` | `{}` (빈 배열 = 해당 위젯 전체 프로그램) |
| `inquiryRowRead` | `{}` |
| `layout.orderedWidgetIds` | 바로가기 → 일반 일정 → 모집 → 문의 → KPI |
| `layout.widgetWidths` | 전부 `24` (100% 폭) |

MASTER ACL 기준 일정 위젯은 **일반만** 노출합니다 (`getProgramScheduleKindsForAdminUser`). 1사1교·UJAT·Gemini 일정 위젯 마스터 행은 카탈로그에 두되, 기본 레이아웃에는 넣지 않습니다.

---

## 2. 카탈로그 갭 (현재 BE vs mock)

V42는 아래 4건을 mock과 다르게 둡니다. **use_yn=true** 로 맞추고 라벨·path를 FE와 동일하게 하세요.

| id | shortcutKey | mock 라벨 | mock path |
|----|-------------|-----------|-----------|
| 162925 | `member-login-history` | 회원 로그인 이력 | `/logs/member-login-history` |
| 162922 | `file-download-history` | 파일 다운로드 이력 | `/logs/file-download-history` |
| 162923 | `privacy-query-history` | 개인정보 조회 이력 | `/logs/personal-info-access-history` |
| 162924 | `bug-issue-history` | 버그/이슈 이력 | `/logs/bug-issue-history` |

`GET /api/admin/dashboard/shortcuts` 는 `use_yn=true` 만 반환합니다. 비활성 행은 설정 모달·바로가기 위젯에서 빠집니다.

---

## 3. 검증

1. 로컬 데모 MASTER 로그인 후 `GET /api/admin/dashboard/shortcuts` → 25건, 로그 이력 4건 포함.
2. `GET /api/admin/me/dashboard-preferences` → `shortcutVisibility` 25키 전부 true, `widgetProgramFilters` 빈 객체(또는 키 없음).
3. CMS `/` 「대시보드 설정」: 바로가기 25개 + 전체 선택, 위젯별 프로그램 아코디언이 잘리지 않고 스크롤된다.
