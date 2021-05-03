import { getDMMF } from "@prisma/sdk";
import fs from "fs-extra";
import { controllerParams } from "./types";

const SCHEMA_PATH = "prisma/schema.prisma";
const TEMPLATES_PATH = "templates/fastify-typescript";
const ROUTES_FOLDER = "routes";
const OUT_DIR = "src";

interface moduleType {
  file: (args: any) => string;
}

interface routeModuleType extends moduleType {
  file: (args?: controllerParams) => string;
}

async function main() {
  fs.copySync(TEMPLATES_PATH, OUT_DIR, {
    overwrite: false,
    filter: (src) => !src.includes("{{modelName}}"),
  });
  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  const dmmf = await getDMMF({ datamodel: schema });

  // fs.writeFileSync("generated.json", JSON.stringify(dmmf.datamodel, null, 2));
  // console.log(
  //   ...new Set(
  //     dmmf.datamodel.models.flatMap((model) =>
  //       model.fields.map((field) => field.type)
  //     )
  //   )
  // );
  // return;

  const routeFiles = fs
    .readdirSync(`${TEMPLATES_PATH}/${ROUTES_FOLDER}`, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);

  const routeDirs = fs
    .readdirSync(`${TEMPLATES_PATH}/${ROUTES_FOLDER}`, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const routeDir of routeDirs) {
    const srcDirPath = `${TEMPLATES_PATH}/${ROUTES_FOLDER}/${routeDir}`;
    const outDirPath = `${OUT_DIR}/${ROUTES_FOLDER}/${routeDir}`;

    const dirFiles = fs
      .readdirSync(srcDirPath, { withFileTypes: true })
      .filter((dirent) => dirent.isFile())
      .map((dirent) => dirent.name);

    for (const dirFile of dirFiles) {
      const module: routeModuleType = await import(
        `${process.cwd()}/${srcDirPath}/${dirFile}`
      );

      for (const model of dmmf.datamodel.models) {
        const file = module.file({ model });
        fs.writeFileSync(
          `${outDirPath}/${dirFile.replace("{{modelName}}", model.name)}`,
          file
        );
      }
    }
  }

  for (const routeFile of routeFiles) {
    const module: routeModuleType = await import(
      `${process.cwd()}/${TEMPLATES_PATH}/${ROUTES_FOLDER}/${routeFile}`
    );

    for (const model of dmmf.datamodel.models) {
      const file = module.file({ model });
      fs.writeFileSync(
        `${OUT_DIR}/${ROUTES_FOLDER}/${routeFile.replace(
          "{{modelName}}",
          model.name
        )}`,
        file
      );
    }
  }
}

main();
