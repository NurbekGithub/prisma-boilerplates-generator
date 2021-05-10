import pluralize from "pluralize";
import {
  deleteParamsParams,
  getDetailsParamsParams,
  getQueryParams,
  HTTP_METHODS,
  OptsParams,
  putParamsParams,
  ScalarField,
  selectionType,
  templateConfig,
  typeParams,
} from "../../../../types";
import {
  getEnumFields,
  getIdField,
  getScalarFields,
  getTypeboxScalar,
  wrapArrayField,
  wrapArrayWithUnionField,
  wrapOptionalField,
} from "../../../../utils";

function getGetOpts({ model, selection }: OptsParams) {
  if (!selection) return "";
  const modelNamePlural = pluralize(model.name);
  const scalarFields = getScalarFields(model.fields);
  const enumFields = getEnumFields(model.fields);
  return `export const GetOpts = {
    schema: {
      query: ${getQuery({
        scalarFields,
        enumFields,
      })},
      response: {
        200: Type.Object({
          ${modelNamePlural}: Type.Array(
            ${getResponseObject(selection)}
          ),
          totalCount: Type.Integer()
        }),
      },
    },
  };
  
  export type GetQueryStatic = Static<typeof GetOpts.schema.query>;`;
}

function getQuery(params: getQueryParams) {
  return `Type.Object({
    limit: Type.Optional(Type.Number()),
    offset: Type.Optional(Type.Number()),
    ${params.scalarFields
      .map(
        (field) =>
          `${field.name}: Type.Optional(Type.${getTypeboxScalar(
            field.type
          )}()),`
      )
      .join("\n")}
    ${params.enumFields
      .map(
        (field) =>
          `${field.name}: Type.Optional(Type.Enum(PrismaClient.${field.type})),`
      )
      .join("\n")}})`;
}

function getBodyObject(selection: selectionType[]): string {
  const scalarFields = selection.filter(
    (field) => field.kind === "scalar"
  ) as ScalarField[];
  const enumFields = selection.filter((field) => field.kind === "enum");
  const objectFields = selection.filter((field) => field.kind === "object");
  return `Type.Object({
    ${scalarFields
      .map(
        (field) =>
          `${field.name}: ${wrapOptionalField(
            field.isRequired,
            wrapArrayField(
              field.isList,
              `Type.${getTypeboxScalar(field.type)}(),`
            )
          )}`
      )
      .join("\n")}
      ${enumFields
        .map(
          (field) =>
            `${field.name}: ${wrapOptionalField(
              field.isRequired,
              wrapArrayField(
                field.isList,
                `Type.Enum(PrismaClient.${field.type}),`
              )
            )}`
        )
        .join("\n")}
      ${objectFields
        .map(
          (field) =>
            `${field.name}: ${wrapOptionalField(
              field.isRequired,
              wrapArrayField(field.isList, `${getBodyObject(field.values)},`)
            )}`
        )
        .join("\n")}
  })`;
}

function getResponseObject(selection: selectionType[]): string {
  const scalarFields = selection.filter(
    (field) => field.kind === "scalar"
  ) as ScalarField[];
  const enumFields = selection.filter((field) => field.kind === "enum");
  const objectFields = selection.filter((field) => field.kind === "object");
  return `Type.Object({
    ${scalarFields
      .map(
        (field) =>
          `${field.name}: ${wrapOptionalField(
            field.isRequired,
            wrapArrayWithUnionField(
              field.isList,
              `Type.${getTypeboxScalar(field.type)}(),`
            )
          )}`
      )
      .join("\n")}
      ${enumFields
        .map(
          (field) =>
            `${field.name}: ${wrapOptionalField(
              field.isRequired,
              wrapArrayWithUnionField(
                field.isList,
                `Type.Enum(PrismaClient.${field.type}),`
              )
            )}`
        )
        .join("\n")}
      ${objectFields
        .map(
          (field) =>
            `${field.name}: ${wrapOptionalField(
              field.isRequired,
              wrapArrayWithUnionField(
                field.isList,
                `${getResponseObject(field.values)},`
              )
            )}`
        )
        .join("\n")}
  })`;
}

function getGetDetailsOpts({ model, selection }: OptsParams) {
  const NAME = model.name;
  const idField = getIdField(model.fields);
  if (!idField || !selection) return "";
  return `export const GetDetailsOpts = {
    schema: {
      params: ${getDetailsParams({ idField })},
      response: {
        200: Type.Object({
          ${NAME}: ${getResponseObject(selection)}
        }),
      },
    },
  };
  
  export type GetDetailsParamsStatic = Static<typeof GetDetailsOpts.schema.params>;`;
}

function getPostOpts({ model, selection }: OptsParams) {
  const NAME = model.name;
  if (!selection) return "";
  // TODO: use relationFromFields to exclude scalar fields from post body
  // that being used with its object version (user, user_id)
  return `export const PostOpts = {
    schema: {
      body: ${getBodyObject(selection)},
      response: {
        200: Type.Object({
          ${NAME}: ${getResponseObject(selection)}
        }),
      },
    },
  };
  
  export type PostBodyStatic = Static<typeof PostOpts.schema.body>;`;
}

function getPutOpts({ model, selection }: OptsParams) {
  const NAME = model.name;
  const idField = getIdField(model.fields);
  if (!idField || !selection) return "";
  // TODO: use relationFromFields to exclude scalar fields from post body
  // that being used with its object version (user, user_id)
  return `export const PutOpts = {
    schema: {
      body: ${getBodyObject(selection)},
      params: ${putParams({ idField })},
      response: {
        200: Type.Object({
          ${NAME}: ${getResponseObject(selection)}
        }),
      },
    },
  };
  
  export type PutBodyStatic = Static<typeof PutOpts.schema.body>;
  export type PutParamsStatic = Static<typeof PutOpts.schema.params>;`;
}

function getDeleteOpts({ model, selection }: OptsParams) {
  const NAME = model.name;
  const idField = getIdField(model.fields);
  if (!idField || !selection) return "";
  return `export const DeleteOpts = {
    schema: {
      params: ${deleteParams({ idField })},
      response: {
        200: Type.Object({
          ${NAME}: ${getResponseObject(selection)}
        }),
      },
    },
  };
  
  export type DeleteParamsStatic = Static<typeof DeleteOpts.schema.params>;`;
}

function getDetailsParams({ idField }: getDetailsParamsParams) {
  return `Type.Object({
    ${idField.name}: Type.${getTypeboxScalar(idField.type)}()
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
  return `import { Type, Static } from "@sinclair/typebox";
  import * as PrismaClient from "@prisma/client";

${getGetOpts({
  model: params.model,
  selection: params.selection[HTTP_METHODS.GET],
})}

${getGetDetailsOpts({
  model: params.model,
  selection: params.selection[HTTP_METHODS.GET_DETAILS],
})}

${getPostOpts({
  model: params.model,
  selection: params.selection[HTTP_METHODS.POST],
})}

${getPutOpts({
  model: params.model,
  selection: params.selection[HTTP_METHODS.PUT],
})}

${getDeleteOpts({
  model: params.model,
  selection: params.selection[HTTP_METHODS.DELETE],
})}
`;
}

export const config: templateConfig = {
  outPath: "",
};
