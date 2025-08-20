import { CallHandler, ExecutionContext, Injectable, InternalServerErrorException, NestInterceptor } from "@nestjs/common";
import { delay, Observable, tap } from "rxjs";

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {

    // 인터셉터가 구현해야 하는 메서드
    // context => 현재 요청에 대한 실행 컨텍스트(어떤 라우터가 호출됐는지, 어떤 메서드인지 등의 정보)
    // next => 다음 단계로 요청을 넘기는 함수(주로 next.handle()을 통해 컨트롤러로 요청 전달)
    // 이 함수는 Observable 또는 **Promise<Observable>**를 반환
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {

        //  현재 들어온 HTTP 요청 정보 (ex. URL, 메서드, 바디 등)
        const req = context.switchToHttp().getRequest();

        // 메서드 요청을 보낸 시간
        const reqTime = Date.now();

        // 다음 핸들러(컨트롤러 메서드)로 요청을 전달
        return next.handle()
            // RxJS(reactive extensions for JavaScript)에서 제공하는 메서드
            // RxJS의 연산자들을 pipe 내부에 넣어서 사용 가능 (tap, map, catchError 등)
            .pipe(
                // delay(1000),

                // RxJS의 tap 연산자 
                // Observable의 흐름을 가로채서 사이드 이펙트(부수 효과)를 수행할 수 있게 해준다.
                // 컨트롤러 응답 Observable이 값을 emit(방출)하는 시점에 실행
                tap(() => {
                    // 메서드 응답이 완료된 시점의 시간(ms)
                    const resqTime = Date.now();

                    // 요청이 들어온 시점과 응답이 완료된 시점의 차이(소요 시간)
                    const diff = resqTime - reqTime;


                    // 3초이상 걸리면 에러를 던짐
                    if (diff > 3000) {
                        console.log(`!!!!TIMEOUT [${req.method} ${req.path} ${diff}ms]`)
                        throw new InternalServerErrorException('시간이 너무 오래 걸렸습니다!');
                    } else {
                        // HTTP 요청의 메서드(GET/POST 등), 경로(path), 걸린 시간(ms)을 로그로 출력
                        console.log(`${req.method} ${req.path} ${diff}ms`)
                    }
                })
            )
    }
}