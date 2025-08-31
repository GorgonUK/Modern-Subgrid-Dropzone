import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { Landing } from "./Landing/Landing";
import * as React from "react";
import "./styles/globals.scss"
import { getEntityMetadata } from "./lib/dataverse";

export class ModernSubgridDropzone implements ComponentFramework.ReactControl<IInputs, IOutputs> {
  private notifyOutputChanged!: () => void;

  init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void
  ): void {
    console.log("Modern Subgrid Dropzone 0.3 Initialised")
    //console.log(context)
    this.notifyOutputChanged = notifyOutputChanged;
  }

  updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
    return React.createElement(Landing, {
      context,
      notifyOutputChanged: this.notifyOutputChanged
    });
  }

  getOutputs(): IOutputs { return {}; }
  destroy(): void { /* no-op */ }
}
