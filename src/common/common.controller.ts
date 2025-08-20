import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('common')
// Swagger Authorize 설정
// => 페이지에 자물쇠 모양 버튼 생김(Bearer 토큰 인증)
@ApiBearerAuth()
// Swagger 엔드 포인트를 그룹으로 정리
@ApiTags('common')
export class CommonController {
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
    createVideo(
        @UploadedFile() video: Express.Multer.File,
    ){
        return {
            fileName: video.filename,
        }
    }
}
