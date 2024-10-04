import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as axios from 'axios';

let ruleFile: string | null = null;
let testFiles: string[] = [];

// Encode file content to base64 (asynchronously)
const encodeFileToBase64 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(Buffer.from(data).toString('base64'));
      }
    });
  });
};

// Function to create Webview with buttons
const createWebviewPanel = (context: vscode.ExtensionContext) => {
  const panel = vscode.window.createWebviewPanel(
    'testRunnerPanel',
    'Test Runner',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  panel.webview.html = getWebviewContent();

  panel.webview.onDidReceiveMessage(async (message) => {
    switch (message.command) {
      case 'importRule':
        const ruleUri = await vscode.window.showOpenDialog({
          canSelectMany: false,
          filters: { 'YAML Files': ['yml', 'yaml'] },
        });

        if (ruleUri && ruleUri.length > 0) {
          ruleFile = ruleUri[0].fsPath;
          panel.webview.postMessage({
            command: 'ruleSelected',
            ruleFile: path.basename(ruleFile),
          });
        }
        break;

      case 'importTests':
        const testUris = await vscode.window.showOpenDialog({
          canSelectMany: true,
          filters: { 'All Files': ['*'] },
        });

        if (testUris && testUris.length > 0) {
          testFiles = testUris.map((uri) => uri.fsPath);
          panel.webview.postMessage({
            command: 'testsSelected',
            testFiles: testFiles.length,
          });
        }
        break;

      case 'runTests':
        if (!ruleFile || testFiles.length === 0) {
          vscode.window.showErrorMessage(
            'Please select a rule file and at least one test file.'
          );
          return;
        }

        try {
          // Ensure Base64 encoding finishes before making the API request
          const ruleBase64 = await encodeFileToBase64(ruleFile);
          const testsBase64 = await Promise.all(
            testFiles.map(async (testFile) => ({
              fileName: path.basename(testFile),
              fileEncoded: await encodeFileToBase64(testFile),
            }))
          );

          // Prepare the request body according to the required structure
          const requestBody = {
            rule: {
              fileName: path.basename(ruleFile),
              fileEncoded: ruleBase64,
            },
            tests: testsBase64,
          };

          console.log('Request: ', requestBody);

          // Make the POST request to the API
          const response = await axios.default.post(
            'http://4.227.147.247:8080/runRule',
            requestBody
          );

          // Highlight specific lines and columns in the test file
          const testUri = vscode.Uri.file(testFiles[0]); // Assuming you want to highlight the first test file
          const document = await vscode.workspace.openTextDocument(testUri);
          const editor = await vscode.window.showTextDocument(
            document,
            vscode.ViewColumn.Two
          );

          // Create a decoration for the range
          const highlightDecoration =
            vscode.window.createTextEditorDecorationType({
              backgroundColor: 'yellow', // Highlight color
            });

          const rangesToHighlight: vscode.Range[] = [];

          // Loop through each result and accumulate ranges
          for (const result of response.data.results) {
            const startPos = new vscode.Position(
              result.start.line - 1,
              result.start.col - 1
            ); // Convert to 0-based index
            const endPos = new vscode.Position(
              result.end.line - 1,
              result.end.col - 1
            );

            const highlightRange = new vscode.Range(startPos, endPos);

            // Add the range to the list of ranges
            rangesToHighlight.push(highlightRange);
          }

          // Apply all the accumulated ranges at once
          editor.setDecorations(highlightDecoration, rangesToHighlight);

          // // Define the range to highlight (Line numbers are zero-based)
          // const startPos = new vscode.Position(13, 12);  // Line 14, Column 1
          // const endPos = new vscode.Position(13, 100);   // Line 14, Column 10
          // const highlightRange = new vscode.Range(startPos, endPos);

          // // Apply the decoration to the editor
          // editor.setDecorations(highlightDecoration, [highlightRange]);

          // Console log the response from the API
          console.log('Response from API:', response.data.results);
          vscode.window.showInformationMessage('Test run successful.');
        } catch (error: any) {
          vscode.window.showErrorMessage(
            `Failed to run tests: ${error.message}`
          );
          console.error('Error while running tests:', error);
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
  let disposable = vscode.commands.registerCommand(
    'rule-executor.helloWorld',
    () => {
      createWebviewPanel(context);
    }
  );

  context.subscriptions.push(disposable);
}

// Deactivate function
export function deactivate() {}
