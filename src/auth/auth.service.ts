import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// import { Role, User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { envVariableKeys } from 'src/common/const/env.const';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/common/prisma.service';
import { Role } from '@prisma/client';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/user/schema/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
    constructor(
        // @InjectRepository(User)
        // private readonly userRepository: Repository<User>,

        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
        
        private readonly userService: UserService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,

        // private readonly prisma: PrismaService,

        @InjectModel(User.name)
        private readonly userModel: Model<User>,
    ){}

    async tokenBlock(token: string){
        const payload = this.jwtService.decode(token);

        const expiryDate = +new Date(payload['exp'] * 1000);
        const now = +Date.now()
        const differenceInSeconds = (expiryDate - now) / 1000;

        await this.cacheManager.set(`BLOCK_TOKEN_${token}`, payload, Math.max((differenceInSeconds) * 1000, 1))

        return true;
    }
    
    parseBasicToken(rawToken: string){
        /// 1) 토큰을 ' ' 기준으로 스플릿 한 후 토큰 값만 추출하기
        /// ['Basic', $token]
        const basicSplit = rawToken.split(' ');

        if(basicSplit.length !== 2){
            throw new BadRequestException('토큰 포맷이 잘못되었습니다!');
        }

        const [basic, token] = basicSplit;

        if(basic.toLowerCase() !== 'basic'){
            throw new BadRequestException('토큰 포맷이 잘못되었습니다!');
        }

        /// 2) 추출한 토큰을 base64 디코딩해서 이메일과 비밀번호로 나눈다.
        const decoded = Buffer.from(token, 'base64').toString('utf-8');

        /// 3) "email:password" 형태 : 기준으로 분리하기
        const tokenSplit = decoded.split(':');

        if(tokenSplit.length !== 2){
            throw new BadRequestException('토큰 포맷이 잘못되었습니다!');
        }

        const [email, password] = tokenSplit;

        return {
            email,
            password,
        }
    }

    async parseBearerToken(rawToken: string, isRefreshToken: boolean){
        const basicSplit = rawToken.split(' ');

        if(basicSplit.length !== 2){
            throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
        }

        const [bearer, token] = basicSplit;

        if(bearer.toLocaleLowerCase() !== 'bearer'){
            throw new BadRequestException('토큰 포맷이 잘못되었습니다!');
        }

        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                { secret: this.configService.get<string>(envVariableKeys.refreshTokenSecret) },
            );

            if (isRefreshToken) {
                if (payload.type !== 'refresh') {
                    throw new BadRequestException('Refresh 토큰을 입력해주세요')
                }
            } else {
                if (payload.type !== 'access') {
                    throw new BadRequestException('Access 토큰을 입력해주세요')
                }
            }

            return payload;

        } catch (error) {
            throw new UnauthorizedException('토큰이 만료됐습니다!');
        }
    }

    /// rawToken -> "Basic $toekn"
    async register(rawToken: string){
        const { email, password } = this.parseBasicToken(rawToken);

        return this.userService.create({
            email,
            password
        })
    }

    async authenticate(email: string, password: string) {

        // MongoDB
        const user = await this.userModel.findOne(
            { email },
            { 
                password: 1,
                role: 1,
            },
        ).exec();

        // Prisma
        // const user = await this.prisma.user.findUnique({
        //     where: { email }
        // });

        // TypeORM
        // const user = await this.userRepository.findOne({
        //     where: { email }
        // });

        if (!user) {
            throw new BadRequestException('잘못된 로그인 정보입니다!');
        }

        // password => 암호화가 진행된 비밀번호 | user.password => 암호화가 안된 비밀번호(암호화 진행 후 비교)
        // const passOk = await bcrypt.compare(password, user.password);

        // if (!passOk) {
        //     throw new BadRequestException('잘못된 로그인 정보입니다!');
        // }

        return user;
    }

    issueToken(user: {_id: any, role: Role}, isRefreshToken: boolean) {
        const accessTokenSecret = this.configService.get<string>(envVariableKeys.accessTokenSecret);
        const refreshTokenSecret = this.configService.get<string>(envVariableKeys.refreshTokenSecret);

        return this.jwtService.signAsync({
            sub: user._id,
            role: user.role,
            type: isRefreshToken ? 'refresh' : 'access',
        }, {
            secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
            expiresIn: isRefreshToken ? '24H': 300,
        })
    }

    async login(rawToken: string) {
        const { email, password } = this.parseBasicToken(rawToken);

        const user = await this.authenticate(email, password);

        return {
            refreshToken: await this.issueToken(user, true),
            accessToken: await this.issueToken(user, false),
        }
    }
}