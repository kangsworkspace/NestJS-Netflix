import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ChatRoom } from './entity/chat-room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Chat } from './entity/chat.entity';
import { Role, User } from 'src/user/entity/user.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { WsException } from '@nestjs/websockets';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ChatService {
    // 연결된 클라이언트 맵 (userId, Socket)
    private readonly connectedClients = new Map<number, Socket>();

    constructor(
        @InjectRepository(ChatRoom)
        private readonly chatRoomRepository: Repository<ChatRoom>,
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ){}

    // 연결된 클라이언트를 메모리에 등록
    registerClient(userId: number, socket: Socket) {
        this.connectedClients.set(userId, socket);
    }

    // 연결이 끊어진 클라이언트를 메모리에서 제거
    removeClient(userId: number) {
        this.connectedClients.delete(userId);
    }

    // 데이터베이스에서 사용자가 참여한 채팅방들을 조회
    async joinUserRooms(user: { sub: number }, client: Socket) {

        // 사용자가 참여한 채팅방들을 조회
        const chatRooms = await this.chatRoomRepository.createQueryBuilder('chatRoom')
            .innerJoin(
                'chatRoom.users',       // 1. 조인할 관계
                'user',                 // 2. 조인할 관계의 별칭
                'user.id = :userId',    // 3. 조인 조건
                { userId: user.sub }    // 4. 조인 조건의 매개변수
            )
            .getMany(); // 5. 조인 결과를 반환

        // 조회된 각 채팅방에 대해 Socket.io 룸 Join 처리
        chatRooms.forEach((room) => {
            // 
            client.join(room.id.toString());
        });

        // 조회된 채팅방 목록을 반환 (호출한 곳에서 추가 처리 가능)
        return chatRooms;
    }


    // 메세지 생성 및 전송
    async createMessage(
        payload: { sub: number },
        {message, room }: CreateChatDto,
        qr: QueryRunner
    ) {
        // 사용자 조회
        const user = await this.userRepository.findOne({ where: { id: payload.sub } })
        if(!user) {
            throw new WsException('존재하지 않는 사용자입니다.');
        }

        // 채팅방 조회
        const chatRoom = await this.getOrCreateChatRoom(user, qr, room);
        if(!chatRoom) {
            throw new WsException('채팅방을 찾을 수 없습니다.');
        }

        // 메세지를 데이터베이스에 저장
        const msgModel = await qr.manager.save(Chat, {
            author: user,  // 작성자
            message,       // 내용
            chatRoom,      // 채팅방
        });

        // 사용자가 연결된 클라이언트 조회
        const client = this.connectedClients.get(user.id);

        // 연결된 다른 클라이언트들에게 실시간 메세지 전송
        client?.to(chatRoom.id.toString()).emit('newMessage', plainToClass(Chat, msgModel));

        // 메세지 내용 리턴
        return message;
    }

    // 채팅방 조회 또는 생성
    async getOrCreateChatRoom(user: User, qr: QueryRunner, room?: number) {
        // Admin일 때는 기존 채팅방을 조회
        if(user.role === Role.admin) {
            if(!room) {
                throw new WsException('어드민은 room 값을 필수로 제공해야 합니다.');
            }

            return qr.manager.findOne(ChatRoom, {
                where: { id: room },
                relations: ['users'],
            });
        }

        // 일반 사용자일 때 기존 채팅방 조회
        let chatRoom = await qr.manager.createQueryBuilder(ChatRoom, 'chatRoom')
            .innerJoin('chatRoom.users', 'user')
            .where('user.id = :userId', { userId: user.id })
            .getOne();

        // 기존 채팅방이 없을 경우 새로 생성
        if(!chatRoom) {
                // 관리자 조회
                const adminUser = await qr.manager.findOne(
                    User,
                    { where: { role: Role.admin } 
                });
                
                if (!adminUser) {
                    throw new WsException('관리자 사용자를 찾을 수 없습니다.');
                }

                // 새로운 채팅방 생성
                const newChatRoom = qr.manager.create(ChatRoom, {}); // 채팅방 생성
                newChatRoom.users = [user, adminUser]; // 사용자와 관리자 추가
                chatRoom = await qr.manager.save(ChatRoom, newChatRoom); // 채팅방 저장

                // 연결된 클라이언트에게 채팅방 생성 알림 전송
                [user.id, adminUser.id].forEach((userId) => {
                    // 연결된 클라이언트 조회
                    const client = this.connectedClients.get(userId);

                    // 연결된 클라이언트가 있으면 채팅방 생성 알림 전송
                    if(client){
                        client.emit('roomCreated', chatRoom!.id);
                        client.join(chatRoom!.id.toString());
                    }
                });
            }

        // 조회되거나 생성된 채팅방 반환
        return chatRoom;    
    }
}


