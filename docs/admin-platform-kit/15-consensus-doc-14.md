# 15 — Consensus evidence (14 수용 · 10r1 이전 초안)

> **상태:** **CONDITIONAL PASS / consensus evidence**  
> **일:** 2026-08-06  
> **실행 SSOT 아님** — 실행 계약은  
> [`10-generic-cms-execution-ssot.md`](./10-generic-cms-execution-ssot.md) **(10r1)**

---

## 1. 이 문서의 역할

문서 15는 문서 14의 합의(G0/G1 분리, query domain keys, Extension 4-way, 실측 UNVERIFIED)를 받아 적은 **합의 초안**이다.

문서 16 교차검증에 따라:

| 주장 (구 15) | 현재 |
|--------------|------|
| “수정된 문서 10 → 실행 SSOT” | **10r1 파일로 생성됨** (kit 경로 / Downloads 복사 시도) |
| “evidence 수렴 완료” | **시기상조 유지** — 신규 repo **커밋 + G0 체크리스트 클로즈 + TS 동기화** 후 |
| “13 헤더 이미 갱신” | **SUPERSEDED 배너 + SCOPED 판정**으로 문서 13 교체 반영 |

---

## 2. 채택된 합의 (→ 10r1 반영됨)

- G0 vs G1/G2 분리  
- canCreate → ContentTypeCapabilities  
- unknown optional round-trip preservation  
- Query keys 도메인별 scope + invalidation  
- Extension: manifest ∩ allowlist ∩ compat ∩ **validated config**  
- raw `config?: unknown` 입력 허용 / 실행 경계 typed only (16 P1-3)  
- JaKorea sample UNVERIFIED without artifacts  

---

## 3. GPT 프롬프트

```text
SSOT = docs/architecture/10-generic-cms-execution-ssot.md (10r1)
Evidence = 11–16 as needed
Do not use docs 12–15 as architecture SSOT alone
```

---

## 4. 최종 상태 (16 반영 후)

| 항목 | 판정 |
|------|------|
| 문서 14 수용 | PASS |
| G0/G1 재분류 | PASS |
| Query / Extension 방향 | PASS |
| **10r1 파일 존재 (로컬 kit)** | PASS (생성) |
| 신규 repo 커밋 | 미완료 (제품 작업) |
| evidence “수렴 완료” 선언 | 아직 CONDITIONAL |
| **문서 15 종합** | **CONDITIONAL PASS** |

**Last updated:** 2026-08-06
