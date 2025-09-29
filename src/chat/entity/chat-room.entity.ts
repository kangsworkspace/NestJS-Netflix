import { BaseTable } from "src/common/entity/base-table.entity";
import { User } from "src/user/entity/user.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Chat } from "./chat.entity";

@Entity()
export class ChatRoom extends BaseTable {
    // 기본키 컬럼 - 자동 증가하는 고유 ID
    @PrimaryGeneratedColumn()
    id: number;

    // 다대다 관계 - 여러 사용자가 여러 채팅방에 참여할 수 있음
    @ManyToMany(
        () => User, // User 엔티티와의 관계
        (user) => user.chatRooms // User 엔티티의 chatRooms 속성과 연결
    )
    @JoinTable() // 중간 테이블을 생성하는 데코레이터 (소유자 측에서 사용)
    users: User[]; // 이 채팅방에 참여하는 사용자들

    // 일대다 관계 - 하나의 채팅방이 여러 채팅 메시지를 가질 수 있음
    @OneToMany(
        () => Chat, // Chat 엔티티와의 관계
        (chat) => chat.chatRoom, // Chat 엔티티의 chatRoom 속성과 연결
    )
    chats: Chat[]; // 이 채팅방에 속한 채팅 메시지들
}