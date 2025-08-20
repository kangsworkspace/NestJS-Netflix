import { Exclude, Transform } from "class-transformer";
import { ChildEntity, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn, VersionColumn } from "typeorm";
import { BaseTable } from "src/common/entity/base-table.entity";
import { MovieDetail } from "./movie-detail.entity";
import { Director } from "src/director/entity/director.entity";
import { Genre } from "src/genre/entities/genre.entity";
import { User } from "src/user/entities/user.entity";
import { MovieUserLike } from "./movie-user-like-entity";

/// ManyToOne Director -> 감독은 여러개의 영화를 만들 수 있음
/// OneToOne MovieDetail -> 영화는 하나의 상세 내용을 가질 수 있음
/// ManyToMany Genre  -> 영화는 여러개의 장르를 가질 수 있고 장르는 여러개의 영화에 속할 수 있음

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  // Many(Movie) -> One(User) 관계
  // 여러 Movie가 하나의 User를 참조
  @ManyToOne(
    // 관계를 맺을 대상 엔티티(User)
    // TypeScript에서는 순환 참조 문제 때문에 람다 함수로 타입을 넘겨야 한다.
    // 
    () => User,
    // 대상 엔티티의 역방향 필드 지정
    // User 입장에서 어떤 필드가 이 관계를 표현하는지를 알려줌.
    // User -> createdMovies: Movie[]
    (user) => user.createdMovies,
  )
  creator: User;

  @Column({unique: true})
  title: string;

  @ManyToMany(
    () => Genre,
    genre => genre.movies,
    {
      cascade: true,
      nullable: false,
    }
  )

  @JoinTable()
  genres: Genre[];

  @Column({
    default: 0,
  })
  likeCount: number;

  @Column({
    default: 0,
  })
  dislikeCount: number;

  @OneToOne(
    () => MovieDetail,
    MovieDetail => MovieDetail.id,
    { 
      cascade: true,
      nullable: false,
    }
  )
  @JoinColumn()
  detail: MovieDetail;

  @Column()
  @Transform(
    ({value}) => `http://localhost:3000/${value}`
  )
  movieFilePath: string;

  @ManyToOne(
    () => Director,
    director => director.id,
    { 
      cascade: true,
      nullable: false,
    }
  )
  director: Director;

  @OneToMany(
    () => MovieUserLike,
    (movieUserLike) => movieUserLike.movie,
  )
  likedUsers: MovieUserLike[];
}
