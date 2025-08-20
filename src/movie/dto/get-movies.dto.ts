import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { number } from "joi";
import { CursorPaginationDto } from "src/common/dto/cursor-pagination.dto";
import { PagePaginationDto } from "src/common/dto/page-pagination.dto";

// **페이지 기반 페이지네이션
//
// export class GetMoviesDto extends PagePaginationDto {
//     @IsString()
//     @IsOptional()
//     title?: string;
// }


// **커서 기반 페이지네이션
// 
export class GetMoviesDto extends CursorPaginationDto {
    @IsString()
    @IsOptional()
    // Swagger에 담을 문서 내용 설정
    @ApiProperty({
        // 유추하지 않고 임의로 타입을 지정할 수 있음
        // 타입이 꼬일 수 있어 지양해야함
        // type: number,
        description: '영화의 제목',
        example: '프로메테우스'
    })
    title?: string;
}