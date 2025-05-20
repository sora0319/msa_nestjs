# msa_nestjs
이벤트 / 보상 관리 플랫폼 구성

### 파일 실행 방법
```
docker-compose up -d --build
```


### 배운 점
Nestjs를 처음 사용해보면서 Nestjs를 알기 위해 공부를 하며, 기존 Nodejs와의 차이와 느겼습니다.
Node.js는 자바스크립트 런타임 환경에서서 서버를 구축하고 다양한 기능을 빠르게 구현할 수 있도록 해주어서 Express와 같은 간단한 프레임워크를 사용해 빠르게 구현할 수 있었습니다.
그러나 직접 사용해 보았을 때 java의 spring boot에 비해 빠르게 구축할 수 있었지만, 구조화된 코드 관리는 할 수 없었습니다.
  
NestJS는 Node.js 기반의 프레임워크이지만, 모듈화와 의존성 주입, 데코레이터, 타입스크립트 기반의 정적 타입 지원 등 엔터프라이즈 개발에 최적화된 다양한 기능을 제공합니다. NestJS를 활용하면서 서비스의 규모가 커져도 코드의 유지보수성과 확장성을 자연스럽게 확보할 수 있는 서비스라는 것을 알게 되었습니다.
  
이전에 경험해 보았던 Express, Nodejs, Spring Boot와 비교해 보았을 때 typescript로 구성된 Spring Boot 서비스와 많이 비슷하다고 느겼습니다
또한 데코레이터를 잘 활용해야 확장성이 높은 서비스를 만들 수 있다는 것을 배울 수 있었습니다. 상속 받아서 사용하는 것과 비슷하지만, 자신이 원하는 기능의 어떤 것이든 확장하여서 사용할 수 있도록 하는 개발 구조가 개발자에게 높은 자유도를 준다는 느낌을 받았습니다.

<br/>

### 고민한 점
#### 1. DB의 컬렉션 설계 고민
NoSQL이 연관관계가 아닌 document 방식이다보니 데이터는 쉽게 저장가능하지만, 어떤 값을 중복시킬지에 대해 고민하였습니다.
특히 이벤트 기간과 이벤트 종류 간의 관계에 대해 많이 고민하였습니다.
이벤트 기간은 기간와 활성화 상태로 간단하게 구성이 되지만, 이벤트 종류는 확장 가능성을 고려해야 되었습니다.

현재 설계한 기능으로는 (매일 출석, 기간 출석, 접속 시간) 에 대한 보상을 구성하였습니다. 그러나 이 이벤트 종류는 무궁무진하게 변할 수 있는 것이고, 이벤트 조건도 많이 변할 수 있는 것이라고 생각하였습니다.
그래서 초반에는 기간과 종류를 같은 컬렉션에 저장을 하였지만, 이렇게 설계하니, 확장을 하지 못한다는 단점이 보였습니다.

그래서 확장성을 더 중점적으로 두고자, 보상 정책을 따로 두고 이벤트에서는 보상 정책에 관해 참조를 하도록 구성하였습니다.
이로 인해 서버에서 데이터 조회 시 2개의 컬렉션을 함께 조회하는 빈도가 늘어나겠지만, 서비스 확장성에서는 편하게 할 수 있도록 된 것 같습니다.


#### 2. DB 개수 고민
MSA 구조화 설계 시 MongoDB와 서버와의 연계에 대해 트랜젝션 충돌에 대해 고민을 하였습니다. 1개의 DB로 2개의 서버가 접근을 한다면 관리의 측면에서는 docker container가 1개만 사용하여서 관리는 편하겠지만, 트랜젝션 충돌이 일어날 것 같았습니다.

이것에 대해 2개의 DB로 각 서버에 할당을 하면 충돌이 일어나지는 않겠지만, 관리의 불편함과 사용자 정보를 Event Server에서 사용을 하는 것에 대해 어떻게 대처를 할지 고민을 하였습니다.

그 결과 JWT 토큰에 토큰 생성 시 생성 인자에 사용자 id 정보를 넣어서 조회 시 빠르게 구축할 수 있도록 계획하였습니다.
보안에는 문제가 있겠지만, 사용자가 모든 서비스에서 본인에 대한 정보를 찾으려고 할 때 Auth Server에 계속 요청을 넣어야 하는 상황이 발생하고, 그러면 요청이 과부화 될 것이라고 생각하여서 이 방식으로 구성하였습니다.

더 나은 방식이 있을지 고민해보고 DB의 구조를 바꾸던가, 새로운 방식을 찾아보아야 겠습니다.


#### 4. API Gateway와 서비스 Server 간의 연결
처음에는 Nestjs를 잘 알지 못하여서 API Gateway에 요청을 받으면 인증 인가를 한 후에 REST API로 라우팅을 해주어야 하나 생각을 하였습니다. 이러한 생각의 이유는 이전까지 사용하였던 Framework 들에서 프로젝트를 할 당시에 API Gateway는 라우팅 역할 만 맡았고, 인증, 인가를 하는 다른 서버가 존재하였기 때문입니다. 그래서 초기 구상은 그렇게 하였지만, Nestjs에 대해 공부를 하면서 데코레이터에 대해 알게 되었고, 이것을 사용하면 의존성 주입 및 기능 확장이 편리해진다는 것을 알게 되었습니다. 

알게된 것을 바탕으로 AuthGuard를 사용해 데코레이터를 구성하여 인증, 인가를 설계하였고, Nestjs에서 proxy 환경에 라우팅을 설정하여서 접근하는 주소에 따른 라우팅에 대해 계획을 세울 수 있었습니다.

그러나 입력 라우팅 주소에 대해 역할 별로도 접근을 막아야 하는데 라우팅 규칙이 역할에 따라 일정하지가 않아서 그 부분에 대해 고민을 하고 있습니다.
라우팅 규칙에서 어떻게 해야 역할 별로 편리하게 구별이 될 수 있을 지 공부가 필요하다는 것을 느꼈습니다.

#### 4. Docker 실행 환경
현재 윈도우 환경에서 Docker Desktop을 실행하여 Container를 생성하였습니다.
그러나 윈도우 환경에서 Docker를 사용하기 위해선 wsl을 사용하여 Ubuntu환경을 설치해 주어야 Docker 가 실행됩니다.

이러한 환경 구성에 있어서 1,2개의 image  생성과 실행은 괜찮았지만 5개의 image를 생성하고 Container로 운영하려고 하니, 실행할 image와 용량이 커서, Docker가 자꾸 멈추게 되었습니다.
이러한 상황에서 용량을 관리하는 방법이나, 새로운 방법으로 Docker를 안정적으로 구축할 수 있는 방법에 대해 찾아보아야 겠습니다. 


 
<br/>

# 서비스 구성

## ✅ API Gateway 조건

- **AccessToken & RefreshToken**은 `HttpOnly`, `Secure` 쿠키로 생성되어 Api Gate way에 전달된다다
- **JWT 검증은 API Gateway에서 수행한다다**
- Auth Server는 Gateway로부터 유효한 사용자 정보를 받은 상태로 동작
- **클라이언트는 토큰을 직접 다루지 않으며, 쿠키를 자동 전송**


  
<br/>  

## ✅ Auth Server – 사용자 관 API 설계


### 사용자 인증 관련 API

| 기능 | Method | URL | 인증 필요 | 비고 |
| --- | --- | --- | --- | --- |
| 회원가입 | POST | /auth/signup | ❌ |  |
| 로그인 | POST | /auth/login | ❌ | JWT 발급 |
| 이메일 중복 검사 | GET | /auth/email/valid | ❌ |  |
| 내 정보 조회 | GET | /auth/user/info | ✅ 관리자(admin), 감사자 (auditor),운영자(operator) 사용자(user) | 토큰 필요 |
| 사용자 목록 조회 | GET | /auth/users/list | ✅ 관리자(admin) | role 필터 가능 |
| 역할 변경 | PATCH | /auth/users/:id/role | ✅ 관리자(admin) | role 필터 가능 |
| 재발급 | GET | /auth/retake | ✅ 관리자(admin), 감사자 (auditor),운영자(operator) 사용자(user) | refresh 토큰 필요 |

### 📌 1. 회원가입

- **Endpoint**: `POST /auth/signup`
- **Request DTO**: `SignupRequestDto`

```
{
  email: string;
  password: string;
  nickname: string;
}

```

- **Response**:
    - 201 Created
    - JWT 발급 없이 사용자만 생성 (토큰은 로그인에서 발급)

---

### 📌 2. 로그인 (토큰을 쿠키로 설정)

- **Endpoint**: `POST /auth/login`
- **Request DTO**: `LoginRequestDto`

```
{
  email: string;
  password: string;
}

```

- **Response**:
    - `Set-Cookie: accessToken=...; HttpOnly; Secure; Path=/; SameSite=None`
    - `Set-Cookie: refreshToken=...; HttpOnly; Secure; Path=/; SameSite=None`
    - Optional body: `{ message: 'Login successful' }`

---

### 📌 3. 로그아웃

- **Endpoint**: `POST /auth/logout`
- **Response**:
    - `Set-Cookie: accessToken=; Max-Age=0`
    - `Set-Cookie: refreshToken=; Max-Age=0`

---

### 📌 4. 내 정보 조회

- **Endpoint**: `GET /auth/user/info`
- **전제 조건**: Gateway에서 JWT를 검증하고 사용자 ID와 role을 전달
- **요청 헤더** (예: 내부 서비스 간 통신)
    
    ```
    X-User-Id: userId123
    X-User-Role: USER
    
    ```
    
- **Response DTO**:

```
// UserResponseDto
{
  email: string;
  role: 'USER' | 'ADMIN' | 'OBSERVER';
  nickname: string;
  createdAt: string;
  points: int;
}

```

---

### 📌 5. 사용자 목록 조회 (Admin 전용)

- **Endpoint**: `GET /auth/users/list`
- **인증 정보**: Gateway에서 역할 검사 후 통과한 요
- **Response DTO**:

```
// UserListResponseDto
[
{
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'OBSERVER';
  nickname?: string;
  createdAt: string;
},
{
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'OBSERVER';
  nickname?: string;
  createdAt: string;
}
]

```

---

### 📌 6. 사용자 역할 변경 (Admin 전용)

- **Endpoint**: `PATCH /auth/users/:id/role`
- **Request DTO**: `UpdateUserRoleDto`

```
{
  role: 'USER' | 'ADMIN' | 'OBSERVER';
}

```

- **Response**: 201


<br/>

## ✅ Auth Server – MongoDB 스키마 설계 (User)

### 📦 컬렉션: `users`

## ✅ Mongoose 스키마 정의


## 1️⃣ **user-role.enum.ts**

```
// src/common/enums/user-role.enum.ts

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  AUDITOR = 'AUDITOR',
}

```

<br/>

## 2️⃣ **user.schema.ts**

```

// src/users/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  nickname: string;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  lastLogoutAt?: Date;

  @Prop({ default: 0 })
  points: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

```


<br/>

## ✅ 주요 설명

| 필드명 | 설명 |
| --- | --- |
| `email` | 이메일 |
| `password` | 해시된 비밀번호 |
| `nickname` | 필수 닉네임 |
| `role` | 사용자 역할 (`USER`, `ADMIN`, `OPERATOR`,  `AUDITOR` ) |
| `isActive` | 비활성 계정 여부 (soft delete 등 활용 가능) |
| `lastLoginAt` | 마지막 로그인 시각 |
| `createdAt` | 생성 시각 (자동) |
| `updatedAt` | 수정 시각 (자동) |
| `lastLogoutAt` | 마지막 로그아웃 시각 |
| `points` | 가지고 있는 재화 |


<br/>

## ✅ Event Server  – 이벤트/보상 플랫폼 API 설계



### 이벤트/보상 관련 API

| 기능 | Method | URL | 인증 필요 | 비고 |
| --- | --- | --- | --- | --- |
| 전체 활성 이벤트 목록 | GET | /event/active | ✅사용자(user)
관리자(admin) | 현재 진행중인 이벤트 확인 |
| 내 이벤트 진행 목록 | GET | /event/user/progress | ✅사용자(user)
관리자(admin) |  |
| 이벤트 진행(조회+상태갱신) | GET | /event/user/progresses/:eventId | ✅ 사용자(user)
관리자(admin) | 조회 시 상태 자동 갱신 |
| 보상 수령 신청 | POST | /event/user/progresses/:eventId/reward | ✅ 사용자(user)
관리자(admin) | 조건 충족 시만 |
| 내 보상 이력 조회 | GET | /event/user/rewards | ✅ 사용자(user)
관리자(admin) | 내가 받은 보상 전체 |
| 사용자 보상 이력 조회 | GET | /event/rewards | ✅관리자(admin), 운영자(operator), 감사자 (auditor) | 모든 사용자 보상 이력 조회 |
| 보상 정책 등록 | POST | /event/:eventId/rewards/policies | ✅ 관리자(admin), 운영자(operator) |  |
| 보상 정책 수정 | PATCH | /event/:eventId/rewards/policies/:rewardId | ✅ 관리자(admin), 운영자(operator) |  |
| 전체 이벤트 목록 | GET | /event/list | ✅관리자(admin), 운영자(operator) | 생성된 모든 이벤트 목록 확인 |
| 이벤트 등록 | POST | /event/register | ✅관리자(admin), 운영자(operator) |  |
| 이벤트 수정 | PATCH | /event/:eventId | ✅ 관리자(admin), 운영자(operator) |  |
| 이벤트 상태변경 | PATCH | /event/:eventid/status | ✅관리자(admin), 운영자(operator) | 활성/비활성 |


<br/>
<br/>

## ✅ 주요 API별 DTO 정의

### 📌 1. 전체 활성 이벤트 목록

**GET `/event/active`**

**Response DTO:**

```
// EventActiveResponseDto
[
  {
    id: string;
    title: string;
    description: string;
    type: 'daily_check_in' | 'streak_check_in' | 'session_time';
    startAt: string;
    endAt: string;
    status: 'ACTIVE' | 'INACTIVE';
    rewardPolicy: {
      id: string;
      name: string;
      condition: {
        type: 'daily_check_in' | 'streak_check_in' | 'session_time';
        requiredDays?: number;
        requiredStreak?: number;
        requiredSeconds?: number;
      };
      reward: {
        type: string;
        amount: number;
      };
    };
  }
]

```

---

### 📌 2. 내 이벤트 진행 목록

**GET `/event/user/progress`**

**Response DTO:**

```
// UserEventProgressListDto
[
  {
    eventId: string;
    eventTitle: string;
    type: 'daily_check_in' | 'streak_check_in' | 'session_time';
    progressData: any;
    isCompleted: boolean;
    isRewarded: boolean;
    rewardPolicy: {
      name: string;
      condition: { ... };
      reward: { type: string; amount: number; }
    };
  }
]

```
<br/>

---

### 📌 3. 이벤트 진행(조회+상태갱신)

**GET `/event/user/progresses/:eventId`**

**Response DTO:** 

```
// UserEventProgressDetailDto 
{
  eventId: string;
  progressData:
    | { checkedDates: string[] }                    // daily_check_in
    | { currentStreak: number; lastCheckedDate: string } // streak_check_in
    | { totalSeconds: number };                     // session_time
  isCompleted: boolean;
  isRewarded: boolean;
  rewardPolicy: {
    name: string;
    condition: { ... };
    reward: { type: string; amount: number; }
  };
}

```
<br/>

---

### 📌 4. 보상 수령 신청

**POST `/event/user/progresses/:eventId/reward`**

**Response DTO:**

```
// UserRewardReceiveResponseDto
{
  reward: { type: string; amount: number;} 
}

```
<br/>

---

### 📌 5. 내 보상 이력 조회

**GET `/event/user/rewards`**

**Response DTO:**

```
// UserRewardHistoryListDto
[
  {
    eventId: string;
    rewardPolicyId: string;
    reward: { type: string; amount: number; };
  }
]

```
<br/>

---

### 📌 6. 사용자 보상 이력 전체 조회

**GET `/event/rewards`** (관리자, 운영자, 감사자 전용)

**Query**

- `userId?` (optional): 특정 사용자만 조회

**Response DTO:**

```
// AllUserRewardHistoryListDto
[
  {
    id: string;
    userId: string;
    eventId: string;
    rewardPolicyId: string;
    reward: { type: string; amount: number; };
    issuedAt: string;
  }
]

```
<br/>

---

### 📌 7. 보상 정책 등록

**POST `/event/rewards/policies`**

**Request DTO:**

```
// RewardPolicyCreateDto
{
  reward: {
    type: string;
    amount: number;
  };
}

```
<br/>

---

### 📌 8. 보상 정책 수정

**PATCH `/event/rewards/policies/:rewardId`**

**Request DTO:**

```
// RewardPolicyUpdateDto
{
  name?: string;
  condition?: {
    type?: 'daily_check_in' | 'streak_check_in' | 'session_time';
    requiredDays?: number;
    requiredStreak?: number;
    requiredSeconds?: number;
  };
  reward?: {
    type?: string;
    amount?: number;
  };
}

```

**Response DTO:**

- 수정된 보상 정책의 상세

<br/>

---

### 📌 9. 보상 정책 목록

**GET `/event/rewards/policies`**

**Response DTO:**

```
// RewardPolicyListDto
[
  {
    id: string;
    name: string;
    condition: { ... };
    reward: { type: string; amount: number; };
    createdAt: string;
    updatedAt: string;
  }
]

```
<br/>

---

### 📌 10. 전체 이벤트 목록

**GET `/event/list`**

**Response DTO:**

```
// EventListDto
[
  {
    id: string;
    title: string;
    description: string;
    condition: {
    type: 'daily_check_in' | 'streak_check_in' | 'session_time';
    requiredDays?: number;
    requiredStreak?: number;
    requiredSeconds?: number;
  };
    status: 'ACTIVE' | 'INACTIVE';
    startAt: string;
    endAt: string;
    rewardPolicy: { ... }
  }
]

```
<br/>

---

### 📌 11. 이벤트 등록

**POST `/event/register`**

**Request DTO:**

```
// EventRegisterDto
{
  title: string;
  description: string;
  condition: {
    type: 'daily_check_in' | 'streak_check_in' | 'session_time';
    requiredDays?: number;
    requiredStreak?: number;
    requiredSeconds?: number;
  };
  startAt: string;
  endAt: string;
  rewardPolicyId: string;
}

```

**Response DTO:**

- 등록된 이벤트의 상세

<br/>

---

### 📌 12. 이벤트 수정

**PATCH `/event/:eventId`**

**Request DTO:**

```
// EventUpdateDto
{
  title?: string;
  description?: string;
  condition: {
    type: 'daily_check_in' | 'streak_check_in' | 'session_time';
    requiredDays?: number;
    requiredStreak?: number;
    requiredSeconds?: number;
  };
  startAt?: string;
  endAt?: string;
  rewardPolicyId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

```

**Response DTO:**

- 수정된 이벤트의 상세

<br/>

---

### 📌 13. 이벤트 상태변경

**PATCH `/event/:eventId/status`**

**Request DTO:**

```
// EventStatusUpdateDto
{
  status: 'ACTIVE' | 'INACTIVE';
}

```

<br/>

---

## ✅ DB 스키마 (MongoDB)

### 1. `events` (src/events/schemas/event.schema.ts)

```
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: ['daily_check_in', 'streak_check_in', 'session_time'] })
  type: string;

  @Prop({ required: true, enum: ['ACTIVE', 'INACTIVE'] })
  status: string;

  @Prop({ type: Date, required: true })
  startAt: Date;

  @Prop({ type: Date, required: true })
  endAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'RewardPolicy', required: true })
  rewardPolicyId: Types.ObjectId;

  // createdAt, updatedAt 자동 생성 (timestamps 옵션)
}

export const EventSchema = SchemaFactory.createForClass(Event);

```

---

### 2. `reward_policies` (src/reward-policies/schemas/reward-policy.schema.ts)

```
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RewardPolicyDocument = RewardPolicy & Document;

class RewardPolicyCondition {
  @Prop({ required: true, enum: ['daily_check_in', 'streak_check_in', 'session_time'] })
  type: string;

  @Prop()
  requiredDays?: number; // daily_check_in

  @Prop()
  requiredStreak?: number; // streak_check_in

  @Prop()
  requiredSeconds?: number; // session_time
}

class RewardPolicyReward {
  @Prop({ required: true })
  type: string; // 'points', 'coupon' 등

  @Prop({ required: true })
  amount: number;
}

@Schema({ timestamps: true })
export class RewardPolicy {
  @Prop({ required: true })
  name: string;

  @Prop({ type: RewardPolicyCondition, required: true })
  condition: RewardPolicyCondition;

  @Prop({ type: RewardPolicyReward, required: true })
  reward: RewardPolicyReward;

  // createdAt, updatedAt 자동 생성
}

export const RewardPolicySchema = SchemaFactory.createForClass(RewardPolicy);

```

---

### 3. `user_event_progresses` (src/user-event-progresses/schemas/user-event-progress.schema.ts)

```
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserEventProgressDocument = UserEventProgress & Document;

class ProgressData {
  @Prop([String])
  checkedDates?: string[]; // daily_check_in

  @Prop()
  currentStreak?: number; // streak_check_in

  @Prop()
  lastCheckedDate?: string; // streak_check_in

  @Prop()
  totalSeconds?: number; // session_time
}

@Schema()
export class UserEventProgress {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  eventId: Types.ObjectId;

  @Prop({ type: ProgressData })
  progressData: ProgressData;

  @Prop({ required: true, default: false })
  isCompleted: boolean;

  @Prop({ required: true, default: false })
  isRewarded: boolean;
}

export const UserEventProgressSchema = SchemaFactory.createForClass(UserEventProgress);

```

---

### 4. `user_rewards` (src/user-rewards/schemas/user-reward.schema.ts)

```
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserRewardDocument = UserReward & Document;

class UserRewardDetail {
  @Prop({ required: true })
  type: string; // 'points', 'coupon' 등

  @Prop({ required: true })
  amount: number;
}

@Schema()
export class UserReward {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  rewardPolicyId: Types.ObjectId;

  @Prop({ type: UserRewardDetail, required: true })
  reward: UserRewardDetail;

  @Prop({ type: Date, required: true })
  issuedAt: Date;
}

export const UserRewardSchema = SchemaFactory.createForClass(UserReward);

```


---

## ✅ 진행/완료 체크 로직

- **이벤트 상세 조회(GET)** →event/user/progress에 row가 없으면 생성 및 상태 자동 갱신
    - **daily_check_in**: 오늘 날짜 출석 시 `checkedDates`에 추가, 개수로 완료
    - **streak_check_in**: 마지막 출석일로 연속 여부 체크, streak 증가/초기화
    - **session_time**: 누적 접속 시간(별도 집계), `totalSeconds` 증가

> 모든 이벤트들은 이벤트 진행 조회 시 상태 자동 갱신 및 최신 진행상황 반환
> 

---

