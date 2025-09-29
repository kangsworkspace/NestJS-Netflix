import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WsException } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { WsTransactionInterceptor } from 'src/common/interceptor/ws-transaction.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { WsQueryRunner } from 'src/common/decorator/ws-query-runner.decorator';
import { QueryRunner } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';

// WebSocket 게이트웨이 데코레이터 - 이 클래스를 WebSocket 서버로 등록
@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) { }

  // 클라이언트가 연결되었을 때 실행되는 메서드
  async handleConnection(client: Socket) {
    try {
      // Bearer 'efafkafpoafoiagroapgnaopgr'
      const rawToken = client.handshake.headers.authorization;
      
      // 토큰이 없으면 즉시 연결 해제
      if (!rawToken) {
        client.disconnect();
        return;
      }

      // 토큰이 있을 경우
      const payload = await this.authService.parseBearerToken(rawToken, false);
      if(payload) {
        // Socket 객체에 사용자 정보를 저장하여 이후 메시지 처리 시 사용자 식별 가능
        client.data.user = payload;
        // 연결된 클라이언트를 메모리에 등록하여 실시간 메시지 전송을 위한 클라이언트 추적
        this.chatService.registerClient(payload.sub, client);
        // 사용자가 참여한 채팅방들을 조회하여 Socket.io 룸 Join 처리
        await this.chatService.joinUserRooms(payload, client);
      } else {
        // 토큰이 없으면 즉시 연결 해제
        client.disconnect();
      }
    } catch (error) {
      // 예외 발생 시 즉시 연결 해제
      client.disconnect();
    }
  }

  // 클라이언트가 연결이 끊어졌을 때 실행되는 메서드
  handleDisconnect(client: Socket) {
    // Socket 객체에서 사용자 정보를 조회
    const user = client.data.user;

    // 사용자 정보가 있으면 연결된 클라이언트를 메모리에서 제거
    if(user) {
      this.chatService.removeClient(client.data.user.sub);
    }
  }

  
  // WebSocket 메시지 수신 및 처리 핵심 메서드
  @SubscribeMessage('sendMessage')  // 'sendMessage' 이벤트를 수신하는 데코레이터
  @UseInterceptors(WsTransactionInterceptor)  // WebSocket 트랜잭션 인터셉터 적용
  async handleMessage(
    @MessageBody() body: CreateChatDto,
    @ConnectedSocket() client: Socket,   // 연결된 클라이언트 Socket 객체
    @WsQueryRunner() qr: QueryRunner,    // 데이터베이스 트랜잭션 관리자
  ) {
    try {
      // 사용자 정보 추출
      const payload = client.data.user;
      
      // 메시지 생성 및 전송
      await this.chatService.createMessage(payload, body, qr);
    } catch (error) {
      throw error; // 에러를 다시 던져서 클라이언트에게 전달
    }
  }
}