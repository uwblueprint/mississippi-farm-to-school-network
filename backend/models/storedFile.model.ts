import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';

import Farm from './farm.model';
import User from './user.model';

@Table({ tableName: 'stored_files', timestamps: true, underscored: true })
export default class StoredFile extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  storage_key!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  original_file_name!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  owner_user_id!: string;

  @BelongsTo(() => User)
  owner!: User;

  @ForeignKey(() => Farm)
  @Column({ type: DataType.UUID, allowNull: false })
  farm_id!: string;

  @BelongsTo(() => Farm)
  farm!: Farm;

  @Column({ type: DataType.STRING, allowNull: true })
  content_type!: string | null;

  @Column({ type: DataType.DATE, allowNull: false })
  createdAt!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt!: Date;
}
