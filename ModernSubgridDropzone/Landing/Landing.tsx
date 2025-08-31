import * as React from "react";
import { IInputs } from "../generated/ManifestTypes";
import { Dropzone, DropzoneEmptyState, DropzoneContent, DropzoneFileList } from "../components/common/Dropzone/Dropzone";
import { createRelatedFile, deleteFile, getEntityMetadata, getFiles } from "../lib/dataverse";
import { getDocumentRelationship, getStringParameter, getNumberParameter, readFileAsBase64 } from "../lib/utils";
import { RelationshipMetadata } from "../common/types/relationship";
import { FileStub } from "../common/types/fileStub";

interface LandingProps {
  context: ComponentFramework.Context<IInputs>;
  notifyOutputChanged: () => void;
}

interface LandingState {
  files?: File[];
  relationshipMetadata?: RelationshipMetadata | null;
  uploadProgress?: Record<string, number>; // key by file name while uploading
  deletingIds?: Record<string, boolean>;
}

export class Landing extends React.Component<LandingProps, LandingState> {
  constructor(props: LandingProps) {
    super(props);
  }

  state: LandingState = {
    files: undefined,
    uploadProgress: {}
  };

  async componentDidMount() {
    const relationshipName = getStringParameter(this.props.context, "relationshipSchemaName");
    const baseEntityMetadata = await getDocumentRelationship(
      this.props.context,
      relationshipName
    );
    if (!baseEntityMetadata) {
      return
    }
    const childEntity = baseEntityMetadata?.ReferencingEntity;
    const childEntityMetadata = await getEntityMetadata(this.props.context, childEntity ?? "");
    // get the child enetity plural logcal name
    const entitySetName = childEntityMetadata?.EntitySetName;
    const updatedMetadata: RelationshipMetadata = {
      ...baseEntityMetadata,
      ReferencingEntityPlural: entitySetName
    } as RelationshipMetadata;
    this.setState({ relationshipMetadata: updatedMetadata });
    await this.fetchFiles();
  }
  componentDidUpdate() { }
  componentWillUnmount() { }

  handleDrop = async (acceptedFiles: File[]) => {
    const relationshipMetadata = this.state.relationshipMetadata ?? null;
    const context = this.props.context;
    const fileFieldLogicalName = getStringParameter(context, "fileFieldLogicalName");
    const fileSizeFieldLogicalName = getStringParameter(context, "fileSizeFieldLogicalName");
    const fileNameFieldLogicalName = getStringParameter(context, "fileNameFieldLogicalName");
    // Optimistically add new files to the list while uploading
    const existing = this.state.files || [];
    this.setState({ files: [...existing, ...acceptedFiles] });
    const progress: Record<string, number> = { ...(this.state.uploadProgress || {}) };
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const uploadKey = (file as any).__uploadKey || ((file as any).__uploadKey = `${file.name}-${Date.now()}-${i}-${Math.random()}`);
      progress[uploadKey] = 0;
      this.setState({ uploadProgress: { ...progress } });
      await createRelatedFile(context, relationshipMetadata, file, (p) => {
        progress[uploadKey] = p;
        this.setState({ uploadProgress: { ...progress } });
      }, fileFieldLogicalName, fileSizeFieldLogicalName, fileNameFieldLogicalName);
      // Finished for this file
      delete progress[uploadKey];
      this.setState({ uploadProgress: { ...progress } });
    }
    await this.fetchFiles();
  };

  fetchFiles = async () => {
    const fileSizeFieldLogicalName = getStringParameter(this.props.context, "fileSizeFieldLogicalName");
    const fileNameFieldLogicalName = getStringParameter(this.props.context, "fileNameFieldLogicalName");
    const entity = this.state.relationshipMetadata?.ReferencingEntity; // child entity
    const entityId = `${entity}id`;
    const result = await getFiles(this.props.context, this.state.relationshipMetadata!, fileSizeFieldLogicalName, fileNameFieldLogicalName);
    if ("entities" in result) {
      const files: FileStub[] = result.entities.map((e: any) => {
        const nameKey = fileNameFieldLogicalName;
        const f = new File([new Blob([])], e[nameKey], { type: "application/octet-stream" }) as FileStub;
        f.fileId = e[entityId];
        f.createdon = e.createdon;
        // populate size from configured size field if present
        const sizeText = e[fileSizeFieldLogicalName];
        if (sizeText) {
          const parsed = parseInt(sizeText, 10);
          if (!Number.isNaN(parsed)) {
            Object.defineProperty(f, "size", { value: parsed });
          }
        }
        return f;
      });
      this.setState({ files });
    }
  };


  render() {
    return (
      <div className="w-full h-full">
        <Dropzone
          src={this.state.files}
          onDrop={(acceptedFiles) => this.handleDrop(acceptedFiles)}
          onError={console.error}
          maxFiles={(() => {
            const v = getNumberParameter(this.props.context, "maxFiles");
            return v > 0 ? v : 100;
          })()}
          maxSize={(() => {
            const mb = getNumberParameter(this.props.context, "maxUploadSizeMB");
            const bytes = mb > 0 ? mb * 1024 * 1024 : 131072 * 1024; // default 128MB
            return bytes;
          })()}
          
        >
          <DropzoneEmptyState />
          <DropzoneContent />

        </Dropzone>
        <DropzoneFileList
          files={(this.state.files || []) as FileStub[]}
          progressMap={this.state.uploadProgress}
          onRemove={async (i) => {
            const prev = (this.state.files || []) as FileStub[];
            const target = prev[i];
            if (!target?.fileId) return;
            // mark deleting
            const deletingIds = { ...(this.state.deletingIds || {}), [target.fileId]: true };
            this.setState({ deletingIds });

            const res = await deleteFile(this.props.context, this.state.relationshipMetadata ?? null, target.fileId);
            if (res.success) {
              // remove on success
              const next = prev.filter((_, idx) => idx !== i);
              this.setState({ files: next });
            } else {
              console.error(res.message);
            }
            // clear deleting state regardless
            const { [target.fileId]: _, ...rest } = deletingIds;
            this.setState({ deletingIds: rest });
          }}
          deletingIds={this.state.deletingIds}
        />
      </div>
    );
  }
}
