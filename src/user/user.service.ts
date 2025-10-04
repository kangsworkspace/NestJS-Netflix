import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
// import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';
import { PrismaService } from 'src/common/prisma.service';
import { Prisma } from '@prisma/client';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schema/user.schema';

@Injectable()
export class UserService {
  constructor(
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,

    private readonly configService: ConfigService,
    // private readonly prisma: PrismaService,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) { }


  // // ==============================
  // // (MongoDB)
  // // ==============================
  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    const user = await this.userModel.findOne({ email }).exec();

    if (user) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    };

    const hash = await bcrypt.hash(password, this.configService.get<number>(envVariableKeys.hashRounds) ?? 10)

    await this.userModel.create({
      email,
      password: hash,
    });

    return this.userModel.findOne({ email }, {
      createdMovies: 0,
      likedMovies: 0,
      chats: 0,
      chatRooms: 0,
    }).exec();
  }

  async findAll() {
    return this.userModel.find().exec();
  }

  async findOne(id: number) {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password } = updateUserDto;

    const user = await this.userModel.findById(id).exec();

    if(!user){
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    let input = {
      ...updateUserDto,
    };

    if(password){
      const hash = await bcrypt.hash(password, this.configService.get<number>(envVariableKeys.hashRounds) ?? 10)

      input = {
        ...input,
        password: hash,
      };
    }

    await this.userModel.findByIdAndUpdate(id, input).exec();

    return this.userModel.findById(id);
  }

  async remove(id: number) {
    const user = await this.userModel.findById(id).exec();
    
    if(!user){
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    await this.userModel.findByIdAndDelete(id).exec();

    return id;
  }

  // // ==============================
  // // (Prisma)
  // // ==============================
  // async create(createUserDto: CreateUserDto) {
  //   const { email, password } = createUserDto;

  //   const user = await this.prisma.user.findUnique({
  //     where: { email }
  //   });

  //   if(user){
  //     throw new BadRequestException('이미 존재하는 이메일입니다.');
  //   };

  //   const hash = await bcrypt.hash(password, this.configService.get<number>(envVariableKeys.hashRounds) ?? 10)

  //   await this.prisma.user.create({
  //     data: {
  //       email,
  //       password: hash
  //     }
  //   });

  //   return this.prisma.user.findUnique({
  //     where: { email }
  //   });
  // }

  // findAll() {
  //   return this.prisma.user.findMany();
  // }

  // async findOne(id: number) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { id },
  //   });

  //   if(!user){
  //     throw new NotFoundException('존재하지 않는 사용자입니다.');
  //   }

  //   return user;
  // }

  // async update(id: number, updateUserDto: UpdateUserDto) {
  //   const { password } = updateUserDto;

  //   const user = await this.prisma.user.findUnique({
  //     where: { id },
  //   });

  //   if (!user) {
  //     throw new NotFoundException('존재하지 않는 사용자입니다.');
  //   }

  //   let input: Prisma.UserUpdateInput = {
  //     ...updateUserDto
  //   };

  //   if(password){
  //     const hash = await bcrypt.hash(password, this.configService.get<number>(envVariableKeys.hashRounds) ?? 10)

  //     input = {
  //       ...input,
  //       password: hash
  //     }
  //   }

  //   // if (password) {
  //   //   const hash = await bcrypt.hash(
  //   //     password,
  //   //     this.configService.get<number>(envVariableKeys.hashRounds) ?? 10
  //   //   );
  //   // }

  //   // const hash = await bcrypt.hash(password, this.configService.get<number>(envVariableKeys.hashRounds) ?? 10);

  //   await this.prisma.user.update({
  //     where: { id },
  //     data: input,
  //   });

  //   return this.prisma.user.findUnique({
  //     where: { id }
  //   });
  // }

  // async remove(id: number) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { id }
  //   });

  //   if(!user){
  //     throw new NotFoundException('존재하지 않는 사용자입니다!');
  //   }

  //   await this.prisma.user.delete({
  //     where: { id }
  //   });

  //   return id;
  // }


  // ==============================
  // (TypeORM)
  // ==============================
  // async create(createUserDto: CreateUserDto) {
  //   const { email, password } = createUserDto;

  //   const user = await this.userRepository.findOne({
  //     where: { email }
  //   });

  //   if(user){
  //     throw new BadRequestException('이미 존재하는 이메일입니다.');
  //   };

  //   const hash = await bcrypt.hash(password, this.configService.get<number>(envVariableKeys.hashRounds) ?? 10)

  //   await this.userRepository.save({
  //     email,
  //     password: hash
  //   });

  //   return this.userRepository.findOne({
  //     where: { email }
  //   });
  // }

  // findAll() {
  //   return this.userRepository.find();
  // }

  // async findOne(id: number) {
  //   const user = await this.userRepository.findOne({
  //     where: { id },
  //   });

  //   if(!user){
  //     throw new NotFoundException('존재하지 않는 사용자입니다.');
  //   }

  //   return user;
  // }

  // async update(id: number, updateUserDto: UpdateUserDto) {
  //   const { password } = updateUserDto;
    
  //   const user = await this.userRepository.findOne({
  //     where: { id },
  //   });

  //   if(!user){
  //     throw new NotFoundException('존재하지 않는 사용자입니다.');
  //   }

  //   let hash: string | undefined;

  //   if (password) {
  //   hash = await bcrypt.hash(
  //     password,
  //     this.configService.get<number>(envVariableKeys.hashRounds) ?? 10
  //   );
  // }

  //   // const hash = await bcrypt.hash(password, this.configService.get<number>(envVariableKeys.hashRounds) ?? 10);

  //   await this.userRepository.update(
  //     { id },
  //     {
  //       ...updateUserDto,
  //       ...(hash && { password: hash }),
  //     },
  //   );

  //   return this.userRepository.findOne({
  //     where: { id }
  //   });
  // }

  // async remove(id: number) {
  //   const user = await this.userRepository.findOne({
  //     where: { id }
  //   });

  //   if(!user){
  //     throw new NotFoundException('존재하지 않는 사용자입니다!');
  //   }

  //   await this.userRepository.delete(id);

  //   return id;
  // }
}