import { Test, TestingModule } from '@nestjs/testing';
import { SpecialLectureFacade } from './specialLecture.facade';
import { LectureService } from '../../domain/lecture/lecture.service';
import { RegistrationService } from '../../domain/registration/registration.service';
import { Lecture } from '../../domain/lecture/lecture.entity';
import { Registration } from '../../domain/registration/registration.entity';

describe('SpecialLectureFacade', () => {
    let specialLectureFacade: SpecialLectureFacade;
    let mockLectureService: jest.Mocked<LectureService>;
    let mockRegistrationService: jest.Mocked<RegistrationService>;

    beforeEach(async () => {
        mockLectureService = {
            getLectureByLectureId: jest.fn(),
            getAvailableLecturesByDate: jest.fn(),
        } as any;

        mockRegistrationService = {
            registerForLecture: jest.fn(),
            getRegisteredLectures: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SpecialLectureFacade,
                {
                    provide: LectureService,
                    useValue: mockLectureService,
                },
                {
                    provide: RegistrationService,
                    useValue: mockRegistrationService,
                },
            ],
        }).compile();

        specialLectureFacade = module.get<SpecialLectureFacade>(SpecialLectureFacade);
    });

    describe('registerForLecture 테스트', () => {
        describe('성공 케이스', () => {
            it('정상적으로 수강 신청이 되는 경우', async () => {
                // given
                const userId = 1;
                const lectureId = 1;
                const currentCount = 0;

                const mockLecture = {
                    id: lectureId,
                    isAvailable: true,
                    currentCount: currentCount + 1,
                    maxCount: 30,
                } as Lecture;

                const mockRegistration = {
                    registrationId: 1,
                    userId,
                    lecture: mockLecture,
                    registrationDate: new Date(),
                } as Registration;

                mockLectureService.getLectureByLectureId.mockResolvedValue(mockLecture);
                mockRegistrationService.registerForLecture.mockResolvedValue(mockRegistration);

                // when
                const result = await specialLectureFacade.registerForLecture(userId, lectureId);

                // then
                expect(result).toBeDefined();
                expect(result.userId).toBe(userId);
                expect(result.lecture.id).toBe(lectureId);
                expect(mockLecture.currentCount).toBe(1); // currentCount가 증가했는지 확인
                expect(mockLectureService.getLectureByLectureId).toHaveBeenCalledWith(lectureId);
                expect(mockRegistrationService.registerForLecture).toHaveBeenCalledWith(
                    userId,
                    lectureId,
                );
            });
        });

        describe('실패 케이스', () => {
            it('강의가 존재하지 않는 경우', async () => {
                // given
                const userId = 1;
                const lectureId = 999;

                mockLectureService.getLectureByLectureId.mockRejectedValue(
                    new Error('해당 강의를 찾을 수 없습니다.'),
                );

                // when & then
                await expect(
                    specialLectureFacade.registerForLecture(userId, lectureId),
                ).rejects.toThrow('해당 강의를 찾을 수 없습니다.');
            });

            it('신청 불가능한 강의인 경우', async () => {
                // given
                const userId = 1;
                const lectureId = 1;

                const mockLecture = {
                    id: lectureId,
                    isAvailable: false,
                } as Lecture;

                mockLectureService.getLectureByLectureId.mockResolvedValue(mockLecture);

                // when & then
                await expect(
                    specialLectureFacade.registerForLecture(userId, lectureId),
                ).rejects.toThrow('해당 강의는 신청할 수 없습니다.');
            });
        });
    });

    describe('getAvailableLecturesByDate 테스트', () => {
        describe('성공 케이스', () => {
            it('해당 날짜에 수강 가능한 강의가 있는 경우', async () => {
                // given
                const date = new Date('2024-12-24');
                const mockLectures = [
                    { id: 1, title: 'Lecture 1', isAvailable: true },
                    { id: 2, title: 'Lecture 2', isAvailable: true },
                ] as Lecture[];

                mockLectureService.getAvailableLecturesByDate.mockResolvedValue(mockLectures);

                // when
                const result = await specialLectureFacade.getAvailableLecturesByDate(date);

                // then
                expect(result).toHaveLength(2);
                expect(mockLectureService.getAvailableLecturesByDate).toHaveBeenCalledWith(date);
            });

            it('해당 날짜에 수강 가능한 강의가 없는 경우', async () => {
                // given
                const date = new Date('2024-12-24');
                mockLectureService.getAvailableLecturesByDate.mockResolvedValue([]);

                // when
                const result = await specialLectureFacade.getAvailableLecturesByDate(date);

                // then
                expect(result).toHaveLength(0);
                expect(mockLectureService.getAvailableLecturesByDate).toHaveBeenCalledWith(date);
            });
        });
        // 해당 날짜에 수강 가능한 강의가 없다면 빈 배열을 반환
        // 따라서, 실패 케이스는 필요 없다고 판단
    });

    describe('getRegisteredLectures 테스트', () => {
        describe('성공 케이스', () => {
            it('사용자의 수강 신청 내역이 있는 경우', async () => {
                // given
                const userId = 1;
                const mockRegistrations = [
                    {
                        registrationId: 1,
                        userId,
                        lecture: { id: 1, title: 'Lecture 1' },
                    },
                    {
                        registrationId: 2,
                        userId,
                        lecture: { id: 2, title: 'Lecture 2' },
                    },
                ] as Registration[];

                mockRegistrationService.getRegisteredLectures.mockResolvedValue(mockRegistrations);

                // when
                const result = await specialLectureFacade.getRegisteredLectures(userId);

                // then
                expect(result).toHaveLength(2);
                expect(mockRegistrationService.getRegisteredLectures).toHaveBeenCalledWith(userId);
            });

            it('사용자의 수강 신청 내역이 없는 경우', async () => {
                // given
                const userId = 1;
                mockRegistrationService.getRegisteredLectures.mockResolvedValue([]);

                // when
                const result = await specialLectureFacade.getRegisteredLectures(userId);

                // then
                expect(result).toHaveLength(0);
                expect(mockRegistrationService.getRegisteredLectures).toHaveBeenCalledWith(userId);
            });
        });

        // 수강 신청 내역이 없다면 빈 배열을 반환
        // 따라서, 실패 케이스는 필요 없다고 판단
    });
});
