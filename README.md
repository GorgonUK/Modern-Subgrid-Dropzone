### Modern Subgrid Dropzone (PCF)
<img width="932" height="515" alt="image" src="https://github.com/user-attachments/assets/6ffe1ee7-fb65-46c0-93b4-67c23a4668e2" />


Upload and manage related files from a model-driven form using a clean, modern UI. This PCF control lets users drag and drop files to a child table via a 1:N relationship, shows upload progress, and allows deletions.

---

## Features
- Drag-and-drop or click-to-upload
- Upload progress indicator
- Sortable/filterable file list
- Delete selected files
- Small bundle size (no heavy icon libraries)

---

## Installation
1. If you just installed this component then click on "Get more components" and add it to the form. 
2. Drag and drop the component onto the form.
3. In the right hand pane, scroll to the bottom and open up "components". Click on the 3 dots on the side of "modern Subgrid Dropzone"
<img width="270" height="196" alt="image" src="https://github.com/user-attachments/assets/e7d055e0-f26b-4a52-bb4e-a345fb517e13" />

4. The "Table" and "View" fields do nto affect the control. Make sure the controls listed below are configured correctly.


## Input parameters (ControlManifest)

Configure these inputs when adding the control to a form:

- **relationshipSchemaName**: Schema name of the 1:N relationship from the current table (parent) to the file table (child). Example: `new_document_Case_new_case`.
- **fileFieldLogicalName**: Logical name of the File column on the child table. Example: `new_file`.
- **fileSizeFieldLogicalName**: Optional logical name of a Text column on the child table that stores file size in bytes. Example: `new_filesize`.
- **fileNameFieldLogicalName**: Logical name of the Text column on the child table used as the file name. Example: `new_filename`.
- **maxFiles**: Maximum number of files selectable per upload (whole number). Example: `100`.
- **maxUploadSizeMB**: Maximum single file size in megabytes (whole number). Example: `128`.

Example:
<img width="1912" height="901" alt="image" src="https://github.com/user-attachments/assets/eabfb221-bdf6-46dc-af55-54bad2416a68" />


Notes:
- The control manifest includes a placeholder dataset named `LeaveEmpty`; you do not need to bind it to data.
- Ensure your parameter names match the manifest exactly (case-sensitive in code).

---

## Example configuration values
- relationshipSchemaName: `new_document_Case_new_case`
- fileFieldLogicalName: `new_file`
- fileSizeFieldLogicalName: `new_filesize`
- fileNameFieldLogicalName: `new_filename`
- maxFiles: `100`
- maxUploadSizeMB: `128`

---

## How to find the relationship schema name
1. In the Maker portal, open the solution that contains your parent table.
2. Open the parent table, go to Relationships → 1:N.
3. Find the relationship pointing to your file table and copy its Schema Name (not the Display Name).

---

## Prerequisites
- Node.js 18+ (LTS recommended)
- Power Platform CLI (`pac`)
- A Dataverse environment where you have rights to import solutions and add controls to forms

---

## Install and build
```bash
# from repository root
npm ci
npm run build
```

Useful scripts:
- `npm run start`: run the PCF test harness
- `npm run rebuild`: clean + build
- `npm run refreshTypes`: regenerate TypeScript types after changing the manifest

---

## Deploy to Dataverse

Option A — push directly during development
```bash
pac auth create --url https://yourorg.crm.dynamics.com
pac pcf push
```
This creates/updates a temporary solution in your environment with the control for quick testing.

Option B — import a solution zip
1. Build the control: `npm run build`.
2. Build the Visual Studio solution located under `Solution/ModernSubgridDropzone` to produce a zip (e.g., `Solution/ModernSubgridDropzone/bin/Debug/ModernSubgridDropzone.zip`).
3. Import the zip into your environment via Solutions → Import.

---

## Add the control to a form
1. Open the model-driven form where you want the control.
2. Insert a section or placeholder and add the control `guk_GorgonUK.ModernSubgridDropzone`.
3. In the control’s properties, set the inputs listed above.
4. Save and publish the form and app.

Permissions required for end users:
- Create/Read/Write on the child (file) table
- Append/Append To between the parent and child tables

---

## Defaults and behavior
- It is strongly recommended to set all inputs explicitly. If an input is omitted, the control may attempt to use a code default. Configure `fileFieldLogicalName` and `fileNameFieldLogicalName` to avoid ambiguity.
- If `fileSizeFieldLogicalName` is provided, the control writes the file size in bytes.
- If `maxFiles` is not provided or is 0, the default is 100.
- If `maxUploadSizeMB` is not provided or is 0, the default is 128 MB.

---

## Troubleshooting
- "Property RelationshipName is required" or "Expected non-empty string": one or more inputs are empty or mismatched. Ensure `relationshipSchemaName` is set and valid. Verify column logical names exist on the child table.
- No files appear after upload: verify the relationship connects the child records to the current parent record and that users have security permissions.
- Types don’t match after editing the manifest: run `npm run refreshTypes` and re-build.

---

## Tech stack
- React 16.14
- ShadCN-inspired UI components
- React Dropzone for file picking/drag-and-drop
- Dataverse Web API for create/upload/delete operations

If you experience and issue, make sure to open a new Github issue 
