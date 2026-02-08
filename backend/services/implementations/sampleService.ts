import { SampleDTO, CreateSampleDTO } from "../../types";
import Sample from "../../models/sample.model";
import ISampleService from "../interfaces/sampleService";

const grabSample = async (sampleId: string): Promise<Sample> => {
	try {
		const sample = await Sample.findByPk(sampleId);
		if (!sample) {
			throw new Error(`SampleId ${sampleId} not found.`);
		}
		return sample;
	} catch (error: unknown) {
		throw error;
	}
};

class SampleService implements ISampleService {
	/* eslint-disable class-methods-use-this */

	async getAllSamples(): Promise<SampleDTO[]> {
		let samples: Sample[] = [];
		let sampleDTOs: Array<SampleDTO> = [];
		try {
			samples = await Sample.findAll();
			sampleDTOs = samples.map((sample) => ({
				id: sample.id,
				name: sample.name,
				description: sample.description,
				createdAt: sample.createdAt.toISOString(),
				updatedAt: sample.updatedAt.toISOString(),
			}));
		} catch (error: unknown) {
			throw error;
		}
		return sampleDTOs;
	}

	async getSampleById(id: string): Promise<SampleDTO> {
		try {
			const sample = await grabSample(id);
			return {
				id: sample.id,
				name: sample.name,
				description: sample.description,
				createdAt: sample.createdAt.toISOString(),
				updatedAt: sample.updatedAt.toISOString(),
			};
		} catch (error: unknown) {
			throw error;
		}
	}

	async createSample(content: CreateSampleDTO): Promise<SampleDTO> {
		try {
			const sample = await Sample.create({
				name: content.name,
				description: content.description,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			return {
				id: sample.id,
				name: sample.name,
				description: sample.description,
				createdAt: sample.createdAt.toISOString(),
				updatedAt: sample.updatedAt.toISOString(),
			};
		} catch (error: unknown) {
			throw error;
		}
	}

	async updateSample(id: string, content: CreateSampleDTO): Promise<SampleDTO> {
		const sample = await grabSample(id);
		try {
			sample.name = content.name;
			sample.description = content.description;
			sample.updatedAt = new Date();
			await sample.save();
			return {
				id: sample.id,
				name: sample.name,
				description: sample.description,
				createdAt: sample.createdAt.toISOString(),
				updatedAt: sample.updatedAt.toISOString(),
			};
		} catch (error: unknown) {
			throw error;
		}
	}

	async deleteSampleById(id: string): Promise<SampleDTO> {
		const sample = await grabSample(id);
		try {
			await sample.destroy();
			return {
				id: sample.id,
				name: sample.name,
				description: sample.description,
				createdAt: sample.createdAt.toISOString(),
				updatedAt: sample.updatedAt.toISOString(),
			};
		} catch (error: unknown) {
			throw error;
		}
	}
}

export default SampleService;
