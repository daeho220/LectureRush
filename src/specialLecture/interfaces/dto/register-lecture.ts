import { IsInt, IsPositive } from 'class-validator';

export class RegisterLectureDto {
    @IsInt()
    @IsPositive()
    userId: number;

    @IsInt()
    @IsPositive()
    lectureId: number;
}
