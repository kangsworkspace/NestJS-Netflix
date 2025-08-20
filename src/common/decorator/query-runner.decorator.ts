import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";

export const QueryRunner = createParamDecorator(
    (data: any, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();

        if (!request || !request.queryRunner) {
            // queryRunner가 없는 경우는 TransactionInterceptor를 적용하지 않았을 때,
            // => 서버의 문제
            throw new InternalServerErrorException();
        }

        return request.queryRunner;
    }
)