import { Lecture } from '../../domain/lecture/lecture.entity';

export interface LectureRepository {
    findLectureById(lectureId: number): Promise<Lecture | null>;
    findLecturesByDate(date: Date): Promise<Lecture[]>;
    incrementCurrentCount(lectureId: number): Promise<Lecture>;
    setAvailabilityTrue(lectureId: number): Promise<Lecture>;
    setAvailabilityFalse(lectureId: number): Promise<Lecture>;
}

export const ILECTURE_REPOSITORY = Symbol('ILECTURE_REPOSITORY');
