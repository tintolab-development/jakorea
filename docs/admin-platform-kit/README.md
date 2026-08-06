# Admin Platform Kit

CMS(`apps/cms`) 기반 **재사용 어드민 솔루션**의 내부 규약 문서입니다.  
JA Korea 제품 도메인을 통째로 복제하지 않고, **관리자 셸(Kit)** 만 신규 프로젝트에 적용하기 위한 기준을 둡니다.

| 문서 | 내용 | 대응 Phase |
|------|------|------------|
| [01-domain-mapping.md](./01-domain-mapping.md) | 필수 Kit vs JA 전용 도메인 맵 | P0 착수 전 |
| [02-l0-starter-checklist.md](./02-l0-starter-checklist.md) | L0 스캐폴드·빈 앱 트리·복사 소스 | P0–P1 |
| [03-first-vertical-slice.md](./03-first-vertical-slice.md) | 첫 목록 CRUD 수직 슬라이스 합격 기준 | P0–P1 |
| [04-package-promotion-scope.md](./04-package-promotion-scope.md) | `@jakorea/admin-ui` 등 패키지 승격 범위 | P2 |
| [05-frontend-architecture-cursor-crosscheck.md](./05-frontend-architecture-cursor-crosscheck.md) | 아키텍처 상세 · Cursor 교차검증 프로토콜 | 전 단계 SSOT |
| [08-gpt-handoff-generic-cms-new-project.md](./08-gpt-handoff-generic-cms-new-project.md) | **GPT 핸드오프** monorepo 이식 | 범용 CMS 착수 참고 |
| [**10-generic-cms-execution-ssot.md**](./10-generic-cms-execution-ssot.md) | **실행 SSOT (10r1)** | **구현 계약 우선** |
| [11~17 교차검증](./17-accept-doc-16-and-10r1.md) | evidence 체인 · 16 수용 | 11–16 validation |

> **실행 계약:** 항상 [10r1](./10-generic-cms-execution-ssot.md).  
> 01–08 · 구 교차검증은 Admin Kit 또는 evidence. 고객별 CRUD → 01–04.  
> kit 폴더는 git ignore 가능 — 신규 CMS 레포에 10r1을 커밋할 것.


## 한 줄 원칙

**CMS 전체를 템플릿으로 쓰지 않는다.** Kit 스캐폴드 + 프로젝트별 `features/*` 만 남기고, 도메인은 게이트를 통과한 경우만 이식한다.

## 레이어 요약

```text
L0  문서·스캐폴드 (코드 복제, admin 셸 of record)
L1  @jakorea/admin-ui · admin-list · admin-shell 패키지
L2  동일 산업 도메인 애드온만 (교육 B2B 등) — 기본 제외
```

**기본 착수 전략: L0.** 앱이 2개 이상이거나 외부 납품이 반복될 때만 L1에 투자한다.  
CMS 리라이트는 전제하지 않는다 (strangler: Kit 추출 시 CMS/admin이 점진 소비).

**실무 순서:** 교차검증·디렉터리·프롬프트는 **[05](./05-frontend-architecture-cursor-crosscheck.md)** → 이 monorepo에 대입하는 법은 **[06](./06-jakorea-monorepo-adoption.md)**.

## 코드·스펙 of record

| 종류 | of record | 비고 |
|------|-----------|------|
| **L0 복사 소스 (셸·Cms\* UI)** | [`apps/admin`](../../apps/admin) | 얇은 셸. homepage 도메인 feature는 제외 |
| **목록·필터 치수·토큰 의도** | [`.cursor/rules/cms-admin-ui/`](../../.cursor/rules/cms-admin-ui/) | 양 앱 공유 SSOT (필터·셸·**버튼 용도 large**·FileSelect) |
| **목록 훅 폴백·무거운 테이블 스택** | [`apps/cms`](../../apps/cms) `shared/` only | admin에 없을 때 CMS `shared`에서 **파일 단위** 이식 |
| **금지 복사** | `apps/cms/src/features/{program,settlement*,template,user}` 통째 | 패턴 참고만 |
| **Form/에디터 런타임** | `packages/form-*`, `rich-text` 등 | 필요 시 workspace dep |

Admin이 CMS 경로를 import하지 않는 규칙은 그대로다. L1 이후에는 **Kit 패키지만** import 한다.

## 현 레포 자산 맵

| 자산 | 경로 |
|------|------|
| Homepage Admin (두 번째 어드민 선례) | `apps/admin` |
| UI 스펙 SSOT | `.cursor/rules/cms-admin-ui/` |
| CMS FSD·테이블 규약 | `apps/cms/.cursor/rules/` |
| 교차 패키지 | `packages/{form-schema,form-template-runtime,rich-text,utils,location,identity-verification,social-auth}` |

## 의사결정 (고정)

- Kit 범위: layout, providers, Cms\* controls, list/filter/modal, axios/RQ 규약, (옵션) auth/RBAC **primitive**
- Kit 제외: program 유형 분할, 정산 상태머신, JA 약관·동의 정책, 전역 mock/real 스위치, 거대 menu-config 기본값
- 신규 1건: P0–P1만. 반복 납품 시 P2

**Last updated:** 2026-08-06
