import { PrismaPrimitive } from "./types";

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
