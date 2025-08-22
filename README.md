# 7-MyBiasPhoto-team1-BE

## Team 1

https://www.notion.so/23fbb64da38080e78b66c50a46302974

## 팀원 구성

이유진

김성근

김제성

김태홍

정남영

정우진

---

## 프로젝트 소개

개인용 디지털 사진첩 생성 플랫폼, 최애의 포토
"최애의 포토"는 디지털 시대의 새로운 수집 문화를 선도하는 플랫폼입니다. 자신이 좋아하는 아이돌이나 스포츠 스타, 그림 등 디지털 포토카드를 손쉽게 사고팔 수 있는 공간으로,
특별한 커뮤니티를 제공합니다. 이제는 좋아하는 포토카드를 실제로 모으는 것뿐만 아니라, 디지털 자산으로 소장하며 나만의 컬렉션을 완성할 수 있습니다. 서로의 포토카드를 교환하고,
나만의 포토카드를 자랑하는 재미와 함께 상호 교류도 즐길 수 있는 플랫폼, "최애의 포토"에서 만나보세요!

프로젝트 기간: 2025.07.30 ~ 2024.08.21

### 기술 스택
- Frontend: JavaScript, Next.js, React
- Backend: Node.js, Express
- Database: PostgreSQL
- 공통 Tool: Git & Github, Discord

---

## 팀원별 구현 기능 상세

### 이유진

- 자신이 개발한 기능에 대한 사진이나 gif 파일 첨부

### 김성근

- 자신이 개발한 기능에 대한 사진이나 gif 파일 첨부

### 김제성

- 자신이 개발한 기능에 대한 사진이나 gif 파일 첨부

### 김태홍

- Access & Refresh Token 기반 인증 구현
- Refresh Token 전략 구현
- Google & Kakao OAuth 구현

### 정남영

- 자신이 개발한 기능에 대한 사진이나 gif 파일 첨부

### 정우진

- 구매/판매 API
- 이벤트(구매/판매/교환 등) 발생시 알림 API
- 동시성처리, 에러 규격화

---

## 파일 구조
```
.
├── package-lock.json
├── package.json
├── prisma
│   ├── data
│   │   ├── photoCard.js
│   │   └── user.js
│   ├── migrations
│   ├── schema.prisma
│   ├── seed.js
│   └── seeds
│       ├── see-user.js
│       ├── seed-photoCard.js
│       ├── seed-sale.js
│       └── seed-userCard.js
├── README.md
├── server.js
├── src
│   ├── common
│   │   ├── constants
│   │   │   ├── date.js
│   │   │   └── enum.js
│   │   ├── middleware
│   │   │   ├── errorHandler.js
│   │   │   ├── validate.js
│   │   │   └── verifyAccessToken.js
│   │   └── utils
│   │       ├── apiError.js
│   │       ├── jwt.js
│   │       ├── opaque.js
│   │       ├── pickPoints.js
│   │       ├── prisma.js
│   │       └── throwApiErrors.js
│   ├── generated
│   │   └── prisma
│   │       ├── default.d.ts
│   │       ├── default.js
│   │       ├── edge.d.ts
│   │       ├── edge.js
│   │       ├── index-browser.js
│   │       ├── index.d.ts
│   │       ├── index.js
│   │       ├── libquery_engine-darwin-arm64.dylib.node
│   │       ├── package.json
│   │       ├── runtime
│   │       ├── schema.prisma
│   │       ├── wasm.d.ts
│   │       └── wasm.js
│   └── modules
│       ├── auth
│       │   ├── controller.js
│       │   ├── passport.js
│       │   ├── repository.js
│       │   ├── routes.js
│       │   ├── schema
│       │   └── service.js
│       ├── exchange
│       │   ├── controller.js
│       │   ├── repository.js
│       │   ├── routes.js
│       │   ├── schema
│       │   ├── service.js
│       │   └── transaction.js
│       ├── notification
│       │   ├── controller.js
│       │   ├── index.js
│       │   ├── repository.js
│       │   ├── routes.js
│       │   ├── schema
│       │   ├── service.js
│       │   └── transaction.js
│       ├── photoCard
│       │   ├── controller.js
│       │   ├── repository.js
│       │   ├── routes.js
│       │   ├── schema
│       │   ├── service.js
│       │   ├── transaction.js
│       │   └── upload.js
│       ├── point
│       │   ├── controller.js
│       │   ├── CooldownRepository.js
│       │   ├── repository.js
│       │   ├── routes.js
│       │   ├── schema
│       │   ├── service.js
│       │   └── transaction.js
│       ├── sale
│       │   ├── controller.js
│       │   ├── repository.js
│       │   ├── routes.js
│       │   ├── saleTransaction.js
│       │   ├── schema
│       │   ├── service.js
│       │   └── transaction.js
│       ├── user
│       │   ├── controller.js
│       │   ├── repository.js
│       │   ├── routes.js
│       │   ├── schema
│       │   └── service.js
│       └── userCard
│           ├── controller.js
│           ├── repository.js
│           ├── routes.js
│           ├── schema
│           ├── service.js
│           └── transaction.js
├── test.http
├── uploads
└── wjtest.http
```
---

## 구현 홈페이지

https://7-my-bias-photo-team1-fe-theta.vercel.app
https://7-mybiasphoto-team1-be-production.up.railway.app
---

## 프로젝트 회고록

(제작한 발표자료 링크 혹은 첨부파일 첨부)
