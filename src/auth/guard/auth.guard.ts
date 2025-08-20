import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Public } from "../decorator/public.decorator";

@Injectable()
export class AuthGuard implements CanActivate{
    constructor(
        private readonly reflector: Reflector,
    ){}

    canActivate(context: ExecutionContext): boolean {
        // public decoration은 모든 로직을 bypass 한다.
        const isPublic = this.reflector.get(Public, context.getHandler());

        if(isPublic){
            return true;
        }

        // 요청에서 user 객체가 존재하는지 확인한다.
        const request = context.switchToHttp().getRequest();

        if(!request.user || request.user.type != 'access'){
            return false;
        }

        return true;
    }
}