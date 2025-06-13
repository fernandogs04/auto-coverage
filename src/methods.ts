import * as vscode from 'vscode';

async function removeFolderByBlob(marker: string): Promise<void> {
    const files = await vscode.workspace.findFiles(`**/${marker}/**`, '**/node_modules/**');

    const testResultsFiles = new Set(files.map((x) => {
        var fullPath = x.fsPath;
        const index = fullPath.indexOf(marker);
        return index === -1 
            ? fullPath
            : fullPath.slice(0, index + marker.length);
    }));

    testResultsFiles.forEach(async resultPath => {
        await vscode.workspace.fs.delete(vscode.Uri.file(resultPath), { recursive: true, useTrash: true, });
    });
}

export async function deletePastResults(): Promise<vscode.TerminalExitStatus> {
    let terminal = vscode.window.createTerminal();
    terminal.sendText("dotnet tool install -g dotnet-reportgenerator-globaltool");
    await removeFolderByBlob("coverage_report");
    await removeFolderByBlob("TestResults");
    terminal.sendText("exit");
    return new Promise<vscode.TerminalExitStatus>((resolve, reject) => {
        const disposeToken = vscode.window.onDidCloseTerminal(async (closedTermianl) => {
            if(closedTermianl === terminal) {
                disposeToken.dispose();
                if(closedTermianl.exitStatus !== undefined) {
                    resolve(closedTermianl.exitStatus);
                }
                else {
                    reject("Terminal closed without exit status");
                }
            }
        });
    });
}

export async function collectTestResults(): Promise<vscode.TerminalExitStatus> {
    let terminal = vscode.window.createTerminal();
    terminal.sendText("dotnet test --collect:\"XPlat Code Coverage\"");
    terminal.sendText("exit");
    return new Promise<vscode.TerminalExitStatus>((resolve, reject) => {
        const disposeToken = vscode.window.onDidCloseTerminal(async (closedTermianl) => {
            if(closedTermianl === terminal) {
                disposeToken.dispose();
                if(closedTermianl.exitStatus !== undefined) {
                    resolve(closedTermianl.exitStatus);
                }
                else {
                    reject("Terminal closed without exit status");
                }
            }
        });
    });
}

export async function generateReport(): Promise<vscode.TerminalExitStatus> {
    let terminal = vscode.window.createTerminal();
    terminal.sendText("reportgenerator -reports:./**/coverage.cobertura.xml -targetdir:coverage_report -filefilters:-**Moq** -assemblyFilters:-*.Tests");
    terminal.sendText("start ./coverage_report/index.html");
    terminal.sendText("exit");
    return new Promise<vscode.TerminalExitStatus>((resolve, reject) => {
        const disposeToken = vscode.window.onDidCloseTerminal(async (closedTermianl) => {
            if(closedTermianl === terminal) {
                disposeToken.dispose();
                if(closedTermianl.exitStatus !== undefined) {
                    resolve(closedTermianl.exitStatus);
                }
                else {
                    reject("Terminal closed without exit status");
                }
            }
        });
    });
}
