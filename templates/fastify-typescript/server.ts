// Read the .env file.
import * as dotenv from "dotenv";
dotenv.config();

// Require the framework
import Fastify from "fastify";

// Require library to exit fastify process, gracefully (if possible)
import closeWithGrace from "close-with-grace";

// Instantiate Fastify with some config
const app = Fastify({
  logger: true,
});

// Register your application as a normal plugin.
app.register(import("./app"));

// delay is the number of milliseconds for the graceful close to finish
const closeListeners = closeWithGrace(
  { delay: 500 },
  async function ({ signal, err, manual }: any) {
    if (err) {
      app.log.error(err);
    }
    await app.close();
  }
);

app.addHook("onClose", async (instance, done) => {
  closeListeners.uninstall();
  done();
});

// Start listening.
app.listen(process.env.PORT || 3000, (err: any) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});

// ejected fastify-cli
// ideally you should not touch this file
// this was ejected because I always had some trouble with fastify-cli
