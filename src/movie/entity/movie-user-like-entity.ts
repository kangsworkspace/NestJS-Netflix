import { User } from "src/user/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Movie } from "./movie.entity";

@Entity()
// ManyToMany Relationship 중간 Table 직접 만들기
// => Movie와 User의 관계를 들고있어야 한다.
export class MovieUserLike {
    // @PrimaryColumn() + @ManyToOne() 조합 => 복합 키 (Composite Primary Key)
    // movieId와 userId를 합쳐서 기본 키로 지정(복합 기본 키)
    @PrimaryColumn({
        name: 'movieId',
        type: 'int8'
    })
    @ManyToOne(
        () => Movie,
        (movie) => movie.likedUsers,
        {
            // 연관된 부모 엔티티가 삭제될 때, 해당 자식 엔티티도 자동으로 삭제되도록 설정
            // MovieUserLike 엔티티는 Movie 엔티티를 외래 키로 참조
            // 특정 Movie가 삭제되면 그 Movie를 참조하고 있는 모든 MovieUserLike 레코드도 자동으로 삭제
            // => movieId가 같은 MovieUserLike row들은 모두 삭제
            onDelete: 'CASCADE',
        }
    )
    movie: Movie;

    @PrimaryColumn({
        name: 'userId',
        type: 'int8'
    })
    @ManyToOne(
        () => User,
        (user) => user.likedMovies,
        {
            // 연관된 부모 엔티티가 삭제될 때, 해당 자식 엔티티도 자동으로 삭제되도록 설정
            // MovieUserLike 엔티티는 User 엔티티를 외래 키로 참조
            // 특정 User 삭제되면 그 User 참조하고 있는 모든 MovieUserLike 레코드도 자동으로 삭제
            // => userId가 같은 MovieUserLike row들은 모두 삭제
            onDelete: 'CASCADE',
        }
    )
    user: User;

    @Column()
    isLike: boolean;
}