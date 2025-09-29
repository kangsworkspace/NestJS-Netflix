import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as ffmpeg from '@ffmpeg-installer/ffmpeg';
import * as ffprobe from 'ffprobe-static';
import * as ffmpegFluent from 'fluent-ffmpeg';
import * as session from 'express-session';

// Fmpeg 경로 설정
ffmpegFluent.setFfmpegPath(ffmpeg.path);
ffmpegFluent.setFfprobePath(ffprobe.path);



// NestJS 애플리케이션 실행 함수 구성
async function bootstrap() {
  // 루트 모듈(AppModule)을 기반으로 NestJS 애플리케이션 인스턴스 생성
  const app = await NestFactory.create(AppModule, {
    // 로거 표시 설정
    logger: ['debug'],
  });
  /// **Swagger 설정**
  const config = new DocumentBuilder()
  .setTitle('코드팩토리 넷플릭스')
  .setDescription('코드팩토리 NestJS 강의!')
  .setVersion('1.0')
  // 페이지에 Auth 옵션 버튼 추가
  .addBasicAuth()
  .addBearerAuth()
  .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      // 페이지를 새로고침해도 Authorize 정보가 사라지지 않음
      persistAuthorization: true,
    }
  })


  /// **Versioning 설정**
  // 모든 값의 URI에 v1을 포함해야 함(너무 광범위해서 사용 X)
  // app.setGlobalPrefix('v1');
  app.enableVersioning({
    // URI를 사용하여 Versioning
    // type: VersioningType.URI,
    // 기본 Version(잘 사용하지 않음)
    // defaultVersion: ['1', '2'],

    // HEADER를 사용하여 Versioning
    // type: VersioningType.HEADER,
    // header: 'version',

    // MEDIA TYPE을 사용하여 Versioning
    type: VersioningType.MEDIA_TYPE,
    key: 'v='
  })

  // 로거 라이브러리 Winston 사용
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))

  // 글로벌 파이프(전역 유효성 검사) 설정
  app.useGlobalPipes(new ValidationPipe({
    // DTO에 정의되지 않은 속성은 자동 제거
    // ex) DTO에 title만 있는데, age가 들어오면 age 자동 제거
    whitelist: true,

    // whitelist로 제거하는 대신,에러 발생 (whitelist와 같이 사용)
    // 400 Bad Request 응답 보냄
    forbidNonWhitelisted: true,

    // 요청으로 들어온 값(JSON/Query 등)을 DTO 클래스의 인스턴스로 자동 변환
    transform: true,
    // transform의 세부 옵션 설정
    transformOptions: {
      // @Type(() => Number) 같은 명시적 타입 지정 없이도, DTO에서 타입 정보를 기반으로 자동 변환을 수행
      // ex) "10" → 10, "true" → true 등
      enableImplicitConversion: true,
    }
  }));


  // 세션 설정
  app.use(
    session({
      // 프로덕트 환경에서는 환경변수 + 배포용, 개발용 다르게 처리
      secret: 'secret',
    })
  )

  // 서버를 지정된 포트에서 실행
  await app.listen(process.env.PORT || 3000);
}
// NestJS 애플리케이션 실행 함수 선언(서버 구동))
bootstrap();