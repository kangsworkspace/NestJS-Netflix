import { Controller, Request, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor, ParseIntPipe, BadRequestException, ParseBoolPipe, NotFoundException, UseGuards, UploadedFile, UploadedFiles, Version, VERSION_NEUTRAL, Req } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MovieFilePipe } from './pipe/movie-file.pipe';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';
import { CacheKey, CacheTTL, CacheInterceptor as CI } from '@nestjs/cache-manager';
import { Throttle } from 'src/common/decorator/throttle.decorators';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/// Version 설정
// @Controller({
//   path: 'movie',
//   // Version 설정
//   version: '1',

//   // 상세 버전 외의 모든 버전을 흡수함.
//   // 모듈의 순서가 중요
//   // version: VERSION_NEUTRAL,
// })
@Controller('movie')
// Swagger Authorize 설정
// => 페이지에 자물쇠 모양 버튼 생김(Bearer 토큰 인증)
@ApiBearerAuth()
// Swagger 엔드 포인트를 그룹으로 정리
@ApiTags('movie')
// @UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) { }

  /// /movie
  @Get()
  @Public()
  // 쓰로틀 설정(1분에 5번)
  @Throttle({
    // 횟수
    count: 5,
    // 단위
    unit: 'minute'
  })
  // Swagger API 엔드 포인트에 대한 설명 넣기
  @ApiOperation({
    description: '[Movie]를 Pagination하는 API'
  })
  // Swagger API 응답에 대한 설명 넣기
  @ApiResponse({
    status: 200,
    description: '성공적으로 API Pagination을 실행 했을 때'
  })
  // Swagger API 응답에 대한 설명 넣기
  @ApiResponse({
    status: 400,
    description: 'Pagination를 잘못 입력 했을때'
  })  
  // 개별 Versioning
  // @Version(['1', '5'])
  getMovies(
    // @Query('title', MovieTitleValidationPipe) title?: string,
    @Query() dto: GetMoviesDto,

    // 좋아요 정보를 받기 위한 쿼리를 요청한 유저의 ID
    @UserId() userId?: number,
  ) {
    return this.movieService.findAll(dto, userId);
  }

  /// /movie/recent
  @Get('recent')
  // 캐시 인터셉터 사용
  @UseInterceptors(CI)
  // 캐시 Key 일괄 설정(쿼리가 바뀌어도 동일한 키로 저장 가능)
  @CacheKey('getMoviesRecent')
  // 캐시 TTL 설정
  @CacheTTL(1000)
  getMoviesRecent() {
    return this.movieService.findRecent();
  }

  /// /movie/1
  @Get(':id')
  @Public()
  getMovie(
    @Param('id') id: string,
    @Req() request: any,
  ) {
    // 세션에서 현재 영화 조회 횟수 정보를 가져옴
    const session = request.session;
    const movieCount = session.movieCount ?? {};

    // 해당 영화의 조회 횟수를 1 증가시키고 세션에 저장
    // 기존에 조회한 적이 있으면 +1, 없으면 1로 초기화
    request.session.movieCount = {
      ...movieCount,
      [id]: movieCount[id] 
        ? movieCount[id] + 1
        : 1,
    }

    console.log(session);
    return this.movieService.findOne(id);
  }

  // /movie 경로의 POST 요청에 응답하는 라우터 핸들러
  @Post()
  // 사용자 역할(Role-Based Access Control)을 검사하는 커스텀 데코레이터
  // admin보다 낮으면 오류 던짐
  @RBAC(Role.admin)
  // 트랜잭션 인터셉터 사용
  // @UseInterceptors(TransactionInterceptor) (Prisma에서는 사용 X)
  // 파일 리스트 업로드 인터셉터 사용
  // @UseInterceptors(FilesInterceptor('movies'))

  // 여러 파일 업로드 인터셉터 사용
  // @UseInterceptors(FileFieldsInterceptor([
  //   {
  //     name: 'movie',
  //     maxCount: 1,
  //   },
  //   {
  //     name: 'poster',
  //     maxCount: 2
  //   }
  // ],
  // {
  //   // 파일 용량 제한
  //   limits: {
  //     fileSize: 20000000,
  //   },
  //   // callback(error, 파일을 받을 지 여부)
  //   fileFilter(req, file, callback){
  //     console.log(file);

  //     /// video/mp4 파일 형식 필터
  //     if(file.mimetype !== 'video/mp4'){
  //       return callback(new BadRequestException('mp4 타입만 업로드 가능합니다!'), false);
  //     }

  //     return callback(null, true);
  //   }
  // },
  // ))

  // // 단일 파일 업로드 인터셉터 사용
  // @UseInterceptors(FileInterceptor('movie', {
  //   // 용량 제한
  //   limits: {
  //     fileSize: 20000000,
  //   },

  //   // callback(error, 파일을 받을 지 여부)
  //   fileFilter(req, file, callback){

  //    /// video/mp4 파일 형식 필터
  //   if(file.mimetype !== 'video/mp4'){
  //     return callback(new BadRequestException('mp4 타입만 업로드 가능합니다!'), false);
  //   }

  //   return callback(null, true);
  // }}))
  postMovie(
    @Body() body: CreateMovieDto,
    // Express의 req 객체 전체를 주입해주는 데코레이터
    // any 타입으로 오기 때문에 내부의 값을 사용할 때,
    // UserId, QueryRunner처럼 커스텀 데코레이터로 만들면 좋다.
    // @Request() req,

    // queryRunner를 가져오는 커스텀 데코레이터 (Prisma에서는 사용 X)
    // @QueryRunner() queryRunner: QR,
    // userId를 가져오는 커스텀 데코레이터
    @UserId() userId: number,

    // 단일 파일 업로드 인터셉터 사용
    // @UploadedFile(
    // // movie 객체 검증 파이프 사용
    // new MovieFilePipe({
    //   maxSize: 20,
    //   mimetype: 'video/mp4'
    // }),
    // ) movie: Express.Multer.File,

    // 파일 리스트 업로드 인터셉터 사용
    // @UploadedFiles() files: Express.Multer.File[]

    // 여러 파일 업로드 인터셉터 사용
    // @UploadedFiles(
    //   new MovieFilePipe({
    //     maxSize: 20,
    //     mimetype: 'video/mp4'
    //   }),
    // ) files: {
    //   movie?: Express.Multer.File[],
    //   // poster?: Express.Multer.File[],
    // }
  ) {
    return this.movieService.create(
      body,
      userId,
      // movie.filename,
      // queryRunner, (Prisma에서는 사용 X)
    );
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id') id: string,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(
      id,
      body,
    );
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(
    @Param('id') id: string,
  ) {
    return this.movieService.remove(id);
  }

  /**
   * 좋아요 기능 구성 - Frontend - 가정
  * 
  * [Like] [Dislike]
  * 
  * 아무것도 누르지 않은 상태
  * Like & Dislike 모두 버튼 꺼져있음
  * /=====================
  * 
  * Like 버튼 누르면
  * Like 버튼 불 켜짐
  * 
  * Like 버튼 다시 누르면
  * Like 버튼 불 꺼짐
  * /=====================
  * 
  * Dislike 버튼 누르면
  * Dislike 버튼 불 켜짐
  * 
  * Dislike 버튼 다시 누르면
  * Dislike 버튼 불 꺼짐
  * /=====================
  * 
  * Like 버튼 누르면
  * Like 버튼 불 켜짐
  * 
  * Dislike 버튼 누르면
  * Like 버튼 불 꺼지고 Dislike 버튼 불 켜짐
  * /=====================
  */

  // @POST => 경로 파라미터 /movies/1/like
  @Post(':id/like')
  createMovieLike(
    // 위 URL의 id 값을 컨트롤러 메서드의 인자로 전달
    @Param('id') movieId: string,
    // 커스텀 데코레이터
    @UserId() userId: string,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDislike(
    @Param('id') movieId: string,
    @UserId() userId: string,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}


// 원하는 에러 메세지를 보내는 경우
//
// @Get(':id')
// getMovie(@Param('id', new ParseIntPipe({
//   exceptionFactory(error) {
//     throw new BadRequestException('숫자를 입력해주세요!');
//   }
// })) id: number) {
//   return this.movieService.findOne(id);
// }

// Version 설정 예시
// @Controller({
//   path: 'movie',
//   // Version 설정
//   version: ['2', '3'],
// })
// export class MovieController2 {
//   @Get()
//   getMovies() {
//     return [];
//   }
// }




