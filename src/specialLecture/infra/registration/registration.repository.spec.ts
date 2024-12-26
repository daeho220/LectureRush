import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Registration } from '../../domain/registration/registration.entity';
import { RegistrationRepository } from './registration.repository';
import { RegistrationRepositoryImpl } from './registration.repository.impl';
import { Lecture } from '../../domain/lecture/lecture.entity';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import * as dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

describe('RegistrationRepositoryImpl', () => {
    let registrationRepository: RegistrationRepository;
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
            entities: [Registration, Lecture],
            synchronize: true,
        };

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(typeOrmModuleOptions),
                TypeOrmModule.forFeature([Registration, Lecture]),
            ],
            providers: [RegistrationRepositoryImpl],
        }).compile();

        registrationRepository = module.get<RegistrationRepositoryImpl>(RegistrationRepositoryImpl);
        dataSource = module.get<DataSource>(DataSource);
    });

    beforeAll(async () => {
        // 강의 데이터 삽입
        await dataSource.getRepository(Lecture).save({
            id: 1,
            title: 'Test Lecture 1',
            instructor: 'Instructor 1',
            lectureDate: new Date(),
            startTime: '10:00',
            endTime: '12:00',
            currentCount: 0,
            maxCount: 30,
        });
        await dataSource.getRepository(Lecture).save({
            id: 2,
            title: 'Test Lecture 2',
            instructor: 'Instructor 2',
            lectureDate: new Date(),
            startTime: '14:00',
            endTime: '16:00',
            currentCount: 0,
            maxCount: 30,
        });
    });

    beforeEach(async () => {
        await dataSource.getRepository(Registration).delete({}); // 각 테스트 전에 테이블 초기화
    });
    afterEach(async () => {
        await dataSource.getRepository(Registration).delete({}); // 각 테스트 후에 테이블 초기화
    });

    afterAll(async () => {
        if (dataSource) {
            await dataSource.getRepository(Lecture).delete({});
            await dataSource.destroy();
        }
        if (container) {
            await container.stop();
        }
    });

    describe('addRegistration 테스트', () => {
        describe('성공 케이스', () => {
            it('정상적인 userId와 lectureId가 존재하는 경우', async () => {
                const userId = 1;
                const lectureId = 1;
                const registration = await registrationRepository.addRegistration(
                    userId,
                    lectureId,
                );
                expect(registration).toBeDefined();
                expect(registration.userId).toBe(userId);
                expect(registration.lecture.id).toBe(lectureId);
            });
        });
        describe('실패 케이스', () => {
            it('lectureId가 존재하지 않는 경우', async () => {
                const userId = 1;
                const lectureId = 999;
                await expect(
                    registrationRepository.addRegistration(userId, lectureId),
                ).rejects.toThrow('해당 강의를 찾을 수 없습니다.');
            });
            it('userId가 양의 정수가 아닌 경우', async () => {
                const userId = -1;
                const lectureId = 1;
                await expect(
                    registrationRepository.addRegistration(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 userId: 양의 정수가 아닙니다.');
            });
            it('lectureId가 양의 정수가 아닌 경우', async () => {
                const userId = 1;
                const lectureId = -1;
                await expect(
                    registrationRepository.addRegistration(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 lectureId: 양의 정수가 아닙니다.');
            });
            it('userId와 lectureId가 양의 정수가 아닌 경우', async () => {
                const userId = -1;
                const lectureId = -1;
                await expect(
                    registrationRepository.addRegistration(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 userId: 양의 정수가 아닙니다.');
            });
        });
    });

    describe('findRegistrationByUserId 테스트', () => {
        describe('성공 케이스', () => {
            it('정상적인 userId가 존재하는 경우', async () => {
                // given: 1번 유저 - 1,2번 강의 등록
                const userId1 = 1;
                const lectureId1 = 1;
                const lectureId2 = 2;
                await registrationRepository.addRegistration(userId1, lectureId1);
                await registrationRepository.addRegistration(userId1, lectureId2);

                // 2번 유저 - 2번 강의 등록
                const userId2 = 2;
                await registrationRepository.addRegistration(userId2, lectureId2);

                // when
                const registrations1 =
                    await registrationRepository.findRegistrationByUserId(userId1);
                const registrations2 =
                    await registrationRepository.findRegistrationByUserId(userId2);

                // then
                // 1번 유저의 등록 강의 체크
                expect(registrations1.length).toBe(2);
                expect(registrations1[0].lecture.id).toBe(lectureId1);
                expect(registrations1[1].lecture.id).toBe(lectureId2);

                // 2번 유저의 등록 강의 체크
                expect(registrations2.length).toBe(1);
                expect(registrations2[0].lecture.id).toBe(lectureId2);
            });
            it('userId는 정상적이지만, 등록된 강의가 없는 경우', async () => {
                const userId = 1;
                const registrations = await registrationRepository.findRegistrationByUserId(userId);
                expect(registrations.length).toBe(0);
            });
        });
        describe('실패 케이스', () => {
            it('userId가 양의 정수가 아닌 경우', async () => {
                const userId = -1;
                await expect(
                    registrationRepository.findRegistrationByUserId(userId),
                ).rejects.toThrow('유효하지 않은 userId: 양의 정수가 아닙니다.');
            });
            it('userId가 0인 경우', async () => {
                const userId = 0;
                await expect(
                    registrationRepository.findRegistrationByUserId(userId),
                ).rejects.toThrow('유효하지 않은 userId: 양의 정수가 아닙니다.');
            });
            it('userId가 문자열인 경우', async () => {
                const userId = 'test' as any;
                await expect(
                    registrationRepository.findRegistrationByUserId(userId),
                ).rejects.toThrow('유효하지 않은 userId: 양의 정수가 아닙니다.');
            });
            it('userId가 null인 경우', async () => {
                const userId = null as any;
                await expect(
                    registrationRepository.findRegistrationByUserId(userId),
                ).rejects.toThrow('유효하지 않은 userId: 양의 정수가 아닙니다.');
            });
            it('userId가 undefined인 경우', async () => {
                const userId = undefined as any;
                await expect(
                    registrationRepository.findRegistrationByUserId(userId),
                ).rejects.toThrow('유효하지 않은 userId: 양의 정수가 아닙니다.');
            });
        });
    });

    describe('findRegistrationByUserIDAndLectureId 테스트', () => {
        describe('성공 케이스', () => {
            it('정상적인 userId와 lectureId가 존재하는 경우', async () => {
                const userId = 1;
                const lectureId = 1;
                await registrationRepository.addRegistration(userId, lectureId);
                const registration =
                    await registrationRepository.findRegistrationByUserIDAndLectureId(
                        userId,
                        lectureId,
                    );
                expect(registration.userId).toBe(userId);
                expect(registration.lecture.id).toBe(lectureId);
            });
        });
        describe('실패 케이스', () => {
            it('userId가 양의 정수가 아닌 경우', async () => {
                const userId = -1;
                const lectureId = 1;
                await expect(
                    registrationRepository.findRegistrationByUserIDAndLectureId(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 userId: 양의 정수가 아닙니다.');
            });

            it('userId가 0인 경우', async () => {
                const userId = 0;
                const lectureId = 1;
                await expect(
                    registrationRepository.findRegistrationByUserIDAndLectureId(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 userId: 양의 정수가 아닙니다.');
            });
            it('userId가 문자열인 경우', async () => {
                const userId = 'test' as any;
                const lectureId = 1;
                await expect(
                    registrationRepository.findRegistrationByUserIDAndLectureId(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 userId: 양의 정수가 아닙니다.');
            });
            it('userId가 null인 경우', async () => {
                const userId = null as any;
                const lectureId = 1;
                await expect(
                    registrationRepository.findRegistrationByUserIDAndLectureId(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 userId: 양의 정수가 아닙니다.');
            });
            it('userId가 undefined인 경우', async () => {
                const userId = undefined as any;
                const lectureId = 1;
                await expect(
                    registrationRepository.findRegistrationByUserIDAndLectureId(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 userId: 양의 정수가 아닙니다.');
            });

            it('lectureId가 양의 정수가 아닌 경우', async () => {
                const userId = 1;
                const lectureId = -1;
                await expect(
                    registrationRepository.findRegistrationByUserIDAndLectureId(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 lectureId: 양의 정수가 아닙니다.');
            });
            it('lectureId가 0인 경우', async () => {
                const userId = 1;
                const lectureId = 0;
                await expect(
                    registrationRepository.findRegistrationByUserIDAndLectureId(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 lectureId: 양의 정수가 아닙니다.');
            });
            it('lectureId가 문자열인 경우', async () => {
                const userId = 1;
                const lectureId = 'test' as any;
                await expect(
                    registrationRepository.findRegistrationByUserIDAndLectureId(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 lectureId: 양의 정수가 아닙니다.');
            });
            it('lectureId가 null인 경우', async () => {
                const userId = 1;
                const lectureId = null as any;
                await expect(
                    registrationRepository.findRegistrationByUserIDAndLectureId(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 lectureId: 양의 정수가 아닙니다.');
            });
            it('lectureId가 undefined인 경우', async () => {
                const userId = 1;
                const lectureId = undefined as any;
                await expect(
                    registrationRepository.findRegistrationByUserIDAndLectureId(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 lectureId: 양의 정수가 아닙니다.');
            });

            it('userId와 lectureId가 양의 정수가 아닌 경우', async () => {
                const userId = -1;
                const lectureId = -1;
                await expect(
                    registrationRepository.findRegistrationByUserIDAndLectureId(userId, lectureId),
                ).rejects.toThrow('유효하지 않은 userId: 양의 정수가 아닙니다.');
            });
        });
    });
});
