-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('admin', 'paidUser', 'user');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'user',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Movie" (
    "id" SERIAL NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "dislikeCount" INTEGER NOT NULL DEFAULT 0,
    "detailId" INTEGER NOT NULL,
    "movieFilePath" TEXT NOT NULL,
    "directorId" INTEGER NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MovieUserLike" (
    "movieId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "isLike" BOOLEAN NOT NULL,

    CONSTRAINT "MovieUserLike_pkey" PRIMARY KEY ("movieId","userId")
);

-- CreateTable
CREATE TABLE "public"."MovieDetail" (
    "id" SERIAL NOT NULL,
    "detail" TEXT NOT NULL,

    CONSTRAINT "MovieDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Chat" (
    "id" SERIAL NOT NULL,
    "authorId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "chatRoomId" INTEGER NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatRoom" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Genre" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Director" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "nationality" TEXT NOT NULL,

    CONSTRAINT "Director_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat" (
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "message" VARCHAR NOT NULL,
    "authorId" INTEGER,
    "chatRoomId" INTEGER,

    CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_room" (
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,

    CONSTRAINT "PK_8aa3a52cf74c96469f0ef9fbe3e" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_room_users_user" (
    "chatRoomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "PK_78b0004f767c1273a6d13c1220b" PRIMARY KEY ("chatRoomId","userId")
);

-- CreateTable
CREATE TABLE "public"."director" (
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "dob" TIMESTAMP(6) NOT NULL,
    "nationality" VARCHAR NOT NULL,

    CONSTRAINT "PK_b85b179882f31c43324ef124fea" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."genre" (
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "PK_0285d4f1655d080cfcf7d1ab141" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."movie" (
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "title" VARCHAR NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "dislikeCount" INTEGER NOT NULL DEFAULT 0,
    "movieFilePath" VARCHAR NOT NULL,
    "creatorId" INTEGER,
    "detailId" INTEGER NOT NULL,
    "directorId" INTEGER NOT NULL,

    CONSTRAINT "PK_cb3bb4d61cf764dc035cbedd422" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."movie_detail" (
    "id" SERIAL NOT NULL,
    "detail" VARCHAR NOT NULL,

    CONSTRAINT "PK_e3014d1b25dbc9648b9abc58537" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."movie_genres_genre" (
    "movieId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,

    CONSTRAINT "PK_aee18568f9fe4ecca74f35891af" PRIMARY KEY ("movieId","genreId")
);

-- CreateTable
CREATE TABLE "public"."movie_user_like" (
    "movieId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "isLike" BOOLEAN NOT NULL,

    CONSTRAINT "PK_55397b3cefaa6fc1b47370fe84e" PRIMARY KEY ("movieId","userId")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "email" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,
    "role" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ChatRoomToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ChatRoomToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_GenreToMovie" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GenreToMovie_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_title_key" ON "public"."Movie"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_detailId_key" ON "public"."Movie"("detailId");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "public"."Genre"("name");

-- CreateIndex
CREATE INDEX "IDX_4abf95f2b061eff07204eb6928" ON "public"."chat_room_users_user"("chatRoomId");

-- CreateIndex
CREATE INDEX "IDX_8fc13654c02f47079cdd00935b" ON "public"."chat_room_users_user"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_dd8cd9e50dd049656e4be1f7e8c" ON "public"."genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_a81090ad0ceb645f30f9399c347" ON "public"."movie"("title");

-- CreateIndex
CREATE UNIQUE INDEX "REL_87276a4fc1647d6db559f61f89" ON "public"."movie"("detailId");

-- CreateIndex
CREATE INDEX "IDX_1996ce31a9e067304ab168d671" ON "public"."movie_genres_genre"("genreId");

-- CreateIndex
CREATE INDEX "IDX_985216b45541c7e0ec644a8dd4" ON "public"."movie_genres_genre"("movieId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_e12875dfb3b1d92d7d7c5377e22" ON "public"."user"("email");

-- CreateIndex
CREATE INDEX "_ChatRoomToUser_B_index" ON "public"."_ChatRoomToUser"("B");

-- CreateIndex
CREATE INDEX "_GenreToMovie_B_index" ON "public"."_GenreToMovie"("B");

-- AddForeignKey
ALTER TABLE "public"."Movie" ADD CONSTRAINT "Movie_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Movie" ADD CONSTRAINT "Movie_detailId_fkey" FOREIGN KEY ("detailId") REFERENCES "public"."MovieDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Movie" ADD CONSTRAINT "Movie_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "public"."Director"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovieUserLike" ADD CONSTRAINT "MovieUserLike_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "public"."Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovieUserLike" ADD CONSTRAINT "MovieUserLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "public"."ChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat" ADD CONSTRAINT "FK_ac7ca6f6fbe56f2a231369f2171" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."chat" ADD CONSTRAINT "FK_e49029a11d5d42ae8a5dd9919a2" FOREIGN KEY ("chatRoomId") REFERENCES "public"."chat_room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."chat_room_users_user" ADD CONSTRAINT "FK_4abf95f2b061eff07204eb69288" FOREIGN KEY ("chatRoomId") REFERENCES "public"."chat_room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_room_users_user" ADD CONSTRAINT "FK_8fc13654c02f47079cdd00935b7" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."movie" ADD CONSTRAINT "FK_87276a4fc1647d6db559f61f89a" FOREIGN KEY ("detailId") REFERENCES "public"."movie_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."movie" ADD CONSTRAINT "FK_a32a80a88aff67851cf5b75d1cb" FOREIGN KEY ("directorId") REFERENCES "public"."director"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."movie" ADD CONSTRAINT "FK_b55916de756e46290d52c70fc04" FOREIGN KEY ("creatorId") REFERENCES "public"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."movie_genres_genre" ADD CONSTRAINT "FK_1996ce31a9e067304ab168d6715" FOREIGN KEY ("genreId") REFERENCES "public"."genre"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."movie_genres_genre" ADD CONSTRAINT "FK_985216b45541c7e0ec644a8dd4e" FOREIGN KEY ("movieId") REFERENCES "public"."movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movie_user_like" ADD CONSTRAINT "FK_6a4d1cde9def796ad01b9ede541" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."movie_user_like" ADD CONSTRAINT "FK_fd47c2914ce011f6966368c8486" FOREIGN KEY ("movieId") REFERENCES "public"."movie"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."_ChatRoomToUser" ADD CONSTRAINT "_ChatRoomToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ChatRoomToUser" ADD CONSTRAINT "_ChatRoomToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GenreToMovie" ADD CONSTRAINT "_GenreToMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GenreToMovie" ADD CONSTRAINT "_GenreToMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
