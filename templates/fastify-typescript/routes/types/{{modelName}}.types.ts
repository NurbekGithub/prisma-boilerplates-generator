import pluralize from "pluralize";
import {
  deleteParamsParams,
  getDetailsParamsParams,
  getQueryParams,
  getResponseParams,
  postBodyParams,
  putBodyParams,
  putParamsParams,
  ScalarField,
  templateConfig,
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
    ${idField.name}: Type.${getTypeboxScalar(idField.type)}()
  })`;
}

function postBody(params: postBodyParams) {
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

function putBody(params: putBodyParams) {
  return `Type.Object({
    ${params.scalarFields
      .map(
        (field) =>
          `${field.name}: Type.Optional(Type.${getTypeboxScalar(field.type)}())`
      )
      .join(",\n")},
    ${params.enumFields
      .map((field) => `${field.name}: Type.Optional(Type.Enum(${field.type}))`)
      .join(",\n")}
  })`;
}

function putParams(params: putParamsParams) {
  const idField = params.idField!;
  return `Type.Object({
    ${idField.name}: Type.${getTypeboxScalar(idField.type)}()
  })`;
}

function deleteParams(params: deleteParamsParams) {
  const idField = params.idField!;
  return `Type.Object({
    ${idField.name}: Type.${getTypeboxScalar(idField.type)}()
  })`;
}

export default function file(params: typeParams) {
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
  return `import { Type, Static } from "@sinclair/typebox";
${
  enumFields.length > 0
    ? `import { ${enumFields
        .map((field) => field.type)
        .join(", ")} } from "@prisma/client";`
    : ""
}

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

export type GetDetailsParamsStatic = Static<typeof GetDetailsOpts.schema.params>;

export const PostOpts = {
  schema: {
    body: ${postBody({ enumFields, scalarFields })},
    response: {
      200: Type.Object({
        ${NAME}: ${getResponse({ enumFields, scalarFields })}
      }),
    },
  },
};

export type PostBodyStatic = Static<typeof PostOpts.schema.body>;

export const PutOpts = {
  schema: {
    body: ${putBody({ enumFields, scalarFields })},
    params: ${putParams({ idField })},
    response: {
      200: Type.Object({
        ${NAME}: ${getResponse({ enumFields, scalarFields })}
      }),
    },
  },
};

export type PutBodyStatic = Static<typeof PutOpts.schema.body>;
export type PutParamsStatic = Static<typeof PutOpts.schema.params>;

export const DeleteOpts = {
  schema: {
    params: ${deleteParams({ idField })},
    response: {
      200: Type.Object({
        ${NAME}: ${getResponse({ enumFields, scalarFields })}
      }),
    },
  },
};

export type DeleteParamsStatic = Static<typeof DeleteOpts.schema.params>;
`;
}

export const config: templateConfig = {
  outPath: "",
};
