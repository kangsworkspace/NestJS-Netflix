import { ApiHideProperty } from "@nestjs/swagger";
import { Exclude } from "class-transformer";
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from "typeorm";

export class BaseTable{
  @CreateDateColumn()
  @Exclude()
  // Swagger Schemas에서 가리기
  @ApiHideProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude()
  // Swagger Schemas에서 가리기
  @ApiHideProperty()
  updateAt: Date;

  @VersionColumn()
  @Exclude()
  // Swagger Schemas에서 가리기
  @ApiHideProperty()
  version: number;
}