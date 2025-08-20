import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { number } from "joi";

export class CreateMovieDto{
    @IsNotEmpty()
    @IsString()
    // Swagger 문서에 들어갈 내용 설정
    @ApiProperty({
        description: '영화 제목',
        example: '겨울왕국'
    })
    title: string;

    @IsNotEmpty()
    @IsString()
    // Swagger 문서에 들어갈 내용 설정
    @ApiProperty({
        description: '영화 설명',
        example: '3시간 순삭'
    })
    detail: string;

    @IsNotEmpty()
    @IsNumber()
    // Swagger 문서에 들어갈 내용 설정
    @ApiProperty({
        description: '감독 객체 ID',
        example: 1
    })    
    directorId: number

    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({ maxDecimalPlaces: 0 }, { each: true })
    // FormData로 들어오는 값은 모두 string으로 들어오기 때문에 사용
    @Type(() => Number)
        // Swagger 문서에 들어갈 내용 설정
    @ApiProperty({
        description: '장르 객체 배열',
        example: [1, 2]
    })
    genreIds: number[]

    @IsString()
    // Swagger 문서에 들어갈 내용 설정
    @ApiProperty({
        description: '영화 파일 이름',
        example: 'aaa-bbb-ccc-ddd.jpg'
    })
    movieFileName: string;
}