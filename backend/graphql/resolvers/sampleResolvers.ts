import SampleService from "../../services/implementations/sampleService";
import ISampleService from "../../services/interfaces/sampleService";
import { SampleDTO, CreateSampleDTO } from "../../types";

const sampleService: ISampleService = new SampleService();

const sampleResolvers = {
	Query: {
		sampleById: async (
			_parent: undefined,
			{ id }: { id: string },
		): Promise<SampleDTO> => {
			const sample = await sampleService.getSampleById(id);
			return sample;
		},
		samples: async (
			_parent: undefined,
			_args: undefined,
		): Promise<SampleDTO[]> => {
			const samples = await sampleService.getAllSamples();
			return samples;
		},
	},
	Mutation: {
		createSample: async (
			_parent: undefined,
			{ sample }: { sample: CreateSampleDTO },
		): Promise<SampleDTO> => {
			const newSample = await sampleService.createSample(sample);
			return newSample;
		},
		updateSample: async (
			_parent: undefined,
			{ id, sample }: { id: string; sample: CreateSampleDTO },
		): Promise<SampleDTO> => {
			const updatedSample = await sampleService.updateSample(id, sample);
			return updatedSample;
		},
		deleteSampleById: async (
			_parent: undefined,
			{ id }: { id: string },
		): Promise<SampleDTO> => {
			const deletedSample = await sampleService.deleteSampleById(id);
			return deletedSample;
		},
	},
};

export default sampleResolvers;
