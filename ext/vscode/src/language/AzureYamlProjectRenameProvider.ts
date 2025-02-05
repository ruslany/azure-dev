// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AzExtFsExtra } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { getAzureYamlProjectInformation, getProjectRelativePath } from './azureYamlUtils';

export class AzureYamlProjectRenameProvider extends vscode.Disposable {
    public constructor() {
        const disposables: vscode.Disposable[] = [];
        disposables.push(vscode.workspace.onWillRenameFiles(evt => this.handleWillRenameFile(evt)));

        super(() => {
            vscode.Disposable.from(...disposables).dispose();
        });
    }

    public async provideWorkspaceEdits(oldUri: vscode.Uri, newUri: vscode.Uri, token: vscode.CancellationToken): Promise<vscode.WorkspaceEdit | undefined> {
        // When a folder is renamed, only the folder is passed in as the old URI
        // At the time this is called, the rename has not happened yet
        if (!await AzExtFsExtra.isDirectory(oldUri)) {
            return undefined;
        }

        const azureYamlUris = await vscode.workspace.findFiles('**/azure.{yml,yaml}', undefined, 1, token);
        if (azureYamlUris.length === 0) {
            return undefined;
        }

        const azureYamlUri = azureYamlUris[0];
        const azureYaml = await vscode.workspace.openTextDocument(azureYamlUri);
        const projectInformation = await getAzureYamlProjectInformation(azureYaml);

        const projectToUpdate = projectInformation.find(pi => pi.projectUri.toString() === oldUri.toString());
        if (!projectToUpdate) {
            return undefined;
        }

        const newRelativePath = getProjectRelativePath(azureYamlUri, newUri);
        const projectUriEdit = new vscode.WorkspaceEdit();
        projectUriEdit.replace(azureYamlUri, projectToUpdate.projectValueNodeRange, newRelativePath);
        return projectUriEdit;
    }

    private handleWillRenameFile(evt: vscode.FileWillRenameEvent): void {
        const oldUri = evt.files[0].oldUri;
        const newUri = evt.files[0].newUri;

        evt.waitUntil(this.provideWorkspaceEdits(oldUri, newUri, evt.token));
    }
}
