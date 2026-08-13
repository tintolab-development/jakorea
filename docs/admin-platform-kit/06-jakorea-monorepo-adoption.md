# 06 — JaKorea 모노레포에서 교차검증 문서를 쓰는 법

> 원문·실행 규약: [05 — 프론트엔드 아키텍처 · Cursor 교차검증](./05-frontend-architecture-cursor-crosscheck.md)  
> 기준일: 2026-08-06

05 문서는 **신규 CMS/Admin 솔루션**의 목표 아키텍처와 Cursor 교차검증 프로토콜이다.  
이 문서는 그 규약을 **지금 이 레포(`jakorea`)** 에 어떻게 대입할지 앱별로 고정한다.

---

## 1. 한 줄 결론

| 맥락 | 접근 |
|------|------|
| **신규 어드민 / 외부 솔루션** | 05 전량 적용. of record = `apps/admin` 셸 → L0 → 수직 슬라이스 → (반복 시) P2 |
| **Homepage Admin (`apps/admin`)** | 셸·목록 패턴은 이미 Kit of record. **갭 보완**(auth·FSD 규약 강화)만 05 기준으로 맞춤. 제품 feature는 Kit이 아님 |
| **CMS (`apps/cms`)** | **전면 리팩터 대상 아님**. 신규·리팩터 구간만 05 경계·import·UI SSOT를 따르고, JA 도메인은 유지 |
| **Platform (`apps/platform`)** | Admin Kit 대상 아님. 사용자 홈/회원 UI 규약 별도 |

**금지:** CMS 전체를 05 디렉터리로 마이그레이션하거나, `features/program|settlement|template` 를 신규 앱 시드로 복사.

---

## 2. 문서 계층 (누가 언제 읽나)

```text
요구사항·API 계약 (제품/BE)
        ↓
.cursor/rules/cms-admin-ui/*          UI 수치·필터·테이블
        ↓
docs/admin-platform-kit/01~04         경계·L0·슬라이스·패키지
        ↓
docs/admin-platform-kit/05            아키텍처 상세 + Cursor 교차검증
        ↓
docs/admin-platform-kit/06  (이 문서)  앱별 적용·갭·플레이북
        ↓
apps/admin | apps/cms 구현 of record
```

| 역할 | 필독 |
|------|------|
| 신규 앱 설계 | 01 → 02 → 05 §2~§10 → **06 §4** |
| Cursor 구현 | 05 §17·§18 + 이 문서 §5·§6 |
| CMS 기능 수정 | cms-admin-ui + CMS rules + **06 §3.1** (05 전 마이그레이션 금지) |
| Admin 기능 수정 | cms-admin-ui + admin rules + **06 §3.2** |
| 패키지 추출 논의 | 04 + 05 §20.4 + 06 §7 |

---

## 3. 앱별 갭 진단 (05 대비)

### 3.1 `apps/cms` — JA 제품 어드민 (규모 큼)

| 05 기준 | 현재 | 우리 태도 |
|---------|------|-----------|
| FSD 레이어 | `app/widgets/pages/features/entities/shared` + `data/mock` | **유지**. 새 코드만 FSD 방향 강화 |
| Kit / 도메인 분리 | 도메인이 Kit 위에 **강하게 실림** (의도) | 제품이므로 OK. Kit 추출 시 feature 제외 |
| Auth / RBAC 3중 | 존재 (`ProtectedRoute`, hooks, permissions) | 제품 policy 유지. **permissions 본문은 신규 앱에 복사 금지** |
| 목록 스택 | `useTablePage` / FilterTableLayout | UI 수치는 cms-admin-ui와 정렬. 훅 이름 통일은 **P2** |
| mock / `VITE_REAL_API_MODULES` | 광범위 사용 | **신규 Kit·신규 앱에 이식 금지**. CMS 내부는 점진 축소만 |
| Orval / OpenAPI | 일부 도입 | CMS 전용. Kit에 넣지 않음 |
| Cursor 교차검증 §17 | 전 리포 강제 아님 | **터치한 파일·새 feature**에 한해 §17 검색 적용 |

**CMS에서 05를 쓰는 방식**

```text
✅ 새 목록 CRUD / 공통 ui 수정
   → 05 §10~§13 + cms-admin-ui + FSD import

✅ shared/ui 버그 수정
   → admin과 수치 어긋남 있으면 cms-admin-ui SSOT 확인, admin 동기 여부 검토

❌ CMS 디렉터리 전체를 05 트리로 재배치
❌ program 유형 폴더를 “재사용 Kit”으로 승격
❌ 전역 mock 제거 big-bang (별도 마이그레이션)
```

**관련 유지 룰 (CMS 전용, Kit와 별개):**

- `program-type-isolation` — 프로그램 유형 간섭 방지  
- Notion CMS 기능정의서 — 스펙 SSOT  
- `data/mock` — 제품 개발 부채 (신규 솔루션 비권장)

---

### 3.2 `apps/admin` — L0 of record (홈페이지 콘텐츠 어드민)

| 05 기준 | 현재 | 갭 |
|---------|------|-----|
| 셸 providers | Theme/Query/Error/Alert ✅ | AuthProvider **없음** (mock GNB) |
| Layout LNB/GNB | ✅ | 알림 mock 허용 |
| `shared/ui` Cms* | ✅ of record | — |
| list filter URL | `useListFilterUrl` ✅ | 일부 콘텐츠 화면은 정렬 DnD 중심 (필터 없는 목록 OK) |
| FSD features/* | hero-banner 등 CRUD 패턴 ✅ | 제품 도메인(홈페이지) — **Kit 복사 시 제외** |
| ROUTE_PATHS SSOT | 메뉴+router 분리 약함 | 신규 feature부터 path 상수 권장 |
| 페이지 lazy | 대부분 static import | 규모 커지면 lazy 도입 |
| Auth 3중 | 미구현 | 로그인 요구 전까지 N/A; 도입 시 05 §8 |

**Admin of record에서 복사해도 되는 것**

```text
app/providers (auth 제외)
widgets/layout
shared/ui/**
shared/lib/use-list-filter-url, use-table-search, query-client
shared/instance/axios-instance
shared/constants (filter·table·modal-z)
menu-config.tsx 의 “형태”만 (본문은 신규 메뉴로 교체)
```

**복사하면 안 되는 것**

```text
features/*  (hero-banner, ja-korea-*, popup, …)
entities/*  (위 feature 대응)
pages/main/**, pages/ja-korea/**
홈페이지 전용 package (dnd-kit은 배너 요구 없으면 제외)
```

Admin 기능 개발 시: 05 교차검증은 **변경한 feature/page**에 적용. Kit 문서 위반을 “이미 있는 홈페이지 feature 전 마이그레이션” 이유로 삼지 않는다.

---

### 3.3 `apps/platform`

| 앱 | 05 적용 |
|-----|---------|
| platform | **적용 대상 아님** (사용자 홈). UI 토큰·폼 런타임만 일부 공유 가능 |

신규 백오피스는 admin 셸 기반 `apps/<name>`으로 추가한다.

---

### 3.4 `packages/*`

| 패키지 | 05에서의 위치 |
|--------|----------------|
| form-schema / form-template-runtime / rich-text / location / identity / social-auth | **Kit 선택(opt-in)** |
| utils | Kit 최소 dep |
| ui (`@jakorea/ui`) | 디자인 시스템 본체 아님. **admin-ui 승격과 혼동 금지** |
| domain | JA 교육 enum — 신규 일반 솔루션 기본 제외 |

P2 승격 대상은 아직 **없음**. 게이트는 [04](./04-package-promotion-scope.md).

---

## 4. 시나리오별 플레이북

### 4.1 시나리오 A — monorepo 안 신규 어드민 `apps/<name>`

```text
1. 01 워크시트: 요구 = Kit필수 / 선택 / 신규 / JA전용 분류
2. 02 체크리스트: admin 셸 복사 → 홈페이지 feature·entity·pages 삭제
3. menu 2~3 + Home + Placeholder, validate 통과
4. auth 필요 시 CMS features/auth 골격 파일 단위 이식 (정책 테이블 제외)
5. 05 §10 + 03: 리소스 1개 수직 슬라이스
6. 매 PR: 05 §17 정적 검색 + validate + §19 보고서
7. 확장 게이트: 둘째 feature ≤1일
```

**Cursor 프롬프트:** 05 §18.1 그대로, `apps/<name>` 기입.

### 4.2 시나리오 B — monorepo 밖 고객 납품

```text
1. 시나리오 A와 동일 트리; git history 없이 admin 셸 + docs 복사
2. workspace packages는 필요 시만 publish/path 연결
3. JA Notion/프로그램 룰 · CMS mock 미포함
4. 05 문서를 고객 repo docs/ 로 이관 (경로 조정)
```

### 4.3 시나리오 C — 기존 CMS 화면 개선

```text
1. 프로그램 유형이면 program-type-isolation 먼저
2. UI 수치·필터·버튼 large → cms-admin-ui
3. 새 service/hooks 추가 시 05 §9~§10 패턴 (DTO/query-key/invalidate)
4. shared/ui 수정 시 admin 동기화 필요 여부 판단
5. §17 중 import 역전·page axios·table CSS override만 필수 검색
6. mock 제거는 해당 모듈 real-API 준비 시에만 점진
```

### 4.4 시나리오 D — 기존 Admin 화면 개선

```text
1. 홈페이지 스펙(Notion·feature) 우선
2. 목록·모달·버튼 → cms-admin-ui + admin adapter rules
3. feature 추가 패턴: hero-banner = 03/05 슬라이스 참고 구현
4. 로그인 도입 시점 → 05 §8 일괄 (partial 금지: 버튼만 숨김 금지)
```

### 4.5 시나리오 E — “CMS를 솔루션으로 팔고 싶다”

```text
❌ CMS 클론 후 메뉴 삭제
✅ 시나리오 A로 빈 앱 → 고객 도메인 feature만 재구현
✅ CMS는 레퍼런스 데모 + shared 패턴 창고로만 사용
✅ 정산/프로그램이 고객 요구면 05 L2(동일 산업) 검토 — 기본 제외
```

---

## 5. 이 레포에서 돌리는 교차검증 (실전)

### 5.1 대상별 APP 변수

```bash
# 신규 / 검증 앱
export APP=apps/<name>

# of record 점검 시
export APP=apps/admin

# CMS는 터치 범위 한정 권장 (전 트리 0건 기대 불가)
export APP=apps/cms
```

### 5.2 신규·admin — 05 §17 전부

05 §17.3 명령을 `$APP` 에 실행. 기대:

| 검사 | 신규 앱 | admin | cms 전트리 |
|------|---------|-------|------------|
| CMS path import | 0 | 0 | N/A |
| program/settlement/template 폴더 | 0 (미승인 시) | 0 | **존재 허용** (제품) |
| VITE_REAL_API_MODULES / data/mock | 0 | 0 권장 | **존재 허용** |
| shared → features import | 0 | 0 | 0 목표 |
| page axios 직접 호출 | 0 | 0 목표 | 터치 파일 0 |
| silent catch | 0 | 0 목표 | 터치 파일 0 |

### 5.3 CMS 터치 시 축소 검색

```bash
# 예: 이번에 수정한 feature만
rg -n "from '@/pages/|from '@/widgets/|from '@/app/" \
  apps/cms/src/features/<touch> apps/cms/src/shared

rg -n "axios\.|api\.(get|post)" apps/cms/src/pages/<touch-page>

rg -n "(th|td).*\{|!important" apps/cms/src/pages -g "*.css"
```

전역 mock 0건을 CMS DoD로 두지 않는다.

### 5.4 빌드 게이트

```bash
pnpm --filter admin validate    # typecheck+lint+build
pnpm --filter cms typecheck     # 스크립트에 맞게
pnpm --filter <name> validate
```

---

## 6. Cursor 작업 루틴 (JaKorea 고정)

### 6.1 변경 전 필수 분류 (05 §17.2)

에이전트/개발자는 코드 전 한 블록 출력:

```text
[작업 분류] Kit 필수 | Kit 선택 | 신규 도메인 | JA 전용 | CMS 제품 유지
[대상 앱] cms | admin | apps/<name> | packages/*
[SSOT] 05 + cms-admin-ui + (CMS면 program-type-isolation / Notion)
[복사 허용] admin shared/ui… | 불가: cms features/*
```

`JA 전용` 이고 대상이 `apps/<name>` 이면 **구현 중단** → 재구현 계획만.

### 6.2 권장 프롬프트 접두 (복붙)

```text
docs/admin-platform-kit/05-frontend-architecture-cursor-crosscheck.md
docs/admin-platform-kit/06-jakorea-monorepo-adoption.md
.cursor/rules/cms-admin-ui/**

대상 앱: apps/<…>
시나리오: A(신규) | C(CMS) | D(Admin)  (06 §4)
앱 간 import 금지. CMS feature 통째 복사 금지.
변경 전 작업 분류·파일 계획을 출력한 뒤 구현.
구현 후 대상 앱 validate + 06 §5 검색을 요약.
```

### 6.3 리뷰 우선순위 (05 §18.2 + monorepo)

| 등급 | 항목 |
|------|------|
| P0 | 보안·권한, admin→cms import, 빌드 실패, 데이터 손실 |
| P1 | FSD 역전, query key/invalidate, URL filter 불일치, program 유형 간섭(CMS) |
| P2 | UI 수치, 공통화, 테스트, lazy loading |

---

## 7. 로드맵 (이 레포 기준)

| Phase | 지금 상태 | 다음 액션 |
|-------|-----------|-----------|
| **P0 문서** | 01~06 존재 | 신규 요구 시 01 워크시트 작성 |
| **L0 starter** | of record = admin, 생성기 없음 | 첫 `apps/<name>` 파일럿 또는 template 폴더 |
| **P1 슬라이스** | admin hero-banner 가 CRUD 참고 구현 | 신규 앱 또는 admin 로그인 도입 시 05 §10 DoD |
| **CMS 정렬** | mock/real 이중 경로 잔존 | 모듈 단위 real API 전환만; Kit 문서와 분리 |
| **P2 패키지** | 게이트 미충족 | admin-ui 승격은 앱 ≥2 + 중복 diff 후 (04) |

### 우선 과제 제안 (실행 순서)

1. **신규 파일럿이 있으면** → 시나리오 A 즉시 (문서만 있고 앱 없으면 Kit 검증 불가)  
2. **파일럿 없으면** → admin에 auth 도입 계획을 잡을 때만 05 §8 정렬  
3. **CMS** → 신규 목록 화면만 05 §10 패턴을 “기본 템플릿”으로 팀 공유  
4. **shared/ui 이중 관리** → 중복 패치 누적 시 04 게이트로 P2 논의  

---

## 8. ADR / 예외

05 §22 ADR 템플릿을 사용한다. 이 레포에서 ADR이 필요한 예:

| 상황 | 예 |
|------|-----|
| CMS mock 매트릭스를 신규 앱에 쓴다 | **원칙 위반** — ADR로도 권장하지 않음. 재설계 |
| admin 로그인 없이 production | 보안 ADR + BE 네트워크 격리 전제 |
| list filter를 URL이 아닌 store SSOT | 05 위반 → ADR + 만료 조건 |
| CMS shared를 admin이 path import | **금지** — 패키지 또는 복사 |

예외 PR에는 05 §19 `예외·만료 조건` 필수.

---

## 9. 의사결정 요약 (이 레포)

| 질문 | 답 |
|------|-----|
| 05를 지금 전 앱에 강제하나? | **신규 앱·신규 슬라이스에 강제**. CMS 전체 리라이트 아님 |
| 솔루션 시드는? | `apps/admin` 셸, **아닌** `apps/cms` |
| CMS의 가치는? | 도메인 제품 + shared 패턴 참고 + UI SSOT 공동 진화 |
| Cursor 교차검증은? | 신규/admin 변경: §17 풀. CMS: 터치 범위 축소 |
| 언제 패키지화? | 04 게이트 2개 이상 + 05 §20.4 |
| platform 포함? | 아니오 |

---

## 10. 빠른 체크리스트 (착수 1페이지)

```text
[ ] 대상 앱 확정 (cms / admin / apps/<name>)
[ ] 시나리오 A~E 중 선택 (§4)
[ ] 01 분류 완료 (JA 전용이면 복사 계획)
[ ] of record 경로 확인 (admin shared vs cms feature)
[ ] cms-admin-ui 관련 rule 링크
[ ] API 계약 또는 feature fixture 범위
[ ] 구현 → validate → §5 검색 → §19 보고
[ ] 둘째 feature 확장 ≤1일 여부
```

**완료 정의 (솔루션):** 고객 도메인 feature를 추가할 때 layout/`shared/ui` 를 건드리지 않고, 05 교차검증을 Pass 한 상태.

**Last updated:** 2026-08-06
