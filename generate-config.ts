import fs from "fs-extra";
import { getDMMF } from "@prisma/sdk";
import { SCHEMA_PATH, TOKENS_TO_IGNORE } from "./constants";

async function main() {
  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  const dmmf = await getDMMF({ datamodel: schema });

  const modelTypesForSelection = dmmf.datamodel.models
    .map((model) => {
      const scalarAndEnumFields = model.fields.filter(
        (field) => field.kind === "enum" || field.kind === "scalar"
      );
      const objectFields = model.fields.filter(
        (field) => field.kind === "object"
      );

      return `
  type ${model.name}Selection = {
    ${scalarAndEnumFields.map((field) => `${field.name}?: boolean;`).join("\n")}
    ${objectFields
      .map((field) => `${field.name}: ${field.type}Selection | null;`)
      .join("\n")}
  } | null`;
    })
    .join("\n");

  const selections = dmmf.datamodel.models
    .map((model) => {
      const scalarAndEnumFields = model.fields.filter(
        (field) => field.kind === "enum" || field.kind === "scalar"
      );
      const objectFields = model.fields.filter(
        (field) => field.kind === "object"
      );
      const selection = `{
      ${scalarAndEnumFields
        .map(
          (field) => `${field.name}: ${!TOKENS_TO_IGNORE.includes(field.name)},`
        )
        .join("\n")}
      ${objectFields.map((field) => `${field.name}: null`).join(",\n")}
    }`;
      return `
    ${model.name}: {
      get: {
        selection: ${selection} as ${model.name}Selection,
        withOffsetPagination: true,
        withCursorPagination: false,
      },
      getDetails: {
        selection: ${selection}
      },
      post: {
        selection: ${selection}
      },
      put: {
        selection: ${selection}
      }
    }`;
    })
    .join(",\n");
  const file = `
    export const selections = {${selections}}

    ${modelTypesForSelection}
    `;
  fs.writeFileSync("pbg.config.ts", file);
}
main().catch(console.error);
