import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, of, tap } from "rxjs";

@Injectable()
export class CacheInterceptor implements NestInterceptor{
    // 메모리에 캐시 데이터를 저장하는 Map 객체
    // 실제 서비스에서는 메모리 캐싱보다는 Redis 같은 외부 캐시 스토리지를 사용하는 것이 일반적
    private cache = new Map<string, any>();

    // 인터셉터가 구현해야 하는 메서드
    // context => 현재 요청에 대한 실행 컨텍스트(어떤 라우터가 호출됐는지, 어떤 메서드인지 등의 정보)
    // next => 다음 단계로 요청을 넘기는 함수(주로 next.handle()을 통해 컨트롤러로 요청 전달)
    // 이 함수는 Observable 또는 **Promise<Observable>**를 반환
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        //  현재 들어온 HTTP 요청 정보 (ex. URL, 메서드, 바디 등)
        const request = context.switchToHttp().getRequest();

        // 캐시 키 구성: 요청 메서드 + 요청 경로
        // 예: GET /movie → "GET-/movie"
        const key = `${request.method}-${request.path}`;

        if(this.cache.has(key)){
            // of(): 값을 Observable로 감싸 반환
            // 컨트롤러를 건너뛰고 인터셉터에서 바로 응답
            return of(this.cache.get(key));
        }

        // 다음 핸들러(컨트롤러 메서드)로 요청을 전달
        return next.handle()
        // RxJS(reactive extensions for JavaScript)에서 제공하는 메서드
        // RxJS의 연산자들을 pipe 내부에 넣어서 사용 가능 (tap, map, catchError 등)
        .pipe(
            // RxJS의 tap 연산자 
            // Observable의 흐름을 가로채서 사이드 이펙트(부수 효과)를 수행할 수 있게 해준다.
            // 컨트롤러 응답 Observable이 값을 emit(방출)하는 시점에 실행
            // response: 함수를 실행하고 응답받은 값
            tap(respone => this.cache.set(key, respone)),
        )
    }
}