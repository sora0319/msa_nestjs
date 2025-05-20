# msa_nestjs
이벤트 / 보상 관리 플랫폼 구성

### 파일 실행 방법
```
docker-compose up -d --build
```


### 생각한 점점
Nestjs를 처음 사용해보면서 기존 nodejs와의 차이와 느겼습니다.
Node.js는 자바스크립트 런타임 환경에서서 서버를 구축하고 다양한 기능을 빠르게 구현할 수 있도록 해주어서서 Express와 같은 간단한 프레임워크를 사용해 빠르게 구현할 수 있었습니다.
그러나 직접 사용해 보았을 때 java의 spring boot에 비해 빠르게 구축할 수 있었지만, 구조화된 코드 관리는 할 수 없었습니다.

 NestJS는 Node.js 기반의 프레임워크이지만, 모듈화와 의존성 주입, 데코레이터, 타입스크립트 기반의 정적 타입 지원 등 엔터프라이즈 개발에 최적화된 다양한 기능을 제공합니다. NestJS를 활용하면서 서비스의 규모가 커져도 코드의 유지보수성과 확장성을 자연스럽게 확보할 수 있었습니다.

 이번 경험으로 Nestjs의 확장성과 유연성에 대해 배울 수 있었습니다

 ### 고민한 점
 MSA 구조화 설계 시 MongoDB와 서버와의 연계에 대해 트랜젝션 충돌이 일어나지 않도록 하는 방법에 대해 고민하였습니다.
 연관관계가 아닌 document 방식이다보니 데이터는 쉽게 저장가능하지만, 어떤 값을 중복시킬지에 대해 고민하였습니다.

 


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

