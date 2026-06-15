import {
  CreateFarmInput,
  FarmFilter,
  FarmDTO,
  UpdateFarmInput,
  FarmStatus,
  FarmRejectionDTO,
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
   * Get the latest unresolved rejection for a farm
   * @param farmId farm's id
   * @returns the latest active FarmRejectionDTO or null if no active rejection exists
   * @throws Error if retrieval fails
   */
  getLatestActiveRejection(farmId: string): Promise<FarmRejectionDTO | null>;

  /**
   * Resubmit a rejected farm with updated fields
   * @param farmId farm's id
   * @param resubmittedByUserId id of the user resubmitting the farm
   * @param input the farm fields to update
   * @returns a FarmDTO with status PENDING_APPROVAL
   * @throws Error if farm is not in REJECTED status or update fails
   */
  resubmitFarm(
    farmId: string,
    resubmittedByUserId: string,
    input: UpdateFarmInput
  ): Promise<FarmDTO>;
}

export default IFarmService;
