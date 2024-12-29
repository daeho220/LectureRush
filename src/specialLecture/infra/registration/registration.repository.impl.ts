import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { RegistrationRepository } from './registration.repository';
import { Registration } from '../../domain/registration/registration.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Lecture } from '../../domain/lecture/lecture.entity';
@Injectable()
export class RegistrationRepositoryImpl implements RegistrationRepository {
    constructor(
        @InjectRepository(Registration)
        private registrationRepository: Repository<Registration>,
        @InjectRepository(Lecture)
        private lectureRepository: Repository<Lecture>,
        private dataSource: DataSource,
    ) {}

    // 강의 신청
    async addRegistration(userId: number, lectureId: number): Promise<Registration> {
        this.validateUserId(userId);
        this.validateLectureId(lectureId);
        try {
            return await this.dataSource.transaction(async (manager) => {
                // lecture 객체를 조회하고 잠금 설정
                const lecture = await manager.findOne(Lecture, {
                    where: { id: lectureId },
                    lock: { mode: 'pessimistic_write' }, // 쓰기 잠금
                });

                if (!lecture) {
                    throw new Error('해당 강의를 찾을 수 없습니다.');
                }

                if (lecture.isAvailable === false) {
                    throw new Error('수강 신청이 마감되었습니다.');
                }

                const now = new Date();

                // 등록 정보 저장
                const registration = await manager.save(Registration, {
                    userId,
                    lecture,
                    registrationDate: now,
                });

                // 강의의 현재 인원 증가
                lecture.currentCount += 1;
                if (lecture.currentCount >= lecture.maxCount) {
                    lecture.isAvailable = false;
                }
                await manager.save(lecture);

                // 저장 후 lecture 관계를 포함하여 조회
                return manager.findOne(Registration, {
                    where: { registrationId: registration.registrationId },
                    relations: ['lecture'],
                });
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                // MySQL의 유니크 제약 조건 위반 에러 코드
                throw new Error('이미 수강 신청한 강의입니다.');
            }
            throw error;
        }
    }

    // 특정 유저 수강신청 완료 목록 조회
    async findRegistrationByUserId(userId: number): Promise<Registration[]> {
        this.validateUserId(userId);
        return await this.registrationRepository.find({
            where: { userId },
            relations: ['lecture'],
        });
    }

    // 특정 유저 특정 강의 수강신청 완료 목록 조회
    async findRegistrationByUserIDAndLectureId(
        userId: number,
        lectureId: number,
    ): Promise<Registration | null> {
        this.validateUserId(userId);
        this.validateLectureId(lectureId);
        return await this.registrationRepository.findOne({
            where: { userId, lecture: { id: lectureId } },
            relations: ['lecture'],
        });
    }

    validateLectureId(lectureId: number): void {
        if (typeof lectureId !== 'number' || lectureId <= 0) {
            throw new Error('유효하지 않은 lectureId: 양의 정수가 아닙니다.');
        }
    }

    validateUserId(userId: number): void {
        if (typeof userId !== 'number' || userId <= 0) {
            throw new Error('유효하지 않은 userId: 양의 정수가 아닙니다.');
        }
    }
}
