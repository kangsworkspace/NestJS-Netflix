import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "src/user/schema/user.schema";
import { Movie } from "./movie.schema";

@Schema({
    timestamps: true,
})
export class MovieUserLike extends Document {
    @Prop({
        type: Types.ObjectId,
        ref: 'Movie',
        required: true,
    })
    movie: Movie;

    @Prop({
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    })
    user: User;

    @Prop({
        required: true,
    })
    isLike: boolean;
}

export const MovieUserLikeSchema = SchemaFactory.createForClass(MovieUserLike);