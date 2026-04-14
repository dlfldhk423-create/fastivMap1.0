---
url: 'https://developers-apps-in-toss.toss.im/user-hash-key/intro.md'
description: '유저 식별키 발급 서비스 소개입니다. 주요 기능, 혜택, 적용 방법을 확인하세요.'
---

# 이해하기

유저 식별키 발급은 사용자의 동의 절차 없이도 바로 서비스를 사용할 수 있게 해요.

***

## 유저 식별키 발급이란 무엇인가요

유저 식별키 발급은 별도의 서버를 만들지 않아도, 그리고 사용자 동의 절차 없이도 사용자를 식별할 수 있도록 돕는 기능이에요.\
동의 과정 없이 사용자가 즉시 서비스를 시작할 수 있도록 유저 식별키 발급 기능을 제공해요.

| **구분**       | **토스 로그인** | **유저 식별키 발급**                   |
| -------------- | --------------- | -------------------------------------- |
| 사용 가능 대상 | 모든 제휴사     | 모든 미니앱                            |
| 사용 함수      | `appLogin`      | `getUserKeyForGame`, `getAnonymousKey` |
| 서버 구축 필요 | 필요            | 불필요                                 |
| 콘솔 설정      | 필요            | 불필요                                 |
| 유저 동의      | 필요            | 불필요                                 |

***

## 유저 식별키 발급을 사용하면 어떤 점이 좋나요

* 서버 간 연동이 필요 없어요.
* 미니앱 안에서 사용자를 안정적으로 식별할 수 있어요.

***

## 참고해 주세요

* 게임 미니앱은 [`getUserKeyForGame`](/bedrock/reference/framework/게임/getUserKeyForGame.html)을, 비게임 미니앱은 [`getAnonymousKey`](/bedrock/reference/framework/비게임/getAnonymousKey.html)를 사용해 주세요.
* 토스 로그인에 대한 자세한 내용은 [가이드 문서](/login/intro.html)를 참고해 주세요.
