import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { catchError, Observable, tap } from "rxjs";
import { DataSource } from "typeorm";

@Injectable()
export class TransactionInterceptor implements NestInterceptor{
    constructor(
        private readonly dataSource: DataSource,
    ){}

    // 인터셉터가 구현해야 하는 메서드
    // context => 현재 요청에 대한 실행 컨텍스트(어떤 라우터가 호출됐는지, 어떤 메서드인지 등의 정보)
    // next => 다음 단계로 요청을 넘기는 함수(주로 next.handle()을 통해 컨트롤러로 요청 전달)
    // 이 함수는 Observable 또는 **Promise<Observable>**를 반환
    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        //  현재 들어온 HTTP 요청 정보 (ex. URL, 메서드, 바디 등)
        const req = context.switchToHttp().getRequest();

        // 트랜잭션: 여러 DB 작업을 하나의 단위로 묶어서 처리하는 방법
        // 트랜잭션을 직접 제어하기 위한 QueryRunner 인스턴스 생성
        const qr = this.dataSource.createQueryRunner();
        // 트랜잭션 데이터 베이스와 연결
        await qr.connect();
        // 트랜잭션 시작
        await qr.startTransaction();
        // 쿼리 러너 전달
        req.queryRunner = qr;

        // 다음 핸들러(컨트롤러 메서드)로 요청을 전달
        return next.handle()
            // RxJS(reactive extensions for JavaScript)에서 제공하는 메서드
            // RxJS의 연산자들을 pipe 내부에 넣어서 사용 가능 (tap, map, catchError 등)
            .pipe(
                // 응답값에 Error 발생 시 Catch
                catchError(
                    async (error) => {
                        // 트랜잭션 롤백
                        await qr.rollbackTransaction();
                        // 사용이 끝난 연결을 DB 커넥션 풀로 반환
                        await qr.release();
                        
                        // 다시 에러 던짐
                        throw error
                    }
                ),

                tap(async () => {
                    // 트랙잭션 커밋
                    await qr.commitTransaction();
                    // 사용이 끝난 연결을 DB 커넥션 풀로 반환.
                    await qr.release();
                })
            );
    }
}