import { Injectable } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { LectureRepository } from './lecture.repository';
import { Lecture } from '../../domain/lecture/lecture.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LectureRepositoryImpl implements LectureRepository {
    constructor(
        @InjectRepository(Lecture)
        private lectureRepository: Repository<Lecture>,
    ) {}

    async findLectureById(lectureId: number): Promise<Lecture | null> {
        this.validateLectureId(lectureId);
        return await this.lectureRepository.findOne({ where: { id: lectureId } });
    }

    async findLecturesByDate(date: Date): Promise<Lecture[]> {
        this.validateDate(date);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return await this.lectureRepository.find({
            where: { lectureDate: Between(startOfDay, endOfDay) },
        });
    }

    async incrementCurrentCount(lectureId: number): Promise<Lecture> {
        this.validateLectureId(lectureId);

        const lecture = await this.lectureRepository.findOne({
            where: { id: lectureId },
        });

        if (!lecture) {
            throw new Error('해당 강의를 찾을 수 없습니다.');
        }

        if (lecture.currentCount >= lecture.maxCount) {
            throw new Error('수강 인원이 초과되었습니다.');
        }

        lecture.currentCount += 1;

        // 수강 인원이 다 찼을 경우 자동으로 isAvailable을 false로 설정
        if (lecture.currentCount >= lecture.maxCount) {
            lecture.isAvailable = false;
        }

        return await this.lectureRepository.save(lecture);
    }

    async setAvailabilityTrue(lectureId: number): Promise<Lecture> {
        this.validateLectureId(lectureId);

        const lecture = await this.lectureRepository.findOne({
            where: { id: lectureId },
        });

        if (!lecture) {
            throw new Error('해당 강의를 찾을 수 없습니다.');
        }

        // 수강 인원이 다 찼으면 available로 설정할 수 없음
        if (lecture.currentCount >= lecture.maxCount) {
            throw new Error('수강 인원이 초과된 강의는 available로 설정할 수 없습니다.');
        }

        lecture.isAvailable = true;
        return await this.lectureRepository.save(lecture);
    }

    async setAvailabilityFalse(lectureId: number): Promise<Lecture> {
        this.validateLectureId(lectureId);

        const lecture = await this.lectureRepository.findOne({
            where: { id: lectureId },
        });

        if (!lecture) {
            throw new Error('해당 강의를 찾을 수 없습니다.');
        }

        lecture.isAvailable = false;
        return await this.lectureRepository.save(lecture);
    }

    validateLectureId(lectureId: number): void {
        if (typeof lectureId !== 'number' || lectureId <= 0) {
            throw new Error('유효하지 않은 lectureId: 양의 정수가 아닙니다.');
        }
    }

    validateDate(date: Date): void {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw new Error('유효하지 않은 날짜 형식입니다.');
        }
    }
}
