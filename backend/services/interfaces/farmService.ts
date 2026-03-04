import { FarmDTO } from '@/types';

interface IFarmService {
  /**
   * Farm search within radius of certain point
   * @param lat latitude of position
   * @param lng longitude of position
   * @param radiusKm search radius in km
   * @returns array of FarmDTOs within radius
   * @throws Error if failure
   */
  getFarmsByProximity(lat: number, lng: number, radiusKm: number): Promise<FarmDTO[]>;
}

export default IFarmService;
