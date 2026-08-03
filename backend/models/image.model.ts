import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';

import Farm from './farm.model';

@Table({ tableName: 'images', timestamps: true, underscored: true })
export default class Image extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string;

  @ForeignKey(() => Farm)
  @Column({ type: DataType.UUID, allowNull: false })
  farm_id!: string;

  @BelongsTo(() => Farm)
  farm!: Farm;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  storage_key!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  content_type!: string;

  @Column({ type: DataType.BIGINT, allowNull: false })
  size!: number;

  @Column({ type: DataType.JSONB, allowNull: false })
  dimensions!: { width: number; height: number };

  @Column({ type: DataType.INTEGER, allowNull: false })
  index!: number;

  @Column({ type: DataType.DATE, allowNull: false })
  createdAt!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt!: Date;
}
