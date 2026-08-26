# 실적 관리 더미 시드 요청 (BE)

CMS **LNB `실적 관리`** 목록·합계 탭을 FE mock 30건과 동일하게 검증할 수 있도록, `performance_record`(명칭은 BE 테이블에 맞춤) **30건** 더미 시드를 요청합니다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-25 |
| **대상 화면** | LNB `실적 관리` |
| **FE path** | `/education-records` (`?tab=data` / `?tab=summary`) |
| **목록 API** | `GET /api/admin/performance-records` → `PerformanceRecordFrontendResponse[]` |
| **합계 API** | `GET /api/admin/performance/summary` (없으면 FE가 목록 행으로 피벗) |
| **모듈 플래그** | `VITE_REAL_API_MODULES=...,performanceRecords` |
| **FE SSOT** | [`programs.ts`](../../src/data/mock/programs.ts) `educationRecords` (30건, 실제 교육실적 샘플) |
| **BE 복붙 페이로드** | [`education-records-seed.payload.json`](./education-records-seed.payload.json) — CASE-01~30 |
| **insert 배열만** | [`education-records-seed.db-rows.json`](./education-records-seed.db-rows.json) |
| **슬랙/메일 복붙본** | [`education-records-dummy-seed-backend-copy.md`](./education-records-dummy-seed-backend-copy.md) |
| **백엔드 Cursor 프롬프트** | [`education-records-dummy-seed-backend-cursor-prompt.md`](./education-records-dummy-seed-backend-cursor-prompt.md) — 지시 + 30건 JSON 한 파일 |

> **금지:** Gemini 실적 관리(`/programs/gemini/performance`, `training-reports`)와 **혼용하지 마세요.**  
> **금지:** `POST /api/admin/performance-records/rebuild`만으로 이 30건을 채우지 마세요. rebuild는 프로그램에서 재집계하므로 엑셀 mock 수치(참가자·봉사·교사 수)를 보장하지 않습니다.  
> OpenAPI에 **bulk create POST가 없습니다.** local profile Flyway / 내부 시더로 insert 해 주세요.

---

## 0. 이 문서를 읽는 법

1. [`education-records-seed.payload.json`](./education-records-seed.payload.json) 의 `cases[].dbRow` 를 insert 한다. (`listItem` 은 `GET /performance-records` 가 돌려줘야 할 FE DTO)
2. `id` `90001`~`90030`, `programId` `1`~`30` 은 **로컬 안정 값**. 운영 PK·프로그램 FK는 BE가 매핑.
3. `performanceStatus=CONFIRMED`, `latestRevisionYn=true`, `revisionNo=1`.
4. 라벨은 **엑셀 원문**(초/중/고, 오프라인, 학교 안, Yes/No). FE 테이블은 enum(`elementary`, `offline`)도 한글 라벨로 표시하지만, 시드는 원문을 유지한다.

재생성:

```bash
node apps/cms/scripts/export-education-record-seed.mjs
```

---

## 1. CASE 마스터 (30건)

| CASE | FE `programId` | 월 | 사업분야 | 후원사(국문) | 세부 프로그램명 | 학교/기관 | 시군구 | 인원 |
|------|----------------|----|----------|--------------|-----------------|-----------|--------|------|
| CASE-01 | `prog-001` | 12 | 기업가정신 | JA Korea 고유목적사업 | 1사1교 경제금융교육 | 발곡고등학교 | 경기 의정부시 | 27 |
| CASE-02 | `prog-002` | 7 | 경제금융 | BNP 파리바 카디프생명 | 신용케어 아카데미 | 씨앗지역아동센터 | 인천 계양구 | 12 |
| CASE-03 | `prog-003` | 2 | 경제금융 | BNP PARIBAS CIB | BNP PARIBAS CIB와 JA Korea가 함께하는 어린이 경제교육 프로그램 | 새날지역아동센터 | 서울 광진구 | 22 |
| CASE-04 | `prog-004` | 3 | 기업가정신 | 뉴욕멜론은행 | 오리엔테이션 | — | — | 132 |
| CASE-05 | `prog-005` | 1 | 기업가정신 | 뉴욕멜론은행, 한국투자공사, 월트디즈니컴퍼니코리아, SAP Korea | 국내대회 | — | — | 57 |
| CASE-06 | `prog-006` | 4 | 경제금융 | 한국 씨티은행 | 1사1교 경제금융교육 | 중원중학교 | 충북 충주시 | 21 |
| CASE-07 | `prog-007` | 6 | 경제금융 | 한국 씨티은행 | 1사1교 경제금융교육 | 대구영선초등학교 | 대구 남구 | 44 |
| CASE-08 | `prog-008` | 9 | 경제금융 | 한국 씨티은행 | 1사1교 경제금융교육 | 윤슬초등학교 | 경기 하남시 | 280 |
| CASE-09 | `prog-009` | 5 | 진로취업 | 한국씨티은행 | 특별한 JOB담 | 서울여자상업고등학교 | 서울 관악구 | 16 |
| CASE-10 | `prog-010` | 2 | 기업가정신 | EY한영 | 기타 프로그램 | — | — | 48 |
| CASE-11 | `prog-011` | 5 | 기업가정신 | 페덱스 | 국제무역창업대회 | — | — | 84 |
| CASE-12 | `prog-012` | 5 | 기업가정신 | 페덱스 | 국제무역창업대회 | — | 서울 마포구 | 20 |
| CASE-13 | `prog-013` | 8 | 기업가정신 | 한국경제인협회 | 기발한CEO교실 | 서울탑산초등학교 | 서울 강서구 | 55 |
| CASE-14 | `prog-014` | 9 | 기업가정신 | 한국경제인협회 | 기발한CEO교실 | 서울미래초등학교 | 서울 구로구 | 70 |
| CASE-15 | `prog-015` | 1 | 디지털리터러시 | 구글 | Gemini Academy 교원연수(1월) | — | — | 85 |
| CASE-16 | `prog-016` | 2 | 디지털리터러시 | 구글 포 에듀케이션 | 제미나이 아카데미 | — | — | 397 |
| CASE-17 | `prog-017` | 3 | 기업가정신 | HSBC은행 | (184명)오리엔테이션 | — | — | 184 |
| CASE-18 | `prog-018` | 4 | 기업가정신 | HSBC | 국내대회 본선 | — | — | 16 |
| CASE-19 | `prog-019` | 6 | 경제금융 | 현대캐피탈 | 1사1교 경제금융교육 | 월계초등학교 | 울산 남구 | 13 |
| CASE-20 | `prog-020` | 6 | 경제금융 | 현대캐피탈 | 1사1교 경제금융교육 | 인천아라중학교 | 인천 서구 | 17 |
| CASE-21 | `prog-021` | 6 | 경제금융 | 현대캐피탈 | 1사1교 경제금융교육 | 동춘천초등학교 | 강원 춘천시 | 20 |
| CASE-22 | `prog-022` | 6 | 경제금융 | 현대캐피탈 | 1사1교 경제금융교육 | 동구로초등학교 | 서울 구로구 | 22 |
| CASE-23 | `prog-023` | 6 | 경제금융 | 현대캐피탈 | 1사1교 경제금융교육 | 세일고등학교 | 인천 부평구 | 11 |
| CASE-24 | `prog-024` | 6 | 경제금융 | 현대캐피탈 | 1사1교 경제금융교육 | 숭미초등학교 | 서울 도봉구 | 21 |
| CASE-25 | `prog-025` | 6 | 진로취업 | 한화투자증권 | 특성화고 취업 멘토링 | 경일관광경영고등학교 | 경기 안산시 | 21 |
| CASE-26 | `prog-026` | 11 | 진로취업 | 한화투자증권 | 특성화고 금융투자 특강 | 경기경영고등학교 | 경기 부천시 | 7 |
| CASE-27 | `prog-027` | 7 | 경제금융 | 제이에이코리아 | 1사1교 경제금융교육 | 인천봉수초등학교 | 인천 서구 | 30 |
| CASE-28 | `prog-028` | 7 | 경제금융 | 교보생명 | 1사1교 경제금융교육 | 안양동초등학교 | 경기 안양시 | 54 |
| CASE-29 | `prog-029` | 7 | 경제금융 | KB금융공익재단 | 1사1교 경제금융교육 | 서울미래초등학교 | 서울 구로구 | 70 |
| CASE-30 | `prog-030` | 12 | 진로취업 | 델타항공 | Job shadow | — | 인천 동구 | 13 |

상세 필드·수치 전량은 payload `cases[].listItem` / `dbRow`.

---

## 2. 필드 매핑 (FE list DTO → 내부 Response)

`PerformanceRecordFrontendResponse` → `PerformanceRecordResponse`

| FE (`listItem`) | BE 내부 (`dbRow`) |
|-----------------|-------------------|
| `status` | `performanceStatus` |
| `sponsorNameEn` | `sponsorNamesEn` |
| `titleEn` | `programNameEn` |
| `sponsorNameKo` | `sponsorNamesKo` |
| `mainTitle` | `mainProgramNameKo` |
| `title` | `detailedProgramNameKo` |
| `textbookName` | `textbookNameKo` |
| `district` | `sigungu` |
| `targetLevel` | `targetType` |
| `institutionType` | `organizationType` |
| `ips` | `ipsType` |
| `programChannel` | `programChannelFormat` |
| `maleParticipants` 등 | `maleCount` 등 (`fieldMapToInternal` 참고) |
| `latestRevision` | `latestRevisionYn` |
| `educationHours` | string (예: `"3"`) |

빈 값 규칙 (FE mock과 동일):

- `해당없음` → omit (`programCategory` / `programChannel` / 영문명·교재 등)
- `district` 가 `전국` 또는 `온라인` → omit
- `title === '해당없음'` → `mainTitle` 사용

---

## 3. 검증 기준 (CMS)

1. `VITE_REAL_API_MODULES` 에 `performanceRecords` 포함 + 관리자 JWT.
2. `/education-records?tab=data` 목록 **30건**. CASE-01: 12월 · 발곡고등학교 · 남 15 / 여 12 / 합 27.
3. 「총 N건」이 30.
4. 연도 필터 2026 (CASE-01 `educationMonth=2026-12`).
5. `?tab=summary` 합계가 목록 피벗과 모순되지 않음 (summary API를 쓰면 동일 30건 기준).

---

## 4. 이 레포에서 할 수 없는 일

이 CMS 프론트 레포에는 Flyway/SQL/실적 INSERT API가 없습니다.  
DB 적재는 **백엔드 local 시더**가 payload `dbRow` 30건을 넣는 작업입니다.
