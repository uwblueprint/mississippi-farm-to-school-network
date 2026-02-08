import {
	Column,
	DataType,
	Model,
	Table,
} from "sequelize-typescript";

@Table({ tableName: "samples" })
export default class Sample extends Model {
	@Column({ type: DataType.STRING, primaryKey: true })
	id!: string;

	@Column({ type: DataType.STRING })
	name!: string;

	@Column({ type: DataType.STRING })
	description!: string;

	@Column({ type: DataType.DATE })
	createdAt!: Date;

	@Column({ type: DataType.DATE })
	updatedAt!: Date;
}
