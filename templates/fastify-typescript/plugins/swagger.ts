import { readFileSync } from "fs";
import { join } from "path";
import fp from "fastify-plugin";
import Swagger from "fastify-swagger";
import { FastifyPluginAsync } from "fastify";

const { version } = JSON.parse(
  readFileSync(join(__dirname, "../../package.json")).toString()
);

const swaggerGenerator: FastifyPluginAsync = async (fastify, opts) => {
  fastify.register(Swagger, {
    routePrefix: "/documentation",
    swagger: {
      info: {
        title: "pbg",
        description: "prisma-boilerplate-generator generated document",
        version,
      },
      host: "localhost", // and your deployed url
      schemes: ["http", "https"],
      consumes: ["application/json"],
      produces: ["application/json", "text/html"],
      securityDefinitions: {
        Bearer: {
          type: "apiKey",
          name: "Bearer",
          in: "header",
        },
      },
    },
    // let's expose the documentation only in development
    // it's up to you decide who should see this page,
    // but it's always better to start safe.
    exposeRoute: fastify.config.NODE_ENV !== "production",
  });
};

export default fp(swaggerGenerator, {
  name: "swaggerGenerator",
});
