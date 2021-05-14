import { DMMF } from "@prisma/generator-helper";
import pluralize from "pluralize";
import { TOKENS_TO_IGNORE } from "./constants";
import { ScalarField, selectionType } from "./types";

export function isDefaultChecked(field: DMMF.Field) {
  if (TOKENS_TO_IGNORE.includes(field.name)) return false;

  if (field.kind === "object" || field.kind === "unsupported") return false;

  if (field.kind === "scalar" && isDisabledScalarField(field as ScalarField))
    return false;

  return true;
}

export function isDisabledScalarField(field: ScalarField) {
  return field.type === "Bytes";
}

export function getScalarFields(fields: DMMF.Field[]) {
  return fields.filter((field) => field.kind === "scalar") as ScalarField[];
}

export function getScalarFieldsWithoutId(fields: DMMF.Field[]) {
  return fields.filter(
    (field) => field.kind === "scalar" && !field.isId
  ) as ScalarField[];
}

export function getEnumFields(fields: DMMF.Field[]) {
  return fields.filter((field) => field.kind === "enum");
}

export function getObjectFields(fields: DMMF.Field[]) {
  return fields.filter((field) => field.kind === "object");
}

export function getIdField(fields: DMMF.Field[]) {
  return fields.find((field) => field.isId) as ScalarField | undefined;
}

export function hasObjectField(fields: selectionType[] | undefined) {
  return Boolean(
    fields && Object.values(fields).some((val) => val.kind === "object")
  );
}

export function getStringByMethod(
  method: selectionType[] | undefined,
  string: string
) {
  if (method) return string;
  return "";
}

export function distinctPluralize(word: string) {
  let pluralized = pluralize(word);

  if (word === pluralized) {
    pluralized += "es";
  }

  return pluralized;
}
