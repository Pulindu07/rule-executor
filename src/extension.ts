import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as axios from 'axios';

let ruleFile: string | null = null;
let testFiles: string[] = [];

// Encode file content to base64
const encodeFileToBase64 = (filePath: string): string => {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return Buffer.from(fileContent).toString('base64');
};

// Function to create Webview with buttons
const createWebviewPanel = (context: vscode.ExtensionContext) => {
    const panel = vscode.window.createWebviewPanel(
        'testRunnerPanel',
        'Test Runner',
        vscode.ViewColumn.One,
        { enableScripts: true } // Enables JavaScript execution inside the webview
    );

    panel.webview.html = getWebviewContent();

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async message => {
        switch (message.command) {
            case 'importRule':
                const ruleUri = await vscode.window.showOpenDialog({
                    canSelectMany: false,
                    filters: { 'YAML Files': ['yml', 'yaml'] }
                });

                if (ruleUri && ruleUri.length > 0) {
                    ruleFile = ruleUri[0].fsPath;
                    panel.webview.postMessage({ command: 'ruleSelected', ruleFile: path.basename(ruleFile) });
                }
                break;

            case 'importTests':
                const testUris = await vscode.window.showOpenDialog({
                    canSelectMany: true,
                    filters: { 'All Files': ['*'] }
                });

                if (testUris && testUris.length > 0) {
                    testFiles = testUris.map(uri => uri.fsPath);
                    panel.webview.postMessage({ command: 'testsSelected', testFiles: testFiles.length });
                }
                break;

            case 'runTests':
                if (!ruleFile || testFiles.length === 0) {
                    vscode.window.showErrorMessage("Please select a rule file and at least one test file.");
                    return;
                }

                try {
                    const ruleBase64 = encodeFileToBase64(ruleFile);
                    const testsBase64 = testFiles.map(testFile => ({
                        fileName: path.basename(testFile),
                        fileEncoded: encodeFileToBase64(testFile)
                    }));

                    // Prepare the request body according to the required structure
                    const requestBody = {
                        rule: {
                            fileName: path.basename(ruleFile),
                            fileEncoded: ruleBase64
                        },
                        tests: testsBase64
                    };

					console.log("Request: ", requestBody);

                    // Make the POST request to the new URL
                    const response = await axios.default.post('http://4.227.147.247:8080/runRule', requestBody);

                    // Console log the response from the API
                    console.log("Response from API:", response.data);
                    vscode.window.showInformationMessage("Test run successful.");

                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to run tests: ${error.message}`);
                    console.error("Error while running tests:", error);
                }
                break;
        }
    });
};

// Webview HTML content
const getWebviewContent = (): string => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Runner</title>
        </head>
        <body>
            <h1>Test Runner</h1>
            <button id="importRule">Import Rule</button>
            <p id="ruleInfo"></p>
            
            <button id="importTests">Import Test Files</button>
            <p id="testInfo"></p>
            
            <button id="runTests">Run Tests</button>

            <script>
                const vscode = acquireVsCodeApi();

                document.getElementById('importRule').addEventListener('click', () => {
                    vscode.postMessage({ command: 'importRule' });
                });

                document.getElementById('importTests').addEventListener('click', () => {
                    vscode.postMessage({ command: 'importTests' });
                });

                document.getElementById('runTests').addEventListener('click', () => {
                    vscode.postMessage({ command: 'runTests' });
                });

                window.addEventListener('message', event => {
                    const message = event.data;

                    if (message.command === 'ruleSelected') {
                        document.getElementById('ruleInfo').innerText = 'Selected Rule: ' + message.ruleFile;
                    }

                    if (message.command === 'testsSelected') {
                        document.getElementById('testInfo').innerText = 'Number of test files selected: ' + message.testFiles;
                    }
                });
            </script>
        </body>
        </html>
    `;
};

// Activate function to register commands
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('rule-executor.helloWorld', () => {
        createWebviewPanel(context);
    });

    context.subscriptions.push(disposable);
}

// Deactivate function
export function deactivate() {}
