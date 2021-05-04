import { DMMF } from "@prisma/generator-helper";

export type controllerParams = {
  model: DMMF.Model;
};

export type routeParams = {
  modelName: string;
  idField?: ScalarField | undefined;
};

export type typeParams = {
  model: DMMF.Model;
};

export type getResponseParams = {
  scalarFields: ScalarField[];
  enumFields: DMMF.Field[];
};

export type getQueryParams = {
  scalarFields: ScalarField[];
  enumFields: DMMF.Field[];
};

export type getDetailsParamsParams = {
  idField: ScalarField | undefined;
};

export type postBodyParams = {
  scalarFields: ScalarField[];
  enumFields: DMMF.Field[];
};

export type putBodyParams = {
  scalarFields: ScalarField[];
  enumFields: DMMF.Field[];
};

export type putParamsParams = {
  idField: ScalarField | undefined;
};

export type deleteParamsParams = {
  idField: ScalarField | undefined;
};

export type PrismaPrimitive =
  | "String"
  | "Boolean"
  | "Int"
  | "Float"
  | "DateTime"
  | "Json"
  | "Bytes"
  | "Decimal"
  | "BigInt";

export type ScalarField = DMMF.Field & { type: PrismaPrimitive };
