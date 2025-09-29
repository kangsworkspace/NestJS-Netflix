import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { join } from "path";
import { cwd } from "process";
import * as ffmpegFluent from 'fluent-ffmpeg';

// 'thumbnail-generation' 큐에서 작업을 처리하는 프로세서
@Processor('thumbnail-generation')
export class ThumbnailGenerationProcess extends WorkerHost {
    // 큐에서 작업을 받아 처리하는 메서드
    async process(job: Job, token?: string): Promise<any> {
        // 작업 데이터에서 비디오 ID와 파일 경로 추출
        const { videoId, videoPath } = job.data;

        console.log(`영상 트랜스코딩중...ID: ${videoId}`);

        // 썸네일 이미지가 저장될 디렉토리 경로 설정
        const outputDirectory = join(cwd(), 'public', 'thumbnail');

        // FFmpeg를 사용하여 비디오에서 썸네일 생성
        ffmpegFluent(videoPath)
            .screenshots({
                count: 1,                                    // 생성할 썸네일 개수 (1개)
                filename: `${videoId}.png`,                  // 썸네일 파일명 (비디오ID.png)
                folder: outputDirectory,                     // 썸네일 저장 폴더
                size: '320x240',                             // 썸네일 크기 (가로x세로)
            })
            .on('end', () => {
                console.log(`썸네일 생성 완료...ID: ${videoId}`);
            })
            .on('error', (err) => {
                // 썸네일 생성 중 오류가 발생했을 때 실행
                console.log(`썸네일 생성 오류...ID: ${videoId}`);
                console.log(err);                            // 오류 상세 정보 출력
            })
    }
}