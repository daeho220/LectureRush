import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SpecialLectureModule } from './specialLecture/modules/specialLecture.module';
import { Lecture } from './specialLecture/domain/lecture/lecture.entity';
import { Registration } from './specialLecture/domain/registration/registration.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SpecialLectureController } from './specialLecture/interfaces/specialLecture.controller';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                type: configService.get<string>('DB_TYPE') as 'mysql',
                host: configService.get<string>('DB_HOST'),
                port: configService.get<number>('DB_PORT'),
                username: configService.get<string>('DB_USERNAME'),
                password: configService.get<string>('DB_PASSWORD'),
                database: configService.get<string>('DB_DATABASE'),
                entities: [Lecture, Registration],
            }),
            inject: [ConfigService],
        }),
        SpecialLectureModule,
    ],
    controllers: [AppController, SpecialLectureController],
    providers: [AppService],
})
export class AppModule {}
