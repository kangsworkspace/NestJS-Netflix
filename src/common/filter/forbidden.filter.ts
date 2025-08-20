import { ArgumentsHost, Catch, ExceptionFilter, ForbiddenException } from "@nestjs/common";

// ForbiddenException이 발생했을 때 필터가 작동하도록 설정
@Catch(ForbiddenException)
export class ForbiddenExceptionFilter implements ExceptionFilter{
    // 필터가 작동했을 때 동작하는 메서드
    // exception -> 발생한 예외 객체 (ForbiddenException 인스턴스)
    // host -> 실행 컨텍스트 (ExecutionContext, RpcContext, WsContext 등)
    catch(exception: any, host: ArgumentsHost) {
        const context = host.switchToHttp();
        const response = context.getResponse();
        const request = context.getRequest();
        const status = exception.getStatus();

        console.log(`[UnauthorizationException] ${request.method} ${request.path}`);

        // 예외 응답 커스타미이징
        // status(원하는 스테이터스 코드)
        // .json({ 원하는 응답 객체 })
        response.status(status)
            .json({
                statusCode: status,
                timeStamp: new Date().toISOString(),
                path: request.url,
                message: '권한이 없습니다!!!',
            })
    }
}