import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import User from './user.model';
import { FarmStatus } from '@/types';

@Table({ tableName: 'farms', timestamps: true, underscored: true })
export default class Farm extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  owner_user_id!: string;

  @BelongsTo(() => User)
  owner!: User;

  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  usda_farm_id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  farm_name!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  description!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  primary_phone!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  primary_email!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  website!: string | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  social_media!: Record<string, unknown> | null;

  @Column({ type: DataType.STRING, allowNull: false })
  farm_address!: string;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false })
  counties_served!: string[];

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false })
  cities_served!: string[];

  @Column({ type: DataType.GEOGRAPHY('POINT', 4326), allowNull: false })
  location!: unknown;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false })
  food_categories!: string[];

  @Column({ type: DataType.JSON, allowNull: true })
  market_sales_data!: { market: string; times: string }[] | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  bipoc_owned!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  gap_certified!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  food_safety_plan!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  agritourism!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  sells_at_markets!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  csa_boxes!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  online_sales!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  delivery!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  f2s_experience!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  interested_in_f2s!: boolean;

  @Column({
    type: DataType.ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING_APPROVAL',
    allowNull: false,
  })
  status!: FarmStatus;

  @Column({ type: DataType.DATE, allowNull: false })
  createdAt!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt!: Date;
}

