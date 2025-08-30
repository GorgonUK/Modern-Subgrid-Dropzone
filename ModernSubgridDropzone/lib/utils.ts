import { RelationshipMetadata, RelationshipWrapper } from "../common/types/relationship";
import { IInputs } from "../generated/ManifestTypes";
import { getEntityMetadata } from "./dataverse";

// PCF Parameters

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

// Context Helpers
export async function getTenderDocumentRelationship(
  context: ComponentFramework.Context<IInputs>,
  relationshipName: string
): Promise<RelationshipMetadata | null> {
  const entityMetadata = await getEntityMetadata(context, (context as any).page.entityTypeName);
  if (!entityMetadata?.OneToManyRelationships?._collection) return null;

  const relationships = Object.values(entityMetadata.OneToManyRelationships._collection);
  const match = relationships.find(
    (rel) =>
      (rel as RelationshipWrapper).relationshipMetadata?.SchemaName ===
    relationshipName
  ) as RelationshipWrapper | undefined;

  return match?.relationshipMetadata ?? null;
}

//helpers
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      // remove the "data:<type>;base64," prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}