import { BaseTable } from "src/common/entity/base-table.entity";
import { MovieUserLike } from "src/movie/entity/movie-user-like-entity";
import { User } from "src/user/entity/user.entity";
import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChatRoom } from "./chat-room.entity";

@Entity()
export class Chat extends BaseTable {
    // 기본키 컬럼 - 자동 증가하는 고유 ID
    @PrimaryGeneratedColumn()
    id: number;

    // 다대일 관계 - 여러 채팅이 하나의 사용자에 속함
    @ManyToOne(
        () => User, // User 엔티티와의 관계
        (user) => user.chats // User 엔티티의 chats 속성과 연결
    )
    author: User; // 채팅 메시지를 작성한 사용자

    // 메시지 내용 컬럼 - 채팅 메시지의 실제 텍스트
    @Column()
    message: string;

    // 다대일 관계 - 여러 채팅이 하나의 채팅방에 속함
    @ManyToOne(
        () => ChatRoom, // ChatRoom 엔티티와의 관계
        (chatRoom) => chatRoom.chats // ChatRoom 엔티티의 chats 속성과 연결
    )
    chatRoom: ChatRoom; // 이 채팅이 속한 채팅방
}