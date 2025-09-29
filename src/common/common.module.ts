import { Module } from "@nestjs/common";
import { CommonService } from "./common.service";
import { CommonController } from './common.controller';
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { join } from "path";
import { v4 } from "uuid";
import { TasksService } from "./tasks.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Movie } from "src/movie/entity/movie.entity";
import { DefaultLogger } from "./logger/default.logger";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { envVariableKeys } from "./const/env.const";

@Module({
    // 외부 기능이나 다른 모듈이 필요할 때 imports
    imports: [
        // 파일 업로드 모듈 사용
        MulterModule.register({
            // storage: 저장할 장소 | diskStorage: 로컬 스토리지
            storage: diskStorage({
                // cwd -> Current Working Directory (서버를 실행한 작업중인 폴더 가져오기)
                // ......./Netflix/public/movie 경로를 가져온다.
                // 실행 OS와 상관없이 정확한 경로를 가져온다.
                destination: join(process.cwd(), 'public', 'temp'),

                // 파일 이름 변경하기
                filename: (req, file, callback) => {
                    const split = file.originalname.split('.');

                    let extension = 'mp4';

                    if (split.length > 1) {
                        extension = split[split.length - 1];
                    }

                    callback(null, `${v4()}_${Date.now()}.${extension}`);
                }
            }),
        }),
        TypeOrmModule.forFeature([
            Movie,
        ]),
        // BullMQ Redis 큐 시스템 설정
        // Redis를 사용한 백그라운드 작업 큐 관리
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>(envVariableKeys.redisHost) || 'localhost',
                    port: configService.get<number>(envVariableKeys.redisPort) || 6379,
                    username: 'default',
                    password: configService.get<string>(envVariableKeys.redisPassword) || undefined,
                }
            }),
            inject: [ConfigService],
        }),
        // 큐 등록
        BullModule.registerQueue({
            name: 'thumbnail-generation',
        }),
    ],
    // 요청(Request)을 받고 응답(Response)을 처리하는 클래스
    controllers: [CommonController],
    // 서비스, 유틸, 인터셉터, 가드 등 실행 로직을 담은 클래스
    providers: [CommonService, TasksService, DefaultLogger],
    // 다른 모듈이 이 모듈의 특정 provider를 사용하도록 공개할 때 등록
    exports: [CommonService, DefaultLogger],
})
export class CommonModule { }