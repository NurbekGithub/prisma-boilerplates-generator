import { camelCase as cC } from "change-case";
import {
  deleteParamsParams,
  getDetailsParamsParams,
  getQueryParams,
  HTTP_METHODS,
  OptsParams,
  PrismaPrimitive,
  putParamsParams,
  ScalarField,
  selectionType,
  templateConfig,
  typeParams,
} from "../../../../types";
import {
  distinctPluralize,
  getEnumFields,
  getIdField,
  getScalarFields,
} from "../../../../utils";

function getTypeboxScalar(fieldType: PrismaPrimitive): string {
  switch (fieldType) {
    case "DateTime":
    case "String":
      return "String";
    case "BigInt":
    case "Int":
      return "Integer";
    case "Float":
      return "Number";
    case "Json":
      return "Unkown";
    case "Boolean":
      return "Boolean";
    case "Bytes":
      return "Unknown";
    default:
      console.error(`Not recognized prisma primitive ${fieldType}`);
      return "Unknown";
  }
}

function wrapOptionalField(isRequired: boolean, children: string) {
  return !isRequired ? `Type.Optional(${children}),` : children;
}

function wrapArrayField(isList: boolean, children: string) {
  return isList ? `Type.Array(${children}),` : children;
}

function getGetOpts({ model, selection }: OptsParams) {
  if (!selection) return "";
  const camelCase = cC(model.name);
  const pluralizedCamelCase = distinctPluralize(camelCase);
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
          ${pluralizedCamelCase}: Type.Array(
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

function getResponseObject(
  selection: selectionType[],
  isNullable = false
): string {
  const scalarFields = selection.filter(
    (field) => field.kind === "scalar"
  ) as ScalarField[];
  const enumFields = selection.filter((field) => field.kind === "enum");
  const objectFields = selection.filter((field) => field.kind === "object");
  return `Type.Object({
    ${scalarFields
      .map(
        (field) =>
          `${field.name}: ${wrapArrayField(
            field.isList,
            `Type.${getTypeboxScalar(
              field.type
            )}({nullable: ${!field.isRequired}}),`
          )}`
      )
      .join("\n")}
      ${enumFields
        .map(
          (field) =>
            `${field.name}: ${wrapArrayField(
              field.isList,
              `Type.Enum(PrismaClient.${
                field.type
              }, {nullable: ${!field.isRequired}}),`
            )}`
        )
        .join("\n")}
      ${objectFields
        .map(
          (field) =>
            `${field.name}: ${wrapOptionalField(
              field.isRequired,
              wrapArrayField(
                field.isList,
                `${getResponseObject(field.values, !field.isRequired)},`
              )
            )}`
        )
        .join("\n")}
  }, {nullable: ${isNullable}})`;
}

function getGetDetailsOpts({ model, selection }: OptsParams) {
  const idField = getIdField(model.fields);
  if (!idField || !selection) return "";
  const camelCase = cC(model.name);
  return `export const GetDetailsOpts = {
    schema: {
      params: ${getDetailsParams({ idField })},
      response: {
        200: Type.Object({
          ${camelCase}: ${getResponseObject(selection)}
        }),
      },
    },
  };
  
  export type GetDetailsParamsStatic = Static<typeof GetDetailsOpts.schema.params>;`;
}

function getPostOpts({ model, selection }: OptsParams) {
  if (!selection) return "";
  const camelCase = cC(model.name);
  // TODO: use relationFromFields to exclude scalar fields from post body
  // that being used with its object version (user, user_id)
  return `export const PostOpts = {
    schema: {
      body: ${getBodyObject(selection)},
      response: {
        200: Type.Object({
          ${camelCase}: ${getResponseObject(selection)}
        }),
      },
    },
  };
  
  export type PostBodyStatic = Static<typeof PostOpts.schema.body>;`;
}

function getPutOpts({ model, selection }: OptsParams) {
  const idField = getIdField(model.fields);
  if (!idField || !selection) return "";
  const camelCase = cC(model.name);
  // TODO: use relationFromFields to exclude scalar fields from post body
  // that being used with its object version (user, user_id)
  return `export const PutOpts = {
    schema: {
      body: ${getBodyObject(selection)},
      params: ${putParams({ idField })},
      response: {
        200: Type.Object({
          ${camelCase}: ${getResponseObject(selection)}
        }),
      },
    },
  };
  
  export type PutBodyStatic = Static<typeof PutOpts.schema.body>;
  export type PutParamsStatic = Static<typeof PutOpts.schema.params>;`;
}

function getDeleteOpts({ model, selection }: OptsParams) {
  const idField = getIdField(model.fields);
  if (!idField || !selection) return "";
  const camelCase = cC(model.name);
  return `export const DeleteOpts = {
    schema: {
      params: ${deleteParams({ idField })},
      response: {
        200: Type.Object({
          ${camelCase}: ${getResponseObject(selection)}
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
