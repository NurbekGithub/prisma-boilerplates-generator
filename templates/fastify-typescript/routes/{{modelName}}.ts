import { DMMF } from "@prisma/generator-helper";
import pluralize from "pluralize";
import changeCase from "change-case";
import { controllerParams } from "../../../types";

type paramsType = {
  modelName: string;
};
function getRoute(params: paramsType) {
  const modelNamePlural = pluralize(params.modelName);
  return `
  fastify.get("/", async (req) => {
    const { ${modelNamePlural} } = await fastify.get${modelNamePlural}();
    return {
      ${modelNamePlural}
    };
  });`;
}

function getDetailsRoute(params: paramsType) {
  const NAME = params.modelName;
  // TODO: EXTRACT ID FIELD FROM MODEL AND USE IT TO FILTER UNIQUE
  return `
  fastify.get("/:TODO_ID", async (req) => {
    const { TODO_ID } = req.params;
    const { ${NAME} } = await fastify.get${NAME}({ TODO_ID });
    return {
      ${NAME}
    };
  });`;
}

function postRoute(params: paramsType) {
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

function putRoute(params: paramsType) {
  const NAME = params.modelName;
  // TODO: ADD VALIDATIONS AND SERIALIZATIONS
  return `
  fastify.put("/:TODO_ID", async (req) => {
    const { TODO_ID } = req.params;
    const data = req.body;
    const { ${NAME} } = await fastify.update${NAME}(data, { TODO_ID });
    return {
      ${NAME}
    };
  });`;
}

function deleteRoute(params: paramsType) {
  const NAME = params.modelName;
  // EXTRACT ID FIELD FROM MODEL AND USE IT TO FILTER UNIQUE
  return `
  fastify.delete("/:TODO_ID", async (req) => {
    const { TODO_ID } = req.params;
    const { ${NAME} } = await fastify.delete${NAME}({ TODO_ID });
    return {
      ${NAME}
    };
  });`;
}

export function file(params: controllerParams) {
  const NAME = params.model.name;
  const SERVICE_NAME = NAME + "Service";
  const CONTROLLER_NAME = NAME + "Controller";
  const scalarFields = params.model.fields.filter(
    (field) => field.kind === "scalar"
  );

  return `
import { FastifyPluginAsync } from "fastify";
import {${SERVICE_NAME}} from "./services/${SERVICE_NAME}"

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
