import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationService } from './registration.service';
import { RegistrationRepository } from '../../infra/registration/registration.repository';
import { Registration } from './registration.entity';
import { Lecture } from '../lecture/lecture.entity';
import { IREGISTRATION_REPOSITORY } from '../../infra/registration/registration.repository';

describe('RegistrationService', () => {
    let registrationService: RegistrationService;
    let mockRegistrationRepository: jest.Mocked<RegistrationRepository>;

    beforeEach(async () => {
        // 모킹된 레포지토리 객체 생성
        mockRegistrationRepository = {
            addRegistration: jest.fn(),
            findRegistrationByUserIDAndLectureId: jest.fn(),
            findRegistrationByUserId: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RegistrationService,
                {
                    provide: IREGISTRATION_REPOSITORY,
                    useValue: mockRegistrationRepository,
                },
            ],
        }).compile();

        registrationService = module.get<RegistrationService>(RegistrationService);
    });

    describe('registerForLecture 테스트', () => {
        describe('성공 케이스', () => {
            it('정상적으로 수강 신청이 되는 경우', async () => {
                // given
                const userId = 1;
                const lectureId = 1;
                const mockRegistration = new Registration();
                mockRegistration.registrationId = 1;
                mockRegistration.userId = userId;
                mockRegistration.lecture = {
                    id: lectureId,
                    title: 'Test Lecture',
                    instructor: 'Test Instructor',
                    lectureDate: new Date('2024-12-24'),
                    startTime: '10:00:00',
                    endTime: '12:00:00',
                    currentCount: 1,
                    maxCount: 30,
                    isAvailable: true,
                } as Lecture;
                mockRegistration.registrationDate = new Date();

                mockRegistrationRepository.addRegistration.mockResolvedValue(mockRegistration);

                // when
                const result = await registrationService.registerForLecture(userId, lectureId);

                // then
                expect(mockRegistrationRepository.addRegistration).toHaveBeenCalledWith(
                    userId,
                    lectureId,
                );

                expect(result).toBeDefined();
                expect(result.userId).toBe(userId);
                expect(result.lecture.id).toBe(lectureId);
                expect(result.registrationDate).toBeDefined();
            });
        });

        // 레포지토리 단위 테스트 검증을 통해 실패 케이스 검증 완료하여
        // 실패 케이스는 없다고 판단
    });

    describe('getRegisteredLectures 테스트', () => {
        describe('성공 케이스', () => {
            it('사용자의 수강 신청 내역이 있는 경우', async () => {
                // given
                const userId = 1;
                const mockRegistrations = [
                    {
                        registrationId: 1,
                        userId: userId,
                        lecture: { id: 1, title: 'Lecture 1' } as Lecture,
                        registrationDate: new Date(),
                    },
                    {
                        registrationId: 2,
                        userId: userId,
                        lecture: { id: 2, title: 'Lecture 2' } as Lecture,
                        registrationDate: new Date(),
                    },
                ] as Registration[];

                mockRegistrationRepository.findRegistrationByUserId.mockResolvedValue(
                    mockRegistrations,
                );

                // when
                const result = await registrationService.getRegisteredLectures(userId);

                // then
                expect(result).toHaveLength(2);
                expect(result[0].userId).toBe(userId);
                expect(result[1].userId).toBe(userId);
            });

            it('사용자의 수강 신청 내역이 없는 경우', async () => {
                // given
                const userId = 1;
                mockRegistrationRepository.findRegistrationByUserId.mockResolvedValue([]);

                // when
                const result = await registrationService.getRegisteredLectures(userId);

                // then
                expect(result).toHaveLength(0);
            });
        });

        // 수강 신청 완료 내역이 있으면 해당 Registration 객체를 반환
        // 수강 신청 완료 내역이 없으면 빈 배열을 반환
        // 따라서, 실패 케이스는 없다고 판단
    });
});
