import { Role } from "@prisma/client";
import { Types, Document } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { MovieUserLike } from "src/movie/schema/movie-user-like.schema";
import { Movie } from "src/movie/schema/movie.schema";
import { ChatRoom } from "src/chat/schema/chat-room.schema";
import { Chat } from "src/chat/schema/chat.schema";
// import { Schema, Types } from "mongoose";

@Schema({
    // 자동으로 CreatedAt, UpdatedAt 필드 추가
    timestamps: true,
})
export class User extends Document {
    @Prop({
        unique: true,
        required: true,
    })
    email: String;

    @Prop({
        required: true,
        select: false,
    })
    password: String;

    @Prop({
        enum: Role,
        default: Role.user,
    })
    role: Role;

    @Prop({
        type: [{
            type: Types.ObjectId,
            ref: 'Movie',
        }],
    })
    createdMovies: Movie[];

    @Prop({
        type: [{
            type: Types.ObjectId,
            ref: 'MovieUserLike',
        }],
    })
    likedMovies: MovieUserLike[];

    @Prop({
        type: [{
            type: Types.ObjectId,
            ref: 'Chat',
        }],
    })
    chats: Chat[];

    @Prop({
        type: [{
            type: Types.ObjectId,
            ref: 'CharRoom',
        }],
    })
    chatRooms: ChatRoom[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// export const userSchema = new Schema({
//   id: Number,
//   email: String,
//   password: String,
//   role: Role,
//   createdMovies: [{
//     type: Types.ObjectId,
//     ref: 'Movie',
//   }],
//   likedMovies: [{
//     type: Types.ObjectId,
//     ref: 'MovieUserLike',
//   }],
//   chats: [{
//     type: Types.ObjectId,
//     ref: 'Chat',
//   }],
//   chatRooms: [{
//     type: Types.ObjectId,
//     ref: 'ChatRoom',
//   }],
// })