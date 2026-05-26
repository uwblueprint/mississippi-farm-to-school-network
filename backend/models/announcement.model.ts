import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';

import User from './user.model';

@Table({ tableName: 'announcements', timestamps: true, underscored: true, paranoid: false })
export default class Announcement extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  message!: string;

  @Column({ type: DataType.DATE, allowNull: false, field: 'start_date' })
  startDate!: Date;

  @Column({ type: DataType.DATE, allowNull: true, field: 'end_date' })
  endDate!: Date | null;

  @Column({ type: DataType.DATE, allowNull: true, field: 'deleted_at' })
  deletedAt!: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, field: 'created_by' })
  createdBy!: string;

  @BelongsTo(() => User, 'createdBy')
  creator!: User;

  @Column({ type: DataType.DATE, allowNull: false })
  createdAt!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt!: Date;

  get status(): 'LIVE' | 'UPCOMING' | 'PAST' {
    const now = new Date();

    if (this.deletedAt !== null || (this.endDate !== null && this.endDate < now)) {
      return 'PAST';
    }

    if (this.startDate > now) {
      return 'UPCOMING';
    }

    return 'LIVE';
  }
}
