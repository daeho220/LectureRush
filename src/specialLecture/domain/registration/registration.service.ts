import { Injectable, Inject } from '@nestjs/common';
import { RegistrationRepository } from '../../infra/registration/registration.repository';
import { Registration } from './registration.entity';
import { IREGISTRATION_REPOSITORY } from '../../infra/registration/registration.repository';
@Injectable()
export class RegistrationService {
    constructor(
        @Inject(IREGISTRATION_REPOSITORY)
        private readonly registrationRepository: RegistrationRepository,
    ) {}

    // 강의 신청
    async registerForLecture(userId: number, lectureId: number): Promise<Registration> {
        return await this.registrationRepository.addRegistration(userId, lectureId);
    }

    // 수강신청 완료 목록 조회
    async getRegisteredLectures(userId: number): Promise<Registration[]> {
        return this.registrationRepository.findRegistrationByUserId(userId);
    }
}
