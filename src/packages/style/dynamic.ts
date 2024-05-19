import type { DynamicValue } from "./types";

export function dynamic<Value>(value: Value): DynamicValue<Value> {
  return { type: "dynamic-value", value };
}

export function isDynamicValue(arg: any): arg is DynamicValue {
  return arg?.type === "dynamic-value";
}
