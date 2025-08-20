import { Controller, Post, Headers, Request, UseGuards, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGaurd } from './strategy/jwt.strategy';
import { Public } from './decorator/public.decorator';
import { ApiBasicAuth, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Authorization } from './decorator/authorization.decorator';

@Controller('auth')
// Swagger Authorize 설정
// => 페이지에 자물쇠 모양 버튼 생김(Bearer 토큰 인증)
@ApiBearerAuth()
// Swagger 엔드 포인트를 그룹으로 정리
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Public()
  // Swagger 로그인 설정
  // => 페이지에 자물쇠 모양 버튼 생김
  @ApiBasicAuth()
  @Post('register')
  // 헤더에서 값을 추출하는 경우
  // registerUser(@Headers('authorization') token: string){
  // 커스텀 데코레이터로 추출하는 경우(Swagger에 표시되지 않음)
  registerUser(@Authorization() token: string){
    return this.authService.register(token);
  }

  @Public()
  // Swagger 로그인 설정
  // => 페이지에 자물쇠 모양 버튼 생김
  @ApiBasicAuth()
  @Post('login')
  // 헤더에서 값을 추출하는 경우
  // loginUser(@Headers('authorization') token: string){
  // 커스텀 데코레이터로 추출하는 경우(Swagger에 표시되지 않음)
  loginUser(@Authorization() token: string){
    return this.authService.login(token);
  }

  @Post('token/block')
  blockToken(
    @Body('token') token: string
  ) {
    return this.authService.tokenBlock(token);
  }

  @Post('token/access')
  async rotateAccessToken(
    @Request() req
  ){
    return {
      accessToken: await this.authService.issueToken(req.user, false)
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login/passport')
  async loginUserPassport(@Request() req){
    return {
      refreshToken: await this.authService.issueToken(req.user, true),
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }

  // @UseGuards(JwtAuthGaurd)
  // @Get('private')
  // async private(@Request() req){
  //   return req.user;
  // }
}