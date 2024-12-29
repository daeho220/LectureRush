## DB 설계

### 목차

1. [테이블 설명 및 설계 이유](#테이블-설명-및-설계-이유)
    - [Registrations 테이블](#registrations-테이블)
    - [Lectures 테이블](#lectures-테이블)
3. [테이블 간 관계 설명](#테이블-간-관계-설명)
    - [Lectures와 Registrations 간의 관계](#lectures와-registrations-간의-관계)
4. [API 요구사항 충족](#api-요구사항-충족)

### 테이블 설명 및 설계 이유

- 테이블은 **Lectures, Registrations** 테이블로 총 2개입니다.
- 강의 정보를 저장할 **Lectures** 테이블과 수강 신청이 완료된 후의 정보를 저장할 **Registrations** 테이블이 필요하다고 생각하였습니다.

<img width="1285" alt="image" src="https://github.com/user-attachments/assets/d128814d-dc99-40d5-9cc5-01a1b01ecf0f" />

**Registrations 테이블**

- registration_id (int, PK)
    - 설명: 각 신청을 고유하게 식별하기 위한 기본 키입니다.
    - 설계 이유: 신청 데이터를 명확히 구분하기 위해 설정하였습니다.
- user_id (int)
    - 설명: 신청한 사용자를 식별하기 위해 유저의 id를 저장합니다.
    - 설계 이유: 사용자와 신청 간의 관계를 명확히 하기 위해 설정하였습니다.
- lecture_id (varchar, FK)
    - 설명: 신청한 특강을 식별하기 위해 Lectures 테이블의 lecture_id를 참조합니다.
    - 설계 이유: 특강과 신청 간의 관계를 명확히 하기 위해 설정하였습니다.
- registration_date (date)
    - 설명: 신청이 이루어진 날짜를 저장합니다.
    - 설계 이유: 신청 기록을 관리하기 위해 설정하였습니다.
- 유니크 제약 조건 (user_id, lecture_id)
    - 설명: 동일한 사용자가 동일한 강의에 대해 중복 신청할 수 없도록 합니다.
    - 설계 이유: 데이터 무결성을 보장하고, 비즈니스 로직의 요구사항을 충족하기 위해 설정하였습니다.

**Lectures 테이블**

- lecture_id (int, PK)
    - 설명: 각 특강을 고유하게 식별하기 위한 기본 키입니다.
    - 설계 이유: 특강 데이터를 명확히 구분하기 위해 설정하였습니다.
- title (varchar)
    - 설명: 특강의 제목을 저장합니다.
    - 설계 이유: 한글, 영어, 숫자가 가능하도록 설정하여 다양한 강의를 지원합니다.
- instructor (varchar)
    - 설명: 강연자의 정보를 저장합니다.
    - 설계 이유: 한글과 영어를 지원하여 다양한 강연자를 등록할 수 있습니다.
- current_count(int, default: 0)
    - 설명: 현재 특강 신청 인원을 저장합니다.
    - 설계 이유: Registration 테이블에서 lecture_id를 COUNT하여 구할 수는 있지만, 동시 신청이 많을 경우, 해당 쿼리를 자주 실행하면 성능이 저하될 것으로 예상하여 해당 필드를 추가하였습니다.
- max_count(int, default: 30)
    - 설명: 특강 최대 인원을 저장합니다.
    - 설계 이유: current_count만을 사용해서 비즈니스 로직에서 제어할 수 있지만, 추후 확장성을 위해서 있어도 괜찮겠다고 생각하여 해당 필드를 추가하였습니다.
- lecture_date (date: YYYY-MM-DD)
    - 설명: 특강 날짜를 저장합니다.
    - 설계 이유: 신청 가능한 특강 목록 조회시 사용을 위해 설정하였습니다.
- start_time (time)
    - 설명: 특강 시작 시간을 저장합니다.
    - 설계 이유: 프론트 단에서 강의 시간이 필요할 것으로 생각하여 설정하였습니다.
- end_time (time)
    - 설명: 특강 종료 시간을 저장합니다.
    - 설계 이유: 프론트 단에서 강의 시간이 필요할 것으로 생각하여 설정하였습니다.
- is_available (boolean)
    - 설명: 특강 신청 가능여부를 저장합니다.
        - true: 신청 가능
        - false: 신청 불가능
    - 설계 이유: current_count와 max_count의 대소 비교를 통해 비즈니스 로직으로 구현가능하지만, read시 성능 향상을 위해 신청 가능여부 필드를 추가하였습니다.

### 테이블 간 관계 설명

**Lectures와 Registrations 간의 관계**

- 1:N 관계:
    - 한 특강은 여러 사용자가 신청할 수 있습니다.
    - Registrations 테이블의 lecture_id는 Lectures 테이블의 lecture_id를 참조하는 외래 키(FK)입니다.
    - 이를 통해 각 신청이 어떤 특강에 대한 것인지를 추적할 수 있습니다.

### **API 요구사항 충족**

- **특강 신청 API**: DB 단에서는 유니크 제약 조건 (user_id, lecture_id)을 설정하여 동일한 신청자가 동일한 강의에 대해 중복 신청을 방지하였습니다. 또한, Lectures 테이블의 를 통해 is_available, current_count, max_count를 사용하여 신청인원 30명 제한을 구현하였습니다.
- **특강 신청 가능 목록 API**: 현재 신청 가능한 특강 목록을 날짜별로 조회할 수 있도록 설계되었습니다.
    ```sql
    2024년 12월 25일 특강 조회
    → 2024년 12월 25일의 신청가능한 특강 리스트 목록 반환 (is_available=true)
    ```
- **특강 신청 완료 목록 조회 API**: 특정 사용자에 대한 신청 완료된 특강 목록을 조회할 수 있도록 관계를 설정하였습니다.
