import { Inject, Injectable, Logger, LoggerService } from "@nestjs/common";
import { Cron, SchedulerRegistry } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { readdir, unlink } from "fs/promises";
import { join, parse } from "path";
import { Movie } from "src/movie/entity/movie.entity";
import { Repository } from "typeorm";
import { DefaultLogger } from "./logger/default.logger";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

/// Scheduling Tasks
@Injectable()
export class TasksService{
    /// NestJS 기본 로거 설정
    // private readonly logger = new Logger(TasksService.name);

    constructor(
        @InjectRepository(Movie)
        private readonly movieRepository: Repository<Movie>,

        // 로거 라이브러리 Winston
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,

        private readonly schedulerRegistry: SchedulerRegistry,
        // 커스텀 로거
        // private readonly logger: DefaultLogger,

        
    ){}

    // @Cron('* * * * * *')
    logEverySecond(){
        // TasksService.name => Context 제공
        // null => 실제 Stack Trace를 하는 파라미터? 위치 

        // this.logger.fatal('FATAL 레벨 로그');
        this.logger.error('ERROR 레벨 로그', null, TasksService.name);
        this.logger.warn('WARN 레벨 로그', TasksService.name);
        this.logger.log('LOG 레벨 로그', TasksService.name);
        // this.logger.debug('DEBUG 레벨 로그');
        // this.logger.verbose('VERBOSE 레벨 로그');
    }

    // '초', '분', '시', '일', '월', '요일'
    @Cron('0 0 0 * * *')
    async eraseOrphanFiles(){
        const files = await readdir(join(process.cwd(), 'public', 'temp'));

        const deleteFilesTargets = files.filter((file) => {
            // 1. 파일 이름이 지정된 형식이 아니면 삭제
            // 확장자 제거
            const filename = parse(file).name;

            // _ 단위로 분리
            const split = filename.split('_');

            // 형식에 맞지 않는 경우 삭제
            if(split.length !== 2){
                return true;
            }

            try {
                const date = +new Date(parseInt(split[split.length - 1]));
                const aDayInMilSec = (24 * 60 * 60 * 1000);
                const now = +new Date();

                // 하루 이상이 지난 경우 삭제
                return (now - date) > aDayInMilSec;
            } catch(error) {
                return true;
            }
            // 2. 특정 기간이 지난 후 삭제
        });

        /// 내부의 모든 작업을 병렬 + 비동기 처리
        /// 하나라도 실패하면 전체가 실패
        await Promise.all(
            deleteFilesTargets.map(
                // unlink가 Promise를 즉시 반환,
                // 모든 Promise들이 모이면 Promise.all() 실행
                (x) => unlink(join(process.cwd(), 'public', 'temp', x))
            )
        );
    }


    @Cron('0 0 0 * * *')
    async calculateMovieLikeCounts() {
        console.log('run');
        await this.movieRepository
            .createQueryBuilder('movie')
            .update()
            .set({
                likeCount: () =>
                    `(SELECT COUNT(*) FROM movie_user_like mul WHERE mul."movieId" = movie.id AND mul."isLike" = true)`,
                dislikeCount: () =>
                    `(SELECT COUNT(*) FROM movie_user_like mul WHERE mul."movieId" = movie.id AND mul."isLike" = false)`,
            })
            .execute();
    }

    // @Cron('* * * * * *', {
    //     name: 'printer',
    // })
    // printer(){
    //     console.log('print every seconds');
    // }

    // @Cron('*/5 * * * * *')
    // stopper(){
    //     console.log('---stopper run---');

    //     const job = this.schedulerRegistry.getCronJob('printer');

    //     console.log('# Last Date');
    //     console.log(job.lastDate());

    //     console.log('# Next Date');
    //     console.log(job.nextDate());

    //     console.log('# Next Dates');
    //     console.log(job.nextDates(5));

    //     if(job.isActive){
    //         job.stop();
    //     } else {
    //         job.start();
    //     }
    // }
}