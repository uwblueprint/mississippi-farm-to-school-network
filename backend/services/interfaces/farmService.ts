import {
  CreateFarmInput,
  FarmFilter,
  FarmDTO,
  FarmRejectionDTO,
  UpdateFarmInput,
  FarmStatus,
} from '@/types';
import Farm from '@/models/farm.model';

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
   * Get farms with optional filtering
   * @param filter optional farm filter criteria
   * @returns array of FarmDTOs
   * @throws Error if farm retrieval fails
   */
  getFarms(filter?: FarmFilter): Promise<Array<FarmDTO>>;

  /**
   * Update a farm by id
   * @param id farm's id
   * @param input the farm fields to be updated
   * @returns a FarmDTO with the updated farm's information
   * @throws Error if farm update fails
   */
  updateFarm(id: string, input: UpdateFarmInput, farmToUpdate?: Farm): Promise<FarmDTO>;

  /**
   * Get farms by their FarmStatus
   * @param status the status to filter farms by
   * @returns array of FarmDTOs
   * @throws Error if farm retrieval fails
   */
  getFarmsByStatus(status: FarmStatus): Promise<FarmDTO[]>;

  /**
   * Update a farm's status to APPROVED & attempt to email farm owner
   * @param id farm's id
   * @returns a FarmDTO with the updated farm's information
   * @throws Error if farm update fails
   */
  approveFarm(id: string): Promise<FarmDTO>;

  getFarmById(farmId: string): Promise<FarmDTO>;

  /**
   * Create a rejection record for a farm
   * @param farmId farm's id
   * @param rejectedByUserId id of the user rejecting the farm
   * @param rejectionReason reason for the rejection
   * @returns a FarmRejectionDTO with the created rejection's information
   * @throws Error if farm rejection creation fails
   */
  createFarmRejection(
    farmId: string,
    rejectedByUserId: string,
    rejectionReason: string
  ): Promise<FarmRejectionDTO>;

  /**
   * Get the latest rejection for a farm
   * @param farmId farm's id
   * @returns the latest FarmRejectionDTO or null when no rejection exists
   * @throws Error if farm rejection retrieval fails
   */
  getLatestFarmRejectionByFarmId(farmId: string): Promise<FarmRejectionDTO | null>;
}

export default IFarmService;
