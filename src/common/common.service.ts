import { BadRequestException, Injectable } from "@nestjs/common";
import { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { PagePaginationDto } from "./dto/page-pagination.dto";
import { CursorPaginationDto } from "./dto/cursor-pagination.dto";

@Injectable()
export class CommonService {
    constructor() { }

    applyPagePaginationParamsToQb<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, dto: PagePaginationDto) {
        const { page, take } = dto;

        if (take && page) {
            const skip = (page - 1) * take;

            qb.take(take);
            qb.skip(skip);
        }
    }

    async applyCursorPaginationParamsToQb<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, dto: CursorPaginationDto) {
        let { cursor, take, order } = dto;

        if(cursor) {
            const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
            
            // cursorObj = { "values": { "id": 27, "likeCount": 60 }, "order": ["id_DESC", "likeCount_DESC"] }
            const cursorObj = JSON.parse(decodedCursor);

            // order 커서의 order로 덮어씌우기(프론트 실수 방지)
            order = cursorObj.order;

            // values = { "id": 27, "likeCount": 60 }
            const { values } = cursorObj;

            // columns = [ 'id', 'likeCount' ]
            const columns = Object.keys(values);

            // (모든 요소가 DESC나 ASC로 통일되었다는 가정으로 진행)
            // comparisonOperator = '<' or '>'
            const comparisonOperator = order
                .some((object) => object.endsWith('DESC'))
                ? '<'
                : '>';

            // whereConditions = 'movie.id,movie.likeCount'
            const whereConditions = columns
                .map((column) => `${qb.alias}.${column}`)
                .join(',');

            // whereParams = ':id,:likeCount'
            const whereParams = columns
                .map((column) => `:${column}`)
                .join(',');
            
            // qb = (movie.id, movie.likeCount) < (:id, :likeCount)
            qb.where(`(${whereConditions}) ${comparisonOperator} (${whereParams})`, values);
        }

        // cursor가 없는 경우 첫번째부터
        // ["likeCOunt_DESC", "id_DESC"]
        for(let i = 0; i< order.length; i++){
            const [column, direction] = order[i].split('_');

            if(direction !== 'ASC' && direction !== 'DESC'){
                throw new BadRequestException('Order는 ASC 또는 DESC로 입력해주세요');
            }

            if(i === 0){
                qb.orderBy(`${qb.alias}.${column}`, direction)
            } else {
                qb.addOrderBy(`${qb.alias}.${column}`, direction)
            }
        }

        qb.take(take);

        const results = await qb.getMany();

        const nextCursor = this.generateNextCursor(results, order);

        return { qb, nextCursor };
    }

    generateNextCursor<T>(results: T[], order: string[]): string | null {
        // 응답값이 없다 == 다음 데이터가 없다.
        if (results.length === 0) return null;

        // lastItem = { id: 4, title: 'A', likeCount: 60 }
        const lastItem = results[results.length - 1];

        // 정렬 기준 필드들만 추려서 values에 저장
        const values = {};

        // order = ['id_DESC', 'likeCount_DESC']
        order.forEach((columnOrder) => {
            // [column] = id
            const [column] = columnOrder.split('_')

            // valuess = { id: 4 }
            values[column] = lastItem[column];
        });

        
        /** 
         * cursorObj = 
         * 
         * {
         *  "values": {
         *      "id": 27,
         *      "likeCount": 60
         *  },
         *  "order": ["id_DESC", "likeCount_DESC"]
         * }
         */
        const cursorObj = { values, order };
        const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString('base64');
        return nextCursor;
    }
} 