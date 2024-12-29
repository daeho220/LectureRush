import { Injectable, Inject } from '@nestjs/common';
import { LectureRepository } from '../../infra/lecture/lecture.repository';
import { Lecture } from './lecture.entity';
import { ILECTURE_REPOSITORY } from '../../infra/lecture/lecture.repository';

@Injectable()
export class LectureService {
    constructor(
        @Inject(ILECTURE_REPOSITORY)
        private readonly lectureRepository: LectureRepository,
    ) {}

    // 강의 조회
    async getLectureByLectureId(lectureId: number): Promise<Lecture> {
        const lecture = await this.lectureRepository.findLectureById(lectureId);
        if (!lecture) {
            throw new Error('해당 강의를 찾을 수 없습니다.');
        }
        return lecture;
    }

    // 날짜별 가능한 강의 리스트 조회
    async getAvailableLecturesByDate(date: Date): Promise<Lecture[]> {
        const lectures = await this.lectureRepository.findLecturesByDate(date);
        return lectures.filter((lecture) => lecture.isAvailable);
    }
}
