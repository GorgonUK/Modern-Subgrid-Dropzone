import * as React from "react";
import { IInputs } from "../generated/ManifestTypes";
import { Container } from "./styles";
import { initializeFileTypeIcons } from "@uifabric/file-type-icons";
import { Dropzone, DropzoneEmptyState, DropzoneContent, DropzoneFileList } from "../components/common/Dropzone/Dropzone";
import { createRelatedFile, deleteFile, getEntityMetadata, getFiles } from "../lib/dataverse";
import { getTenderDocumentRelationship, readFileAsBase64 } from "../lib/utils";
import { RelationshipMetadata } from "../common/types/relationship";
import { FileStub } from "../common/types/fileStub";

interface LandingProps {
  context: ComponentFramework.Context<IInputs>;
  notifyOutputChanged: () => void;
}

interface LandingState {
  files?: File[];
  relationshipMetadata?: RelationshipMetadata | null;
}

export class Landing extends React.Component<LandingProps, LandingState> {
  constructor(props: LandingProps) {
    super(props);
    initializeFileTypeIcons();
  }

  state: LandingState = {
    files: undefined,
  };

  getFileExtension(filename?: string): string {
    if (!filename) {
      return "folder";
    }
    const extension = filename.split(".").pop()?.toLowerCase();
    return extension ? extension : "txt";
  }

  async componentDidMount() {
    const entityMetadata = await getTenderDocumentRelationship(
      this.props.context,
      "gk_tenderdocument_Tender_gk_tender" // TODO: Make this dynamic
    );

    this.setState({ relationshipMetadata: entityMetadata });
    this.fetchFiles();
  }
  componentDidUpdate() {}
  componentWillUnmount() {}

  handleDrop = async (acceptedFiles: File[]) => {
    const relationshipMetadata = this.state.relationshipMetadata ?? null;
    const context = this.props.context;
    for (const file of acceptedFiles) {
      await createRelatedFile(context, relationshipMetadata, file);
    }
    this.fetchFiles();
    this.setState({ files: acceptedFiles });
  };

  fetchFiles = async () => {
    const result = await getFiles(this.props.context, this.state.relationshipMetadata ?? null);
    if ("entities" in result) {
      const files: FileStub[] = result.entities.map((e: any) => {
        const f = new File([new Blob([])], e.gk_name, { type: "application/octet-stream" }) as FileStub;
        f.fileId = e.gk_tenderdocumentid;
        f.createdon = e.createdon;
        return f;
      });
      this.setState({ files });
    }
  };


  render() {
    const { context } = this.props;

    return (
      <Container>
        <Dropzone
          src={this.state.files}
          onDrop={(acceptedFiles) => this.handleDrop(acceptedFiles)}
          onError={console.error}
          maxSize={131072 * 1024} // 128MB
          accept={{
            // PDF
            "application/pdf": [".pdf"],

            // Word (modern + legacy)
            "application/msword": [".doc"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],

            // Excel (modern + legacy)
            "application/vnd.ms-excel": [".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],

            // PowerPoint (modern + legacy)
            "application/vnd.ms-powerpoint": [".ppt"],
            "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],

            // Text formats (common in RFPs/exports)
            "text/plain": [".txt"],
            "application/rtf": [".rtf"],

            // OpenDocument formats (common in enterprise/public sector)
            "application/vnd.oasis.opendocument.text": [".odt"],
            "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
            "application/vnd.oasis.opendocument.presentation": [".odp"]
          }}
        >
          <DropzoneEmptyState />
          <DropzoneContent />

        </Dropzone>
        <DropzoneFileList
          files={(this.state.files || []) as FileStub[]}
          onRemove={async (i) => {
            const prev = (this.state.files || []) as FileStub[];
            const target = prev[i];
            if (!target?.fileId) return;

            // optimistic remove
            const next = prev.filter((_, idx) => idx !== i);
            this.setState({ files: next });

            const res = await deleteFile(this.props.context, this.state.relationshipMetadata ?? null, target.fileId);
            if (!res.success) {
              // revert on failure
              this.setState({ files: prev });
              console.error(res.message);
            }
          }}
        />
      </Container>
    );
  }
}
