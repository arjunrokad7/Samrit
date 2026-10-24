import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// Versioned domain documents share the existing transactional PostgreSQL store.
@Entity('samrit_record')
@Index(['kind'])
export class SamritRecord {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() kind: string;
  @Column('jsonb') payload: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
