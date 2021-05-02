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
    const { ${modelNamePlural} } = fastify.get${modelNamePlural}();
    return {
      ${modelNamePlural}
    };
  });`;
}

function getDetailsRoute() {}

function postRoute() {}

function putRoute() {}

function deleteRoute() {}

export function file(params: controllerParams) {
  const NAME = params.model.name;
  const SERVICE_NAME = NAME + "Service";
  const CONTROLLER_NAME = NAME + "Controller";
  const scalarFields = params.model.fields.filter(
    (field) => field.kind === "scalar"
  );

  return `
import { FastifyPluginAsync } from "fastify";
import {${SERVICE_NAME}} from "./services"

const ${CONTROLLER_NAME}: FastifyPluginAsync = async (fastify, _opts) => {

  fastify.register(${SERVICE_NAME})
  ${getRoute({ modelName: NAME })}

};

export const autoPrefix = "/${NAME}";
export default ${CONTROLLER_NAME}; 
  `;
}
