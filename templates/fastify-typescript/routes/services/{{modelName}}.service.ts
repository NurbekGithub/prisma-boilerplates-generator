import pluralize from "pluralize";
import { serviceParams, templateConfig } from "../../../../types";

export default function file(params: serviceParams) {
  const NAME = params.model.name;
  const SERVICE_NAME = NAME + "Service";
  const modelNamePlural = pluralize(NAME);
  // if no nested params selected for POST and PUT methods
  // we will use uncheck version of prisma data type
  const POST_UNCHECKED_PREFIX =
    params.selection.POST &&
    Object.values(params.selection.POST).every(
      (val) => typeof val === "boolean"
    )
      ? "Unchecked"
      : "";
  const PUT_UNCHECKED_PREFIX =
    params.selection.PUT &&
    Object.values(params.selection.PUT).every((val) => typeof val === "boolean")
      ? "Unchecked"
      : "";
  return `import { Prisma, ${NAME} } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { db } from "../../db";

declare module "fastify" {
  interface FastifyInstance {
    get${modelNamePlural}: (where: Prisma.${NAME}WhereInput) => Promise<{${modelNamePlural}: ${NAME}[]}>;
    get${NAME}: (where: Prisma.${NAME}WhereUniqueInput) => Promise<{${NAME}: ${NAME}}>;
    create${NAME}: (data: Prisma.${NAME}${POST_UNCHECKED_PREFIX}CreateInput) => Promise<{${NAME}: ${NAME}}>;
    update${NAME}: (
      data: Prisma.${NAME}${PUT_UNCHECKED_PREFIX}UpdateInput,
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

  async function create${NAME}(data: Prisma.${NAME}${POST_UNCHECKED_PREFIX}CreateInput) {
    const ${NAME} = await db.${NAME}.create({ data });
    return { ${NAME} }
  }

  async function update${NAME}(data: Prisma.${NAME}${PUT_UNCHECKED_PREFIX}UpdateInput, where: Prisma.${NAME}WhereUniqueInput) {
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

export const config: templateConfig = {
  outPath: "",
};
