import { SampleDTO, CreateSampleDTO } from "../../types";

interface ISampleService {
	getAllSamples(): Promise<SampleDTO[]>;
	getSampleById(id: string): Promise<SampleDTO>;
	createSample(content: CreateSampleDTO): Promise<SampleDTO>;
	updateSample(id: string, content: CreateSampleDTO): Promise<SampleDTO>;
	deleteSampleById(id: string): Promise<SampleDTO>;
}

export default ISampleService;
