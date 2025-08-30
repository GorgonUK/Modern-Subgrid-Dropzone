import * as React from "react";
import { IInputs } from "../generated/ManifestTypes";
import { Container } from "./styles";
import { initializeFileTypeIcons } from "@uifabric/file-type-icons";
import { Dropzone, DropzoneEmptyState, DropzoneContent } from "../components/common/Dropzone/Dropzone";

interface LandingProps {
  context: ComponentFramework.Context<IInputs>;
  notifyOutputChanged: () => void;
}

interface LandingState {
  files?: File[] | undefined;
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

  componentDidMount() { }
  componentDidUpdate() {console.log(this.state.files) }
  componentWillUnmount() { }

  render() {
    const { context } = this.props;


    return (
      <Container>
        <Dropzone
          src={this.state.files}
          onDrop={(acceptedFiles, _fileRejections, _event) => {
            this.setState({ files: acceptedFiles });
          }}
          onError={console.error}
          maxSize={131072}
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
      </Container>
    );
  }
}
