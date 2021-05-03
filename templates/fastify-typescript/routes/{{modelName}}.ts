import { DMMF } from "@prisma/generator-helper";
import pluralize from "pluralize";
import changeCase from "change-case";
import { controllerParams, routeParams } from "../../../types";

function getRoute(params: routeParams) {
  const modelNamePlural = pluralize(params.modelName);
  return `
  fastify.get<{ Querystring: schemaOpts.GetQueryStatic }>("/", schemaOpts.GetOpts, async (req) => {
    const { ${modelNamePlural} } = await fastify.get${modelNamePlural}(req.query);
    return {
      ${modelNamePlural}
    };
  });`;
}

function getDetailsRoute(params: routeParams) {
  const NAME = params.modelName;
  const ID = params.idField!.name;
  return `
  fastify.get<{ Params: schemaOpts.GetDetailsParamsStatic }>("/:${ID}", schemaOpts.GetDetailsOpts, async (req) => {
    const { ${ID} } = req.params;
    const { ${NAME} } = await fastify.get${NAME}({ ${ID} });
    return {
      ${NAME}
    };
  });`;
}

function postRoute(params: routeParams) {
  const NAME = params.modelName;
  // TODO: ADD VALIDATIONS AND SERIALIZATIONS
  return `
  fastify.post("/", async (req) => {
    const data = req.body;
    const { ${NAME} } = await fastify.create${NAME}(data);
    return {
      ${NAME}
    };
  });`;
}

function putRoute(params: routeParams) {
  const NAME = params.modelName;
  const ID = params.idField!.name;
  // TODO: ADD VALIDATIONS AND SERIALIZATIONS
  return `
  fastify.put("/:${ID}", async (req) => {
    const { ${ID} } = req.params;
    const data = req.body;
    const { ${NAME} } = await fastify.update${NAME}(data, { ${ID} });
    return {
      ${NAME}
    };
  });`;
}

function deleteRoute(params: routeParams) {
  const NAME = params.modelName;
  const ID = params.idField!.name;
  // EXTRACT ID FIELD FROM MODEL AND USE IT TO FILTER UNIQUE
  return `
  fastify.delete("/:${ID}", async (req) => {
    const { ${ID} } = req.params;
    const { ${NAME} } = await fastify.delete${NAME}({ ${ID} });
    return {
      ${NAME}
    };
  });`;
}

export function file(params: controllerParams) {
  const NAME = params.model.name;
  const SERVICE_NAME = NAME + "Service";
  const CONTROLLER_NAME = NAME + "Controller";

  return `
import { FastifyPluginAsync } from "fastify";
import {${SERVICE_NAME}} from "./services/${NAME}.service"
import * as schemaOpts from "./types/${NAME}.types"

const ${CONTROLLER_NAME}: FastifyPluginAsync = async (fastify, _opts) => {

  fastify.register(${SERVICE_NAME})

  ${getRoute({ modelName: NAME })}
  ${getDetailsRoute({ modelName: NAME })}
  ${postRoute({ modelName: NAME })}
  ${putRoute({ modelName: NAME })}
  ${deleteRoute({ modelName: NAME })}
};

export const autoPrefix = "/${NAME}";
export default ${CONTROLLER_NAME}; 
`;
}
