import { getDMMF } from "@prisma/sdk";
import fs from "fs-extra";
import {
  OUT_DIR,
  ROUTES_FOLDER,
  SCHEMA_PATH,
  TEMPLATES_PATH,
} from "./constants";
import {
  fileParams,
  HTTP_METHODS,
  ScalarField,
  selectionAnswerType,
  selectionType,
} from "./types";
import inquirer from "inquirer";
import { DMMF } from "@prisma/client/runtime";
import { isDefaultChecked, isDisabledScalarField } from "./utils";

inquirer.registerPrompt("search-list", require("inquirer-search-list"));
interface moduleType {
  default: (args: any) => string;
}

interface routeModuleType extends moduleType {
  default: (args: fileParams) => string;
}

async function getRelationAnwers(
  models: DMMF.Model[],
  relationsChain: string[],
  objectFields: DMMF.Field[]
) {
  const selections: selectionType[] = [];
  for (const relation of objectFields) {
    const model = models.find((model) => model.name === relation.name)!;
    const relationAnswers: {
      [relationName: string]: DMMF.Field[];
    } = await inquirer.prompt({
      name: relation.name,
      message: `Choose sub fields of ${relation.name} for ${relationsChain.join(
        "---"
      )}`,
      type: "checkbox",
      choices: model.fields.map((field) => ({
        name: `${field.name} (${field.type})`,
        checked: isDefaultChecked(field),
        disabled:
          (field.kind === "scalar" &&
            isDisabledScalarField(field as ScalarField)) ||
          relationsChain.includes(field.type),
        value: field,
      })),
    });

    const objectFields = relationAnswers[relation.name].filter(
      (field) => field.kind === "object"
    );

    const scalarOrEnumFields = relationAnswers[relation.name].filter(
      (field) => field.kind === "scalar" || field.kind === "enum"
    );

    const subAnswers = await getRelationAnwers(
      models,
      [...relationsChain, relation.name],
      objectFields
    );

    selections.push({
      ...relation,
      values: [...scalarOrEnumFields, ...subAnswers],
    });
  }

  return selections;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.copySync(TEMPLATES_PATH, OUT_DIR, {
      overwrite: false,
      filter: (src) => !src.includes("{{modelName}}"),
    });
  }
  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  const dmmf = await getDMMF({ datamodel: schema });
  const selection: selectionAnswerType = {};

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
    const methodAnswers: {
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
        value: field,
      })),
    });

    const objectFields = methodAnswers[method].filter(
      (field) => field.kind === "object"
    );

    const scalarOrEnumFields = methodAnswers[method].filter(
      (field) => field.kind === "scalar" || field.kind === "enum"
    );

    // this is needed to prevent circular relations
    // e.g. user -> post -> user
    const relationsChain = [model.name];
    const answers = await getRelationAnwers(
      dmmf.datamodel.models,
      relationsChain,
      objectFields
    );

    selection[method] = [...scalarOrEnumFields, ...answers];
  }

  // for services and types
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
      const path = `${outDirPath}/${dirFile.replace(
        "{{modelName}}",
        model.name
      )}`;
      let canWrite = true;
      if (fs.existsSync(path)) {
        const answer: { replace: boolean } = await inquirer.prompt({
          type: "confirm",
          message: `${path} already exists. Replace it?`,
          name: "replace",
          default: false,
        });

        canWrite = answer.replace;
      }

      if (canWrite) {
        const module: routeModuleType = await import(
          `${process.cwd()}/${srcDirPath}/${dirFile}`
        );

        const file = module.default({ model, selection });
        fs.writeFileSync(path, file);
      }
    }
  }

  // for route
  const routeFiles = fs
    .readdirSync(`${TEMPLATES_PATH}/${ROUTES_FOLDER}`, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);

  for (const routeFile of routeFiles) {
    const path = `${OUT_DIR}/${ROUTES_FOLDER}/${routeFile.replace(
      "{{modelName}}",
      model.name
    )}`;
    let canWrite = true;
    if (fs.existsSync(path)) {
      const answer: { replace: boolean } = await inquirer.prompt({
        type: "confirm",
        message: `${path} already exists. Replace it?`,
        name: "replace",
        default: false,
      });

      canWrite = answer.replace;
    }

    if (canWrite) {
      const module: routeModuleType = await import(
        `${process.cwd()}/${TEMPLATES_PATH}/${ROUTES_FOLDER}/${routeFile}`
      );

      const file = module.default({ model, selection });
      fs.writeFileSync(path, file);
    }
  }
}

main();
