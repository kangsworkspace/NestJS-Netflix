import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { Movie } from './entity/movie.entity';
// import { MovieDetail } from './entity/movie-detail.entity';
// import { Director } from 'src/director/entity/director.entity';
// import { Genre } from 'src/genre/entity/genre.entity';
import { CommonModule } from 'src/common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
// import { MovieUserLike } from './entity/movie-user-like-entity';
// import { User } from 'src/user/entity/user.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { Movie, MovieSchema } from './schema/movie.schema';
import { MovieDetail, MovieDetailSchema } from './schema/movie-detail.schema';
import { MovieUserLike, MovieUserLikeSchema } from './schema/movie-user-like.schema';
import { Director, DirectorSchema } from 'src/director/schema/director.schema';
import { Genre, GenreSchema } from 'src/genre/schema/genre.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports:[
    // TypeOrmModule.forFeature([
    //   Movie,
    //   MovieDetail,
    //   MovieUserLike,
    //   Director,
    //   Genre,
    //   User,
    // ]),
    MongooseModule.forFeature([
      { name: Movie.name, schema: MovieSchema },
      { name: MovieDetail.name, schema: MovieDetailSchema },
      { name: MovieUserLike.name, schema: MovieUserLikeSchema },
      { name: Director.name, schema: DirectorSchema },
      { name: Genre.name, schema: GenreSchema },
      { name: User.name, schema: UserSchema },
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
