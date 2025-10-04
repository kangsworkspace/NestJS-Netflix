import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
// import { Genre } from './entity/genre.entity';
import { Repository } from 'typeorm';
import { PrismaService } from 'src/common/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Genre } from './schema/genre.schema';

@Injectable()
export class GenreService {
  constructor(
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    // private readonly prisma: PrismaService,
    
    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,
  ){}

  async create(createGenreDto: CreateGenreDto) {
    const result = await this.genreModel.create(createGenreDto);
    return await this.genreModel.findById(result._id).exec();
  }

  findAll() {
    return this.genreModel.find().exec();
  }

  async findOne(id: string) {

    const genre = await this.genreModel.findById(id).exec();

    if(!genre){
      throw new NotFoundException('존재하지 않는 장르입니다!');
    }

    return genre;
  }

  async update(id: string, updateGenreDto: UpdateGenreDto) {
    const genre = await this.genreModel.findById(id).exec();

    if(!genre){
      throw new NotFoundException('존재하지 않는 장르입니다!');
    }

    await this.genreModel.findByIdAndUpdate(id, updateGenreDto).exec();
    
    const newGenre = await this.genreModel.findById(id).exec();

    return newGenre;
  }

  async remove(id: string) {
    const genre = await this.genreModel.findById(id).exec();

    if(!genre){
      throw new NotFoundException('존재하지 않는 장르입니다!');
    }

    await this.genreModel.findByIdAndDelete(id).exec();

    return id;
  }

  // // ==============================
  // // (Prisma)
  // // ==============================
  // async create(createGenreDto: CreateGenreDto) {
  //   const genre = await this.prisma.genre.findUnique({
  //     where: { name: createGenreDto.name }
  //   });

  //   if(genre){
  //     throw new BadRequestException('이미 존재하는 장르입니다.');
  //   }

  //   return this.prisma.genre.create({
  //     data: createGenreDto,
  //   })
  // }

  // findAll() {
  //   return this.prisma.genre.findMany();
  // }

  // async findOne(id: number) {
  //   const genre = await this.prisma.genre.findUnique({ 
  //     where: { id }
  //   });

  //   if(!genre){
  //     throw new NotFoundException('존재하지 않는 장르입니다!');
  //   }

  //   return genre;
  // }

  // async update(id: number, updateGenreDto: UpdateGenreDto) {
  //   const genre = await this.prisma.genre.findUnique({
  //     where: { id }
  //   });

  //   if(!genre){
  //     throw new NotFoundException('존재하지 않는 장르입니다.');
  //   }

  //   await this.prisma.genre.update({
  //     where: { id },
  //     data: { ...updateGenreDto },
  //   });

  //   const newGenre = await this.prisma.genre.findUnique({
  //     where: { id }
  //   });

  //   return newGenre;
  // }

  // async remove(id: number) {
  //   const genre = await this.prisma.genre.findUnique({
  //     where: { id }
  //   });

  //   if(!genre){
  //     throw new NotFoundException('존재하지 않는 장르입니다.');
  //   }

  //   await this.prisma.genre.delete({
  //     where: { id },
  //   });

  //   return id;
  // }

  // ==============================
  // (TypeORM)
  // ==============================
  // async create(createGenreDto: CreateGenreDto) {
  //   const genre = await this.genreRepository.findOne({
  //     where: { name: createGenreDto.name }
  //   });

  //   if(genre){
  //     throw new BadRequestException('이미 존재하는 장르입니다.');
  //   }

  //   return this.genreRepository.save(createGenreDto)
  // }

  // findAll() {
  //   return this.genreRepository.find();
  // }

  // async findOne(id: number) {
  //   const genre = await this.genreRepository.findOne({ where: { id }});

  //   if(!genre){
  //     throw new NotFoundException('존재하지 않는 장르입니다!');
  //   }

  //   return genre;
  // }

  // async update(id: number, updateGenreDto: UpdateGenreDto) {
  //   const genre = await this.genreRepository.findOne({
  //     where: { id }
  //   });

  //   if(!genre){
  //     throw new NotFoundException('존재하지 않는 장르입니다.');
  //   }

  //   await this.genreRepository.update(
  //     { id },
  //     { ...updateGenreDto },
  //   );

  //   const newGenre = await this.genreRepository.findOne({
  //     where: { id }
  //   });

  //   return newGenre;
  // }

  // async remove(id: number) {
  //   const genre = await this.genreRepository.findOne({
  //     where: { id }
  //   });

  //   if(!genre){
  //     throw new NotFoundException('존재하지 않는 장르입니다.');
  //   }

  //   await this.genreRepository.delete(id);

  //   return id;
  // }
}
