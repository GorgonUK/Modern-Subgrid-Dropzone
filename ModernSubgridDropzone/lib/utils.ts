import { IInputs } from "../generated/ManifestTypes";

function getParameterValue<T = any>(
  context: ComponentFramework.Context<IInputs>,
  parameter: keyof IInputs
): T | undefined {
  const param = context.parameters[parameter];
  
  if (
    typeof param === "object" &&
    "raw" in param
  ) {
    return param.raw === "val" ? undefined : (param.raw as T);
  }

  return undefined;
}

export function getBooleanParameter(context: ComponentFramework.Context<IInputs>, parameter: keyof IInputs): boolean {
  return getParameterValue<boolean>(context, parameter) === true;
}

export function getStringParameter(context: ComponentFramework.Context<IInputs>, parameter: keyof IInputs): string {
  return getParameterValue<string>(context, parameter) ?? "";
}

export function getNumberParameter(context: ComponentFramework.Context<IInputs>, parameter: keyof IInputs): number {
  return Number(getParameterValue<number>(context, parameter)) || 0;
}

export function getEnumParameter<T extends { [key: string]: string | number }>(
  context: ComponentFramework.Context<IInputs>,
  parameter: keyof IInputs,
  enumObj: T
): keyof T {
  const value = Number(getParameterValue<number>(context, parameter));
  const keys = Object.keys(enumObj).filter(k => isNaN(Number(k)));
  const key = keys.find(k => enumObj[k] === value);
  return (key ?? keys[0]) as keyof T;
}