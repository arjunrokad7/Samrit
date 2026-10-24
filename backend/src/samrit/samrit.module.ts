import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SamritRecord } from './samrit.entity';
import { User } from '../auth/entities/user.entity';
import { SamritService } from './samrit.service';
import { SamritController } from './samrit.controller';
import { SamritAI } from './ai.service';
@Module({
  imports: [TypeOrmModule.forFeature([SamritRecord, User])],
  providers: [SamritService, SamritAI],
  controllers: [SamritController],
})
export class SamritModule {}
