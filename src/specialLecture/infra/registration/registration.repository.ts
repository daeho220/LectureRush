import { Registration } from '../../domain/registration/registration.entity';
export interface RegistrationRepository {
    addRegistration(userId: number, lectureId: number): Promise<Registration>;
    findRegistrationByUserId(userId: number): Promise<Registration[]>;
    findRegistrationByUserIDAndLectureId(
        userId: number,
        lectureId: number,
    ): Promise<Registration | null>;
}

export const IREGISTRATION_REPOSITORY = Symbol('IREGISTRATION_REPOSITORY');
