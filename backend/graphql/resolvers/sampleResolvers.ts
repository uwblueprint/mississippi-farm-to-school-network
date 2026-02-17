import SampleService from '@/services/implementations/sampleService';
import ISampleService from '@/services/interfaces/sampleService';

const sampleService: ISampleService = new SampleService();

const sampleResolvers = {
  Query: {
    sampleById: async (_: unknown, { id }: { id: string }) => {
      return sampleService.getSampleById(id);
    },
    samples: async () => {
      return sampleService.getAllSamples();
    },
  },
  Mutation: {
    createSample: async (
      _: unknown,
      { sample }: { sample: { name: string; description: string } }
    ) => {
      return sampleService.createSample(sample);
    },
    updateSample: async (
      _: unknown,
      { id, sample }: { id: string; sample: { name: string; description: string } }
    ) => {
      return sampleService.updateSample(id, sample);
    },
    deleteSampleById: async (_: unknown, { id }: { id: string }) => {
      return sampleService.deleteSampleById(id);
    },
  },
};

export default sampleResolvers;
