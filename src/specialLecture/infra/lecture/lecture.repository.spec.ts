import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LectureRepositoryImpl } from './lecture.repository.impl';
import { Lecture } from '../../domain/lecture/lecture.entity';
import { LectureRepository } from './lecture.repository';
import { DataSource } from 'typeorm';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import * as dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

describe('LectureRepositoryImpl', () => {
    let lectureRepository: LectureRepository;
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
            entities: [Lecture],
            synchronize: true,
        };

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(typeOrmModuleOptions),
                TypeOrmModule.forFeature([Lecture]),
            ],
            providers: [LectureRepositoryImpl],
        }).compile();

        lectureRepository = module.get<LectureRepositoryImpl>(LectureRepositoryImpl);
        dataSource = module.get<DataSource>(DataSource);
    });

    beforeEach(async () => {
        await dataSource.getRepository(Lecture).delete({}); // 각 테스트 전에 테이블 초기화
    });

    afterEach(async () => {
        await dataSource.getRepository(Lecture).delete({}); // 각 테스트 후에 테이블 초기화
    });

    afterAll(async () => {
        if (dataSource) {
            await dataSource.destroy();
        }

        if (container) {
            await container.stop();
        }
    });

    describe('findLectureById 테스트', () => {
        describe('성공 케이스', () => {
            it('정상적인 lectureId가 존재하는 경우', async () => {
                // given : 테스트 데이터 생성
                const lecture: Lecture = new Lecture();
                lecture.title = 'Test Lecture';
                lecture.instructor = 'Test Instructor';
                lecture.lectureDate = new Date('2024-12-24');
                lecture.startTime = '10:00:00';
                lecture.endTime = '12:00:00';
                const savedLecture = await dataSource.getRepository(Lecture).save(lecture);

                // when : 테스트 데이터 조회
                const foundLecture = await lectureRepository.findLectureById(savedLecture.id);

                // then : 조회 결과 검증
                expect(foundLecture).toBeDefined();
                expect(foundLecture?.title).toBe('Test Lecture');
            });
        });

        describe('실패 케이스', () => {
            it('lectureId가 존재하지 않는 경우', async () => {
                const lectureId = 9999; // 존재하지 않는 ID
                const foundLecture = await lectureRepository.findLectureById(lectureId);
                expect(foundLecture).toBeNull();
            });

            it('lectureId가 null인 경우', async () => {
                const lectureId = null as any; // 타입 오류 방지를 위해 any로 캐스팅
                await expect(lectureRepository.findLectureById(lectureId)).rejects.toThrow(
                    '유효하지 않은 lectureId: 양의 정수가 아닙니다.',
                );
            });

            it('lectureId가 undefined인 경우', async () => {
                const lectureId = undefined as any; // 타입 오류 방지를 위해 any로 캐스팅
                await expect(lectureRepository.findLectureById(lectureId)).rejects.toThrow(
                    '유효하지 않은 lectureId: 양의 정수가 아닙니다.',
                );
            });

            it('lectureId가 0인 경우', async () => {
                const lectureId = 0; // 타입 오류 방지를 위해 any로 캐스팅
                await expect(lectureRepository.findLectureById(lectureId)).rejects.toThrow(
                    '유효하지 않은 lectureId: 양의 정수가 아닙니다.',
                );
            });

            it('lectureId가 음수인 경우', async () => {
                const lectureId = -1; // 타입 오류 방지를 위해 any로 캐스팅
                await expect(lectureRepository.findLectureById(lectureId)).rejects.toThrow(
                    '유효하지 않은 lectureId: 양의 정수가 아닙니다.',
                );
            });

            it('lectureId가 숫자가 아닌 경우', async () => {
                const lectureId = 'invalid' as any; // 타입 오류 방지를 위해 any로 캐스팅
                await expect(lectureRepository.findLectureById(lectureId)).rejects.toThrow(
                    '유효하지 않은 lectureId: 양의 정수가 아닙니다.',
                );
            });
        });
    });

    describe('findLecturesByDate 테스트', () => {
        describe('성공 케이스', () => {
            it('정상적인 날짜가 존재하고, 해당 날짜의 강의가 존재하는 경우', async () => {
                // given : 테스트 데이터 생성
                const date1 = new Date('2024-12-24');
                const lecture1: Lecture = new Lecture();
                lecture1.title = 'Test Lecture';
                lecture1.instructor = 'Test Instructor';
                lecture1.lectureDate = date1;
                lecture1.startTime = '10:00:00';
                lecture1.endTime = '12:00:00';
                await dataSource.getRepository(Lecture).save(lecture1);

                const date2 = new Date('2024-12-25');
                const lecture2: Lecture = new Lecture();
                lecture2.title = 'Test Lecture2';
                lecture2.instructor = 'Test Instructor2';
                lecture2.lectureDate = date2;
                lecture2.startTime = '10:00:00';
                lecture2.endTime = '12:00:00';
                await dataSource.getRepository(Lecture).save(lecture2);

                const date3 = new Date('2024-12-26');
                const lecture3: Lecture = new Lecture();
                lecture3.title = 'Test Lecture3';
                lecture3.instructor = 'Test Instructor3';
                lecture3.lectureDate = date3;
                lecture3.startTime = '10:00:00';
                lecture3.endTime = '12:00:00';
                await dataSource.getRepository(Lecture).save(lecture3);

                // when : 테스트 데이터 조회
                const lectures = await lectureRepository.findLecturesByDate(date1);

                // then : 조회 결과 검증
                expect(lectures).toBeDefined();
                expect(lectures.length).toBe(1);
            });
        });
        describe('실패 케이스', () => {
            it('해당 날짜의 강의가 존재하지 않는 경우', async () => {
                const date = new Date('2024-12-27');
                const lectures = await lectureRepository.findLecturesByDate(date);
                expect(lectures.length).toBe(0);
            });
            it('잘못된 날짜 형식이 입력된 경우', async () => {
                const date = 'invalid-date' as any;
                await expect(lectureRepository.findLecturesByDate(date)).rejects.toThrow(
                    '유효하지 않은 날짜 형식입니다.',
                );
            });
            it('날짜가 null인 경우', async () => {
                const date = null as any;
                await expect(lectureRepository.findLecturesByDate(date)).rejects.toThrow(
                    '유효하지 않은 날짜 형식입니다.',
                );
            });
            it('날짜가 undefined인 경우', async () => {
                const date = undefined as any;
                await expect(lectureRepository.findLecturesByDate(date)).rejects.toThrow(
                    '유효하지 않은 날짜 형식입니다.',
                );
            });
        });
    });

    describe('incrementCurrentCount 테스트', () => {
        describe('성공 케이스', () => {
            it('정상적으로 currentCount가 증가하는 경우', async () => {
                // given
                const lecture = new Lecture();
                lecture.title = 'Test Lecture';
                lecture.instructor = 'Test Instructor';
                lecture.lectureDate = new Date('2024-12-24');
                lecture.startTime = '10:00:00';
                lecture.endTime = '12:00:00';
                lecture.currentCount = 0;
                lecture.maxCount = 2;
                const savedLecture = await dataSource.getRepository(Lecture).save(lecture);

                // when
                const updatedLecture = await lectureRepository.incrementCurrentCount(
                    savedLecture.id,
                );

                // then
                expect(updatedLecture.currentCount).toBe(1);
                expect(updatedLecture.isAvailable).toBe(true);
            });
        });
        describe('실패 케이스', () => {
            it('currentCount가 maxCount와 같은 경우', async () => {
                const lecture = new Lecture();
                lecture.title = 'Test Lecture';
                lecture.instructor = 'Test Instructor';
                lecture.lectureDate = new Date('2024-12-24');
                lecture.startTime = '10:00:00';
                lecture.endTime = '12:00:00';
                lecture.currentCount = 2;
                lecture.maxCount = 2;
                await dataSource.getRepository(Lecture).save(lecture);

                await expect(lectureRepository.incrementCurrentCount(lecture.id)).rejects.toThrow(
                    '수강 인원이 초과되었습니다.',
                );
            });
            it('currentCount가 증가하다가 maxCount와 같아지면 isAvailable이 false로 변경되는 경우', async () => {
                // given
                const lecture = new Lecture();
                lecture.title = 'Test Lecture';
                lecture.instructor = 'Test Instructor';
                lecture.lectureDate = new Date('2024-12-24');
                lecture.startTime = '10:00:00';
                lecture.endTime = '12:00:00';
                lecture.currentCount = 1;
                lecture.maxCount = 2;
                const savedLecture = await dataSource.getRepository(Lecture).save(lecture);

                // when
                const updatedLecture = await lectureRepository.incrementCurrentCount(
                    savedLecture.id,
                );

                // then
                expect(updatedLecture.currentCount).toBe(2);
                expect(updatedLecture.isAvailable).toBe(false);
            });
        });
    });

    describe('setAvailabilityTrue 테스트', () => {
        describe('성공 케이스', () => {
            it('정상적으로 isAvailable이 true로 변경되는 경우', async () => {
                // given
                const lecture = new Lecture();
                lecture.title = 'Test Lecture';
                lecture.instructor = 'Test Instructor';
                lecture.lectureDate = new Date('2024-12-24');
                lecture.startTime = '10:00:00';
                lecture.endTime = '12:00:00';
                lecture.isAvailable = false;
                lecture.currentCount = 1;
                lecture.maxCount = 2;
                const savedLecture = await dataSource.getRepository(Lecture).save(lecture);

                // when
                const updatedLecture = await lectureRepository.setAvailabilityTrue(savedLecture.id);

                // then
                expect(updatedLecture.isAvailable).toBe(true);
            });
        });

        describe('실패 케이스', () => {
            it('존재하지 않는 강의인 경우', async () => {
                await expect(lectureRepository.setAvailabilityTrue(9999)).rejects.toThrow(
                    '해당 강의를 찾을 수 없습니다.',
                );
            });

            it('수강 인원이 이미 가득 찬 경우', async () => {
                // given
                const lecture = new Lecture();
                lecture.title = 'Test Lecture';
                lecture.instructor = 'Test Instructor';
                lecture.lectureDate = new Date('2024-12-24');
                lecture.startTime = '10:00:00';
                lecture.endTime = '12:00:00';
                lecture.isAvailable = false;
                lecture.currentCount = 2;
                lecture.maxCount = 2;
                const savedLecture = await dataSource.getRepository(Lecture).save(lecture);

                // when & then
                await expect(
                    lectureRepository.setAvailabilityTrue(savedLecture.id),
                ).rejects.toThrow('수강 인원이 초과된 강의는 available로 설정할 수 없습니다.');
            });

            it('lectureId가 유효하지 않은 경우', async () => {
                const lectureId = -1;
                await expect(lectureRepository.setAvailabilityTrue(lectureId)).rejects.toThrow(
                    '유효하지 않은 lectureId: 양의 정수가 아닙니다.',
                );
            });
        });
    });

    describe('setAvailabilityFalse 테스트', () => {
        describe('성공 케이스', () => {
            it('정상적으로 isAvailable이 false로 변경되는 경우', async () => {
                // given
                const lecture = new Lecture();
                lecture.title = 'Test Lecture';
                lecture.instructor = 'Test Instructor';
                lecture.lectureDate = new Date('2024-12-24');
                lecture.startTime = '10:00:00';
                lecture.endTime = '12:00:00';
                lecture.isAvailable = true;
                const savedLecture = await dataSource.getRepository(Lecture).save(lecture);

                // when
                const updatedLecture = await lectureRepository.setAvailabilityFalse(
                    savedLecture.id,
                );

                // then
                expect(updatedLecture.isAvailable).toBe(false);
            });
        });

        describe('실패 케이스', () => {
            it('존재하지 않는 강의인 경우', async () => {
                await expect(lectureRepository.setAvailabilityFalse(9999)).rejects.toThrow(
                    '해당 강의를 찾을 수 없습니다.',
                );
            });

            it('lectureId가 유효하지 않은 경우', async () => {
                await expect(lectureRepository.setAvailabilityFalse(-1)).rejects.toThrow(
                    '유효하지 않은 lectureId: 양의 정수가 아닙니다.',
                );
            });
        });
    });
});
