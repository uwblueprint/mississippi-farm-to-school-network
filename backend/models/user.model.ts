import { Column, HasMany, DataType, Model, Table } from 'sequelize-typescript';
import Farm from './farm.model';
import { Role } from '@/types';

@Table({ tableName: 'users', timestamps: true, underscored: true })
export default class User extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string;

  @HasMany(() => Farm)
  farms!: Farm[];

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  firebase_uid!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.ENUM('ADMIN', 'FARMER'), allowNull: false })
  role!: Role;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_verified!: boolean;

  @Column({ type: DataType.DATE, allowNull: false })
  createdAt!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt!: Date;
}
