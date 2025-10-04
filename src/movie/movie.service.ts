import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
// import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, QueryRunner, Repository } from 'typeorm';
// import { MovieDetail } from './entity/movie-detail.entity';
// import { Director } from 'src/director/entity/director.entity';
// import { Genre } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
// import { User } from 'src/user/entity/user.entity';
// import { MovieUserLike } from './entity/movie-user-like-entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from 'src/common/prisma.service';
import { connect } from 'http2';
import { Prisma } from '@prisma/client';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';
import { Movie } from './schema/movie.schema';
import { MovieDetail } from './schema/movie-detail.schema';
import { MovieUserLike } from './schema/movie-user-like.schema';
import { Director } from 'src/director/schema/director.schema';
import { Genre } from 'src/genre/schema/genre.schema';
import { User } from 'src/user/schema/user.schema';

@Injectable()
export class MovieService {

  constructor(
    // Prisma 적용 전 (TypeORM)
    // @InjectRepository(Movie)
    // private readonly movieRepository: Repository<Movie>,

    // @InjectRepository(MovieDetail)
    // private readonly movieDetailRepository: Repository<MovieDetail>,

    // @InjectRepository(Director)
    // private readonly directorRepository: Repository<Director>,
    
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,

    // @InjectRepository(User)
    // private readonly userRespository: Repository<User>,

    // @InjectRepository(MovieUserLike)
    // private readonly movieUserLikeRepository: Repository<MovieUserLike>,

    // 캐싱 기능 사용을 위한 캐시 매니저
    @Inject(CACHE_MANAGER)
    private readonly cacheManger: Cache,

    // TypeORM에서 데이터베이스와의 연결 설정과 관리를 담당하는 객체입니다.
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    // private readonly prisma: PrismaService,
    
    @InjectModel(Movie.name)
    private readonly movieModel: Model<Movie>,

    @InjectModel(MovieDetail.name)
    private readonly movieDetailModel: Model<MovieDetail>,

    @InjectModel(MovieUserLike.name)
    private readonly movieUserLikeModel: Model<MovieUserLike>,

    @InjectModel(Director.name)
    private readonly directorModel: Model<Director>,

    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ){}

  // ==============================
  // (Mongodb)
  // ==============================
  async findRecent() {
    const cacheData = await this.cacheManger.get('MOVIE_RECENT');

    if(cacheData){
      return cacheData;
    }

    const data = await this.movieModel.find()
      .populate({
        path: 'genres',
        model: 'Genre',
      })
      // 내림차순
      .sort({ createdAt: -1})
      .limit(10)
      .exec();

    await this.cacheManger.set('MOVIE_RECENT', data);

    return data;
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title, cursor, take, order } = dto;

    const orderBy = order.reduce((acc, field) => {
      const [column, direction] = field.split('_');

      if(column === 'id'){
        acc['_id'] = direction.toLowerCase();
      } else {
        acc[column] = direction.toLowerCase();
      }

      return acc;
    }, {})
    
    const query = this.movieModel
      .find(
        title
          ? {
            title: { $regex: title },
            $option: 'i'
          }
          : {})
      .sort(orderBy)
      .limit(take + 1)

    if(cursor) {
      query.lt('_id', new Types.ObjectId(cursor));
    }

    const movies = await query.populate('genres director').exec();

    const hasNextPage = movies.length > take;
 
    if(hasNextPage) movies.pop();

    const nextCursor = hasNextPage ? movies[movies.length - 1].id.toString() : null;

    if(userId) {
      const movieIds = movies.map((movie) => movie.id);

      const likedMovies = movieIds.length < 1 ? [] : await this.movieUserLikeModel.find({
        movie: { $in: movieIds.map((id) => new Types.ObjectId(id.toString())) },
        user: new Types.ObjectId(userId.toString()),
      })
      .populate('movie')
      .exec();

      const likedMovieMap = likedMovies.reduce((acc, next) => ({
        ...acc,
        [next.movie.id]: next.isLike,
      }), {});

      return {
        data: movies.map((movie) => ({
          ...movie.toObject(),
          likeStatus: movie.id in likedMovieMap ? likedMovieMap[movie.id] : null,
        })) as any,
        nextCursor,
        hasNextPage,
      };
    }

    return {
      data: movies,
      nextCursor,
      hasNextPage,
    };
  }

  async findOne(id: string) {
    const movie = await this.movieModel.findById(id).exec();

    if(!movie){
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    return movie;
  }

  async create(createMovieDto: CreateMovieDto, userId: number) {
    const session = await this.movieModel.startSession();
    session.startTransaction();

    try {
      const director = await this.directorModel.findById(createMovieDto.directorId).exec();

      if(!director){
        throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
      }

      const genres = await this.genreModel.find({ _id: { $in: createMovieDto.genreIds } }).exec();

      if(genres.length !== createMovieDto.genreIds.length){
        throw new NotFoundException('존재하지 않는 장르가 있습니다.');
      }

      const movieDetail = await this.movieDetailModel.create(
        [{ detail: createMovieDto.detail }],
        { session }      
      )

      const movie = await this.movieModel.create(
        [{
          title: createMovieDto.title,
          movieFilePath: createMovieDto.movieFileName,
          creator: userId,
          director: director._id,
          genres: genres.map((genre) => genre._id),
          detail: movieDetail[0]._id,
        }],
        { session }
      )

      await session.commitTransaction();

      return this.movieModel.findById(movie[0]._id)
        .populate('detail')
        .populate('director')
        .populate({
          path: 'genres',
          model: 'Genre',
        })
        .exec();
    } catch (error) {
      await session.abortTransaction();
      console.log(error);
      throw new InternalServerErrorException('트랜잭션 실패');
    } finally {
      session.endSession();
    }
  }

  async remove(id: string) {
    const movie = await this.movieModel.findById(id).populate('detail').exec();

    if(!movie){
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    await this.movieModel.findByIdAndDelete(id).exec();
    await this.movieDetailModel.findByIdAndDelete(movie.detail._id).exec();

    return id;
  }

  async toggleMovieLike(movieId: string, userId: string, isLike: boolean) {
    const movie = await this.movieModel.findById(movieId).exec();

    if(!movie){
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    const user = await this.userModel.findById(userId).exec();

    if(!user){
      throw new NotFoundException('존재하지 않는 ID의 유저입니다.');
    }

    const likeRecord = await this.movieUserLikeModel.findOne({ 
      movie: new Types.ObjectId(movieId),
      user: new Types.ObjectId(userId),
    })
    .exec();
    
    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.movieUserLikeModel.findByIdAndDelete(likeRecord._id).exec();
      } else {
        likeRecord.isLike = isLike;
        await likeRecord.save();
      }
    } else {
      await this.movieUserLikeModel.create({
        movie: new Types.ObjectId(movieId),
        user: new Types.ObjectId(userId),
        isLike 
      })
    }

    const result = await this.movieUserLikeModel.findOne({
      movie: new Types.ObjectId(movieId),
      user: new Types.ObjectId(userId),
    }).exec();

    return {
      isLike: result && result.isLike,
    }
  }

  async update(id: string, updateMovieDto: UpdateMovieDto) {
    const session = await this.movieModel.startSession();
    session.startTransaction();

    try {
      const movie = await this.movieModel.findById(id)
        .populate('detail genres')
        .exec();

      if(!movie){
        throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;
      
      let movieUpdateParams: {
        title?: string;
        movieFilePath?: string;
        director?: Types.ObjectId;
        genres?: Types.ObjectId[];
      } = {
        ...movieRest,
      }

      if(directorId){
        const director = await this.directorModel.findById(directorId).exec();

        if(!director){
          throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
        }
        movieUpdateParams.director = director._id as Types.ObjectId;
      }

      if(genreIds){
        const genres = await this.genreModel.find({ _id: { $in: genreIds } }).exec();

        if(genres.length !== genreIds.length){
          throw new NotFoundException('존재하지 않는 장르가 있습니다.');
        }

        movieUpdateParams.genres = genres.map((genre) => genre._id) as Types.ObjectId[];
      }

      if (detail) {
        await this.movieDetailModel.findByIdAndUpdate(movie.detail._id, {
          detail,
        }).exec();
      }

      await this.movieModel.findByIdAndUpdate(id, movieUpdateParams).exec();

      await session.commitTransaction();

      return this.movieModel.findById(id)
        .populate('detail director')
        .populate({
          path: 'genres',
          model: 'Genre',
        })
        .exec();
    } catch (error) {
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }

  // // ==============================
  // // (Prisma)
  // // ==============================
  // /// 캐시를 사용한 검색
  // // 저장 - cacheManger.set(key, value, ttl)
  // // 불러오기 - // cacheManger.get(key)
  // async findRecent(){
  //   const cacheData = await this.cacheManger.get('MOVIE_RECENT');

  //   if(cacheData){
  //     return cacheData;
  //   }

  //   const data = await this.prisma.movie.findMany({
  //     orderBy: { createdAt: 'desc' },
  //     take: 10,
  //   });

  //   await this.cacheManger.set('MOVIE_RECENT', data);

  //   return data;
  // }

  // async findAll(dto: GetMoviesDto, userId?: number) {
  //   const { title, cursor, take, order } = dto;

  //   const orderBy = order.map((field) => {
  //     const [column, direction] = field.split('_');
  //     return { [column]: direction.toLowerCase() };
  //   })
    
  //   const movies = await this.prisma.movie.findMany({
  //     where: title ? { title: { contains: title } } : {},
  //     take: take + 1,
  //     skip: cursor ? 1 : 0,
  //     cursor: cursor ? { id: parseInt(cursor) } : undefined,
  //     orderBy,
  //     include: {
  //       genres: true,
  //       director: true,
  //     }
  //   })

  //   // 다음 페이지 여부
  //   const hasNextPage = movies.length > take;

  //   // 다음 페이지 확인을 위해 + 1로 가져온 데이터 삭제
  //   if(hasNextPage) movies.pop();

  //   // 다음 페이지 커서
  //   const nextCursor = hasNextPage ? movies[movies.length - 1].id.toString() : null;

  //   if (userId) {
  //     const movieIds = movies.map((movie) => movie.id)

  //     const likedMovies = movieIds.length < 1 ? [] : await this.prisma.movieUserLike.findMany({
  //       where: { movieId: { in: movieIds }, userId },
  //       include: { movie: true }
  //     });

  //     const likedMovieMap = likedMovies.reduce((acc, next) => ({
  //       ...acc,
  //       [next.movie.id]: next.isLike,
  //     }), {});

  //     return {
  //       data: movies.map((movie) => ({
  //         ...movie,
  //         likeStatus: movie.id in likedMovieMap ? likedMovieMap[movie.id] : null,
  //       })),
  //       nextCursor,
  //       hasNextPage,
  //     };
  //   }

  //   return {
  //     data: movies,
  //     nextCursor,
  //     hasNextPage,
  //   };
  // }

  // async findOne(id: number) {
  //   const movie = await this.prisma.movie.findUnique({
  //     where: { id },
  //   })

  //   if(!movie){
  //     throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
  //   }

  //   return movie;
  // }

  // async create(createMovieDto: CreateMovieDto, userId: number) {
  //   return this.prisma.$transaction(async(prisma) => {
  //     const director = await prisma.director.findUnique({
  //       where: { id: createMovieDto.directorId }
  //     });

  //     if(!director){
  //       throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
  //     }
      
  //     const genres = await prisma.genre.findMany({
  //       where: { id: { in: createMovieDto.genreIds } }
  //     });

  //     if(genres.length != createMovieDto.genreIds.length){
  //       throw new NotFoundException('존재하지 않는 장르가 있습니다.');
  //     }

  //     const movieDetail = await prisma.movieDetail.create({
  //       data: { detail: createMovieDto.detail }
  //     });

  //     const movie = await prisma.movie.create({
  //       data: {
  //         title: createMovieDto.title,
  //         movieFilePath: createMovieDto.movieFileName,
  //         creator: { connect: { id: userId } },
  //         director: { connect: { id: director.id } },
  //         genres: { connect: genres.map((genre) => ({ id: genre.id })) },
  //         detail: { connect: { id: movieDetail.id } },
  //       }
  //     });

  //     return prisma.movie.findUnique({
  //       where: { id: movie.id },
  //       include: {
  //         detail: true,
  //         director: true,
  //         genres: true,
  //       }
  //     });
  //   });
  // }

  // async update(id: number, updateMovieDto: UpdateMovieDto) {
  //   return this.prisma.$transaction(async(prisma) => {
  //     const movie = await prisma.movie.findUnique({
  //       where: { id },
  //       include: {
  //         detail: true,
  //         genres: true,
  //       }
  //     });

  //     if(!movie){
  //       throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
  //     }

  //     const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

  //     let movieUpdateParams: Prisma.MovieUpdateInput = {
  //       ...movieRest,
  //     }

  //     if(directorId){
  //       const director = await prisma.director.findUnique({
  //         where: { id: directorId }
  //       });

  //       if(!director){
  //         throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
  //       }

  //       movieUpdateParams.director = { connect: { id: director.id } };
  //     }

  //     if(genreIds){
  //       const genres = await prisma.genre.findMany({
  //         where: { id: { in: genreIds } }
  //       });

  //       if(genres.length !== genreIds.length){
  //         throw new NotFoundException('존재하지 않는 장르가 있습니다.');
  //       }

  //       movieUpdateParams.genres = { connect: genres.map((genre) => ({ id: genre.id })) };
  //     }

  //     await prisma.movie.update({
  //       where: { id },
  //       data: movieUpdateParams,
  //     });

  //     if(detail){
  //       await prisma.movieDetail.update({
  //         where: { id: movie.detail.id },
  //         data: { detail },
  //       });
  //     }

  //     return prisma.movie.findUnique({
  //       where: { id },
  //       include: {
  //         detail: true,
  //         director: true,
  //         genres: true,
  //       }
  //     });
  //   });
  // }

  // async remove(id: number) {
  //   const movie = await this.prisma.movie.findUnique({
  //     where: {id},
  //     include: { detail: true }
  //   })

  //   if(!movie){
  //     throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
  //   }

  //   await this.prisma.movie.delete({
  //     where: { id }
  //   });

  //   await this.prisma.movieDetail.delete({
  //     where: { id: movie.detail.id }
  //   });

  //   return id;
  // }

  // async toggleMovieLike(movieId: number, userId: number, isLike: boolean){
  //   const movie = await this.prisma.movie.findUnique({
  //     where: { id: movieId }
  //   });

  //   if(!movie){
  //     throw new BadRequestException('존재하지 않는 영화입니다.');
  //   }

  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId }
  //   });

  //   if(!user){
  //     throw new UnauthorizedException('존재하지 않는 유저입니다.');
  //   }

  //   const likeRecord = await this.prisma.movieUserLike.findUnique({
  //     where: { movieId_userId: { movieId, userId }}
  //   });

  //   if(likeRecord) {
  //     if(isLike === likeRecord.isLike){
  //       await this.prisma.movieUserLike.delete({
  //         where: { movieId_userId: { movieId, userId }}
  //       });
  //     } else {
  //       await this.prisma.movieUserLike.update({
  //         where: { movieId_userId: { movieId, userId } },
  //         data: { isLike }
  //       });
  //     }
  //   } else {
  //     await this.prisma.movieUserLike.create({
  //       data: {
  //         movie: { connect: { id: movieId } },
  //         user: { connect: { id: userId } },
  //         isLike
  //       }
  //     });
  //   }

  //   const result = await this.prisma.movieUserLike.findUnique({
  //     where: { movieId_userId: { movieId, userId }}
  //   });

  //   return {
  //     isLike: result && result.isLike
  //   }
  // }


  // ==============================
  // (TypeORM)
  // ==============================
  // /// 캐시를 사용한 검색
  // // 저장 - cacheManger.set(key, value, ttl)
  // // 불러오기 - // cacheManger.get(key)
  // async findRecent(){
  //   const cacheData = await this.cacheManger.get('MOVIE_RECENT');

  //   if(cacheData){
  //     return cacheData;
  //   }

  //   const data = await this.movieRepository.find({
  //     order: {
  //       createdAt: 'DESC',
  //     },
  //     take: 10,
  //   });

  //   await this.cacheManger.set('MOVIE_RECENT', data);

  //   return data;
  // }

  // // 다음 함수는 coverage에 포함하지 않음
  // /* istanbul ignore next */
  // getMovies() {
  //   return this.movieRepository.createQueryBuilder('movie')
  //     .leftJoinAndSelect('movie.director', 'director')
  //     .leftJoinAndSelect('movie.genres', 'genres');
  // };

  // // 다음 함수는 coverage에 포함하지 않음
  // /* istanbul ignore next */
  // findMovieDetail(id: number){
  //   return this.movieRepository.createQueryBuilder('movie')
  //     .leftJoinAndSelect('movie.director', 'director')
  //     .leftJoinAndSelect('movie.genres', 'genres')
  //     .leftJoinAndSelect('movie.detail', 'detail')
  //     .leftJoinAndSelect('movie.creator', 'creator')
  //     .where('movie.id = :id', { id })
  //     .getOne();
  // }

  // // 다음 함수는 coverage에 포함하지 않음
  // /* istanbul ignore next */
  // async createMovieDetail(qr: QueryRunner, createMovieDto: CreateMovieDto){
  //   return qr.manager
  //     .createQueryBuilder()
  //     .insert()
  //     .into(MovieDetail)
  //     .values({ detail: createMovieDto.detail })
  //     .execute();
  // }  

  // // 다음 함수는 coverage에 포함하지 않음
  // /* istanbul ignore next */
  // createMovie(qr: QueryRunner, createMovieDto: CreateMovieDto, director: Director, movieDetailId: number, userId: number, movieFolder: string) {
  //   return qr.manager.createQueryBuilder()
  //     .insert()
  //     .into(Movie)
  //     .values({
  //       title: createMovieDto.title,
  //       detail: { id: movieDetailId },
  //       director: { id: director.id },
  //       creator: { id: userId },
  //       movieFilePath: join(movieFolder, createMovieDto.movieFileName),
  //     })
  //     .execute();
  // }

  // // 다음 함수는 coverage에 포함하지 않음
  // /* istanbul ignore next */
  // createMovieGenreRelation(qr: QueryRunner, movieId: number, genres: Genre[]) {
  //   return qr.manager.createQueryBuilder()
  //     .relation(Movie, 'genres')
  //     .of(movieId)
  //     .add(genres.map((genre) => genre.id));
  // }

  // // 다음 함수는 coverage에 포함하지 않음
  // /* istanbul ignore next */
  // renameMovieFile(tempFolder: string, movieFolder: string, createMovieDto: CreateMovieDto){
  //   return rename(
  //     // 현재 작업경로 + temp 경로( /public/temp ) + 파일이름
  //     join(process.cwd(), tempFolder, createMovieDto.movieFileName),
  //     // 현재 작업경로 + movie 경로( /public/movie ) + 파일이름
  //     join(process.cwd(), movieFolder, createMovieDto.movieFileName),
  //   );
  // }

  // // 다음 함수는 coverage에 포함하지 않음
  // /* istanbul ignore next */
  // getLikedMovies(movieIds: number[], userId: number) {
  //   return this.movieUserLikeRepository.createQueryBuilder('mul')
  //       .leftJoinAndSelect('mul.user', 'user')
  //       .leftJoinAndSelect('mul.movie', 'movie')
  //       .where('movie.id IN(:...movieIds)', { movieIds })
  //       .andWhere('user.id = :userId', { userId })
  //       .getMany();
  // };

  // // 다음 함수는 coverage에 포함하지 않음
  // /* istanbul ignore next */
  // updateMovie(qr: QueryRunner, movieUpdateFields: UpdateMovieDto, id: number) {
  //   return qr.manager
  //     .createQueryBuilder()
  //     .update(Movie)
  //     .set(movieUpdateFields)
  //     .where('id = :id', { id })
  //     .execute()
  // };

  // // 다음 함수는 coverage에 포함하지 않음
  // /* istanbul ignore next */
  // updateMovieDetail(qr: QueryRunner, detail: string, movie: Movie) {
  //   return qr.manager
  //     .createQueryBuilder()
  //     .update(MovieDetail)
  //     .set({ detail })
  //     .where('id = :id', { id: movie.detail.id })
  //     .execute()
  // };

  // // 다음 함수는 coverage에 포함하지 않음
  // /* istanbul ignore next */
  // updateMovieGenreRelation(qr: QueryRunner, id: number, newGenres: Genre[], movie: Movie) {
  //   return qr.manager
  //     .createQueryBuilder()
  //     .relation(Movie, 'genres')
  //     .of(id)
  //     .addAndRemove(
  //       newGenres.map(genre => genre.id),
  //       movie.genres.map(genre => genre.id)
  //     );
  // };

  // // 다음 함수는 coverage에 포함하지 않음
  // /* istanbul ignore next */
  // deleteMovie(id: number) {
  //   return this.movieRepository
  //     .createQueryBuilder()
  //     .delete()
  //     .where('id = :id', { id })
  //     .execute();
  // };

  // // 다음 함수는 coverage에 포함하지 않음
  // /* istanbul ignore next */
  // getLikedRecord(movieId: number, userId: number) {
  //   return this.movieUserLikeRepository.createQueryBuilder('mul')
  //     .leftJoinAndSelect('mul.movie', 'movie')
  //     .leftJoinAndSelect('mul.user', 'user')
  //     .where('movie.id = :movieId', { movieId })
  //     .andWhere('user.id = :userId', { userId })
  //     .getOne();
  // };

  // async findAll(dto: GetMoviesDto, userId?: number) {
  //   // **페이지 기반 페이지네이션
  //   // 
  //   // const { title, take, page} = dto;

  //   const { title } = dto;

  //   const qb = await this.getMovies();

  //   if(title){
  //     qb.where(
  //       'movie.title LIKE :title',
  //       { title: `%${title}%`}
  //     )
  //   }

  //   // **페이지 기반 페이지네이션
  //   // 
  //   // if(take && page){
  //   //   this.commonService.applyPagePaginationParamsToQb(qb, dto);
  //   // }

  //   // **커서 기반 페이지네이션
  //   // 
  //   const { nextCursor } = await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

  //   let [data, count] = await qb.getManyAndCount();

  //   if (userId) {
  //     const movieIds = data.map(movie => movie.id);

  //     const likedMovies = movieIds.length < 1 
  //       ? [] 
  //       : await this.getLikedMovies(movieIds, userId);

  //     /**
  //     * {
  //     *  movieId: boolean
  //     * }
  //     */
  //     const likedMovieMap = likedMovies.reduce(
  //       (acc, next) => ({
  //         ...acc,
  //         [next.movie.id]: next.isLike,
  //     }), {});

  //     data = data.map((x) => ({
  //       ...x,
  //       likeStatus: x.id in likedMovieMap ? likedMovieMap[x.id] : null,
  //     }))
  //   }

  //   return {
  //     data,
  //     nextCursor,
  //     count
  //   }

  //   // **TypeORM의 Repository 사용 (쿼리빌더 사용 X)
  //   // 
  //   // if(!title){
  //   //   return [await this.movieRepository.find({
  //   //     relations: [
  //   //       'director',
  //   //       'genres',
  //   //     ]
  //   //   })];
  //   // }

  //   // return this.movieRepository.findAndCount({
  //   //   where:{title: Like(`%${title}%`)},
  //   //   relations: [
  //   //     'director',
  //   //     'genres',
  //   //   ]
  //   // });
  // }

  // async findOne(id: number) {
  //   const movie = await this.findMovieDetail(id);

  //   if (!movie) {
  //     throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
  //   } 

  //   return movie;

  //   // const movie = await this.movieRepository.findOne({
  //   //   where: {id},
  //   //   relations: [W
  //   //     'detail',
  //   //     'director',
  //   //     'genres',
  //   //   ],
  //   // })

  //   // if (!movie) {
  //   //   throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
  //   // }

  //   // return movie;
  // }

  // async create(createMovieDto: CreateMovieDto, userId: number, qr: QueryRunner) {
  //   // const director = await this.directorRepository.findOne({
  //   //   where: { id: createMovieDto.directorId }
  //   // });

  //   // if(!director){
  //   //   throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
  //   // }

  //   // const genres = await this.genreRepository.find({
  //   //   where: { id: In(createMovieDto.genreIds) }
  //   // });

  //   // if(genres.length !== createMovieDto.genreIds.length){
  //   //   throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`)
  //   // }

  //   // const movie = await this.movieRepository.save({
  //   //   title: createMovieDto.title,
  //   //   detail: { detail: createMovieDto.detail },
  //   //   director,
  //   //   genres
  //   // });
  //   // return movie;

  //   // 쿼리빌더를 안쓰는 경우
  //   const director = await qr.manager.findOne(Director, {
  //     where: { id: createMovieDto.directorId }
  //   });

  //   // const director = await this.directorRepository.createQueryBuilder('director')
  //   //   .where('director.id = :id', { id: createMovieDto.directorId })
  //   //   .getOne();

  //   if (!director) {
  //     throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
  //   }

  //   const genres = await qr.manager.find(Genre, {
  //     where: { id: In(createMovieDto.genreIds) }
  //   });

  //   if (genres.length !== createMovieDto.genreIds.length) {
  //     throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`)
  //   }

  //   const movieDetail = await this.createMovieDetail(qr, createMovieDto)
  //   const movieDetailId = movieDetail.identifiers[0].id;

  //   // 최상단 -> public -> movie
  //   const movieFolder = join('public', 'movie');
  //   const tempFolder = join('public', 'temp');

  //   const movie = await this.createMovie(qr, createMovieDto, director, movieDetailId, userId, movieFolder);

  //   const movieId = movie.identifiers[0].id;

  //   await this.createMovieGenreRelation(qr, movieId, genres);

  //   // temp 경로의 파일을 movie 경로로 이동
  //   await this.renameMovieFile(tempFolder, movieFolder, createMovieDto);

  //   return await qr.manager.findOne(Movie, {
  //     where: { id: movieId },
  //     relations: ['detail', 'director', 'genres']
  //   });
  // }

  // async update(id: number, updateMovieDto: UpdateMovieDto) {
  //   // const movie = await this.movieRepository.findOne({
  //   //   where: {id},
  //   //   relations: [
  //   //     'detail',
  //   //   ]
  //   // })

  //   // if (!movie) {
  //   //   throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
  //   // }

  //   // const {detail, directorId, genreIds, ...movieRest} = updateMovieDto;
  //   // let newDirector;

  //   // if(directorId){
  //   //   const director = await this.directorRepository.findOne({
  //   //     where: { id: directorId },
  //   //   });

  //   //   if(!director){
  //   //     throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
  //   //   }

  //   //   newDirector = director;
  //   // }

  //   // let newGenres;

  //   // if(genreIds){
  //   //   const genres = await this.genreRepository.find({
  //   //     where: { id: In(genreIds) }
  //   //   });

  //   //   if(genres.length !== updateMovieDto.genreIds.length){
  //   //     throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`)
  //   //   }

  //   //   newGenres = genres;
  //   // }

  //   // const movieUpdateFields = {
  //   //   ...movieRest,
  //   //   ...(newDirector && {director: newDirector})
  //   // }


  //   // await this.movieRepository.update(
  //   //   {id},
  //   //   movieUpdateFields,
  //   // );

  //   // if(detail){
  //   //   await this.movieDetailRepository.update(
  //   //     {id: movie.detail.id},
  //   //     {detail}
  //   //   )
  //   // }

  //   // const newMovie = await this.movieRepository.findOne({
  //   //   where: {id},
  //   //   relations: [
  //   //     'detail',
  //   //     'director',
  //   //   ],
  //   // });

  //   // if(!newMovie) {
  //   //   throw new NotFoundException('존재하지 않는 ID의 업데이트 된 영화입니다.');
  //   // }

  //   // newMovie.genres = newGenres;
  //   // await this.movieRepository.save(newMovie);

  //   // return this.movieRepository.findOne({
  //   //   where: { id },
  //   //   relations: [
  //   //     'detail',
  //   //     'director',
  //   //     'genres'
  //   //   ]
  //   // });

  //   const qr = this.dataSource.createQueryRunner();
  //   await qr.connect();
  //   await qr.startTransaction();


  //   try {
  //     // const movie = await qr.manager
  //     //   .createQueryBuilder(Movie, 'movie')
  //     //   .leftJoinAndSelect('movie.detail', 'detail')
  //     //   .leftJoinAndSelect('movie.genres', 'genres')
  //     //   .where('movie.id = :id', { id: id })
  //     //   .getOne();

  //     const movie = await qr.manager.findOne(Movie, {
  //       where: { id },
  //       relations: [ 'detail' ,'genres']
  //     });

  //     if (!movie) {
  //       throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
  //     }

  //     const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

  //     let newDirector;

  //     if (directorId) {
  //       const director = await qr.manager.findOne(Director, {
  //         where: { id: directorId }
  //       });

  //       // const director = await qr.manager
  //       //   .createQueryBuilder(Director, 'director')
  //       //   .where('director.id = :id', { id: directorId })
  //       //   .getOne();

  //       if (!director) {
  //         throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
  //       }

  //       newDirector = director;
  //     }

  //     let newGenres;

  //     if (genreIds) {
  //       const genres = await qr.manager.find(Genre, {
  //         where: { id: In(genreIds) }
  //       });

  //       // const genres = await qr.manager
  //       //   .createQueryBuilder(Genre, 'genres')
  //       //   .where('genres.id In (:...ids)', { ids: updateMovieDto.genreIds })
  //       //   .getMany();

  //       if (genres.length != updateMovieDto.genreIds!.length) {
  //         throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')}`)
  //       }

  //       newGenres = genres
  //     }

  //     const movieUpdateFields = {
  //       ...movieRest,
  //       ...(newDirector && { director: newDirector })
  //     }

  //     await this.updateMovie(qr, movieUpdateFields, id);

  //     if (detail) {
  //       await this.updateMovieDetail(qr, detail, movie);
  //     }

  //     if (newGenres) {
  //       await this.updateMovieGenreRelation(qr, id, newGenres, movie);
  //     }

  //     await qr.commitTransaction();

  //     return this.movieRepository.findOne({
  //       where: { id },
  //       relations: ['detail', 'director', 'genres']
  //     });


  //     // return this.movieRepository
  //     //   .createQueryBuilder('movie')
  //     //   .leftJoinAndSelect('movie.director', 'director')
  //     //   .leftJoinAndSelect('movie.genres', 'genres')
  //     //   .leftJoinAndSelect('movie.detail', 'detail')
  //     //   .where('movie.id = :id', { id })
  //     //   .getOne();
  //   } catch (error) {
  //     await qr.rollbackTransaction();
  //     throw error;
  //   } finally {
  //     await qr.release();
  //   }
  // }

  // async remove(id: number) {
  //   const movie = await this.movieRepository.findOne({
  //     where: {id},
  //     relations: ['detail']
  //   })

  //   if(!movie){
  //     throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
  //   }

  //   await this.deleteMovie(id);

  //   // await this.movieRepository.delete(id);
  //   await this.movieDetailRepository.delete(movie.detail.id);

  //   return id;
  // }

  // async toggleMovieLike(movieId: number, userId: number, isLike: boolean){
  //   const movie = await this.movieRepository.findOne({
  //     where: { id: movieId }
  //   });

  //   if(!movie){
  //     throw new BadRequestException('존재하지 않는 영화입니다.');
  //   }

  //   const user = await this.userRespository.findOne({
  //     where: { id: userId }
  //   });

  //   if(!user){
  //     throw new UnauthorizedException('존재하지 않는 유저입니다.');
  //   }

  //   const likeRecord = await this.getLikedRecord(movieId, userId);

  //   if(likeRecord) {
  //     if(isLike === likeRecord.isLike){
  //       await this.movieUserLikeRepository.delete({
  //         movie,
  //         user,
  //       });
  //     } else {
  //       await this.movieUserLikeRepository.update({
  //         movie,
  //         user,
  //       }, {
  //         isLike,
  //       })
  //     }
  //   } else {
  //     await this.movieUserLikeRepository.save({
  //       movie,
  //       user,
  //       isLike,
  //     })
  //   }

  //   const result = await this.getLikedRecord(movieId, userId);

  //   return {
  //     isLike: result && result.isLike
  //   }
  // }
}




