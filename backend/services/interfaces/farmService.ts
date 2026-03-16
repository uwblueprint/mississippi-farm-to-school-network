import { CreateFarmInput, FarmDTO } from '@/types';

interface IFarmService {
  /**
   * Create a farm owned by the authenticated user.
   * @param ownerUserId id of the user who owns the farm
   * @param input farm details supplied by the user
   * @returns a FarmDTO with the created farm's information
   * @throws Error if farm creation fails
   */
  createFarm(ownerUserId: string, input: CreateFarmInput): Promise<FarmDTO>;

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
