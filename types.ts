import { DMMF } from "@prisma/generator-helper";

export type controllerParams = {
  model: DMMF.Model;
  selection: selectionAnswerType;
};

export type OptsParams = {
  model: DMMF.Model;
  selection?: selectionType[];
};

export type ServiceParams = {
  model: DMMF.Model;
  selection?: selectionType[];
};

export type serviceParams = {
  model: DMMF.Model;
  selection: selectionAnswerType;
};

export type routeParams = {
  modelName: string;
  idField?: ScalarField | undefined;
};

export type typeParams = {
  model: DMMF.Model;
  selection: selectionAnswerType;
};

export type getResponseParams = {
  selection: selectionType[HTTP_METHODS.GET];
};

export type getQueryParams = {
  scalarFields: ScalarField[];
  enumFields: DMMF.Field[];
};

export type getDetailsParamsParams = {
  idField: ScalarField;
};

export type postBodyParams = {
  scalarFields: ScalarField[];
  enumFields: DMMF.Field[];
  selection: selectionType[HTTP_METHODS.POST];
};

export type putBodyParams = {
  scalarFields: ScalarField[];
  enumFields: DMMF.Field[];
  selection: selectionType[HTTP_METHODS.PUT];
};

export type putParamsParams = {
  idField: ScalarField;
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

export enum HTTP_METHODS {
  GET = "GET",
  GET_DETAILS = "GET/:id",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

export type templateConfig = {
  outPath: string;
};

export type selectionType =
  | DMMF.Field
  | (DMMF.Field & { values: selectionType });

export type selectionAnswerType = {
  [key in HTTP_METHODS]?: selectionType[];
};
