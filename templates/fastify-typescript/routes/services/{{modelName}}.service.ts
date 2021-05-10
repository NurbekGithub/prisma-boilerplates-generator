import pluralize from "pluralize";
import {
  HTTP_METHODS,
  selectionType,
  ServiceParams,
  serviceParams,
  templateConfig,
} from "../../../../types";
import {
  getEnumFields,
  getIdField,
  getObjectFields,
  getScalarFields,
  getScalarFieldsWithoutId,
  getStringByMethod,
  hasObjectField,
} from "../../../../utils";

export function getPrismaSelection(fields: selectionType[]): string {
  const scalarOrEnumFields = [
    ...getScalarFields(fields),
    ...getEnumFields(fields),
  ];
  const objectFields = getObjectFields(fields) as selectionType[];
  return `select: {
    ${scalarOrEnumFields.map((field) => `${field.name}: true,`).join("\n")}
    ${objectFields.map(
      (field) => `${field.name}: {${getPrismaSelection(field.values)}}`
    )}
  }`;
}

export function getCreateData(
  fields: selectionType[],
  isFirstLevel: boolean,
  relationsChain: string[] = [],
  isList: boolean = false
): string {
  const scalarOrEnumFields = [
    ...getScalarFieldsWithoutId(fields),
    ...getEnumFields(fields),
  ];
  const objectFields = getObjectFields(fields) as selectionType[];

  if (isFirstLevel) {
    return `data: {
      ${scalarOrEnumFields
        .map((field) => `${field.name}: data.${field.name},`)
        .join("\n")}
      ${objectFields
        .map(
          (field) =>
            `${field.name}: {${getCreateData(
              field.values,
              false,
              [field.name],
              field.isList
            )}}`
        )
        .join(",\n")}
    }`;
  }

  // prisma does not support nested create many yet
  // so this will be last stop and should not contain
  // nested relations further down
  if (isList) {
    return `createMany: {
      data: data.${relationsChain.join(".")}
    },`;
  }

  // if sub relation data has idField
  // try to find it and connect instead of just create
  const idField = getIdField(fields);
  if (idField) {
    return `connectOrCreate: {
      where: {${idField.name}: data.${relationsChain.join(".")}.${idField.name}}
      ${getCreateData(
        fields.filter((field) => !field.isId),
        false,
        relationsChain
      )}
    }`;
  }
  // just create
  return `create: {
    ${scalarOrEnumFields
      .map(
        (field) =>
          `${field.name}: data.${relationsChain.join(".")}.${field.name},`
      )
      .join("\n")}
    ${objectFields
      .map(
        (field) =>
          `${field.name}: {${getCreateData(
            field.values,
            false,
            [...relationsChain, field.name],
            field.isList
          )}}`
      )
      .join(",\n")}
  }`;
}

export function getUpdateData(
  fields: selectionType[],
  isFirstLevel: boolean,
  relationsChain: string[] = [],
  isList: boolean = false
): string {
  const scalarOrEnumFields = [
    ...getScalarFieldsWithoutId(fields),
    ...getEnumFields(fields),
  ];
  const objectFields = getObjectFields(fields) as selectionType[];

  if (isFirstLevel) {
    return `data: {
      ${scalarOrEnumFields
        .map((field) => `${field.name}: data.${field.name},`)
        .join("\n")}
      ${objectFields
        .map(
          (field) =>
            `${field.name}: {${getUpdateData(
              field.values,
              false,
              [field.name],
              field.isList
            )}}`
        )
        .join(",\n")}
    }`;
  }

  // prisma does not support nested update many yet
  // so this will be last stop and should not contain
  // nested relations further down
  if (isList) {
    return `updateMany: {
      data: data.${relationsChain.join(".")}
    },`;
  }

  const idField = getIdField(fields);
  if (idField) {
    return `upsert: {
      where: {${idField.name}: data.${relationsChain.join(".")}.${idField.name}}
      ${getCreateData(
        fields.filter((field) => !field.isId),
        false,
        relationsChain
      )}
      ${getUpdateData(
        fields.filter((field) => !field.isId),
        false,
        relationsChain
      )}
    }`;
  }
  return `update: {
      ${scalarOrEnumFields
        .map(
          (field) =>
            `${field.name}: data.${relationsChain.join(".")}.${field.name},`
        )
        .join("\n")}
      ${objectFields
        .map(
          (field) =>
            `${field.name}: {${getUpdateData(
              field.values,
              false,
              [...relationsChain, field.name],
              field.isList
            )}}`
        )
        .join(",\n")}
    }`;
}

// TODO: come up with better naming for types (ServiceParams, serviceParams)
function getGetService({ model, selection }: ServiceParams) {
  if (!selection) return "";
  const NAME = model.name;
  let modelNamePlural = pluralize(NAME);

  //TODO: make NAME, PLURAL_NAME global
  // TODO: add ordering
  if (modelNamePlural === NAME) {
    modelNamePlural += "es";
  }
  return `async function get${modelNamePlural}(where: Prisma.${NAME}WhereInput, limit?: number, offset?: number) {
    const ${modelNamePlural} = await db.${NAME}.findMany({
      where,
      skip: offset,
      take: limit,
      ${getPrismaSelection(selection)}
    });
    const totalCount = await db.${NAME}.count({ where })
    return { ${modelNamePlural}, totalCount }
  }`;
}

function getGetDetailsService({ model, selection }: ServiceParams) {
  if (!selection) return "";
  const NAME = model.name;

  return `async function get${NAME}(where: Prisma.${NAME}WhereUniqueInput) {
    const ${NAME} = await db.${NAME}.findUnique({ where, ${getPrismaSelection(
    selection
  )} });
    return { ${NAME} }
  }`;
}

function getPostService({
  model,
  selection,
  postDataType,
}: ServiceParams & { postDataType: string }) {
  if (!selection) return "";
  const NAME = model.name;

  return `async function create${NAME}(data: ${postDataType}) {
    const ${NAME} = await db.${NAME}.create({
      ${getCreateData(selection, true)},
      ${getPrismaSelection(selection)},
    });
    return { ${NAME} }
  }`;
}

function getPutService({
  model,
  selection,
  putDataType,
}: ServiceParams & { putDataType: string }) {
  if (!selection) return "";
  const NAME = model.name;

  return `async function update${NAME}(data: ${putDataType}, where: Prisma.${NAME}WhereUniqueInput) {
    const ${NAME} = await db.${NAME}.update({
      where,
      ${getUpdateData(selection, true)},
      ${getPrismaSelection(selection)},
    });
    return { ${NAME} }
  }`;
}

function getDeleteService({ model, selection }: ServiceParams) {
  if (!selection) return "";
  const NAME = model.name;

  return `async function delete${NAME}(where: Prisma.${NAME}WhereUniqueInput) {
    const ${NAME} = await db.${NAME}.delete({ where });
    return { ${NAME} }
  }`;
}

export default function file(params: serviceParams) {
  const NAME = params.model.name;
  const SERVICE_NAME = NAME + "Service";
  let modelNamePlural = pluralize(NAME);

  if (modelNamePlural === NAME) {
    modelNamePlural += "es";
  }
  // if no nested params selected for POST and PUT methods
  // we will use uncheck version of prisma data type
  let postDataType = `Prisma.${NAME}UncheckedCreateInput`;
  if (hasObjectField(params.selection[HTTP_METHODS.POST])) {
    postDataType = "schemaOpts.PostBodyStatic";
  }
  let putDataType = `Prisma.${NAME}UncheckedUpdateInput`;
  if (hasObjectField(params.selection[HTTP_METHODS.PUT])) {
    putDataType = "schemaOpts.PutBodyStatic";
  }

  return `import fp from 'fastify-plugin'
import { Prisma, ${NAME} } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import * as schemaOpts from "../types/${NAME}.types"
import { db } from "../../db";

declare module "fastify" {
  interface FastifyInstance {
    ${getStringByMethod(
      params.selection[HTTP_METHODS.GET],
      `get${modelNamePlural}: (
        where: Prisma.${NAME}WhereInput,
        limit?: number,
        offset?: number
      ) => Promise<{${modelNamePlural}: ${NAME}[], totalCount: number}>;`
    )}
    ${getStringByMethod(
      params.selection[HTTP_METHODS.GET_DETAILS],
      `get${NAME}: (where: Prisma.${NAME}WhereUniqueInput) => Promise<{${NAME}: ${NAME}}>;`
    )}
    ${getStringByMethod(
      params.selection[HTTP_METHODS.POST],
      `create${NAME}: (data: ${postDataType}) => Promise<{${NAME}: ${NAME}}>;`
    )}
    ${getStringByMethod(
      params.selection[HTTP_METHODS.PUT],
      `update${NAME}: (
        data: ${putDataType},
        where: Prisma.${NAME}WhereUniqueInput
      ) => Promise<{${NAME}: ${NAME}}>;`
    )}
    ${getStringByMethod(
      params.selection[HTTP_METHODS.DELETE],
      `delete${NAME}: (where: Prisma.${NAME}WhereUniqueInput) => Promise<{${NAME}: ${NAME}}>;`
    )}
  }
}

export const ${SERVICE_NAME}: FastifyPluginAsync = fp(async (fastify, _opts) => {

  ${getGetService({
    model: params.model,
    selection: params.selection[HTTP_METHODS.GET],
  })}
  ${getGetDetailsService({
    model: params.model,
    selection: params.selection[HTTP_METHODS.GET_DETAILS],
  })}
  ${getPostService({
    model: params.model,
    selection: params.selection[HTTP_METHODS.POST],
    postDataType,
  })}
  ${getPutService({
    model: params.model,
    selection: params.selection[HTTP_METHODS.PUT],
    putDataType,
  })}
  ${getDeleteService({
    model: params.model,
    selection: params.selection[HTTP_METHODS.DELETE],
  })}

  ${getStringByMethod(
    params.selection[HTTP_METHODS.GET],
    `fastify.decorate("get${modelNamePlural}", get${modelNamePlural})`
  )}
  ${getStringByMethod(
    params.selection[HTTP_METHODS.GET_DETAILS],
    `fastify.decorate("get${NAME}", get${NAME})`
  )}
  ${getStringByMethod(
    params.selection[HTTP_METHODS.POST],
    `fastify.decorate("create${NAME}", create${NAME})`
  )}
  ${getStringByMethod(
    params.selection[HTTP_METHODS.PUT],
    `fastify.decorate("update${NAME}", update${NAME})`
  )}
  ${getStringByMethod(
    params.selection[HTTP_METHODS.DELETE],
    `fastify.decorate("delete${NAME}", delete${NAME})`
  )}
})
`;
}

export const config: templateConfig = {
  outPath: "",
};
