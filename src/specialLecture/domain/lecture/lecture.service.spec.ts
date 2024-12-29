import { Test, TestingModule } from '@nestjs/testing';
import { LectureService } from './lecture.service';
import { LectureRepository } from '../../infra/lecture/lecture.repository';
import { Lecture } from './lecture.entity';
import { ILECTURE_REPOSITORY } from '../../infra/lecture/lecture.repository';
describe('LectureService', () => {
    let lectureService: LectureService;
    let mockLectureRepository: jest.Mocked<LectureRepository>;

    beforeEach(async () => {
        // 모킹된 레포지토리 객체 생성
        mockLectureRepository = {
            findLectureById: jest.fn(),
            findLecturesByDate: jest.fn(),
            incrementCurrentCount: jest.fn(),
            setAvailabilityTrue: jest.fn(),
            setAvailabilityFalse: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LectureService,
                {
                    provide: ILECTURE_REPOSITORY,
                    useValue: mockLectureRepository,
                },
            ],
        }).compile();

        lectureService = module.get<LectureService>(LectureService);
    });

    describe('getLectureByLectureId 테스트', () => {
        describe('성공 케이스', () => {
            it('정상적인 lectureId로 강의를 조회하는 경우', async () => {
                // given
                const mockLecture = new Lecture();
                mockLecture.id = 1;
                mockLecture.title = 'Test Lecture';
                mockLecture.instructor = 'Test Instructor';
                mockLecture.lectureDate = new Date('2024-12-24');
                mockLecture.startTime = '10:00:00';
                mockLecture.endTime = '12:00:00';
                mockLecture.currentCount = 0;
                mockLecture.maxCount = 30;
                mockLecture.isAvailable = true;
                mockLectureRepository.findLectureById.mockResolvedValue(mockLecture);

                // when
                const result = await lectureService.getLectureByLectureId(1);

                // then
                expect(result).toBeDefined();
                expect(result.title).toBe('Test Lecture');
                expect(result.instructor).toBe('Test Instructor');
                expect(mockLectureRepository.findLectureById).toHaveBeenCalledWith(1);
            });
        });
        describe('실패 케이스', () => {
            it('존재하지 않는 강의를 조회하는 경우', async () => {
                // given
                const lectureId = 999;
                mockLectureRepository.findLectureById.mockResolvedValue(null);

                // when & then
                await expect(lectureService.getLectureByLectureId(lectureId)).rejects.toThrow(
                    '해당 강의를 찾을 수 없습니다.',
                );
            });
        });
    });

    describe('getAvailableLecturesByDate 테스트', () => {
        describe('성공 케이스', () => {
            it('해당 날짜에 available한 강의가 있는 경우', async () => {
                // given
                const date = new Date('2024-12-24');
                const mockLectures = [
                    { id: 1, isAvailable: true, title: 'Lecture 1' },
                    { id: 2, isAvailable: false, title: 'Lecture 2' },
                    { id: 3, isAvailable: true, title: 'Lecture 3' },
                ] as Lecture[];

                mockLectureRepository.findLecturesByDate.mockResolvedValue(mockLectures);

                // when
                const result = await lectureService.getAvailableLecturesByDate(date);

                // then
                expect(result).toHaveLength(2);
                expect(result.every((lecture) => lecture.isAvailable)).toBe(true);
                expect(mockLectureRepository.findLecturesByDate).toHaveBeenCalledWith(date);
            });

            it('해당 날짜에 강의가 없는 경우 빈 배열을 반환', async () => {
                // given
                const date = new Date('2024-12-24');
                mockLectureRepository.findLecturesByDate.mockResolvedValue([]);

                // when
                const result = await lectureService.getAvailableLecturesByDate(date);

                // then
                expect(result).toHaveLength(0);
                expect(mockLectureRepository.findLecturesByDate).toHaveBeenCalledWith(date);
            });

            it('해당 날짜에 강의는 있지만 available한 강의가 없는 경우 빈 배열을 반환', async () => {
                // given
                const date = new Date('2024-12-24');
                const mockLectures = [
                    { id: 1, isAvailable: false, title: 'Lecture 1' },
                    { id: 2, isAvailable: false, title: 'Lecture 2' },
                ] as Lecture[];

                mockLectureRepository.findLecturesByDate.mockResolvedValue(mockLectures);

                // when
                const result = await lectureService.getAvailableLecturesByDate(date);

                // then
                expect(result).toHaveLength(0);
                expect(mockLectureRepository.findLecturesByDate).toHaveBeenCalledWith(date);
            });
        });

        // 해당 조건에 맞는 강의가 없어도 LectureRepository.findLecturesByDate에서 빈 배열을 반환하기 때문에,
        // 실패 케이스는 없다고 판단.
    });
});
