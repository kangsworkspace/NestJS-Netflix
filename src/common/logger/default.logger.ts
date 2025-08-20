import { ConsoleLogger, Injectable } from "@nestjs/common";

@Injectable()
/// 커스텀 로거
// ConsoleLogger를 상속받아 로거의 기능 커스텀 구현
export class DefaultLogger extends ConsoleLogger{
    warn(message: unknown, ...rest: unknown[]): void {
        console.log('----WARN LOG----');
        super.warn(message, ...rest);
    }

    error(message: unknown, ...rest: unknown[]): void {
        console.log('----ERROR LOG----');
        super.error(message, ...rest);        
    }
}