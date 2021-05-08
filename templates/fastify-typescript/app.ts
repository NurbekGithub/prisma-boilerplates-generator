import AutoLoad from "fastify-autoload";
import Sensible from "fastify-sensible";
import Env from "fastify-env";
import UnderPressure from "under-pressure";
import { join } from "path";
import { FastifyPluginAsync } from "fastify";
import { Static, Type } from "@sinclair/typebox";

const envProperties = Type.Strict(
  Type.Object({
    NODE_ENV: Type.String(),
  })
);
declare module "fastify" {
  interface FastifyInstance {
    config: Static<typeof envProperties>;
    DATABASE_URL: string;
  }
}

/**
 * This is the entry point of our application. As everything in Fastify is a plugin.
 * The main reason why the entry point is a plugin as well is that we can easily
 * import it in our testing suite and add this application as a subcomponent
 * of another Fastify application. The encapsulaton system, of Fastify will make sure
 * that you are not leaking dependencies and business logic.
 * For more info, see https://www.fastify.io/docs/latest/Encapsulation/
 */
const app: FastifyPluginAsync = async (fastify, opts) => {
  // It's very common to pass secrets and configuration
  // to you application via environment variables.
  // The `fastify-env` plugin will expose those configuration
  // under `fastify.config` and validate those at startup.
  fastify.register(Env, {
    dotenv: true,
    schema: envProperties,
  });

  // Fastify is an extremely lightweight framework, it does very little for you.
  // Every feature you might need, such as cookies or database coonnectors
  // is provided by external plugins.
  // See the list of recognized plugins  by the core team! https://www.fastify.io/ecosystem/
  // `fastify-sensible` adds many  small utilities, such as nice http errors.
  fastify.register(Sensible);

  // This plugin is especially useful if you expect an high load
  // on your application, it measures the process load and returns
  // a 503 if the process is undergoing too much stress.
  fastify.register(UnderPressure, {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 1000000000,
    maxRssBytes: 1000000000,
    maxEventLoopUtilization: 0.98,
  });

  // Normally you would need to load by hand each plugin. `fastify-autoload` is an utility
  // we wrote to solve this specific problems. It loads all the content from the specified
  // folder, even the subfolders. Take at look at its documentation, as it's doing a lot more!
  // First of all, we require all the plugins that we'll need in our application.
  fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: Object.assign({}, opts),
  });

  // Then, we'll load all of our routes.
  fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    dirNameRoutePrefix: false,
    options: Object.assign({}, opts),
  });
};

export default app;

// CREDITS: https://github.com/delvedor/fastify-example
