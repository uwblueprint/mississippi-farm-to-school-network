import { SampleDTO, CreateSampleDTO } from '@/types';
import Sample from '@/models/sample.model';
import ISampleService from '@/services/interfaces/sampleService';

const grabSample = async (sampleId: number): Promise<Sample> => {
  const sample = await Sample.findByPk(sampleId);
  if (!sample) {
    throw new Error(`SampleId ${sampleId} not found.`);
  }
  return sample;
};

class SampleService implements ISampleService {
  async getAllSamples(): Promise<SampleDTO[]> {
    const samples = await Sample.findAll();
    return samples.map((sample) => ({
      id: sample.id,
      name: sample.name,
      description: sample.description,
      createdAt: sample.createdAt.toISOString(),
      updatedAt: sample.updatedAt.toISOString(),
    }));
  }

  async getSampleById(id: number): Promise<SampleDTO> {
    const sample = await grabSample(id);
    return {
      id: sample.id,
      name: sample.name,
      description: sample.description,
      createdAt: sample.createdAt.toISOString(),
      updatedAt: sample.updatedAt.toISOString(),
    };
  }

  async createSample(content: CreateSampleDTO): Promise<SampleDTO> {
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
  }

  async updateSample(id: number, content: CreateSampleDTO): Promise<SampleDTO> {
    const sample = await grabSample(id);
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
  }

  async deleteSampleById(id: number): Promise<SampleDTO> {
    const sample = await grabSample(id);
    await sample.destroy();
    return {
      id: sample.id,
      name: sample.name,
      description: sample.description,
      createdAt: sample.createdAt.toISOString(),
      updatedAt: sample.updatedAt.toISOString(),
    };
  }
}

export default SampleService;
