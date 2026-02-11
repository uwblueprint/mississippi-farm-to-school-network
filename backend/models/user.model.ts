import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { Role } from '../types';

@Table({ tableName: 'users' })
export default class User extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  firstName!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  lastName!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  authId!: string;

  @Column({ type: DataType.ENUM('User', 'Admin'), allowNull: false })
  role!: Role;

  @Column({ type: DataType.DATE, allowNull: false })
  createdAt!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt!: Date;
}
