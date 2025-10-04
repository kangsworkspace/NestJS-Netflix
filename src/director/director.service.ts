import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrismaService } from 'src/common/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Director } from './schema/director.schema';

@Injectable()
export class DirectorService {
  constructor(
    // @InjectRepository(Director)
    // private readonly directorRepository: Repository<Director>,
    // private readonly prisma: PrismaService
    
    @InjectModel(Director.name)
    private readonly directorModel: Model<Director>,
  ){}

  create(createDirectorDto: CreateDirectorDto) {
    return this.directorModel.create(createDirectorDto);
  }

  findAll() {
    return this.directorModel.find().exec();
  }

  findOne(id: string) {
    return this.directorModel.findById(id).exec();
  }

  async update(id: string, updateDirectorDto: UpdateDirectorDto) {
    const director = await this.directorModel.findById(id).exec();

    if(!director){
      throw new NotFoundException('존재하지 않는 감독입니다!');
    }

    await this.directorModel.findByIdAndUpdate(id, updateDirectorDto).exec();

    const newDirector = await this.directorModel.findById(id).exec();

    return newDirector;
  }

  async remove(id: string) {
    const director = await this.directorModel.findById(id).exec();

    if(!director){
      throw new NotFoundException('존재하지 않는 감독입니다!');
    }

    await this.directorModel.findByIdAndDelete(id).exec();

    return id;
  }

  // ==============================
  // Prisma
  // ==============================
  // create(createDirectorDto: CreateDirectorDto) {
  //   return this.prisma.director.create({
  //     data: createDirectorDto
  //   });
  // }

  // findAll() {
  //   return this.prisma.director.findMany();
  // }

  // findOne(id: number) {
  //   return this.prisma.director.findUnique({
  //     where: { id }
  //   });
  // }

  // async update(id: number, updateDirectorDto: UpdateDirectorDto) {
  //   const director = await this.prisma.director.findUnique({
  //     where: { id }
  //   });

  //   if (!director) {
  //     throw new NotFoundException('존재하지 않는 ID의 감독입니다!')
  //   }

  //   await this.prisma.director.update({
  //     where: { id },
  //     data: { ...updateDirectorDto }
  //   });

  //   const newDirector = await this.prisma.director.findUnique({
  //     where: { id }
  //   });

  //   return newDirector;
  // }

  // async remove(id: number) {
  //   const director = await this.prisma.director.findUnique({
  //     where: { id },
  //   });

  //   if (!director) {
  //     throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
  //   }

  //   await this.prisma.director.delete({
  //     where: { id },
  //   });

  //   return id;
  // }

  // ==============================
  // TypeORM
  // ==============================
  // create(createDirectorDto: CreateDirectorDto) {
  //   return this.directorRepository.save(createDirectorDto);
  // }

  // findAll() {
  //   return this.directorRepository.find();
  // }

  // findOne(id: number) {
  //   return this.directorRepository.findOne({
  //     where: { id }
  //   });
  // }

  // async update(id: number, updateDirectorDto: UpdateDirectorDto) {
  //   const director = await this.directorRepository.findOne({
  //     where: { id }
  //   });

  //   if(!director){
  //     throw new NotFoundException('존재하지 않는 ID의 감독입니다!')
  //   }

  //   await this.directorRepository.update(
  //     { id },
  //     { ...updateDirectorDto }
  //   );

  //   const newDirector = await this.directorRepository.findOne({
  //     where: { id }
  //   });

  //   return newDirector;
  // }

  // async remove(id: number) {
  //   const director = await this.directorRepository.findOne({
  //     where: { id },
  //   });

  //   if(!director){
  //     throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
  //   }
    
  //   await this.directorRepository.delete(id);

  //   return id;
  // }
}
