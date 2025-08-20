import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { CommonModule } from 'src/common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { MovieUserLike } from './entity/movie-user-like-entity';
import { User } from 'src/user/entities/user.entity';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports:[
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      MovieUserLike,
      Director,
      Genre,
      User,
    ]),
    // 공통적인 기능을 위한 커스텀 모듈
    CommonModule,
    
    // // 파일 업로드 모듈 사용
    // MulterModule.register({
    //   // storage: 저장할 장소 | diskStorage: 로컬 스토리지
    //   storage: diskStorage({
    //     // cwd -> Current Working Directory (서버를 실행한 작업중인 폴더 가져오기)
    //     // ......./Netflix/public/movie 경로를 가져온다.
    //     // 실행 OS와 상관없이 정확한 경로를 가져온다.
    //     destination: join(process.cwd(), 'public', 'movie'),

    //     // 파일 이름 변경하기
    //     filename: (req, file, callback) => {
    //       const split = file.originalname.split('.');

    //       let extension = 'mp4';

    //       if(split.length > 1){
    //         extension = split[split.length - 1];
    //       }

    //       callback(null, `${v4()}_${Date.now()}.${extension}`);
    //     }
    //   }),
    // }),
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
