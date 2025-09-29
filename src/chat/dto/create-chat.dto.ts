import { IsNumber, IsOptional, IsString } from "class-validator";

// 채팅 메시지 생성을 위한 데이터 전송 객체 (DTO)
export class CreateChatDto {
    // 메시지 내용 - 필수 문자열
    @IsString()
    message: string;

    // 채팅방 ID - 선택적 숫자 (관리자만 사용)
    @IsNumber()
    @IsOptional()
    room?: number;
}