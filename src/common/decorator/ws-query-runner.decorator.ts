import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";

export const WsQueryRunner = createParamDecorator(
    (data: any, context: ExecutionContext) => {
        const client = context.switchToWs().getClient();

        if (!client || !client.data || !client.data.queryRunner) {
            // queryRunner가 없는 경우는 TransactionInterceptor를 적용하지 않았을 때,
            // => 서버의 문제
            throw new InternalServerErrorException();
        }

        return client.data.queryRunner;
    }
)