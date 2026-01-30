import {
  EntityRequestDTO,
  EntityResponseDTO,
  IEntityService,
} from "@/services/interfaces/IEntityService";

function requestToResponse(
  id: string,
  entity: EntityRequestDTO,
): EntityResponseDTO {
  return {
    id,
    stringField: entity.stringField,
    intField: entity.intField,
    enumField: entity.enumField,
    stringArrayField: entity.stringArrayField,
    boolField: entity.boolField,
    fileName: entity.filePath ?? "",
  };
}

let memoryStore: EntityResponseDTO | null = null;

const entityServiceMock: IEntityService = {
  createEntity: async (entity) => {
    memoryStore = requestToResponse("1", entity);
    return memoryStore;
  },
  updateEntity: async (id, entity) => {
    memoryStore = requestToResponse(id, entity);
    return memoryStore;
  },
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  getEntity: async (id) => {
    if (!memoryStore) throw new Error(`Entity id ${id} not found`);
    return memoryStore;
  },
  getEntities: async () => (memoryStore ? [memoryStore] : []),
  deleteEntity: async (id) => {
    memoryStore = null;
    return id;
  },
};

export default entityServiceMock;
