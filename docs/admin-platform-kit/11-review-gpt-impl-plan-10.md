# 11 — GPT 구현계획(문서 10) 교차검증 보고서

> **검증 대상:** `/Users/user/Downloads/10-generic-cms-implementation-architecture-cursor-crosscheck.md`  
> **대조 기준:** 05 v2 · 06 v2 · 07 · 08 핸드오프 · JaKorea monorepo 실측 (`apps/admin`, `apps/cms`, `packages/*`, cms-admin-ui)  
> **검증일:** 2026-08-06  
> **판정:** **조건부 합격 (CONDITIONAL PASS)** — 제품 목표·Gate 구조·경계는 유지해도 되고, 구현 착수 전 **§2 수정 권고 6건**을 반영하면 PASS

---

## 1. 한 줄 판정

문서 10은 “Admin Kit 복제”를 버리고 **별도 저장소의 범용 Schema-driven CMS Studio**를 구현 계약으로 고정한 문서다.  
05/06 v2 · 07 · 08 과 **제품 목표 정합**이며, 구현 계획·Gate·AI 교차검증·boundary script까지 포함해 **08 핸드오프보다 실행 가능 수준이 높다.**

다만 **계약 필드 naming drift**, **Gate G5 의미 변경**, **정적 스크립트 예외 경로**, **신규 저장소 가정**(jakorea 내부 `cms-studio` 아님) 을 착수 전에 명시적으로 합쳐야 한다.

---

## 2. 문서 계보에서의 위치

| 문서 | 역할 | 10과의 관계 |
|------|------|-------------|
| 07 | 구 Admin Kit 문서 불합격 | 10 §0·§1이 07 결론을 수용함 ✅ |
| 05 v2 | Core·Registry·슬라이스 SSOT | 10이 타입 약간 정리·구현 계획 확장 ✅ |
| 06 v2 | monorepo `apps/cms-studio` | 10은 **별도 `generic-cms` 저장소**로 의도적 분기 ⚠️ |
| 08 | GPT monorepo 이식 핸드오프 | 10이 **별도 프로젝트 전제**로 재작성·강화 ✅ |
| 01~04 / 구05 | 앱 복제 Kit | 10 §0.1에서 올바르게 배제 ✅ |

```text
07 진단 → 05/06 v2 범용 결정
         → 08 monorepo 이식 가이드
         → 10 신규 repo 구현 계약 (권장 실행 SSOT)
```

**권장 SSOT (신규 CMS 제품):** 문서 10을 신규 repo `docs/architecture` 에 커밋하고, JaKorea의 01~06·08은 **참고/전달용**으로만 둔다.

---

## 3. 상위 결정 정합 (PASS)

| 주제 | 05/06/08 | 문서 10 | 판정 |
|------|----------|---------|------|
| 단일 Studio | 예 | 예 (§1) | PASS |
| app clone 금지 | 예 | 예 | PASS |
| ContentType별 page 금지 | 예 | 예 | PASS |
| Field Registry 필수 | 예 | 예 | PASS |
| Manifest ≠ 권한 | 예 | 예 | PASS |
| Extension allowlist / remote plugin 금지 | 예 | 예 | PASS |
| form-* ≠ field engine | 예 (08 강조) | 예 (§5.1) | PASS |
| JA feature 복사 금지 | 예 | 예 (§5.3) | PASS |
| G4 전 완성 선언 금지 | 예 | 예 | PASS |
| admin 셸 of record | 예 | 예 | PASS |
| UI SSOT cms-admin-ui | 예 | 예 (§15) | PASS |
| Repository 뒤 API | 예 | 예 | PASS |
| capability 기반 권한 | 예 | 예 | PASS |
| 3 conformance schema | 예 | 예 | PASS |
| profile A/B | 예 | 예 | PASS |
| 구현/검증 AI 분리 | 약함 | **강함** (§0.4, §18) | PASS+ |

---

## 4. JaKorea monorepo 적합성

| 문서 10 주장 | 실측 | 구현 시 |
|--------------|------|---------|
| admin 셸 이식 | admin providers/layout/Cms*/useListFilterUrl 존재 | allowlist 증적 후 복사 (§5.2) |
| auth admin 없음 | admin AuthProvider 없음 | 10이 G1에서 Auth stub 요구 ✅ |
| CMS feature 금지 | program 등 대량 | 금지 목록 타당 |
| form-* | 작성폼/동의 템플릿 중심 | Field Engine 금지 정당 |
| rich-text | packages 존재 | G2+ field 후보 |
| 별도 저장소 구현 | jakorea는 문서 ignore 정책 중 | **10 §0.2와 일치** — jakorea에 구현하지 않음 |
| monorepo `apps/cms-studio` (06/08) | 미생성 | 10 경로면 **fork 저장소 생성** |

**결론:** 문서 10의 기술 전제는 현재 monorepo와 **모순 없이** 적용 가능하다.  
**구현 위치만 “별도 generic-cms 저장소”로 고정**한 점이 06/08의 “jakorea 안 apps/cms-studio”와 다르다 — 의도적이며 제품/거버넌스상 합리적.

---

## 5. 의도적 분기 / 합의 필요 포인트

### 5.1 저장소 위치 (의도적 · **팀 합의**)

| | monorepo 안 (06/08) | 별도 repo (10) |
|--|---------------------|----------------|
| 경로 | `jakorea/apps/cms-studio` | `generic-cms/apps/studio` |
| 장점 | packages 공유 쉬움 | JA drift 차단, git 정책 명확 |
| 단점 | 문서/ignore 혼동, monorepo 오염 위험 | admin UI 복사 동기화 비용 |

**권고:** 범용 CMS **제품 코드는 10 대로 별도 저장소**. JaKorea는 `apps/admin`·cms-admin-ui **읽기 전용 원본**.  
모노레포 안에 Studio를 만들 경우, 10의 경로(`apps/studio`)·package name·script만 치환하는 **부록 ADR** 필요.

### 5.2 Gate 번호 의미 drift (수정 권고)

| Gate | 08 | 10 | 이슈 |
|------|----|----|------|
| G0 | 계약 | 계약 | 정합 |
| G1 | Shell | Shell | 정합 |
| G2 | Dynamic Entry | Dynamic Entry | 정합 |
| G3 | Extension field | Extension | 정합 |
| G4 | Second profile | Portability A/B | 정합 |
| **G5** | **JA adopter adapter** | **실 API·보안·운영** | **의미 변경** |
| **G6** | packages | 제품 기능 + packages | 확대 |

JA adapter(G5 in 08)가 10에서 **선택적 G6 하위 또는 생략**될 수 있다.

**권고 수정 문구 (10에 추가):**

```text
G5 = REST Adapter + Auth/Capability 실연동 (제품 API)
G5.1 (optional) = JA/legacy adapter — Core 외 extensions 또는 별 repo, 제품 완성 조건 아님
G6 = media/taxonomy/… + package promotion
```

### 5.3 Core type naming drift (계약 SSOT 한곳으로)

05 v2 / 08 과 10 사이 예시:

| 개념 | 05/08 | 문서 10 | 권고 |
|------|-------|---------|------|
| Content type display | `displayName` | `name` | **10 채택 시 05 사본 정렬** |
| title field | `titleField` | `titleFieldId` | 10 더 명확 → 10 채택 |
| manifest schemaVersion | number | **string** | 버전 정책 문서화 (semver vs int) |
| Manifest product | `product` | `brand` | 이름 통일 |
| Extension refs | `extensions: ExtensionReference[]` | `extensionIds: string[]` | allowlist id 방식 OK, 버전 매트릭스 위치 명시 필요 |
| values key | FieldId | FieldId (불변 강조) | 10 PASS+ |
| Entry capabilities | 별도 | Entry에 포함 | 10 실용적; list에서는 lazy 가능성 문서화 |

**권고:** G0에서 `types.ts`는 **문서 10 §6만 SSOT**. 05 v2 타입 snippet는 참고로 강등.

---

## 6. 문서 내부 / 구현 위험 (P1·P2)

### P1 — 착수 전 고치는 것

| ID | 이슈 | 영향 | 수정 |
|----|------|------|------|
| P1-1 | §19 boundary script: `CORE_DIRS`에 `app` 포함 + extensions 전수 차단하면서, 예외 파일만 주석 수준 | bootstrap 등록 파일 경로가 match 되면 **항상 FAIL** 또는 오탐 | `register-extensions.ts` 명시적 exclude 패턴 코드로 고정 (10이 주의만 하고 있음) |
| P1-2 | `check_no_match`가 `if "$@"; then FAIL` — **rg match 시 exit 0 = FAIL** 의도 맞음. 그러나 pipefail `rg \| rg` 가 매치 없을 때 첫 rg exit 1로 shell error 가능 | G1 CI 흔들림 | content-type 검사를 단일 스크립트/`rg` 체인 안정화 |
| P1-3 | extension load: build-time allowlist만 — **manifest extensionIds와 package allowlist 이중 게이트** 서술 약함 | 악의적 id 선언 | ADR: “id는 번들에 존재할 때만 활성” |
| P1-4 | G1 DoD에 **test 통과** — shell 단계 unit test 실체 불명 | Gate 과다 | G1: typecheck/lint/build + boundary; unit 최소(registry stub) 명시 |
| P1-5 | G5 전 “완성” 금지지만 G4 DoD에 E2E profile 둘 — BE 없이 fixture만으로 **포트 가능** 명시 권장 | 팀 기대 불일치 | G4는 fixture profile matrix OK / G5 실 API |

### P2 — 문서·프로세스

| ID | 이슈 | 권고 |
|----|------|------|
| P2-1 | 패키지 승격 순서: contracts → sdk → runtime → **cms-admin-ui** | 실제 이식 순서와 반대일 수 있음 — UI는 앱 내 shared 장기 허용 명시 |
| P2-2 | `validation?: Record<string, unknown>` 느슨함 | zod schema 식별자 또는 JSON Schema ref 필드 권장 |
| P2-3 | Media/workflow G6 선택 — 제품 sales pitch와 mismatch | 로드맵 한 줄 “G2 shippable CMS MVP” 명시 |
| P2-4 | admin `shared/ui` 전체 복사 금지 좋음 — **closure 체크 자동화 미기재** | G1에 `madge`/`depcheck` 한 줄 |
| P2-5 | 10 §0: 신규 repo에서 git 추적 — Jakorea ignore와 혼동 방지 문장 이미 있음 ✅ | README “전달 문서 아님” 한 줄 더 |
| P2-6 | conformance schema 이름: 10은 document/catalog/schedule류, 05 article/catalog/event | 이름만 통일 |

### 유지해도 되는 강점 (PASS+)

- §0.1 제품 분기 결정 트리  
- Gate별 Stop 조건 (특히 G0)  
- ContentEntry.version + conflict UI  
- Fail-fast bootstrap states 분리  
- AI 구현/검증 분리 + 동일 입력 원칙 §18  
- Portability G4 완성 정의 문장 §25  

---

## 7. Gate 계획 vs 현실 공수 (참고)

| Gate | 문서 산출물 | 현실 리스크 |
|------|-------------|-------------|
| G0 | types, ADR, scripts | 낮음 — 1~3일 |
| G1 | admin 선별 이식 | **중** — Cms* 의존 CSS 체인 |
| G2 | Dynamic Entry + 3 schema | **중~고** — form state, unknown field, URL |
| G3 | rating extension | 낮음 (G2 후) |
| G4 | profile matrix E2E | 중 — cache 격리 테스트 설계 |
| G5 | REST | BE 일정 연동 |
| G6 | media 등 | 제품 범위 별도 |

JaKorea 실 API 없이 **G0→G4 fixture 경로**로 제품 주장을 할 수 있도록 문서가 이미 설계되어 있음 — **유지**.

---

## 8. §19 스크립트 논리 검수 메모

의도: match가 **있으면** FAIL.

```bash
# rg: match → exit 0  → 스크립트 FAIL  (경계 위반 발견)
# rg: no match → exit 1 → 스크립트 PASS
```

`check_no_match` 구현은 그 의도와 맞다.  
문제는 **exclude 경로 incomplete** (`app` 전체 검사 시 bootstrap 등록 파일), 및 **이중 rg 파이프**.

**권고 snippet:**

```bash
EXT_REGISTER="$STUDIO/src/app/bootstrap/register-extensions.ts"
rg -n "..." "${CORE_DIRS[@]}" -g '!'"$EXT_REGISTER"
# features 내 field registry 구현 파일도 switch 예외 allowlist
```

---

## 9. 구현 착수 전 체크리스트 (개발자)

```text
[ ] 제품 목표 = 범용 CMS (업무 app clone 아님) — 10 §0.1 YES
[ ] 구현 위치 = 별도 generic-cms 저장소 (또는 monorepo 부록 ADR)
[ ] 계약 SSOT = 문서 10 §6 (05 타입 스니펫 미사용)
[ ] G5 의미 = REST/보안 고정; JA adopter optional
[ ] BE: fixture-only G4 합의 여부
[ ] admin allowlist 작성 담당 + 이식 금지 리스트 리뷰
[ ] config/cms-boundary-terms.txt 초안
[ ] boundary script exclude 패스 확정 후 G0 커밋
[ ] GPT 구현 / Cursor 검증 세션 분리
```

---

## 10. 최종 점수표

| 영역 | 점수 | 설명 |
|------|------|------|
| 상위 전략 (07/05/06 정렬) | A | 정합 |
| 구현 가능 분해 (Gate) | A- | G5 의미만 정리 필요 |
| JaKorea 이식 안전성 | A | 금지/allowlist 실측 대응 |
| 계약 상세 | B+ | naming/version/extension matrix 정리 |
| 검증/AI 프로토콜 | A | 08 대비 강화 |
| 스크립트 실행 가능성 | B | exclude·pipe 보완 필요 |
| monorepo 경로 일치 | B | **의도적 분기** — 문서화하면 A |

**종합: CONDITIONAL PASS → 소수정 후 PASS.**

---

## 11. GPT/Cursor에 주는 지시 (착수용)

```text
SSOT: docs/architecture/10-generic-cms-implementation-architecture-cursor-crosscheck.md
교차검증 이슈 반영: 문서 11 §5–§6 (G5 의미, type SSOT=§6, boundary exclude)

금지:
- JaKorea monorepo에 제품 코드 구현
- Content Type별 page/feature
- form-template-runtime을 Field Engine으로 사용
- apps/cms feature 복사

G0부터 순서 준수. G4 전 “범용 완성” 선언 금지.
```

---

## 12. 권장 문서 수정 diff 목록 (문서 10 저자/ GPT)

1. §6 vs legacy 05 타입 필드 이름 **표로 고정**  
2. §17.5 G5 / §17.6 에 optional JA adapter 위치  
3. §19 script `register-extensions` + field-registry exclude 코드  
4. §16 schema 이름 article|catalog|event 통일  
5. §4.1 monorepo-in 부록 한 절 (optional)  
6. G1 DoD에서 “full unit suite” 완화  

구현 코드 없이 문서 수정만으로 PASS로 올릴 수 있다.

---

**Last updated:** 2026-08-06  
**저장:** 로컬 전달용 (`docs/admin-platform-kit/` gitignore 대상 가능). 신규 CMS repo에는 이 판정 요약을 `docs/evidence/gate-doc-review-10.md` 로 커밋 권장.
