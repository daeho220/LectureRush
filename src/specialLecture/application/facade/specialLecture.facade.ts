import { Injectable } from '@nestjs/common';
import { LectureService } from '../../domain/lecture/lecture.service';
import { RegistrationService } from '../../domain/registration/registration.service';
import { Registration } from '../../domain/registration/registration.entity';
import { Lecture } from '../../domain/lecture/lecture.entity';

@Injectable()
export class SpecialLectureFacade {
    constructor(
        private readonly lectureService: LectureService,
        private readonly registrationService: RegistrationService,
    ) {}

    // 강의 신청
    async registerForLecture(userId: number, lectureId: number): Promise<Registration> {
        // 강의 조회
        const lecture = await this.lectureService.getLectureByLectureId(lectureId);
        // 강의 신청 가능 여부 확인
        if (!lecture.isAvailable) {
            throw new Error('해당 강의는 신청할 수 없습니다.');
        }

        // 수강 신청
        const registration = await this.registrationService.registerForLecture(userId, lectureId);

        // 수강 신청 내역 반환
        return registration;
    }

    // 해당 날짜 신청 가능한 강의 리스트 조회
    async getAvailableLecturesByDate(date: Date): Promise<Lecture[]> {
        return this.lectureService.getAvailableLecturesByDate(date);
    }

    // 수강신청 완료 목록 조회
    async getRegisteredLectures(userId: number): Promise<Registration[]> {
        return this.registrationService.getRegisteredLectures(userId);
    }
}
