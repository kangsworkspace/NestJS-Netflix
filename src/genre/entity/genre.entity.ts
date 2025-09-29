import { BaseTable } from "src/common/entity/base-table.entity";
import { Movie } from "src/movie/entity/movie.entity";
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Genre extends BaseTable{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ 
        // 유일한 값만 들어가도록 설정(중복 불가)
        unique: true, 
    })
    name: string;

    @ManyToMany(
        () => Movie,
        movie => movie.genres,
    )
    movies: Movie[];
}
