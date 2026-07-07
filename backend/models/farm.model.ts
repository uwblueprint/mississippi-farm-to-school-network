import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';

import User from './user.model';
import { FarmStatus } from '@/types';
import type {
  GrowingPractice,
  ProductCategory,
  FoodSafetyCertification,
  FarmExperience,
  FarmCharacteristic,
  FarmToSchoolSale,
} from '@/constants/farmOptions';

@Table({ tableName: 'farms', timestamps: true, underscored: true })
export default class Farm extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  id!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  owner_user_id!: string;

  @BelongsTo(() => User)
  owner!: User;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  usda_farm_id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  farm_name!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  specific_products!: string;

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

  @Column({ type: DataType.STRING, allowNull: false })
  county!: string;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true, defaultValue: [] })
  cities_served!: string[];

  @Column({ type: DataType.GEOMETRY('POINT', 4326), allowNull: false })
  location!: { type: string; coordinates: [number, number] };

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false })
  product_categories!: ProductCategory[];

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, defaultValue: [] })
  growing_practices!: GrowingPractice[];

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, defaultValue: [] })
  food_safety_certifications!: FoodSafetyCertification[];

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, defaultValue: [] })
  farm_experiences!: FarmExperience[];

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, defaultValue: [] })
  farm_characteristics!: FarmCharacteristic[];

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, defaultValue: [] })
  farm_to_school_sales!: FarmToSchoolSale[];

  @Column({ type: DataType.JSON, allowNull: true })
  market_sales_data!: { market: string; times: string }[] | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  f2s_experience!: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  minimum_order!: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  delivery_details!: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  cover_photo!: string | null;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, defaultValue: [] })
  carousel_photos!: string[];

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
