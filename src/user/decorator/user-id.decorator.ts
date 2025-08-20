import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";

/// 커스텀 데코레이터 UserId
// createParamDecorator -> 커스텀 파라미터 데코레이터를 만들기 위한 함수 (NestJS 제공)
export const UserId = createParamDecorator(
    // data -> 데코레이터에 넘겨주는 추가 값
    // context -> 현재 실행 컨텍스트
    (data: unknown, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();

        // UserId 가 없으면 오류 반환
        // if(!request || !request.user || !request.user.sub) {
        //     throw new UnauthorizedException('사용자 정보를 찾을 수 없습니다!');
        // }

        return request?.user?.sub;
    }
)