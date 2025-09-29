import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt'
import { UpdateUserDto } from './dto/update-user.dto';

// 테스트를 위한 Mock 객체
const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

const mockConfigService = {
  get: jest.fn()
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,

        // 테스트를 위한 의존성 관리:
        // user.service.ts 파일의
        // @InjectRepository(User)를 Mock 객체로 설정
        {
          // 대상 객체 - User의 레포지토리
          provide: getRepositoryToken(User),
          // 대체할 값 - mock으로 설정
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          // 대체할 값 - mock으로 설정
          useValue: mockConfigService,
        }
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user and return it', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@codefactory.ai',
        password: '123123'
      };

      const hashRounds = 10;
      const hashedPassword = 'hashhashhash'
      const result = {
        id: 1,
        email: createUserDto.email,
        password: hashedPassword
      }

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest.spyOn(bcrypt, 'hash').mockImplementation((password, hashRounds) => hashedPassword);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
        id: 1,
        email: createUserDto.email,
        password: hashedPassword
      })

      const createdUser = await userService.create(createUserDto);

      expect(createdUser).toEqual(result);
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, { where: { email: createUserDto.email }});
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, { where: { email: createUserDto.email }});
      expect(mockConfigService.get).toHaveBeenCalledWith(expect.anything());
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, hashRounds);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
      })
    })

    it('should throw a BadRequestException if email already exists', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@codefactory.ai',
        password: '123123'
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
        id: 1,
        email: createUserDto.email,
      })

      expect(userService.create(createUserDto)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email }})
    })
  });

  /// Test 코드
  /// Service의 테스트 코드는 레포지토리가 적절하게 호출되었는지,
  /// 파라미터가 제대로 전달되었는지 테스트
  describe("findAll", () => {
    // "findAll" 메서드에 대한 테스트 그룹을 정의 (일어나야할 행동을 설명하면 좋음)
    it('should retun all users', async () => {
      // 개별 테스트 케이스: "모든 유저를 반환해야 한다"

      // 1. 테스트에서 사용할 가짜 유저 데이터 준비
      const users = [
        { id: 1,
          email: 'test@codefactory.ai',
        }
      ];

      // 2. mockUserRepository의 find 메서드가 호출되면,
      // users 데이터를 반환하도록 설정
      mockUserRepository.find.mockResolvedValue(users);

      // 3. 실제 서비스의 findAll 메서드 호출
      // 내부적으로 mockUserRepository.find가 사용됨
      const result = await userService.findAll();

      // 4. 서비스 메서드의 반환값이 예상(users)과 같은지 검증
      expect(result).toEqual(users);

      // 5. userService.findAll이 실행될 때
      // 실제로 mockUserRepository.find가 호출됐는지 검증
      expect(mockUserRepository.find).toHaveBeenCalled();
    })
  });

  describe("findOne", () => {
    it('should return a user by id', async () => {
      // 테스트에서 사용할 가짜 유저 데이터 준비
      const user = [{ id: 1, email: 'test@codefactory.ai' }];

      // 아래 코드와 동일하게 동작
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
      // mockUserRepository.findOne.mockResolvedValue(user);

      const result = await userService.findOne(1);

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 }
      })
    })

    it('should throw a NotFoundException if user is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      expect(userService.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 }
      })
    })
  });

  describe("update", () => {
    it('should update a user if it exist and return the updated user', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'test@codefactory.ai',
        password: '123123'
      };

      const hashRounds = 10;
      const hashedPassword = 'hashhashhashhash'
      const user = {
        id: 1,
        email: updateUserDto.email
      }

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest.spyOn(bcrypt, 'hash').mockImplementation((PassThrough, hashRounds) => hashedPassword);
      jest.spyOn(mockUserRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
        ...user,
        password: hashedPassword,
      });

      const result = await userService.update(1, updateUserDto);

      expect(result).toEqual({
        ...user,
        password: hashedPassword,
      });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }});
      expect(bcrypt.hash).toHaveBeenCalledWith(updateUserDto.password, hashRounds);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: 1 },
        { 
          ...updateUserDto,
          password: hashedPassword
        });
    });

    it('should throw a NotFoundException if user to update is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      const updateUserDto: UpdateUserDto = {
        email: 'test@codefactory.ai',
        password: '123123'
      };

      expect(userService.update(999, updateUserDto)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 }
      });
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    // it('should return BadRequestException if password is not found', async () => {
    //   const updateUserDto: UpdateUserDto = {
    //     email: 'test@codefactory.ai'
    //   };

    //   expect(userService.update(999, updateUserDto)).rejects.toThrow(BadRequestException);
    //   expect(mockUserRepository.update).not.toHaveBeenCalled();
    // });
  });

  describe("remove", () => {
    it('should delete a user by id', async () => {
      const id = 999;

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
        id: 999
      });

      const result = await userService.remove(id);

      expect(result).toEqual(id);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: id }
      })
    })

    it('should throw a NotFoundException if user to delete is not found', () => {
      const id = 999;
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      expect(userService.remove(id)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: id }
      })
    })
  });
});
