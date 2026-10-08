# 신청 폼 성범죄 단락 문구 재시드 + 강사 신청 응답 형식 변경 — 백엔드 전달 (2026-10-07)

아래 지시를 **백엔드 레포**에서 실행하라. 이 문서 하나에 필요한 값이 모두 들어 있다.  
본 문서에 없는 단락·문구를 임의로 작성하지 마라. 판단이 안 되면 기존 form template 시드 upsert 코드를 따르고, 그래도 불명확하면 FE에 문의하라.

---

## 1. 요약

| # | 작업 | 대상 |
|---|------|------|
| 1 | 양식 템플릿 DRAFT `schemaJson` 재시드 | `application-instructor`, `application-participant-school`, `application-economy` |
| 2 | 강사 신청 성범죄 단락 **응답 형식 변경** 반영 | `program-instructor-application-seed-crime-record` |
| 3 | 강사 신청 성범죄 단락 **숨김 로직 제거** | 동일 |
| 4 | 기존 프로그램에 복사된 신청 양식 갱신 여부 확인 → FE 회신 | 위 3종 |

---

## 2. 재시드

### 2.1 변경 범위

변경은 **단락 제목·설명 문자열만**이다. 단락 id·순서·`kind`/`variant`·`requiredMark`·`answerRequired`·표 구조는 바뀌지 않았다.

| templateCode | templateName | formType | category | 대상 단락 id | 변경 필드 |
|--------------|--------------|----------|----------|--------------|-----------|
| `application-instructor` | 공통_강사 신청 폼 | `WRITING` | `APPLICATION` | `program-instructor-application-seed-crime-record` | `paragraphTitle`, `paragraphDescription` |
| `application-participant-school` | 일반_참여 기관 신청 폼 | `WRITING` | `APPLICATION` | `program-application-institution-seed-sex-offense-consent-inquiry` | `paragraphDescription` |
| `application-economy` | 1사1교_참여 기관 신청 폼 | `WRITING` | `APPLICATION` | `program-application-economy-seed-sex-offense-consent-inquiry` | `paragraphDescription` |

### 2.2 변경 값

**`application-instructor` — `program-instructor-application-seed-crime-record`**

| 필드 | 변경 전 | 변경 후 |
|------|---------|---------|
| `paragraphTitle` | `성범죄 경력 조회서 제출` | `성범죄경력 조회 동의서 제출 방법 안내` |
| `paragraphDescription` | `학교에 전달할 성범죄 경력 조회서 파일을 제출해 주세요.` | `""` (빈 문자열) |

**`application-participant-school` / `application-economy` — `…-seed-sex-offense-consent-inquiry`**

| 필드 | 변경 전 | 변경 후 |
|------|---------|---------|
| `paragraphDescription` | `성범죄 경력 조회 동의서의 조회 방식을 선택해 주세요. 범죄경력회보서의 온라인 제출을 희망하는 경우, 기관 ID와 검증번호를 함께 전달해 주세요.\nJA 시스템 내에서 확인 선택 시, 프로그램 및 배정 정보와 함께 JA 홈페이지 상세에서 동의서 확인이 가능합니다. (조회 동의서만 제공하며, 실제 조회는 별도로 진행해 주셔야 합니다.)` | `성범죄경력 조회 동의서의 조회 방식을 선택해 주세요.` |

`paragraphTitle`(`성범죄 경력 조회 동의서 조회 방식`)은 그대로다.

### 2.3 시드 방법

1. BE 레포에 보관 중인 위 3종 시드 JSON을 **§6 전문으로 통째로 교체**하라. (BE 시드가 FE 이전 버전과 동일했다면, §2.2 필드만 바꿔도 결과는 같다.)
2. 기존 form template 시드 upsert 경로로 재실행하라.

| 규칙 | 값 |
|------|-----|
| natural key | `templateCode` — upsert. 중복 행 금지, template id 유지 |
| version | 기존 latest DRAFT 갱신 (또는 `versionNo=1` 재작성). `versionStatus=DRAFT`, `versionLabel`은 기존 시드 규칙 유지 |
| 저장 형태 | `schemaJson` / `extensionJson` / `settingsJson` 각각 **JSON.stringify 1회** 한 string. 이중 stringify(`"{\"...`) 금지 |
| Payload | `schemaJson` = object, `extensionJson` = `{ "overlay": {}, "editorState": {}, "uiState": {} }`, `settingsJson` = `null` |
| `_apiStorageNote` | 설명용 키. DB에 넣지 마라 |
| 환경 | **local/dev/staging** 전용. prod Flyway/마이그레이션에 넣지 마라 |

### 2.4 하지 말 것

- 위 3종 외 templateCode 시드 변경
- 단락 id 변경·단락 추가/삭제·문구 재작성
- PDF 생성 로직 변경

---

## 3. 강사 신청 응답 형식 변경

단락 `program-instructor-application-seed-crime-record` 의 사용자(Platform) 제출 값이 바뀌었다.

| 구분 | 응답 값 | 화면 |
|------|---------|------|
| 변경 전 | `{ "fileObjectId": number, "fileName": string }` | 성범죄 경력 조회서 파일 첨부 (`CRIMINAL_HISTORY_EVIDENCE`) |
| 변경 후 | `{ "confirmed": true }` | 제출 방법 안내 고정 문구 + 「네, 상기 내용 모두 확인하였습니다.」 확인 라디오 |

- 파일 첨부는 삭제되었다. 이 단락에 대한 `fileObjectId` 필수 검증·파일 연결 로직이 있으면 제거하라.
- 단락은 필수(`requiredMark: true`, `answerRequired: true`)다. FE는 미확인 시 제출을 막고, 미확인이면 이 단락 답변을 보내지 않는다.
- BE에서 필수 검증을 한다면 `confirmed === true` 기준으로 하라.
- 기존에 `{ fileObjectId, fileName }` 으로 저장된 응답은 그대로 두어도 된다(FE는 읽을 때 `confirmed: false` 로 처리).

---

## 4. 강사 신청 성범죄 단락 숨김 로직 제거

이 단락은 이제 **기관의 성범죄 동의서 제출 요청·제출 방식과 무관하게 항상 노출**된다.

- 신청 양식 응답(`runtimeContext.audienceApplication.hiddenQuestionKeys`)에 `program-instructor-application-seed-crime-record` 를 넣는 로직이 있으면 제거하라. 넣으면 Platform에서 단락이 숨겨지고 제출 검증과 어긋난다.
- 이전 조건(참고): 기관이 「동의서 제출 요청」 + 「사이트 제출 방식 = 온라인 제출」일 때만 노출.

---

## 5. 기존 프로그램 바인딩 확인 (회신 요청)

이미 생성된 프로그램에 복사·바인딩된 신청 양식 schema가 템플릿 재시드로 갱신되는지 확인하고 FE에 회신하라.

- 갱신되지 않으면 기존 프로그램의 Platform 신청 화면에 이전 제목·설명이 남는다.
- 일괄 갱신이 필요하면 §2.2 필드만 대상 단락 id 기준으로 치환하는 방식을 제안해 달라(단락 구조 변경 금지).

---

## 6. 시드 JSON 전문

아래 3개 JSON을 그대로 사용하라.

### 6.1 `application-instructor`

```json
{
  "templateCode": "application-instructor",
  "templateName": "공통_강사 신청 폼",
  "formType": "WRITING",
  "category": "APPLICATION",
  "schemaJson": {
    "schemaVersion": 1,
    "formSettings": {
      "titleNumbering": "none"
    },
    "paragraphs": [
      {
        "id": "program-instructor-application-seed-personal-info",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "개인정보 수집·이용",
        "paragraphDescription": "",
        "participatesInTitleNumbering": true,
        "tableFlavor": "field",
        "columnHeaders": [
          "수집 항목",
          "수집·이용 목적",
          "보유기간"
        ],
        "dataRows": [
          [
            "",
            "",
            ""
          ]
        ],
        "columnFields": [
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          }
        ],
        "fieldDataRows": [
          [
            {
              "kind": "text",
              "value": "이름, 연락처(휴대전화번호), 이메일"
            },
            {
              "kind": "text",
              "value": "JA 프로그램의 참가자 선발 및 프로그램 진행에 필요한 정보 안내"
            },
            {
              "kind": "text",
              "value": "이용 기간: 해당 프로그램이 진행되는 기간\n보유 기간: 동의일로부터 3년 보관 후 폐기"
            }
          ]
        ],
        "bottomText": "위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.",
        "showBottomText": true,
        "showBottomConsent": true,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-instructor-application-seed-third-party",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "개인정보 제3자 정보 제공·이용 동의",
        "paragraphDescription": "",
        "participatesInTitleNumbering": true,
        "tableFlavor": "field",
        "columnHeaders": [
          "제공받는 곳",
          "수집 항목",
          "수집·이용 목적",
          "제공받는 자의 보유기간"
        ],
        "dataRows": [
          [
            "",
            "",
            "",
            ""
          ]
        ],
        "columnFields": [
          {
            "kind": "text",
            "placeholder": "제공받는 곳을 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          }
        ],
        "fieldDataRows": [
          [
            {
              "kind": "text",
              "value": "배정된 교육 대상 학교"
            },
            {
              "kind": "text",
              "value": "이름, 개인 연락처, e-mail"
            },
            {
              "kind": "text",
              "value": "JA 프로그램 진행을 위한 업무 연락"
            },
            {
              "kind": "text",
              "value": "동의일로부터 3년 보관 후 폐기"
            }
          ]
        ],
        "bottomText": "위의 개인정보 제3자 정보 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.",
        "showBottomText": true,
        "showBottomConsent": true,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-instructor-application-seed-crime-record",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "성범죄경력 조회 동의서 제출 방법 안내",
        "paragraphDescription": "",
        "participatesInTitleNumbering": true,
        "tableFlavor": "text",
        "columnHeaders": [
          "항목",
          "내용"
        ],
        "dataRows": [
          [
            "",
            ""
          ]
        ],
        "columnFields": [],
        "fieldDataRows": [],
        "bottomText": "",
        "showBottomText": false,
        "showBottomConsent": false,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-instructor-application-seed-available-schedule",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "강의 진행 가능 일정",
        "paragraphDescription": "강의 진행이 가능한 일정을 모두 선택해 주세요.",
        "participatesInTitleNumbering": true,
        "tableFlavor": "text",
        "columnHeaders": [
          "강의 진행 가능일",
          ""
        ],
        "dataRows": [
          [
            "",
            ""
          ]
        ],
        "columnFields": [],
        "fieldDataRows": [],
        "bottomText": "",
        "showBottomText": false,
        "showBottomConsent": false,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      }
    ]
  },
  "extensionJson": {
    "overlay": {},
    "editorState": {},
    "uiState": {}
  },
  "settingsJson": null,
  "_apiStorageNote": "DB/API에는 schemaJson, extensionJson, settingsJson 각각을 JSON.stringify한 string으로 저장"
}
```

### 6.2 `application-participant-school`

```json
{
  "templateCode": "application-participant-school",
  "templateName": "일반_참여 기관 신청 폼",
  "formType": "WRITING",
  "category": "APPLICATION",
  "schemaJson": {
    "schemaVersion": 1,
    "formSettings": {
      "titleNumbering": "none"
    },
    "paragraphs": [
      {
        "id": "program-application-institution-seed-personal-info",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "개인정보 수집·이용",
        "paragraphDescription": "",
        "participatesInTitleNumbering": true,
        "tableFlavor": "field",
        "columnHeaders": [
          "수집 항목",
          "수집·이용 목적",
          "보유기간"
        ],
        "dataRows": [
          [
            "",
            "",
            ""
          ]
        ],
        "columnFields": [
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          }
        ],
        "fieldDataRows": [
          [
            {
              "kind": "text",
              "value": "이름, 학교명, 학교 소재지, 개인 연락처, 이메일"
            },
            {
              "kind": "text",
              "value": "JA 프로그램의 참가자 선발 및 프로그램 진행에 필요한 정보 안내"
            },
            {
              "kind": "text",
              "value": "이용 기간: 해당 프로그램이 진행되는 기간\n보유 기간: 동의일로부터 3년 보관 후 폐기"
            }
          ]
        ],
        "bottomText": "위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.",
        "showBottomText": true,
        "showBottomConsent": true,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-institution-seed-third-party",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "개인정보 제3자 정보 제공·이용 동의",
        "paragraphDescription": "",
        "participatesInTitleNumbering": true,
        "tableFlavor": "field",
        "columnHeaders": [
          "제공받는 곳",
          "수집 항목",
          "수집·이용 목적",
          "제공받는 자의 보유기간"
        ],
        "dataRows": [
          [
            "",
            "",
            "",
            ""
          ]
        ],
        "columnFields": [
          {
            "kind": "text",
            "placeholder": "제공받는 곳을 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          }
        ],
        "fieldDataRows": [
          [
            {
              "kind": "text",
              "value": ""
            },
            {
              "kind": "text",
              "value": "이름, 학교명, 학교 소재지, 개인 연락처, 이메일"
            },
            {
              "kind": "text",
              "value": "JA 프로그램의 참가자 선발 및\n프로그램 진행에 필요한 정보 안내"
            },
            {
              "kind": "text",
              "value": "동의일로부터 3년 보관 후 폐기"
            }
          ]
        ],
        "bottomText": "위의 개인정보 제3자 정보 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.",
        "showBottomText": true,
        "showBottomConsent": true,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-institution-seed-basic-info",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "기본 정보",
        "paragraphDescription": "설명 입력",
        "participatesInTitleNumbering": true,
        "tableFlavor": "text",
        "columnHeaders": [
          "항목",
          "내용"
        ],
        "dataRows": [
          [
            "",
            ""
          ]
        ],
        "columnFields": [],
        "fieldDataRows": [],
        "bottomText": "",
        "showBottomText": false,
        "showBottomConsent": false,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-institution-seed-guidance",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "안내 사항",
        "paragraphDescription": "강사님들에게 제공 또는 요청할 사전 정보를 작성해 주세요.",
        "participatesInTitleNumbering": true,
        "tableFlavor": "field",
        "columnHeaders": [
          "항목",
          "내용"
        ],
        "dataRows": [
          [
            "",
            ""
          ],
          [
            "",
            ""
          ],
          [
            "",
            ""
          ],
          [
            "",
            ""
          ]
        ],
        "columnFields": [
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          },
          {
            "kind": "subjective",
            "placeholder": "답변을 입력해 주세요"
          }
        ],
        "fieldDataRows": [
          [
            {
              "kind": "text",
              "value": "강의 공간 내 컴퓨터 여부\n강의 공간 내 사용 가능한 컴퓨터가 있다면 몇대 있는지, USB 사용 가능 여부 등의 안내사항을 작성해 주세요."
            },
            {
              "kind": "subjective",
              "value": ""
            }
          ],
          [
            {
              "kind": "text",
              "value": "대기 장소 안내\n강사님들이 대기할 수 있는 장소를 상세히 작성해 주세요. (ex. 본관 2층 3학년 연구실)"
            },
            {
              "kind": "subjective",
              "value": ""
            }
          ],
          [
            {
              "kind": "text",
              "value": "식사 가능 여부 및 안내\n강사님들의 식사 방법과 관련하여 안내사항을 작성해 주세요. (ex. 식사 불가, 인당 4500원 지불 후 급식실에서 식사 가능 등)"
            },
            {
              "kind": "subjective",
              "value": ""
            }
          ],
          [
            {
              "kind": "text",
              "value": "기타 특이사항(주차, 전달사항 등)\n주차 안내나 기타 전달사항이 있다면 작성해 주세요."
            },
            {
              "kind": "subjective",
              "value": ""
            }
          ]
        ],
        "bottomText": "",
        "showBottomText": false,
        "showBottomConsent": false,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-institution-seed-sex-offense-consent-submission",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "성범죄 경력 조회 동의서 제출 요청",
        "paragraphDescription": "강사님들의 성범죄 경력 조회 동의서 제출이 필요하신 경우, 동의서 제출을 요청해 주세요. 미요청 시 전달되지 않습니다.",
        "participatesInTitleNumbering": true,
        "tableFlavor": "text",
        "columnHeaders": [
          "항목",
          "내용"
        ],
        "dataRows": [
          [
            "",
            ""
          ]
        ],
        "columnFields": [],
        "fieldDataRows": [],
        "bottomText": "",
        "showBottomText": false,
        "showBottomConsent": false,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-institution-seed-sex-offense-consent-inquiry",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "성범죄 경력 조회 동의서 조회 방식",
        "paragraphDescription": "성범죄경력 조회 동의서의 조회 방식을 선택해 주세요.",
        "participatesInTitleNumbering": true,
        "tableFlavor": "text",
        "columnHeaders": [
          "항목",
          "내용"
        ],
        "dataRows": [
          [
            "",
            ""
          ]
        ],
        "columnFields": [],
        "fieldDataRows": [],
        "bottomText": "",
        "showBottomText": false,
        "showBottomConsent": false,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-institution-seed-schedule",
        "kind": "single_item",
        "variant": "multiple_choice",
        "requiredMark": true,
        "paragraphTitle": "진행 희망 교육 일정",
        "paragraphDescription": "프로그램 등록 시 노출되는 항목에 따라 설명글을 작성해 주세요.",
        "participatesInTitleNumbering": true,
        "answerRequired": true,
        "allowMultiple": true,
        "items": [
          {
            "id": "institution-schedule-slot-1",
            "label": "26년 4월 20일(일) 9:30 ~ 12:20"
          },
          {
            "id": "institution-schedule-slot-2",
            "label": "26년 4월 27일(월) 13:00 ~ 15:50"
          }
        ],
        "selectedPreviewSingleId": null,
        "selectedPreviewMultipleIds": []
      }
    ]
  },
  "extensionJson": {
    "overlay": {},
    "editorState": {},
    "uiState": {}
  },
  "settingsJson": null,
  "_apiStorageNote": "DB/API에는 schemaJson, extensionJson, settingsJson 각각을 JSON.stringify한 string으로 저장"
}
```

### 6.3 `application-economy`

```json
{
  "templateCode": "application-economy",
  "templateName": "1사1교_참여 기관 신청 폼",
  "formType": "WRITING",
  "category": "APPLICATION",
  "schemaJson": {
    "schemaVersion": 1,
    "formSettings": {
      "titleNumbering": "none"
    },
    "paragraphs": [
      {
        "id": "program-application-economy-seed-personal-info",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "개인정보 수집·이용",
        "paragraphDescription": "",
        "participatesInTitleNumbering": true,
        "tableFlavor": "field",
        "columnHeaders": [
          "수집 항목",
          "수집·이용 목적",
          "보유기간"
        ],
        "dataRows": [
          [
            "",
            "",
            ""
          ]
        ],
        "columnFields": [
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          }
        ],
        "fieldDataRows": [
          [
            {
              "kind": "text",
              "value": "이름, 기관명, 기관 소재지, 개인 연락처, 이메일"
            },
            {
              "kind": "text",
              "value": "JA 프로그램의 참가자 선발 및 프로그램 진행에 필요한 정보 안내"
            },
            {
              "kind": "text",
              "value": "이용 기간: 해당 프로그램이 진행되는 기간\n보유 기간: 동의일로부터 3년 보관 후 폐기"
            }
          ]
        ],
        "bottomText": "위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.",
        "showBottomText": true,
        "showBottomConsent": true,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-economy-seed-third-party",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "개인정보 제3자 정보 제공·이용 동의",
        "paragraphDescription": "",
        "participatesInTitleNumbering": true,
        "tableFlavor": "field",
        "columnHeaders": [
          "제공받는 곳",
          "수집 항목",
          "수집·이용 목적",
          "제공받는 자의 보유기간"
        ],
        "dataRows": [
          [
            "",
            "",
            "",
            ""
          ]
        ],
        "columnFields": [
          {
            "kind": "text",
            "placeholder": "제공받는 곳을 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          },
          {
            "kind": "text",
            "placeholder": "텍스트를 입력해 주세요"
          }
        ],
        "fieldDataRows": [
          [
            {
              "kind": "text",
              "value": ""
            },
            {
              "kind": "text",
              "value": "이름, 학교명, 학교 소재지, 개인 연락처, 이메일"
            },
            {
              "kind": "text",
              "value": "JA 프로그램의 참가자 선발 및\n프로그램 진행에 필요한 정보 안내"
            },
            {
              "kind": "text",
              "value": "동의일로부터 3년 보관 후 폐기"
            }
          ]
        ],
        "bottomText": "위의 개인정보 제3자 정보 제공·이용에 대한 동의를 거부할 권리가 있습니다. 그러나 동의하지 않을 시 해당 프로그램에 참여가 불가합니다.",
        "showBottomText": true,
        "showBottomConsent": true,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-economy-seed-basic-info",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "기본 정보",
        "paragraphDescription": "",
        "participatesInTitleNumbering": true,
        "tableFlavor": "text",
        "columnHeaders": [
          "항목",
          "내용"
        ],
        "dataRows": [
          [
            "",
            ""
          ]
        ],
        "columnFields": [],
        "fieldDataRows": [],
        "bottomText": "",
        "showBottomText": false,
        "showBottomConsent": false,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-economy-seed-guidance",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "안내 사항",
        "paragraphDescription": "강사님들에게 제공 또는 요청할 사전 정보를 작성해 주세요.",
        "participatesInTitleNumbering": true,
        "tableFlavor": "text",
        "columnHeaders": [
          "항목",
          "내용"
        ],
        "dataRows": [
          [
            "",
            ""
          ]
        ],
        "columnFields": [],
        "fieldDataRows": [],
        "bottomText": "",
        "showBottomText": false,
        "showBottomConsent": false,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-economy-seed-sex-offense-consent-submission",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "성범죄 경력 조회 동의서 제출 요청",
        "paragraphDescription": "강사님들의 성범죄 경력 조회 동의서 제출이 필요하신 경우, 동의서 제출을 요청해 주세요. 미요청 시 전달되지 않습니다.",
        "participatesInTitleNumbering": true,
        "tableFlavor": "text",
        "columnHeaders": [
          "항목",
          "내용"
        ],
        "dataRows": [
          [
            "",
            ""
          ]
        ],
        "columnFields": [],
        "fieldDataRows": [],
        "bottomText": "",
        "showBottomText": false,
        "showBottomConsent": false,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-economy-seed-sex-offense-consent-inquiry",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "성범죄 경력 조회 동의서 조회 방식",
        "paragraphDescription": "성범죄경력 조회 동의서의 조회 방식을 선택해 주세요.",
        "participatesInTitleNumbering": true,
        "tableFlavor": "text",
        "columnHeaders": [
          "항목",
          "내용"
        ],
        "dataRows": [
          [
            "",
            ""
          ]
        ],
        "columnFields": [],
        "fieldDataRows": [],
        "bottomText": "",
        "showBottomText": false,
        "showBottomConsent": false,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-economy-seed-lesson-reply",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "결연 금융 회사명",
        "paragraphDescription": "*결연 확인 방법*\n1. 금융감독원 e-금융교육센터 홈페이지(www.fss.or.kr/edu) 접속\n2. 메인화면 [1사1교 금융교육] 클릭\n3. 1사1교 금융교육 프로그램 안내페이지에서 하단의 [결연현황 조회] 클릭\n4. [학교명]에 소속 학교 검색 후 결연된 금융사 확인",
        "participatesInTitleNumbering": true,
        "tableFlavor": "text",
        "columnHeaders": [
          "항목",
          "내용"
        ],
        "dataRows": [
          [
            "",
            ""
          ]
        ],
        "columnFields": [],
        "fieldDataRows": [],
        "bottomText": "",
        "showBottomText": false,
        "showBottomConsent": false,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-economy-seed-education-experience",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "전년도 1사1교 경제금융교육 진행 여부",
        "paragraphDescription": "",
        "participatesInTitleNumbering": true,
        "tableFlavor": "text",
        "columnHeaders": [
          "항목",
          "내용"
        ],
        "dataRows": [
          [
            "",
            ""
          ]
        ],
        "columnFields": [],
        "fieldDataRows": [],
        "bottomText": "",
        "showBottomText": false,
        "showBottomConsent": false,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      },
      {
        "id": "program-application-economy-seed-preferred-schedule",
        "kind": "single_item",
        "variant": "horizontal_table",
        "requiredMark": true,
        "paragraphTitle": "진행 희망 교육 일정",
        "paragraphDescription": "교육을 희망하는 날짜와 진행 차시를 2지망까지 작성해 주세요. 수업은 1일, 최대 2차시까지 운영됩니다. (2차시는 연강으로만 진행 가능합니다. ex. 2교시 시작 시 3교시까지 진행)",
        "participatesInTitleNumbering": true,
        "tableFlavor": "text",
        "columnHeaders": [
          "항목",
          "내용"
        ],
        "dataRows": [
          [
            "",
            ""
          ]
        ],
        "columnFields": [],
        "fieldDataRows": [],
        "bottomText": "",
        "showBottomText": false,
        "showBottomConsent": false,
        "bottomConsent": "agree",
        "answerRequired": true,
        "idTypeWithInput": null
      }
    ]
  },
  "extensionJson": {
    "overlay": {},
    "editorState": {},
    "uiState": {}
  },
  "settingsJson": null,
  "_apiStorageNote": "DB/API에는 schemaJson, extensionJson, settingsJson 각각을 JSON.stringify한 string으로 저장"
}
```

---

## 7. 검증

```bash
API_BASE="${API_BASE:-http://127.0.0.1:8080}"
# ADMIN_JWT 는 관리자 로그인 + MFA 후 accessToken

for CODE in application-instructor application-participant-school application-economy; do
  echo "=== $CODE ==="
  curl -sS -H "Authorization: Bearer $ADMIN_JWT" \
    "$API_BASE/api/admin/form-templates?size=100" \
    | jq --arg c "$CODE" '.data.content[]? // .content[]? | select(.templateCode==$c) | {templateCode, templateName, latestVersionId}'
done

# latestVersionId 를 넣고 대상 단락 확인
VID="<latestVersionId>"
curl -sS -H "Authorization: Bearer $ADMIN_JWT" \
  "$API_BASE/api/admin/form-template-versions/$VID" \
  | jq '.data.schemaJson // .schemaJson | if type=="string" then fromjson else . end
      | .paragraphs[]
      | select(.id|test("crime-record|sex-offense-consent-inquiry"))
      | {id, paragraphTitle, paragraphDescription}'
```

기대값:

| templateCode | id | paragraphTitle | paragraphDescription |
|--------------|----|----------------|----------------------|
| `application-instructor` | `program-instructor-application-seed-crime-record` | `성범죄경력 조회 동의서 제출 방법 안내` | `""` |
| `application-participant-school` | `program-application-institution-seed-sex-offense-consent-inquiry` | `성범죄 경력 조회 동의서 조회 방식` | `성범죄경력 조회 동의서의 조회 방식을 선택해 주세요.` |
| `application-economy` | `program-application-economy-seed-sex-offense-consent-inquiry` | `성범죄 경력 조회 동의서 조회 방식` | `성범죄경력 조회 동의서의 조회 방식을 선택해 주세요.` |

추가로 API `schemaJson`(파싱) 과 §6 JSON의 `schemaJson` 을 `jq -S` 로 비교해 diff가 없으면 완료.

---

## 8. 완료 체크리스트

- [ ] 3종 재시드 완료, §7 기대값 일치
- [ ] 중복 template/version 행 없음
- [ ] 강사 신청 성범죄 단락 응답 `{ "confirmed": true }` 수용, 파일 필수 검증 제거
- [ ] `hiddenQuestionKeys` 에서 강사 신청 성범죄 단락 숨김 로직 제거
- [ ] 기존 프로그램 바인딩 갱신 여부 FE 회신
