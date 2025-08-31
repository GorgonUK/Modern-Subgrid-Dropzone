import { RelationshipMetadata } from "../common/types/relationship";
import { IInputs } from "../generated/ManifestTypes";

export async function getEntityMetadata(
    context: ComponentFramework.Context<IInputs>,
    entityLogicalName: string
): Promise<any> {
    try {
        return await context.utils.getEntityMetadata(entityLogicalName);
    } catch (error) {
        console.error("Failed to get metadata for entity:", entityLogicalName, error);
        return null;
    }
}

export async function createRelatedFile(
    context: ComponentFramework.Context<IInputs>,
    relationshipMetadata: RelationshipMetadata | null,
    file: File,
    onProgress?: (percent: number) => void,
    fileFieldLogicalName?: string,
    fileSizeFieldLogicalName?: string,
    fileNameFieldLogicalName?: string
) {
    if (!relationshipMetadata) {
        return { success: false, message: "Relationship metadata not found. Double check PCF parameters." };
    }
    console.log("Relationship metadata:", relationshipMetadata);
    const entity = relationshipMetadata.ReferencingEntity;
    const entityId = (context as any).page.entityId;

    const record: Record<string, any> = {
        [`${relationshipMetadata.ReferencingEntityNavigationPropertyName}@odata.bind`]: `/${relationshipMetadata.ReferencedEntity}s(${entityId})`
    };
    record[fileNameFieldLogicalName || "gk_name"] = file.name;
    if (fileSizeFieldLogicalName) {
        record[fileSizeFieldLogicalName] = String(file.size);
    }

    try {
        const result = await context.webAPI.createRecord(entity, record);
        console.log("Result:", result);
        const fileColumn = fileFieldLogicalName || "gk_tenderdocument";
        await uploadFile(context, entity, result.id, fileColumn, file, onProgress);
        return { success: true, message: "Note created successfully", fileId: result.id };
    } catch (error) {
        console.error("Error creating note:", error);
        return { success: false, message: `Error creating note: ${(error as any).message}` };
    }
}

export async function uploadFile(
    context: ComponentFramework.Context<IInputs>,
    entityLogicalName: string,
    recordId: string,
    fileColumn: string,
    file: File,
    onProgress?: (percent: number) => void
): Promise<{ success: boolean; message: string }> {
    try {
        const entitySetName = `${entityLogicalName.toLowerCase()}s`;
        const uploadUrl = `${(context as any).page.getClientUrl()}/api/data/v9.0/${entitySetName}(${recordId})/${fileColumn}`;

        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PATCH", uploadUrl);
            xhr.setRequestHeader("Content-Type", "application/octet-stream");
            xhr.setRequestHeader("OData-MaxVersion", "4.0");
            xhr.setRequestHeader("OData-Version", "4.0");
            // Ensure the file keeps its original name in the Dataverse file column
            try {
                xhr.setRequestHeader("x-ms-file-name", file.name);
            } catch {
                // ignore header set errors
            }

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    onProgress?.(percent);
                } else {
                    onProgress?.(0);
                }
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    onProgress?.(100);
                    resolve();
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            };
            xhr.onerror = () => reject(new Error("Network error during upload"));

            xhr.send(file);
        });

        return { success: true, message: "File uploaded successfully" };
    } catch (error: any) {
        console.error("Error uploading file:", error);
        return { success: false, message: `Upload failed: ${error.message}` };
    }
}

export async function getFiles(
    context: ComponentFramework.Context<IInputs>,
    relationshipMetadata: RelationshipMetadata | null,
    fileSizeFieldLogicalName?: string,
    fileNameFieldLogicalName?: string
  ): Promise<ComponentFramework.WebApi.RetrieveMultipleResponse | { success: false; message: string }> {
    if (!relationshipMetadata) {
      return { success: false, message: "Relationship metadata not found. Double check PCF parameters." };
    }
  
    try {
      const entity = relationshipMetadata.ReferencingEntity;                // e.g. gk_tenderdocument
      const entityId = (context as any).page.entityId;
      const lookupAttr = relationshipMetadata.ReferencingAttribute;         // e.g. gk_tender
      const lookupFilterAttr = `_${lookupAttr}_value`;
  
      const select = [fileNameFieldLogicalName || "gk_name", "createdon", "gk_tenderdocumentid"].concat(
        fileSizeFieldLogicalName ? [fileSizeFieldLogicalName] : []
      );
      const query =
        `?$select=${select.join(",")}` +
        `&$filter=${lookupFilterAttr} eq ${entityId}` +
        `&$orderby=createdon desc`;
  
      return await context.webAPI.retrieveMultipleRecords(entity, query);
    } catch (error: any) {
      console.error("Error fetching related files:", error);
      return { success: false, message: `Failed to retrieve files: ${error.message}` };
    }
  }
  
  export async function deleteFile(
    context: ComponentFramework.Context<IInputs>,
    relationshipMetadata: RelationshipMetadata | null,
    fileId: string
  ): Promise<{ success: boolean; message: string }> {
    if (!relationshipMetadata) {
      return { success: false, message: "Relationship metadata not found. Double check PCF parameters." };
    }
    if (!fileId) {
      return { success: false, message: "File id is required." };
    }
  
    const entity = relationshipMetadata.ReferencingEntity;
  
    try {
      await context.webAPI.deleteRecord(entity, fileId);
      return { success: true, message: "File deleted." };
    } catch (err: any) {
      // Try to extract Dataverse error message
      let detail = err?.message || "";
      try {
        const body = typeof err?.body === "string" ? JSON.parse(err.body) : err?.body;
        const fromBody = body?.error?.message || body?.Message;
        if (fromBody) detail = fromBody;
      } catch {
        // ignore JSON parse errors
      }
      console.error("deleteFile failed:", err);
      return { success: false, message: `Failed to delete file${detail ? `: ${detail}` : ""}` };
    }
  }
  