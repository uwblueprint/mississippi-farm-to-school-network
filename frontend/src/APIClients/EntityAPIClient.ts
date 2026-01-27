import baseAPIClient from "./BaseAPIClient";

enum EnumField {
  "A",
  "B",
  "C",
  "D",
}

export type EntityRequest = {
  stringField: string;
  intField: number;
  stringArrayField: string[];
  enumField: EnumField;
  boolField: boolean;
};

export type EntityResponse = {
  id: string | number;
  stringField: string;
  intField: number;
  stringArrayField: string[];
  enumField: EnumField;
  boolField: boolean;
};

const create = async ({
  formData,
}: {
  formData: EntityRequest;
}): Promise<EntityResponse | null> => {
  try {
    const { data } = await baseAPIClient.post("/entities", formData);
    return data;
  } catch (error) {
    return null;
  }
};

const get = async (): Promise<EntityResponse[] | null> => {
  try {
    const { data } = await baseAPIClient.get("/entities");
    return data;
  } catch (error) {
    return null;
  }
};

const getCSV = async (): Promise<string | null> => {
  try {

    const { data } = await baseAPIClient.get("/entities", {
      // Following line is necessary to set the Content-Type header
      // Reference: https://github.com/axios/axios/issues/86
      data: null,
      headers: { "Content-Type": "text/csv" },
    });
    return data;
  } catch (error) {
    return null;
  }
};

const update = async (
  id: number | string,
  {
    entityData,
  }: {
    entityData: EntityRequest;
  },
): Promise<EntityResponse | null> => {
  try {
    const { data } = await baseAPIClient.put(`/entities/${id}`, entityData);
    return data;
  } catch (error) {
    return null;
  }
};

export default { create, get, getCSV, update };
