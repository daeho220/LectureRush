import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Lectures')
export class Lecture {
    @PrimaryGeneratedColumn({ name: 'lecture_id' })
    id: number;

    @Column({ name: 'title', type: 'varchar' })
    title: string;

    @Column({ name: 'instructor', type: 'varchar' })
    instructor: string;

    @Column({ name: 'lecture_date', type: 'date' })
    lectureDate: Date;

    @Column({ name: 'start_time', type: 'time' })
    startTime: string;

    @Column({ name: 'end_time', type: 'time' })
    endTime: string;

    @Column({ name: 'current_count', default: 0 })
    currentCount: number;

    @Column({ name: 'max_count', default: 30 })
    maxCount: number;

    @Column({ name: 'is_available', default: true })
    isAvailable: boolean;
}
