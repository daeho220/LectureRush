import {
    Controller,
    Post,
    Get,
    Param,
    Query,
    Body,
    HttpException,
    HttpStatus,
    ParseIntPipe,
} from '@nestjs/common';
import { SpecialLectureFacade } from '../application/facade/specialLecture.facade';
import { Registration } from '../domain/registration/registration.entity';
import { Lecture } from '../domain/lecture/lecture.entity';
import { RegisterLectureDto } from './dto/register-lecture';
import { ParseDatePipe } from '../common/pipes/parse-date.pipe';

@Controller('lectures')
export class SpecialLectureController {
    constructor(private readonly specialLectureFacade: SpecialLectureFacade) {}

    // 수강 신청 api
    @Post()
    async registerForLecture(
        @Body() registerLectureDto: RegisterLectureDto,
    ): Promise<Registration> {
        try {
            return await this.specialLectureFacade.registerForLecture(
                registerLectureDto.userId,
                registerLectureDto.lectureId,
            );
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    // 날짜별 가능한 강의 리스트 조회 api
    @Get('available')
    async getAvailableLecturesByDate(
        @Query('date', ParseDatePipe) date: string,
    ): Promise<Lecture[]> {
        const parsedDate = new Date(date);
        return await this.specialLectureFacade.getAvailableLecturesByDate(parsedDate);
    }

    // 사용자가 수강 신청 완료한 강의 리스트 조회 api
    @Get('registered/:userId')
    async getRegisteredLectures(
        @Param('userId', ParseIntPipe) userId: number,
    ): Promise<{ lectureId: number; title: string; instructor: string }[]> {
        const registrations = await this.specialLectureFacade.getRegisteredLectures(userId);
        return registrations.map((registration) => ({
            lectureId: registration.lecture.id,
            title: registration.lecture.title,
            instructor: registration.lecture.instructor,
        }));
    }
}
