import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SpecialLectureFacade } from './specialLecture.facade';
import { Lecture } from '../../domain/lecture/lecture.entity';
import { Registration } from '../../domain/registration/registration.entity';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { SpecialLectureModule } from '../../modules/specialLecture.module';
import * as dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

describe('SpecialLectureFacade Integration Test', () => {
    let specialLectureFacade: SpecialLectureFacade;
    let dataSource: DataSource;
    let container: StartedTestContainer;

    beforeAll(async () => {
        container = await new GenericContainer('mysql:8.0')
            .withExposedPorts(Number(process.env.DB_PORT))
            .withEnvironment({
                MYSQL_ROOT_PASSWORD: process.env.DB_PASSWORD,
                MYSQL_DATABASE: process.env.DB_DATABASE,
            })
            .start();

        const typeOrmModuleOptions: TypeOrmModuleOptions = {
            type: 'mysql',
            host: container.getHost(),
            port: container.getMappedPort(Number(process.env.DB_PORT)),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            entities: [Lecture, Registration],
            synchronize: true,
        };

        const module: TestingModule = await Test.createTestingModule({
            imports: [TypeOrmModule.forRoot(typeOrmModuleOptions), SpecialLectureModule],
        }).compile();

        specialLectureFacade = module.get<SpecialLectureFacade>(SpecialLectureFacade);
        dataSource = module.get<DataSource>(DataSource);
    });

    beforeEach(async () => {
        // 테스트 데이터 초기화
        await dataSource.getRepository(Registration).delete({});
        await dataSource.getRepository(Lecture).delete({});

        const sampleLectures = [
            {
                id: 1,
                title: 'Test Lecture 1',
                instructor: 'Instructor 1',
                lectureDate: new Date('2024-12-23'),
                startTime: '10:00',
                endTime: '12:00',
                currentCount: 0,
                maxCount: 30,
                isAvailable: true,
            },
            {
                id: 2,
                title: 'Test Lecture 2',
                instructor: 'Instructor 2',
                lectureDate: new Date('2024-12-23'),
                startTime: '14:00',
                endTime: '16:00',
                currentCount: 30, // 정원 초과
                maxCount: 30,
                isAvailable: false,
            },
            {
                id: 3,
                title: '도지코인 투자법',
                instructor: 'Elon Musk',
                lectureDate: new Date('2024-12-23'),
                startTime: '10:00',
                endTime: '12:00',
                currentCount: 10,
                maxCount: 30,
                isAvailable: false, // 수강 신청 마감
            },
            {
                id: 4,
                title: '주짓수 특강',
                instructor: 'Mark Zuckerberg',
                lectureDate: new Date('2024-12-24'),
                startTime: '14:00',
                endTime: '16:00',
                currentCount: 0,
                maxCount: 30,
                isAvailable: true,
            },
            {
                id: 5,
                title: '맛있는 사과 고르는 방법',
                instructor: 'Isaac Newton',
                lectureDate: new Date('2024-12-25'),
                startTime: '10:00',
                endTime: '12:00',
                currentCount: 0,
                maxCount: 30,
                isAvailable: true,
            },
            {
                id: 6,
                title: '타로카드로 인생 점치기',
                instructor: 'Albert Einstein',
                lectureDate: new Date('2024-12-25'),
                startTime: '14:00',
                endTime: '16:00',
                currentCount: 0,
                maxCount: 30,
                isAvailable: true,
            },
            {
                id: 7,
                title: '올바른 학교 생활',
                instructor: '전재준',
                lectureDate: new Date('2024-12-26'),
                startTime: '10:00',
                endTime: '12:00',
                currentCount: 0,
                maxCount: 30,
                isAvailable: true,
            },
        ];

        // 테스트용 강의 데이터 생성
        await dataSource.getRepository(Lecture).save(sampleLectures);
    });

    afterAll(async () => {
        if (dataSource) {
            await dataSource.getRepository(Registration).delete({});
            await dataSource.getRepository(Lecture).delete({});
            await dataSource.destroy();
        }

        if (container) {
            await container.stop();
        }
    });

    describe('registerForLecture 통합 테스트', () => {
        describe('성공 케이스', () => {
            it('정상적으로 수강 신청이 되는 경우', async () => {
                // given
                const userId = 1;
                const lectureId = 1;

                // when
                const result = await specialLectureFacade.registerForLecture(userId, lectureId);

                // then
                expect(result).toBeDefined();
                expect(result.userId).toBe(userId);
                expect(result.lecture.id).toBe(lectureId);

                // DB 확인
                const updatedLecture = await dataSource.getRepository(Lecture).findOne({
                    where: { id: lectureId },
                });
                const updatedRegistration = await dataSource.getRepository(Registration).findOne({
                    where: { userId, lecture: { id: lectureId } },
                });
                expect(updatedLecture.currentCount).toBe(1);
                expect(updatedRegistration).toBeDefined();
                expect(updatedRegistration.userId).toBe(userId);
            });
        });

        describe('실패 케이스', () => {
            it('정원이 초과된 강의는 신청할 수 없음', async () => {
                // given
                const userId = 1;
                const lectureId = 2;

                // when & then
                await expect(
                    specialLectureFacade.registerForLecture(userId, lectureId),
                ).rejects.toThrow('해당 강의는 신청할 수 없습니다.');
            });

            it('수강 신청이 마감된 강의(isAvailable = false)는 신청할 수 없음', async () => {
                // given
                const userId = 1;
                const lectureId = 3;

                // when & then
                await expect(
                    specialLectureFacade.registerForLecture(userId, lectureId),
                ).rejects.toThrow('해당 강의는 신청할 수 없습니다.');
            });
        });
    });

    describe('getAvailableLecturesByDate 통합 테스트', () => {
        describe('성공 케이스', () => {
            it('특정 날짜에 가능한 강의 목록을 반환', async () => {
                // given
                const date = new Date('2024-12-23');

                // when
                const availableLectures =
                    await specialLectureFacade.getAvailableLecturesByDate(date);

                // then
                expect(availableLectures).toHaveLength(1);
                expect(availableLectures.map((lecture) => lecture.title)).toEqual(
                    expect.arrayContaining(['Test Lecture 1']),
                );
            });

            it('특정 날짜에 가능한 강의가 없는 경우 빈 배열을 반환', async () => {
                // given
                const date = new Date('2024-12-27');

                // when
                const availableLectures =
                    await specialLectureFacade.getAvailableLecturesByDate(date);

                // then
                expect(availableLectures).toHaveLength(0);
            });
        });
    });

    describe('getRegisteredLectures 통합 테스트', () => {
        it('특정 사용자의 수강 신청 내역을 반환', async () => {
            // given
            const userId = 1;
            const lectureId = 1;
            const lectureId2 = 7;

            // 수강 신청을 미리 등록
            await specialLectureFacade.registerForLecture(userId, lectureId);
            await specialLectureFacade.registerForLecture(userId, lectureId2);

            // when
            const registeredLectures = await specialLectureFacade.getRegisteredLectures(userId);

            // then
            expect(registeredLectures).toHaveLength(2);
            expect(registeredLectures[0].lecture.id).toBe(lectureId);
            expect(registeredLectures[1].lecture.id).toBe(lectureId2);
        });

        it('수강 신청 내역이 없는 경우 빈 배열을 반환', async () => {
            // given
            const userId = 1;

            // when
            const registeredLectures = await specialLectureFacade.getRegisteredLectures(userId);

            // then
            expect(registeredLectures).toHaveLength(0);
        });
    });

    describe('동시성 테스트', () => {
        it('동시에 40명의 사용자가 같은 강의에 신청하는 경우', async () => {
            const lectureId = 7;

            // 1부터 40까지의 유저 ID 배열 생성
            const userIds = Array.from({ length: 40 }, (_, i) => i + 1);

            // 모든 유저가 동시에 등록 요청을 보냄
            const results = await Promise.all(
                userIds.map((userId) =>
                    specialLectureFacade
                        .registerForLecture(userId, lectureId)
                        .then((result) => ({ userId, success: true, result }))
                        .catch((error) => ({ userId, success: false, error })),
                ),
            );

            // then
            // 결과 확인
            const successfulRegistrations = results.filter((r) => r.success);
            const failedRegistrations = results.filter((r) => !r.success);

            expect(successfulRegistrations.length).toBe(30);
            expect(failedRegistrations.length).toBe(10);
        });
        it('수강 신청이 마감된 강의 동시에 40명이 신청하는 경우', async () => {
            const lectureId = 3;
            // 1부터 40까지의 유저 ID 배열 생성
            const userIds = Array.from({ length: 40 }, (_, i) => i + 1);

            // 모든 유저가 동시에 등록 요청을 보냄
            const results = await Promise.all(
                userIds.map((userId) =>
                    specialLectureFacade
                        .registerForLecture(userId, lectureId)
                        .then((result) => ({ userId, success: true, result }))
                        .catch((error) => ({ userId, success: false, error })),
                ),
            );

            // then
            // 결과 확인
            const successfulRegistrations = results.filter((r) => r.success);
            const failedRegistrations = results.filter((r) => !r.success);

            expect(successfulRegistrations.length).toBe(0);
            expect(failedRegistrations.length).toBe(40);
        });
        it('동시에 40명이 같은 강의에 신청하는 중간에 날짜별 가능한 강의 리스트 조회', async () => {
            const date = new Date('2024-12-23');
            const lectureId = 1;
            const userIds1 = Array.from({ length: 20 }, (_, i) => i + 1);
            const userIds2 = Array.from({ length: 20 }, (_, i) => i + 21);

            // 모든 유저가 동시에 등록 요청을 보냄
            const registrationPromises1 = userIds1.map((userId) =>
                specialLectureFacade
                    .registerForLecture(userId, lectureId)
                    .then((result) => ({ userId, success: true, result }))
                    .catch((error) => ({ userId, success: false, error })),
            );

            const registrationPromises2 = userIds2.map((userId) =>
                specialLectureFacade
                    .registerForLecture(userId, lectureId)
                    .then((result) => ({ userId, success: true, result }))
                    .catch((error) => ({ userId, success: false, error })),
            );

            // 날짜별 가능한 강의 리스트를 3번 조회
            const lectureListPromises = Array.from({ length: 3 }, () =>
                specialLectureFacade
                    .getAvailableLecturesByDate(date)
                    .then((result) => ({
                        date,
                        success: true,
                        result,
                    }))
                    .catch((error) => ({ date, success: false, error })),
            );

            // 모든 작업을 병렬로 실행 = 20번 동시 등록 요청 + 3번 동시 강의 리스트 조회 + 20번 동시 등록 요청
            const results = await Promise.all([
                ...registrationPromises1,
                ...lectureListPromises,
                ...registrationPromises2,
            ]);

            // then
            // 등록 결과와 강의 리스트 결과를 분리
            const registrationResults1 = results.slice(0, userIds1.length);
            const lectureListResults = results.slice(
                userIds1.length,
                userIds1.length + lectureListPromises.length,
            );
            const registrationResults2 = results.slice(
                userIds1.length + lectureListPromises.length,
            );

            const successfulRegistrations1 = registrationResults1.filter((r) => r.success);
            const failedRegistrations1 = registrationResults1.filter((r) => !r.success);

            const successfulRegistrations2 = registrationResults2.filter((r) => r.success);
            const failedRegistrations2 = registrationResults2.filter((r) => !r.success);

            expect(successfulRegistrations1.length + successfulRegistrations2.length).toBe(30);
            expect(failedRegistrations1.length + failedRegistrations2.length).toBe(10);
            expect(lectureListResults.length).toBe(3);
        });
    });
});
