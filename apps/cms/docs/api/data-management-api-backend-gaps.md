# 데이터 관리 — 백엔드 갭 요청

CMS LNB **데이터 관리** 3화면(후원사·교재·세부 프로그램)의 OpenAPI v9 대조 결과입니다.  
프론트 연동 명세: [data-management-api-integration.md](./data-management-api-integration.md)  
더미 시드: [data-management-dummy-seed-backend-request.md](./data-management-dummy-seed-backend-request.md)

**작성일**: 2026-08-24 · **갱신**: 2026-08-26  
**OpenAPI**: `apps/cms/openapi/data-management.openapi.json`

프론트는 목록 CRUD를 이미 호출합니다. 아래는 **스펙에 없는 API**, **있는 API의 계약 구멍**, **확인만 필요한 항목**입니다.

이력 삭제(P0)는 [cms-table-bulk-delete-api-backend-handoff.md](./cms-table-bulk-delete-api-backend-handoff.md) §4 #18과 동일 건입니다. **이 문서를 SSOT**로 봐 주세요.

---

## 전환 phase 체크리스트 (BE 핸드오프)

| Phase | BE 작업 | FE 후속 |
|-------|---------|---------|
| **B-0** | — | ✅ 성능(placeholderData·Spin·kit 지연 등) |
| **B-1** | 후원사 목록 **Page** (`page`/`size`/`total`) | 페이지네이션 UI |
| **B-2** | 목록 **누적 후원금·수혜자** 컬럼 | adapter |
| **B-3** | 교재·세부 `total` 신뢰 + size 정책(50/100) | FE size 축소 |
| **B-4** | 본 문서 A/B 잔여(이력 삭제·export·키트 규칙 등) | 순차 연동 |
| **B-5** | options/matches 안정화 | 프로그램 폼 mock→API (별 PR) |

로컬 데모 데이터: [시드 요청](./data-management-dummy-seed-backend-request.md) (mock SSOT, upsert·중복 방지).

---

## Notion 기획(노란) ↔ gap 매핑

FE는 2026-08-26 Notion 정렬에서 **API로 가능한 UI만** 맞췄습니다. 아래는 기획 노란/취소선 잔여와 본 문서 gap ID 대응입니다.

| 화면 | Notion 항목 | 조치 | Gap / 비고 |
|------|-------------|------|------------|
| 후원사 목록 | 누적 후원금·수혜자 컬럼 | BE 대기 | **P1** / **B-2** |
| 후원사 목록 | 후원 상태 논의중·휴면 | 기획 확정 후 | **B§1** enum |
| 후원사 목록 | 주 담당자 연락처 | ~~취소~~ FE **제거 완료** | — |
| 후원사 상세 | 홈페이지·로고·비고·로고 일괄 DL | BE 대기 | **P2** |
| 후원사 상세 | 소재지 시군구 분리 | FE는 AddressSearch+상세 단일 유지 | 잔여 UX (요청 우선순위 낮음) |
| 후원사 이력 | 총 수혜자 컬럼 | BE 대기 | DTO 확장 필요 (P1급) |
| 후원사 이력 | 이력 삭제 | BE 대기 | **P0** |
| 후원사 이력 | ~~참여자 모집 인원~~ | FE **제거 완료** | — |
| 교재 | 사업 분야 관리 CRUD | ✅ FE 연동 완료 | — |
| 교재·후원사 | 서버 엑셀 export | BE 대기 | **P2** |
| 공통 | 목록 Page(후원사) | BE 대기 | **P1** / **B-1** |

---

## 현재 OpenAPI vs FE

### 후원사 (`/sponsor`)

| Method | Path | FE |
|--------|------|----|
| GET/POST | `/api/admin/sponsors` | 목록·등록 — 배선됨 |
| GET/PATCH/DELETE | `/api/admin/sponsors/{sponsorId}` | 상세·수정·단건 삭제 — 배선됨 |
| POST | `/api/admin/sponsors/bulk-delete` | 목록 일괄 삭제 — FE 배선 |
| POST | `/api/admin/sponsors/{sponsorId}/end` | 후원 종료 — 배선됨 |
| GET/POST | `/api/admin/sponsors/{sponsorId}/contacts` | 담당자 — 배선됨 |
| PATCH/DELETE | `/api/admin/sponsors/contacts/{contactId}` | 담당자 — 배선됨 |
| POST | `/api/admin/sponsors/contacts/bulk-delete` | 담당자 일괄 삭제 — FE 배선 |
| GET | `/api/admin/sponsors/{sponsorId}/program-histories` | 프로그램 진행 이력 목록 — 배선됨 |
| GET/POST | `/api/admin/sponsors/{sponsorId}/yearly-businesses` | 연도별 후원금 — FE 상세 패널 배선 |
| PATCH/DELETE | `/api/admin/sponsors/yearly-businesses/{yearlyBusinessId}` | 연도별 후원금 수정·삭제 — PATCH 배선 |

### 교재 (`/textbook`)

| Method | Path | FE |
|--------|------|----|
| GET/POST | `/api/admin/textbooks` | 목록·등록 — 배선됨 |
| GET/PATCH/DELETE | `/api/admin/textbooks/{textbookId}` | 상세·수정·단건 삭제 — 배선됨 |
| POST | `/api/admin/textbooks/bulk-delete` | 목록 일괄 삭제 — FE 배선 |
| GET | `/api/admin/textbooks/matches` | 프로그램 폼 카탈로그 (LNB 밖) |
| GET/POST/PATCH/DELETE | `/api/admin/material-kits` 및 versions·calculate | 키트 수량 모달 — 전역 키트(`textbookId` null)로 배선 · **모달 open 시에만 조회** |

### 세부 프로그램 (`/detailed-program`)

| Method | Path | FE |
|--------|------|----|
| GET/POST | `/api/admin/detailed-programs` | 목록·등록 — 배선됨 |
| GET/PATCH/DELETE | `/api/admin/detailed-programs/{detailedProgramId}` | 수정·단건 삭제 — 배선됨 |
| POST | `/api/admin/detailed-programs/bulk-delete` | 목록 일괄 삭제 — FE 배선 |

---

## A. 존재하지 않는 API (신규 엔드포인트)

| 우선 | 제안 경로 | 이유 |
|------|-----------|------|
| **P0** | `DELETE /api/admin/sponsors/{sponsorId}/program-histories/{historyId}` + 선택 `POST …/program-histories/bulk-delete` | Notion 「이력 삭제」(실적 값은 유지). FE 버튼 있음, 스펙 없음. 지금은 remote에서 비활성 |
| **P1** | 후원사 목록 **Page** 응답 (`page`, `size`, `total`) | 지금 전체 배열. 교재·세부 프로그램은 page/size 있음 → **B-1** |
| **P1** | 목록 DTO에 **누적 후원금·누적 수혜자** (또는 연도별 합산 규칙 명시) | Notion 목록 컬럼(노란 하이라이트). `SponsorResponse`에 없음 → **B-2** |
| **P1** | `SponsorsParams`에 **`sponsorshipStartDateFrom` / `sponsorshipStartDateTo`** | Notion·시안 「후원 시작일」기간. FE는 `sp_from`/`sp_to`로 전송 + **일시적 클라 보조 필터**. BE 오면 클라 필터 제거 |
| **P1** | ~~`GET/POST /api/admin/textbook-business-areas` · `PATCH/DELETE …/{id}`~~ | ✅ OpenAPI·FE 연동 완료 (2026-08-26). cascade·중복 409·`deletable` |
| **P2** | 후원사 상세 `homepage`, 로고 업로드/삭제/일괄 다운로드 | Notion 노란 하이라이트. 상세 DTO에 없음 |
| **P2** | `GET /api/admin/sponsors/export`, `GET /api/admin/textbooks/export` (필터 동일, 감사로그 fail-closed) | Notion 엑셀 버튼 노란 하이라이트. 지금은 클라 테이블 dump |
| **P2** | `ProgramHistoriesParams.participantType` (`school` \| `individual` \| `volunteer`) | Notion·시안 「참여자 유형」. FE는 전송·클라 보조 매칭. BE 쿼리 추가 필요 |

**요청하지 않는 것**

- 세부 프로그램 `nameEn` / `businessArea` UI — API에 있고 Notion 목록에는 없음.
- LNB 밖 프로그램 폼 mock (`useSponsorOptionsQuery` 등) — **B-5**에서 API 전환.
- 연도별 후원금 API — 이미 있음. FE가 상세 패널에 배선함.
- 키트 DELETE — 생성 스펙에 이미 있음. 전역 키트 정책상 UI에서 안 씀.
- `POST /api/admin/textbooks/matches` — LNB 교재 화면이 아니라 프로그램 폼 전용이면 범위 밖.

---

## B. 있는 API의 스펙 구멍 (계약 수정)

### 1. 후원 상태 enum

`sponsorshipStatus`가 자유 문자열입니다. FE는 `active` / `ended`.  
Notion은 진행 중 / 후원 종료 / **논의중 / 휴면**(노란 하이라이트).

허용값·목록 인라인 변경 규칙을 OpenAPI enum으로 적어 주세요. 논의중/휴면은 기획 확정 후 FE에 넣습니다.

### 2. 구분 enum · 필터 키

- `organizationKind`: FE `corporate` / `foundation` vs 화면 라벨 기업/재단.
- `SponsorsParams`에 `status`와 `sponsorshipStatus`가 둘 다 있음. **어느 키를 쓰는지** 확정해 주세요. FE는 `sponsorshipStatus`를 보냅니다.

### 3. 프로그램 이력 `id` 타입

삭제 API가 생기면 목록 `id`와 path 타입을 **같은 식별자·같은 타입**으로 맞춰 주세요. (로그 `issueId`와 같은 함정)

### 4. 키트–교재 연결

`MaterialKitResponse.textbookId`가 optional입니다.  
전역 키트(`null`) vs 교재별 키트 운영 규칙을 스펙 설명에 명시해 주세요. CMS 교재 화면은 전역 키트만 사용합니다.

### 5. 교재/세부 프로그램 필터 키

생성 타입에는 아래 키가 있습니다. 실제 서버가 무시하면 문서/구현을 맞춰 주세요. **FE는 보냅니다.**

| 화면 | FE가 보내는 키 |
|------|----------------|
| 교재 | `businessArea`, `educationTarget`, `useStatus`, `grade`, `textbookName` |
| 세부 프로그램 | `useYn`, `keyword` (`dp_name`) |

### 6. 등록자 표시

- 교재: `registrant` (이름)
- 세부 프로그램: `createdByName`. ID(`createdByAdminId`)만 오면 화면이 ID를 보여 줍니다. **이름 필드 보장**을 요청합니다.

### 7. bulk-delete `ids` 타입

`BulkIdsRequest.ids`는 `number[]`입니다. 후원사/교재 `id`가 UUID 문자열이면 호출이 깨집니다.  
**string[] 이거나, 숫자 id로 고정**해 주세요. FE는 파싱 가능한 숫자는 number로 보내고, 아니면 런타임 캐스팅합니다.

---

## C. 확인만 하면 되는 것

1. 후원사 목록 기본 정렬, 건수 상한 여부.
2. 연도별 행이 후원 시작일부터 매년 **자동 생성**인지, FE가 POST로 만드는지. (지금은 시작연도~올해 빈 연도를 표시하고, 저장 시 id 없으면 POST·있으면 PATCH)
3. 이력 삭제 시 「실적 값은 삭제되지 않음」의 서버 의미.
4. `GET /api/admin/textbooks/matches`가 LNB 교재 화면에서 쓰이는지 (프로그램 폼 전용이면 LNB 전환 범위 밖).

---

## 프론트 진행 상태 (참고)

- 교재 `grade`·`textbookName`, 세부 프로그램 `keyword`는 서버 쿼리로 전송. 클라 이중 필터는 제거.
- 후원사 목록 필터는 `organizationKind` / `keyword` / `managerName` / `sponsorshipStatus`. 클라 재필터 없음.
- 일괄 삭제는 `POST …/bulk-delete` (후원사·담당자·교재·세부 프로그램). max 100 청크.
- 연도별 후원금은 상세 패널에서 GET·POST·PATCH.
- 프로그램 이력 삭제는 API가 오기 전까지 비활성.
- 엑셀은 현재 클라 테이블 dump. P2 export가 오면 교체를 검토합니다.
- **B-0**: 목록 `keepPreviousData` · 최초 로드만 Spin · 후원사 status 셀 분리·prefetch debounce · 교재 kit 모달 `enabled` · 세부 `filterFn` pass-through · 편집 draft ref · 저장 `Promise.all`.
- 목록 구분 **라디오(기업/재단)** · 후원 시작일 기간 필터(클라 보조) · 이력 **참여자 유형** 필터(클라 보조).
- Notion FE 정렬(2026-08-26): 후원사 LNB 3탭(담당자 분리)·목록 컬럼/삭제 UX·이력 컬럼·교재/세부 `tb_use`/`dp_use` 라디오 기본값.
- 시드: [`data-management-dummy-seed-backend-request.md`](./data-management-dummy-seed-backend-request.md) — `detailSamples`(contacts·yearly·programHistories).
