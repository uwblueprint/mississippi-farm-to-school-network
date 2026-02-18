import { SampleDTO, CreateSampleDTO } from '@/types';

interface ISampleService {
  getAllSamples(): Promise<SampleDTO[]>;
  getSampleById(id: number): Promise<SampleDTO>;
  createSample(content: CreateSampleDTO): Promise<SampleDTO>;
  updateSample(id: number, content: CreateSampleDTO): Promise<SampleDTO>;
  deleteSampleById(id: number): Promise<SampleDTO>;
}

export default ISampleService;
