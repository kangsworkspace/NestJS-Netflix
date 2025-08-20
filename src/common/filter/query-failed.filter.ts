import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { QueryFailedError } from "typeorm";

// QueryFailedError가 발생했을 때 필터가 작동하도록 설정
@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter{
    // 필터가 작동했을 때 동작하는 메서드
    // exception -> 발생한 예외 객체 (ForbiddenException 인스턴스)
    // host -> 실행 컨텍스트 (ExecutionContext, RpcContext, WsContext 등)
    catch(exception: any, host: ArgumentsHost) {
        const context = host.switchToHttp();
        const response = context.getResponse();
        const request = context.getRequest();

        // typeorm에서 가져오기 때문에 getStatus()가 없음
        // NestJS의 HttpException을 상속하지 않는다
        const status = 400;

        let message = '데이터베이스 에러 발생!';

        if(exception.message.includes('duplicate key')){
            message = '중복 키 에러!'
        }

        response.status(status)
            .json({
                statusCode: status,
                timeStamp: new Date().toISOString(),
                path: request.url,
                message,
            })
    }
}
