import { Exclude } from "class-transformer";
import { ChatRoom } from "src/chat/entity/chat-room.entity";
import { Chat } from "src/chat/entity/chat.entity";
import { BaseTable } from "src/common/entity/base-table.entity";
import { MovieUserLike } from "src/movie/entity/movie-user-like-entity";
import { Movie } from "src/movie/entity/movie.entity";
import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";


export enum Role {
    admin,
    paidUser,
    user,
}

@Entity()
export class User extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    @Exclude({
        // 요청을 받을 때
        // toClassOnly: true,
        
        // 응답을 할 때
        toPlainOnly: true,
    })
    password: string;

    @Column({ 
        enum: Role,
        default: Role.user,
    })
    role: Role;

    // One(User) -> Many(Movie) 관계
    // 하나의 User가 여러 Movie를 참조
    @OneToMany(
        // 관계를 맺을 대상 엔티티(Movie)
        () => Movie,
        // 대상 엔티티의 역방향 필드 지정
        // Movie 입장에서 어떤 필드가 이 관계를 표현하는지를 알려줌.
        // Movie -> creator: User
        (movie) => movie.creator
    )
    createdMovies: Movie[];

    @OneToMany(
        () => MovieUserLike,
        (movieUserLike) => movieUserLike.user,
    )
    likedMovies: MovieUserLike[]

    @OneToMany(
        () => Chat,
        (chat) => chat.author,
    )
    chats: Chat[];

    @ManyToMany(
        () => ChatRoom,
        (ChatRoom) => ChatRoom.users
    )
    chatRooms: ChatRoom[];
}
