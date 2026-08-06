# 13 — 문서 12 재검증 (focused evidence · SUPERSEDED as SSOT)

> **대상:** `12-independent-cross-validation-10-vs-11.md`  
> **일:** 2026-08-06  

```text
╔════════════════════════════════════════════════════════════════╗
║ SUPERSEDED as architecture judgment                            ║
║ 판정: SCOPED / CONDITIONAL PASS (문서 14·15·16·10r1)           ║
║ 실행 SSOT: docs/.../10-generic-cms-execution-ssot.md (10r1)     ║
║ 이 파일 = focused revalidation evidence only                   ║
╚════════════════════════════════════════════════════════════════╝
```

| 범위 | 판정 |
|------|------|
| 문서 12가 문서 11을 정정한 A·B·C | **PASS** |
| P1-NEW 1~6 **문제 제기** | **PASS** |
| “전부 G0 차단” 표현 | **철회** → 10r1 §8 및 14/15 |
| monorepo 실측 | **UNVERIFIED SAMPLE** |
| 역할 | evidence only |

---

## 1. 검증한 것 (A·B·C)

문서 10 원문에 대해 재확인:

1. **register-extensions exclude glob이 명령에 이미 있음** (11 오진)  
2. **pipefail 실제 위험 = 상류 rg exit 2 은폐** (무매치 exit 1이 아닌)  
3. **G2 ≠ production**; G5 = Production Integration  
4. **G5 번호 drift는 10 SSOT 전제에서 자체 모순 아님**  
5. P1-NEW 문제(canCreate·preservation·query·boundary·ExtensionReference) 제기 **타당**

상세 원문 대조 장문은 문서 **12·14** 및 **16**에 있으며 이 파일은 축약 증거본이다.

---

## 2. 후속

- 실행 계약·타입·Gate: **10r1**  
- Gate 분류 보정: **14·15**  
- SSOT 부재 지적 해소: **10r1 파일 생성** (16 P1-1)

**Last updated:** 2026-08-06
