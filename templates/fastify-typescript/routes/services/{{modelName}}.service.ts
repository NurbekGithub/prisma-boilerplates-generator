import { DMMF } from "@prisma/generator-helper";
import pluralize from "pluralize";

type serviceParams = {
  model: DMMF.Model;
};

export function file(params: serviceParams) {
  const NAME = params.model.name;
  const SERVICE_NAME = NAME + "Service";
  const modelNamePlural = pluralize(NAME);
  return `
import { Prisma, ${NAME} } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { db } from "../../db";

declare module "fastify" {
  interface FastifyInstance {
    get${modelNamePlural}: (where: Prisma.${NAME}WhereInput) => Promise<{${modelNamePlural}: ${NAME}[]}>;
    get${NAME}: (where: Prisma.${NAME}WhereUniqueInput) => Promise<{${NAME}: ${NAME}}>;
    create${NAME}: (data: Prisma.${NAME}CreateInput) => Promise<{${NAME}: ${NAME}}>;
    update${NAME}: (
      data: Prisma.${NAME}UpdateInput,
      where: Prisma.${NAME}WhereUniqueInput
    ) => Promise<{${NAME}: ${NAME}}>;
    delete${NAME}: (where: Prisma.${NAME}WhereUniqueInput) => Promise<{${NAME}: ${NAME}}>;
  }
}

export const ${SERVICE_NAME}: FastifyPluginAsync = async (fastify, _opts) => {
  async function get${modelNamePlural}(where: Prisma.${NAME}WhereInput) {
    const ${modelNamePlural} = await db.${NAME}.findMany({where});
    return { ${modelNamePlural} }
  }

  async function get${NAME}(where: Prisma.${NAME}WhereUniqueInput) {
    const ${NAME} = await db.${NAME}.findUnique({ where });
    return { ${NAME} }
  }

  async function create${NAME}(data: Prisma.${NAME}CreateInput) {
    const ${NAME} = await db.${NAME}.create({ data });
    return { ${NAME} }
  }

  async function update${NAME}(data: Prisma.${NAME}UpdateInput, where: Prisma.${NAME}WhereUniqueInput) {
    const ${NAME} = await db.${NAME}.update({ data, where });
    return { ${NAME} }
  }

  async function delete${NAME}(where: Prisma.${NAME}WhereUniqueInput) {
    const ${NAME} = await db.${NAME}.delete({ where });
    return { ${NAME} }
  }

  fastify.decorate("get${modelNamePlural}", get${modelNamePlural})
  fastify.decorate("get${NAME}", get${NAME})
  fastify.decorate("create${NAME}", create${NAME})
  fastify.decorate("update${NAME}", update${NAME})
  fastify.decorate("delete${NAME}", delete${NAME})
}
`;
}
