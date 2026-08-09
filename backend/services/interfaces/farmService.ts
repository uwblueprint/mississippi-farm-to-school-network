import {
  CreateFarmInput,
  FarmFilter,
  FarmDTO,
  FarmRejectionDTO,
  ActiveFarmRejectionDTO,
  FarmStatus,
  UpdateFarmInput,
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
   * Farm search within radius of certain point
   * @param lat latitude of position
   * @param lng longitude of position
   * @param radiusKm search radius in km
   * @returns array of FarmDTOs within radius
   * @throws Error if failure
   */
  getFarmsByProximity(lat: number, lng: number, radiusKm: number): Promise<FarmDTO[]>;

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
   * Archive a farm so it is hidden from public and default listings.
   * Leaves the farm's status untouched so it can be restored later.
   * @param farmId farm's id
   * @returns the updated FarmDTO with is_archived set to true
   * @throws Error if the farm does not exist or the update fails
   */
  archiveFarm(farmId: string): Promise<FarmDTO>;

  /**
   * Unarchive a previously archived farm, restoring it to listings.
   * @param farmId farm's id
   * @returns the updated FarmDTO with is_archived set to false
   * @throws Error if the farm does not exist or the update fails
   */
  unarchiveFarm(farmId: string): Promise<FarmDTO>;

  /**
   * Get the latest unresolved rejection for a farm
   * @param farmId farm's id
   * @returns the latest active FarmRejectionDTO or null if no active rejection exists
   * @throws Error if retrieval fails
   */
  getLatestActiveRejection(farmId: string): Promise<ActiveFarmRejectionDTO | null>;

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
