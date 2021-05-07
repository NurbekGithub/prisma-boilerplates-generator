import { getDMMF } from "@prisma/sdk";
import fs from "fs-extra";
import {
  OUT_DIR,
  ROUTES_FOLDER,
  SCHEMA_PATH,
  TEMPLATES_PATH,
} from "./constants";
import { controllerParams, HTTP_METHODS, ScalarField } from "./types";
import inquirer from "inquirer";
import { DMMF } from "@prisma/client/runtime";
import { isDefaultChecked, isDisabledScalarField } from "./utils";

inquirer.registerPrompt("search-list", require("inquirer-search-list"));
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

  const answers: {
    model: string;
    methods: HTTP_METHODS[];
  } = await inquirer.prompt([
    {
      name: "model",
      message: "choose model to use with generator",
      type: "search-list",
      choices: dmmf.datamodel.models.map((model) => model.name),
    },
    {
      name: "methods",
      type: "checkbox",
      choices: [
        HTTP_METHODS.GET,
        HTTP_METHODS.GET_CURSOR_PAGINATION,
        HTTP_METHODS.GET_OFFSET_PAGINATION,
        HTTP_METHODS.GET_DETAILS,
        HTTP_METHODS.POST,
        HTTP_METHODS.PUT,
        HTTP_METHODS.DELETE,
      ],
    },
  ]);

  const model = dmmf.datamodel.models.find(
    (model) => model.name === answers.model
  )!;

  for (const method of answers.methods) {
    // this is needed to prevent circular relations
    // e.g. user -> post -> user
    let relationsChain = [model.name];
    const answers: {
      [method in HTTP_METHODS]: DMMF.Field[];
    } = await inquirer.prompt({
      name: method,
      message: `Choose fields for ${method}`,
      type: "checkbox",
      choices: model.fields.map((field) => ({
        name: `${field.name} (${field.type})`,
        checked: isDefaultChecked(field),
        disabled:
          field.kind === "scalar" &&
          isDisabledScalarField(field as ScalarField),
        // value: field,
      })),
    });

    // for (const relation of answers[method].filter(field => field.kind === "object")) {
    //   relationsChain.push(relation.name);

    // }

    console.log(answers);
  }

  inquirer.prompt([]);

  console.log(answers);
  // return;

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
