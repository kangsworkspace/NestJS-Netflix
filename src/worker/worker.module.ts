import { Module } from "@nestjs/common";
import { ThumbnailGenerationProcess } from "./thumnail-genetaion.worker";

// 워커 모듈 - 백그라운드 작업을 처리하는 워커 프로세스들을 관리
@Module({
    // 워커 프로세스들을 프로바이더로 등록
    // 썸네일 생성 작업을 처리하는 워커 프로세스
    providers: [ThumbnailGenerationProcess]
})
export class WorkerModule {}