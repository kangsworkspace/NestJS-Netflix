import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {

    // constructor(){
    //     super({
    //         omit: {
    //             user: {
    //                 password: true,
    //             }
    //         }
    //     })
    // }

    // NestJS 모듈이 초기화될 때 데이터베이스 연결을 설정 (애플리케이션 시작 시 자동으로 호출)
    async onModuleInit() {
        await this.$connect();
    }
}
