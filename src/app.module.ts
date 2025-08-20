import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { Movie } from './movie/entity/movie.entity';
import { MovieDetail } from './movie/entity/movie-detail.entity';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entity/director.entity';
import { GenreModule } from './genre/genre.module';
import { Genre } from './genre/entities/genre.entity';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { envVariableKeys } from './common/const/env.const';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/guard/auth.guard';
import { RBACGuard } from './auth/guard/rbac.guard';
import { ResponseTimeInterceptor } from './common/interceptor/response-time.interceptor';
import { ForbiddenExceptionFilter } from './common/filter/forbidden.filter';
import { QueryFailedExceptionFilter } from './common/filter/query-failed.filter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MovieUserLike } from './movie/entity/movie-user-like-entity';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottleInterceptor } from './common/interceptor/throttle.interceper';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';


// NestJS에서 애플리케이션의 루트 모듈을 정의할 때 사용
@Module({
  // 내부/외부 모듈 불러오기
  // 외부 기능이나 다른 모듈이 필요할 때 imports
  imports: [
    // .env 파일을 위한 설정
    // @nestjs/config 패키지의 모듈로, .env 환경변수를 애플리케이션에서 사용할 수 있게 함
    ConfigModule.forRoot({
      // 어떤 모듈에서든 ConfigModule에 등록된 모듈 사용 가능
      isGlobal: true,

      // 노드 환경변수에 따라 다른 환경변수 파일 설정
      envFilePath: process.env.NODE_ENV === 'test' ? 'test.env' : '.env',

      // Joi를 이용한 환경변수 유효성 검사(validation) 정의
      // 애플리케이션 시작 시, .env의 형식이 잘못되면 오류를 발생시켜 안전하게 실행을 막을 수 있다
      // 
      // .string(), number() => 해당 타입이어야 한다.
      // .valid() 다음 값 중 하나여야 한다.
      // .requred() 해당 필드가 반드시 존재해야 한다.
      validationSchema: Joi.object({
        ENV: Joi.string().valid('dev', 'prod', 'test').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
      })
    }),
    // TypeORM 모듈을 비동기 방식으로 설정
    // ConfigService를 통해 환경변수를 안전하게 가져오고,
    // 외부 설정(API 호출, 파일 로딩 등)이 필요한 경우 유연하게 기다릴 수 있도록 구성
    TypeOrmModule.forRootAsync({
      // 설정을 위한 팩토리 함수.
      // 이 함수에서 configService를 이용해 DB 설정 값을 가져온다
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVariableKeys.dbType) as "postgres",
        host: configService.get<string>(envVariableKeys.dbHost),
        port: configService.get<number>(envVariableKeys.dbPort),
        username: configService.get<string>(envVariableKeys.dbUsername),
        password: configService.get<string>(envVariableKeys.dbPassword),
        database: configService.get<string>(envVariableKeys.dbDatabase),
        
        // TypeORM이 관리할 엔티티들
        entities: [
          Movie,
          MovieDetail,
          MovieUserLike,
          Director,
          Genre,
          User,
        ],

        // 서버 실행 시 TypeORM이 DB 스키마를 자동으로 생성/수정
        // 운영 환경: synchronize: false + migration을 사용해서 버전 관리
        synchronize: true,
        ssl: { rejectUnauthorized: false },
      }),

      // 위의 useFactory에서 사용할 서비스를 주입
      inject: [ConfigService],
    }),

    // 이미지를 프론트엔드에 전달하기 위한 모듈
    ServeStaticModule.forRoot({
      // 공개할 경로 public 하위부터
      rootPath: join(process.cwd(), 'public'),

      // public하위부터 공개하기 때문에 /movie/.... 로 접근
      // 하지만 movie/id 경로와 겹치기 때문에
      // 추가로 /public/ 을 붙이게 하도록 설정
      serveRoot: '/public/'
    }),

    // 캐싱을 위한 모듈
    CacheModule.register({
      // 각 모듈마다 CacheModule을 imports에 넣지 않아도 됨
      isGlobal: true,
      // 기본 ttl 설정
      ttl: 3000,
    }),

    // Task Scheduling을 위한 모듈
    ScheduleModule.forRoot(),

    // 로거 라이브러리 Winston 모듈
    WinstonModule.forRoot({
      // 최소 레벨
      level: 'debug',
      transports: [
        // 콘솔 설정
        new winston.transports.Console({
          format: winston.format.combine(
            // 색깔 설정
            winston.format.colorize({ all: true, }),
            // 시간 표시 설정 - timestamp
            winston.format.timestamp(),
            // 로그의 내용 설정
            winston.format.printf(info => `${info.timestamp} ${info.context} ${info.level} ${info.message}`),
          ),
        }),

        // File 관련 설정
        new winston.transports.File({
          // 로그 파일을 지정할 경로
          dirname: join(process.cwd(), 'logs'),
          // 저장할 파일 이름
          filename: 'logs.log',
          // 저장할 파일 포맷
          format: winston.format.combine(
            // 시간 표시 설정 - timestamp
            winston.format.timestamp(),
            // 로그의 내용 설정
            winston.format.printf(info => `${info.timestamp} ${info.context} ${info.level} ${info.message}`),
          ),
        })
      ]
    }),

    /// 각각의 도메인별 모듈
    MovieModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UserModule,
  ],

  // 서비스, 유틸, 인터셉터, 가드 등 실행 로직을 담은 클래스
  // 선언된 순서대로 실행
  providers: [
    // Global Guard
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    
    // Global Guard
    {
      provide: APP_GUARD,
      useClass: RBACGuard
    },

    // InterCeptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor,
    },

    // Throttle Interceptor 설정
    {
      provide: APP_INTERCEPTOR,
      useClass: ThrottleInterceptor,
    },

    // // ExceptionFilter
    // {
    //   provide: APP_FILTER,
    //   useClass: ForbiddenExceptionFilter,
    // },

    // ExceptionFilter
    {
      provide: APP_FILTER,
      useClass: QueryFailedExceptionFilter,
    },
  ],
})
// NestModule을 구현하면, configure() 메서드에서 미들웨어 등록 가능
export class AppModule implements NestModule { 
  // NestJS 미들웨어를 라우팅 기반으로 등록할 수 있는 메서드
  configure(consumer: MiddlewareConsumer) {
    // 미들웨어 등록
    // BearerTokenMiddleware를 모든 요청에 대해 실행되도록 등록
    consumer.apply(
      BearerTokenMiddleware,
    )
    // auth/login과 auth/register 경로는 미들웨어에서 제외
    .exclude({
      path: 'auth/login',
      method: RequestMethod.POST,
      // Default Version 설정
      // version: ['1', '2'],
    }, {
      path: 'auth/register',
      method: RequestMethod.POST,
      // Default Version 설정
      // version: ['1', '2'],
    })
    // 적용 대상 경로 전체 (*)
    .forRoutes('*')
  }
}


/// ✅ NestJS 요청 처리 순서
/// 
/// 요청 로직 처리(Controller -> Service -> Repository)
///
/// 0. 클라이언트 요청
///
/// 1. 🧱 Middleware
///    - Express 기반의 전처리 단계
///    - 로깅, 쿠키 파싱, 토큰 추출 등
///    - 설정 데코레이터: 없음 (app.use() 또는 consumer로 등록)
///
///    : Auth -> BearerTokenMiddleware
///
///
///
/// 2. 🛡️ Guard
///    - 라우트 접근 제어 (ex. 로그인 여부, Role 검사)
///    - false 반환 시 요청 차단 (403 Forbidden)
///    - 설정 데코레이터: @UseGuards()
///    - 커스텀 데코레이터: @Public(), @Guard()
///    - 내부적으로 Passport - Strategy로도 실행 가능
///
///    : Auth -> AuthGuard, RBACGuard, JwtStrategy, LocalStrategy
///
///
///
/// 3. 🔁 Interceptor (요청 전)
///    - 요청 전 가로채기 (ex. 트랜잭션 시작, 로깅, 캐싱)
///    - 설정 데코레이터: @UseInterceptors()
///
///    : Common -> CacheInterceptor, ResponseTimeInterceptor, TransactionInterceptor
///
///
///
/// 4. 🧪 Pipe
///    - 요청 데이터의 유효성 검사 및 변환 (DTO 검사 등)
///    - 설정 데코레이터: @UsePipes(), @Body(), @Param(), @Query()
///
///    : Movie -> MovieTitleValidationPipe
///
///
///
/// 5. 🎯 Controller
///    - 실제 라우트 핸들러 실행 (@Post(), @Get() 등)
///    - 설정 데코레이터: @Controller(), @Post(), @Get(), ...
///
///    : AuthController, CommonController, DirectorController, GenreController,
///      MovieController, UserController
/// 
///
///
/// 6. ⚙️ Service
///    - 비즈니스 로직 실행 (DB 조회, 저장 등)
///    - 설정 데코레이터: @Injectable()
///
///    : AuthService, CommonService, DirectorService, GenreService, 
///      MovieService, UserService, 
///
///
///
/// 7. 🗂️ Repository
///    - DB와의 직접적인 데이터 접근 (TypeORM, Prisma 등)
///    - 설정 데코레이터: @InjectRepository()
///
///    : 대부분의 경우 Repository 클래스를 따로 만들지 않고,
///      아래처럼 NestJS가 자동으로 주입해주는 TypeORM 기본 Repository를 사용
///
///      @InjectRepository(Movie)
///      private readonly movieRepository: Repository<Movie>,
///
///      @InjectRepository(User)
///      private readonly userRepository: Repository<User>,
///
/// 
///
/// 8. 🔁 Interceptor (응답 후)
///    - 응답 후 가로채기 (ex. 트랜잭션 커밋, 응답 가공)
///    - pipe() 내부의 tap(), catchError() 등이 응답 후에 해당
///
///    : Common -> CacheInterceptor, ResponseTimeInterceptor, TransactionInterceptor
///
///
///
/// 9. ❗ Exception Filter
///    - 처리 중 발생한 예외를 가로채고 응답 형식 통일
///    - 설정 데코레이터: @Catch()
///
///    : Common -> ForbiddenExceptionFilter, 
///
/// 10. 📤 응답 반환
///    - 클라이언트에게 응답 전송
