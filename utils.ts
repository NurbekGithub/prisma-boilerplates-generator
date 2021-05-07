import { DMMF } from "@prisma/generator-helper";
import { TOKENS_TO_IGNORE } from "./constants";
import { PrismaPrimitive, ScalarField } from "./types";

export function getTypeboxScalar(fieldType: PrismaPrimitive): string {
  switch (fieldType) {
    case "DateTime":
    case "String":
      return "String";
    case "BigInt":
    case "Int":
      return "Integer";
    case "Float":
      return "Number";
    case "Json":
      return "Unkown";
    case "Boolean":
      return "Boolean";
    case "Bytes":
      return "Unknown";
    default:
      console.error(`Not recognized prisma primitive ${fieldType}`);
      return "Unknown";
  }
}

export function getTypeboxModifier(isRequired: boolean) {
  return isRequired ? "Readonly" : "Optional";
}

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
