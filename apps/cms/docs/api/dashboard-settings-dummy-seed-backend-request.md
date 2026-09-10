# 대시보드 설정 더미 시드 요청 (BE)

CMS **대시보드 홈 → 대시보드 설정** 모달·바로가기 위젯을 FE mock과 동일하게 검증할 수 있도록, 바로가기 카탈로그 **27건** + 로컬 데모 관리자 preferences 1건(역할당)을 시드합니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-09-10 (목록·기본값 갱신) |
| **대상 화면** | 대시보드 홈 `/` → 「대시보드 설정」 |
| **조회 API** | `GET /api/admin/me/dashboard-preferences` · `GET /api/admin/dashboard/shortcuts` |
| **저장 API** | `PUT /api/admin/me/dashboard-preferences` |
| **모듈 플래그** | `VITE_REAL_API_MODULES=...,dashboard` |
| **FE SSOT** | [`dashboard-settings-store.ts`](../../src/features/dashboard/model/dashboard-settings-store.ts) `SHORTCUT_ITEMS` · [`dashboard-config.ts`](../../src/shared/config/dashboard-config.ts) `getProgramScheduleKindsForAdminUser` (MASTER=4유형) |
| **BE 복붙 페이로드** | [`dashboard-settings-seed.payload.json`](./dashboard-settings-seed.payload.json) |

OpenAPI에 bulk create POST가 없습니다. local profile Flyway / `LocalDemoSeedRunner`로 insert 해 주세요.

---

## 0. 가능한가?

가능합니다. 설정은 목록 행이 아니라 **관리자별 1건**입니다.

- 카탈로그: `dashboard_shortcut` (바로가기 마스터, `use_yn=true` **27건**. 메일 발송 이력은 기획 제외. 로그인 이력·권한 설정 등은 **카탈로그에 포함**하되 FE `settingsDisabled`로 체크 불가)
- 개인화: `dashboard_user_shortcut` / `shortcutVisibility` (아래 기본값 — **전부 true가 아님**)
- 레이아웃: `dashboard_widget_layout` (아래 8위젯, `width_size=24`)
- 프로그램 필터: **행 없음** = FE mock `widgetProgramIds: {}` = 전체 선택
- envelope: `dashboard_user_preference` (`schema_version=1`, `revision=1`)

`GET /api/admin/me/dashboard-preferences` 응답이 payload의 `layout` + `settings` 와 같으면 됩니다.

---

## 1. FE mock 기본값 (시드 목표)

| 필드 | mock 기본 |
|------|-----------|
| `assignedProgramTypes` | MASTER `["general","company_school","ujat","gemini"]`. 비마스터는 담당 유형만 |
| `shortcutVisibility` | `SHORTCUT_ITEMS` 27개 id — payload JSON의 boolean 그대로 (기본 체크 13개 on) |
| `widgetProgramFilters` | `{}` (빈 배열 = 해당 위젯 전체 프로그램) |
| `inquiryRowRead` | `{}` |
| `layout.orderedWidgetIds` | 바로가기 → 일반/1사1교/UJAT/Gemini 일정 → 모집 → 문의 → KPI |
| `layout.widgetWidths` | 전부 `24` (100% 폭) |

MASTER는 담당 유형이 전체이므로 일정 위젯 4종을 기본 레이아웃에 넣습니다 (`getProgramScheduleKindsForAdminUser`). 카카오 알림톡·메일 발송 이력은 기획 보류라 카탈로그에 넣지 않습니다.

### 기본 ON (`true`)

`programs-general-education`, `programs-economy`, `users-all`, `users-school`, `users-instructor`, `settlement-payment-orders`, `template-management`, `notices`, `faq`, `inquiries`, `sponsors`, `notification-messages`, `performance`

### 기본 OFF (`false`) — 토글 가능

`programs-ujat`, `programs-gemini`, `users-admin`, `permission-requests`, `settlement-account-payments`, `settlement-item-settings`, `textbooks`, `programs-detail`

### 설정 disabled (체크 불가, 항상 OFF, 위젯 미노출)

FE `settingsDisabled: true`. 카탈로그 `useYn`은 **true**로 두어 설정 모달에 회색 체크로 보이게 합니다. (`useYn=false`면 목록에서 사라져 시안과 불일치)

| shortcutKey | 라벨 |
|-------------|------|
| `admin-permission-settings` | 관리자 권한 설정 |
| `program-permission-settings` | 프로그램 권한 설정 *(신규)* |
| `member-login-history` | 회원 로그인 이력 *(카탈로그 재포함)* |
| `file-download-history` | 파일 다운로드 이력 |
| `privacy-query-history` | 개인정보 조회 이력 |
| `bug-issue-history` | 버그/이슈 이력 |

---

## 2. 카탈로그 갭 (현재 BE vs mock) — **서버 수정 필요**

| 변경 | shortcutKey | 내용 |
|------|-------------|------|
| **추가** | `program-permission-settings` | 프로그램 권한 설정 → `/admin/settings/program-permissions` (`useYn=true`) |
| **추가** | `notification-messages` | 알림 메시지 관리 → `/admin/notifications/kakao-alimtalk` |
| **재포함** | `member-login-history` | 회원 로그인 이력 → `/logs/member-login-history` (`useYn=true`, 설정 disabled) |
| **라벨** | `users-school` | `학교(교사) 회원 관리` → `학교(교사) 회원` |
| **라벨** | `template-management` | `폼 양식 관리` → `템플릿 관리` |
| **라벨** | `inquiries` | `문의내역` → `문의사항` |
| **기본값** | `shortcutVisibility` | 전부 `true` → payload의 ON/OFF 맵으로 교체 |
| **신규 계정 시드** | 데모/신규 관리자 | 위 visibility 기본값 적용 (기존 유저는 migration 정책 별도) |

`GET /api/admin/dashboard/shortcuts` 는 설정 모달·위젯 메타용으로 `use_yn=true` 27건을 반환합니다.  
**체크 불가(disabled)** 는 OpenAPI에 전용 필드가 없으면 FE가 `SHORTCUT_ITEMS.settingsDisabled`로 처리합니다. BE가 `permissionAllowed=false` 등으로 내려줘도 현재 FE는 사용하지 않습니다.

PUT 시 FE는 disabled 키를 항상 `false`로 normalize 해 보냅니다. BE도 disabled 키를 `true`로 저장하지 않도록 가드하면 더 안전합니다(권장, 필수 아님).

---

## 3. 검증

1. 로컬 데모 MASTER 로그인 후 `GET /api/admin/dashboard/shortcuts` → **27건**, 신규 3키(`program-permission-settings`, `notification-messages`, `member-login-history`) 포함.
2. `GET /api/admin/me/dashboard-preferences` → `shortcutVisibility`가 payload와 동일(기본 ON 13 / OFF·disabled 나머지).
3. CMS `/` 「대시보드 설정」: 바로가기 27개 + 전체 선택, disabled 6개 회색·체크 불가, 위젯에는 기본 ON만 노출.
