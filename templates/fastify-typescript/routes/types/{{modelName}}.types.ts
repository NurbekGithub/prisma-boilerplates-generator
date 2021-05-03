import pluralize from "pluralize";
import {
  getDetailsParamsParams,
  getQueryParams,
  getResponseParams,
  ScalarField,
  typeParams,
} from "../../../../types";
import { getTypeboxModifier, getTypeboxScalar } from "../../../../utils";

function getResponse(params: getResponseParams) {
  return `Type.Object({
    ${params.scalarFields
      .map(
        (field) =>
          `${field.name}: Type.${getTypeboxModifier(
            field.isRequired
          )}(Type.${getTypeboxScalar(field.type)}())`
      )
      .join(",\n")},
    ${params.enumFields
      .map(
        (field) =>
          `${field.name}: Type.${getTypeboxModifier(
            field.isRequired
          )}(Type.Enum(${field.type}))`
      )
      .join(",\n")}
  })`;
}

function getQuery(params: getQueryParams) {
  return `Type.Object({
    limit: Type.Optional(Type.Number()),
    offset: Type.Optional(Type.Number()),
    ${params.scalarFields
      .map(
        (field) =>
          `${field.name}: Type.Optional(Type.${getTypeboxScalar(field.type)}())`
      )
      .join(",\n")},
    ${params.enumFields
      .map((field) => `${field.name}: Type.Optional(Type.Enum(${field.type}))`)
      .join(",\n")}})`;
}

function getDetailsParams(params: getDetailsParamsParams) {
  const idField = params.idField!;
  return `Type.Object({
    ${idField.name}: Type.${getTypeboxScalar(idField.type)}
  })`;
}

export function file(params: typeParams) {
  const NAME = params.model.name;
  const modelNamePlural = pluralize(NAME);
  const scalarFields = params.model.fields.filter(
    (field) => field.kind === "scalar"
  ) as ScalarField[];
  const enumFields = params.model.fields.filter(
    (field) => field.kind === "enum"
  );
  const idField = params.model.fields.find((field) => field.isId) as
    | ScalarField
    | undefined;
  return `
import { Type, Static } from "@sinclair/typebox";

export const GetOpts = {
  schema: {
    query: ${getQuery({ scalarFields, enumFields })},
    response: {
      200: Type.Object({
        ${modelNamePlural}: Type.Array(
          ${getResponse({ enumFields, scalarFields })}
        )
      }),
    },
  },
};

export type GetQueryStatic = Static<typeof GetOpts.schema.query>;

export const GetDetailsOpts = {
  schema: {
    params: ${getDetailsParams({ idField })},
    response: {
      200: Type.Object({
        ${NAME}: ${getResponse({ enumFields, scalarFields })}
      }),
    },
  },
};

export type GetDetailsParamsStatic = Static<typeof GetOpts.schema.params>;
`;
}
