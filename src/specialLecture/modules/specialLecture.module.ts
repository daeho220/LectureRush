import { Module } from '@nestjs/common';
import { LectureRepositoryImpl } from '../infra/lecture/lecture.repository.impl';
import { RegistrationRepositoryImpl } from '../infra/registration/registration.repository.impl';
import { LectureService } from '../domain/lecture/lecture.service';
import { RegistrationService } from '../domain/registration/registration.service';
import { Lecture } from '../domain/lecture/lecture.entity';
import { Registration } from '../domain/registration/registration.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecialLectureFacade } from '../application/facade/specialLecture.facade';
import { ILECTURE_REPOSITORY } from '../infra/lecture/lecture.repository';
import { IREGISTRATION_REPOSITORY } from '../infra/registration/registration.repository';
@Module({
    imports: [TypeOrmModule.forFeature([Lecture, Registration])],
    controllers: [],
    providers: [
        {
            provide: ILECTURE_REPOSITORY,
            useClass: LectureRepositoryImpl,
        },
        {
            provide: IREGISTRATION_REPOSITORY,
            useClass: RegistrationRepositoryImpl,
        },
        LectureService,
        RegistrationService,
        SpecialLectureFacade,
    ],
    exports: [SpecialLectureFacade],
})
export class SpecialLectureModule {}
