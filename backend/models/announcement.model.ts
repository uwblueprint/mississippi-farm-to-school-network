import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
 
import User from './user.model';
 
@Table({ tableName: 'announcements', timestamps: true, underscored: true, paranoid: false })
export default class Announcement extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string;
 
  @Column({ type: DataType.TEXT, allowNull: false })
  message!: string;
 
  @Column({ type: DataType.DATE, allowNull: false })
  start_date!: Date;
 
  @Column({ type: DataType.DATE, allowNull: true })
  end_date!: Date | null;
 
  @Column({ type: DataType.DATE, allowNull: true })
  deleted_at!: Date | null;
 
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  created_by!: string;
 
  @BelongsTo(() => User, 'created_by')
  creator!: User;
 
  @Column({ type: DataType.DATE, allowNull: false })
  createdAt!: Date;
 
  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt!: Date;
 
  get status(): 'LIVE' | 'UPCOMING' | 'PAST' {
    const now = new Date();
 
    if (this.deleted_at !== null || (this.end_date !== null && this.end_date < now)) {
      return 'PAST';
    }
 
    if (this.start_date > now) {
      return 'UPCOMING';
    }
 
    return 'LIVE';
  }
}