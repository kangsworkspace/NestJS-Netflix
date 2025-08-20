import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { v4 } from "uuid";
import { rename } from "fs/promises";
import { join } from "path";

@Injectable()
export class MovieFilePipe implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>>{
    constructor(
        private readonly options: {
            /// MB로 입력
            maxSize: number,
            mimetype: string,
        }
    ){}

    async transform(value: Express.Multer.File, metadata: ArgumentMetadata): Promise<Express.Multer.File> {
        console.log('📌 MovieFilePipe transform value:', value);
        
        if(!value){
            throw new BadRequestException('Movie 필드는 필수입니다!');
        }

        const byteSize = this.options.maxSize * 1000000;

        if(value.size > byteSize){
            throw new BadRequestException(`${this.options.maxSize}MB 이하의 사이즈만 업로드 가능합니다!`);
        }

        if(value.mimetype !== this.options.mimetype){
            throw new BadRequestException(`${this.options.mimetype} 만 업로드 가능합니다!`);
        }

        const split = value.originalname.split('.');

        let extension = 'mp4';

        if(split.length > 1){
            extension = split[split.length - 1];
        }

        /// uuid_Date.mp4
        const filename = `${v4()}_${Date.now()}.${extension}`;
        const newPath = join(value.destination, filename);

        await rename(value.path, newPath);

        return {
            ...value,
            filename,
            path: newPath
        }
    }
}