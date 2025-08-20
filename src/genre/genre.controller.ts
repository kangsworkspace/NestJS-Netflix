import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, ClassSerializerInterceptor, ParseIntPipe } from '@nestjs/common';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('genre')
// Swagger Authorize 설정
// => 페이지에 자물쇠 모양 버튼 생김(Bearer 토큰 인증)
@ApiBearerAuth()
// Swagger 엔드 포인트를 그룹으로 정리
@ApiTags('genre')
@UseInterceptors(ClassSerializerInterceptor)
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  @Get()
  findAll() {
    return this.genreService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.genreService.findOne(id);
  }

  @Post()
  create(@Body() createGenreDto: CreateGenreDto) {
    return this.genreService.create(createGenreDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGenreDto: UpdateGenreDto
  ){
    return this.genreService.update(id, updateGenreDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number)
  {
    return this.genreService.remove(id);
  }
}
