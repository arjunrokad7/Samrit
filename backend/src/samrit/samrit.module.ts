import { EvidenceService } from './evidence.service';
import { EvidenceController } from './evidence.controller';
import { RelationalStore } from '../database/relational-store';
import { GeminiGateway } from './gemini.gateway';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SamritRecord } from './samrit.entity';
import { User } from '../auth/entities/user.entity';
import { SamritService } from './samrit.service';
import { SamritController } from './samrit.controller';
import { SamritAI } from './ai.service';
import { ConsumerController } from './consumer.controller';
import { ConsumerSearchService } from './consumer-search.service';
import { VoiceService } from './voice.service';
import { VoiceController } from './voice.controller';
@Module({
  imports: [TypeOrmModule.forFeature([SamritRecord, User])],
  providers: [
    EvidenceService,
    GeminiGateway,
    RelationalStore,
    SamritService,
    SamritAI,
    ConsumerSearchService,
    VoiceService,
  ],
  controllers: [
    EvidenceController,
    SamritController,
    ConsumerController,
    VoiceController,
  ],
})
export class SamritModule {}
