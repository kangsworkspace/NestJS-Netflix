// import { PartialType } from "@nestjs/mapped-types";
// Swagger에서 불러와야 Swagger에서 Schema 인식
import { PartialType } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraintInterface } from "class-validator";
import { CreateMovieDto } from "./create-movie.dto";

// class PasswordValidator implements ValidatorConstraintInterface {
//     validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
//         /// 비밀번호 길이는 4-8
//         return value.length > 4 && value.length < 8;
//     }
//     defaultMessage?(validationArguments?: ValidationArguments): string {
//         throw new Error("비밀번호의 길이는 4~8자 여야합니다. 입력된 비밀번호: ($value)");
//     }
// }

// function IsPasswordValid(validationOptions? : ValidationOptions){
//     return function(object: Object, propertyName: string) {
//         registerDecorator({
//             target: object.constructor,
//             propertyName,
//             options: validationOptions,
//             validator: PasswordValidator
//         });
//     }
// }

// export class updateMovieDto {
//     @IsNotEmpty()
//     @IsString()
//     @IsOptional()
//     title?: string;

//     @IsArray()
//     @ArrayNotEmpty()
//     @IsNumber({}, { each: true })
//     @IsOptional()
//     genreIds: number[];

//     @IsNotEmpty()
//     @IsString()
//     @IsOptional()
//     detail?: string;

//     @IsNotEmpty()
//     @IsNumber()
//     @IsOptional()
//     directorId?: number;
// }


export class UpdateMovieDto extends PartialType(CreateMovieDto){}
