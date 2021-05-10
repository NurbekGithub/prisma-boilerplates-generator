import { DMMF } from "@prisma/generator-helper";
import { TOKENS_TO_IGNORE } from "./constants";
import { PrismaPrimitive, ScalarField, selectionType } from "./types";

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

export function wrapArrayWithUnionField(isList: boolean, children: string) {
  return isList
    ? `Type.Array(Type.Union([${children} Type.Null()])),`
    : children;
}

export function wrapArrayField(isList: boolean, children: string) {
  return isList ? `Type.Array(${children}),` : children;
}

export function wrapOptionalField(isRequired: boolean, children: string) {
  return !isRequired ? `Type.Optional(${children}),` : children;
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
