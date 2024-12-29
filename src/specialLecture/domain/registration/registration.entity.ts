import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Lecture } from '../lecture/lecture.entity';

@Entity('Registrations')
export class Registration {
    @PrimaryGeneratedColumn({ name: 'registration_id' })
    registrationId: number;

    @ManyToOne(() => Lecture)
    @JoinColumn({ name: 'lecture_id' })
    lecture: Lecture;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @Column({ name: 'registration_date', type: 'date' })
    registrationDate: Date;
}
