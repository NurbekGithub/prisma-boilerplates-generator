import { DMMF } from "@prisma/generator-helper";
import pluralize from "pluralize";
import changeCase from "change-case";
import {
  controllerParams,
  HTTP_METHODS,
  routeParams,
  ScalarField,
  templateConfig,
} from "../../../types";

function getRoute(params: routeParams) {
  const modelNamePlural = pluralize(params.modelName);
  return `fastify.get<{ Querystring: schemaOpts.GetQueryStatic }>("/", schemaOpts.GetOpts, async (req) => {
    const { ${modelNamePlural} } = await fastify.get${modelNamePlural}(req.query);
    return {
      ${modelNamePlural}
    };
  });`;
}

function getDetailsRoute(params: routeParams) {
  const NAME = params.modelName;
  const ID = params.idField!.name;
  return `fastify.get<{ Params: schemaOpts.GetDetailsParamsStatic }>("/:${ID}", schemaOpts.GetDetailsOpts, async (req) => {
    const { ${ID} } = req.params;
    const { ${NAME} } = await fastify.get${NAME}({ ${ID} });
    return {
      ${NAME}
    };
  });`;
}

function postRoute(params: routeParams) {
  const NAME = params.modelName;
  return `fastify.post<{ Body: schemaOpts.PostBodyStatic }>("/", schemaOpts.PostOpts, async (req) => {
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
  return `fastify.put<{ Body: schemaOpts.PutBodyStatic, Params: schemaOpts.PutParamsStatic }>("/:${ID}", schemaOpts.PutOpts, async (req) => {
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
  return `fastify.delete<{ Params: schemaOpts.DeleteParamsStatic }>("/:${ID}", schemaOpts.DeleteOpts, async (req) => {
    const { ${ID} } = req.params;
    const { ${NAME} } = await fastify.delete${NAME}({ ${ID} });
    return {
      ${NAME}
    };
  });`;
}

export default function file(params: controllerParams) {
  const NAME = params.model.name;
  const SERVICE_NAME = NAME + "Service";
  const CONTROLLER_NAME = NAME + "Controller";

  const idField = params.model.fields.find((field) => field.isId) as
    | ScalarField
    | undefined;

  return `import { FastifyPluginAsync } from "fastify";
import {${SERVICE_NAME}} from "./services/${NAME}.service"
import * as schemaOpts from "./types/${NAME}.types"

const ${CONTROLLER_NAME}: FastifyPluginAsync = async (fastify, _opts) => {

  await fastify.register(${SERVICE_NAME})

  // GET
  ${params.selection.GET ? getRoute({ modelName: NAME }) : "//Not selected"}
  // GET/:id
  ${
    params.selection[HTTP_METHODS.GET_DETAILS]
      ? getDetailsRoute({ modelName: NAME, idField })
      : "//Not selected"
  }
  // POST
  ${
    params.selection[HTTP_METHODS.POST]
      ? postRoute({ modelName: NAME })
      : "//Not selected"
  }
  // PUT
  ${
    params.selection[HTTP_METHODS.PUT]
      ? putRoute({ modelName: NAME, idField })
      : "//Not selected"
  }
  // DELETE
  ${
    params.selection[HTTP_METHODS.DELETE]
      ? deleteRoute({ modelName: NAME, idField })
      : "//Not selected"
  }
};

export const autoPrefix = "/${NAME}";
export default ${CONTROLLER_NAME}; 
`;
}

export const config: templateConfig = {
  outPath: "",
};
