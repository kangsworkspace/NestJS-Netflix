import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Controller('common')
// Swagger Authorize 설정
// => 페이지에 자물쇠 모양 버튼 생김(Bearer 토큰 인증)
@ApiBearerAuth()
// Swagger 엔드 포인트를 그룹으로 정리
@ApiTags('common')
export class CommonController {
    constructor(
        private readonly commonService: CommonService,

        // 썸네일 생성 큐 의존성 주입
        // 'thumbnail-generation' 큐를 주입받아 백그라운드 작업 처리
        @InjectQueue('thumbnail-generation')
        private readonly thumbnailQueue: Queue,
    ){}

    @Post('video')
    // 단일 파일 업로드 인터셉터 사용
    @UseInterceptors(FileInterceptor('video', {
        // 용량 제한
        limits: {
            fileSize: 20000000,
        },

        // callback(error, 파일을 받을 지 여부)
        fileFilter(req, file, callback) {

            /// video/mp4 파일 형식 필터
            if (file.mimetype !== 'video/mp4') {
                return callback(new BadRequestException('mp4 타입만 업로드 가능합니다!'), false);
            }

            return callback(null, true);
        }
    }))
    async createVideo(
        @UploadedFile() video: Express.Multer.File,
    ){
        // 썸네일 생성 작업을 큐에 추가
        // 비동기적으로 백그라운드에서 썸네일 생성 작업을 처리
        await this.thumbnailQueue.add('thumbnail', {
            videoId: video.filename,    // 업로드된 비디오 파일명
            videoPath: video.path       // 업로드된 비디오 파일 경로
        }, {
            priority: 1, // 우선순위 설정
            delay: 100, // 100ms 뒤에 실행
            attempts: 3, // 3번까지 시도
            lifo: true, // 최근에 추가된 작업이 먼저 처리되도록 설정 Queue <=> Stack
            removeOnComplete: true, // 작업이 완료되면 작업 정보 삭제
            removeOnFail: true, // 작업이 실패하면 작업 정보 삭제
        });
        return {
            fileName: video.filename,
        }
    }
}