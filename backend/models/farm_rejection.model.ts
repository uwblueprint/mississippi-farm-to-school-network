import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';

import Farm from './farm.model';
import User from './user.model';
import { FarmRejectionResolutionType, FarmSnapshotDTO } from '@/types';

@Table({ tableName: 'farm_rejections', timestamps: false, underscored: true })
export default class FarmRejection extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string;

  @ForeignKey(() => Farm)
  @Column({ type: DataType.UUID, allowNull: false })
  farm_id!: string;

  @BelongsTo(() => Farm)
  farm!: Farm;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  rejected_by_user_id!: string;

  @BelongsTo(() => User)
  rejected_by!: User;

  @Column({ type: DataType.TEXT, allowNull: false })
  rejection_reason!: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  farm_snapshot!: FarmSnapshotDTO;

  @Column({ type: DataType.DATE, allowNull: false })
  farm_snapshot_updated_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  resolved_at!: Date | null;

  @Column({
    type: DataType.ENUM('RESUBMITTED', 'APPROVED', 'WITHDRAWN'),
    allowNull: true,
  })
  resolution_type!: FarmRejectionResolutionType | null;
}
