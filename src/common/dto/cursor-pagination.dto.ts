import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsIn, IsInt, IsOptional, IsString } from "class-validator";

// 커서 기반 페이지네이션의 기본 DTO
//
export class CursorPaginationDto {
    // 정렬 받을 값들을 받는다.
    // id_52, likeCount_20
    @IsString()
    @IsOptional()
    // Swagger에 보여줄 문서 내용 설정
    @ApiProperty({
        description: '페이지네이션 커서',
        example: 'eyJ2YWx1ZXMiOnsiaWQiOjF9LCJvcmRlciI6WyJpZF9ERVNDIl19'
    })
    cursor?: string;

    // 오름차순, 내림차순 정렬
    // [id_DESC, likeCount_DESC]
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    // Swagger에 보여줄 문서 내용 설정
    @ApiProperty({
        description: '내림차 또는 오름차 정렬',
        example: ['id_DESC']
    })
    // 배열이 아니면 배열로 받음
    @Transform(({value}) => (Array.isArray(value) ? value : [value]))
    order: string[] = ['id_DESC'];


    @IsInt()
    @IsOptional()
    // Swagger에 보여줄 문서 내용 설정
    @ApiProperty({
        description: '가져올 데이터의 갯수',
        example: 5,
    })        
    take: number = 5;
}