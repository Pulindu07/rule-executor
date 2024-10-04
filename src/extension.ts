import * as vscode from 'vscode';

// Comprehensive list of Semgrep keywords and their properties
const SEMGREP_KEYWORDS = {
    ROOT_LEVEL: [ 
        {
            keyword: 'rules:',
            snippetText: 'rules:\n  - id: rule_id\n    pattern: \n    message: \n    severity: ',
            docs: 'Define a new ruleset'
        }
    ],
    RULE_LEVEL: [
        {
            keyword: '- id:',
            snippetText: '- id: rule_identifier',
            docs: 'Unique identifier for the rule'
        },
        {
            keyword: 'pattern:',
            snippetText: 'pattern: $PATTERN',
            docs: 'Single pattern to match'
        },
        {
            keyword: 'pattern-either:',
            snippetText: 'pattern-either:\n    - pattern: $PATTERN1\n    - pattern: $PATTERN2',
            docs: 'Multiple patterns to match (logical OR)'
        },
        {
            keyword: 'pattern-regex:',
            snippetText: 'pattern-regex: $REGEX_PATTERN',
            docs: 'Regular expression pattern to match'
        },
        {
            keyword: 'patterns:',
            snippetText: 'patterns:\n    - pattern: $PATTERN1\n    - pattern: $PATTERN2',
            docs: 'Multiple patterns to match (logical AND)'
        },
        {
            keyword: 'message:',
            snippetText: 'message: "$MESSAGE"',
            docs: 'Message to display when the rule matches'
        },
        {
            keyword: 'severity:',
            snippetText: 'severity: WARNING',
            docs: 'Severity level of the rule (INFO, WARNING, ERROR)'
        },
        {
            keyword: 'languages:',
            snippetText: 'languages:\n    - python\n    - javascript',
            docs: 'Programming languages this rule applies to'
        },
        {
            keyword: 'paths:',
            snippetText: 'paths:\n    include:\n      - "*.py"\n    exclude:\n      - "tests/"',
            docs: 'Paths to include or exclude for this rule'
        },
        {
            keyword: 'fix:',
            snippetText: 'fix: $REPLACEMENT',
            docs: 'Autofix replacement for the matched pattern'
        },
        {
            keyword: 'metadata:',
            snippetText: 'metadata:\n    category: security\n    technology:\n      - python',
            docs: 'Additional metadata for the rule'
        },
        {
            keyword: 'timeout:',
            snippetText: 'timeout: 5',
            docs: 'Timeout in seconds for pattern matching'
        },
        {
            keyword: 'focus:',
            snippetText: 'focus: $METAVARIABLE',
            docs: 'Metavariable to focus on in the results'
        }
    ],
    PATTERN_LEVEL: [
        {
            keyword: '- pattern:',
            snippetText: '- pattern: $PATTERN',
            docs: 'Nested pattern within pattern-either or patterns'
        },
        {
            keyword: '- focus-metavariable:',
            snippetText: '- focus-metavariable: $METAVARIABLE',
            docs: 'Metavariable to focus on in nested pattern'
        },
        {
            keyword: '- pattern-inside:',
            snippetText: '- pattern-inside: $PATTERN',
            docs: 'Pattern that must exist inside the matched code'
        },
        {
            keyword: '- pattern-not:',
            snippetText: '- pattern-not: $PATTERN',
            docs: 'Pattern that must not exist in the matched code'
        },
        {
            keyword: '- pattern-where:',
            snippetText: '- pattern-where: $CONDITION',
            docs: 'Additional conditions on metavariables'
        }
    ]
};

// class SemgrepDocumentFormatter implements vscode.DocumentFormattingEditProvider {
//     provideDocumentFormattingEdits(
//         document: vscode.TextDocument
//     ): vscode.TextEdit[] {
//         const edits: vscode.TextEdit[] = [];
//         let indentLevel = 0;

//         for (let i = 0; i < document.lineCount; i++) {
//             const line = document.lineAt(i);
//             const text = line.text.trimStart();
            
//             // Determine indentation level
//             if (SEMGREP_KEYWORDS.ROOT_LEVEL.some(({keyword}) => text.startsWith(keyword))) {
//                 indentLevel = 0;
//             } else if (SEMGREP_KEYWORDS.RULE_LEVEL.some(({keyword}) => text.startsWith(keyword.trim()))) {
//                 indentLevel = 1;
//             } else if (SEMGREP_KEYWORDS.PATTERN_LEVEL.some(({keyword}) => text.startsWith(keyword.trim()))) {
//                 indentLevel = 2;
//             } else if (text && text.startsWith('-') && indentLevel === 1) {
//                 indentLevel = 2;
//             } else if (text && indentLevel === 0) {
//                 indentLevel = 1;
//             }

//             // Create indentation string
//             const newIndentation = ' '.repeat(indentLevel * 2);

//             // Only create an edit if the indentation needs to change
//             if (line.firstNonWhitespaceCharacterIndex !== indentLevel * 2) {
//                 const currentIndentation = line.text.substring(0, line.firstNonWhitespaceCharacterIndex);
//                 edits.push(vscode.TextEdit.replace(
//                     new vscode.Range(
//                         new vscode.Position(i, 0),
//                         new vscode.Position(i, currentIndentation.length)
//                     ),
//                     newIndentation
//                 ));
//             }
//         }

//         return edits;
//     }
// }

// class SemgrepDocumentFormatter implements vscode.DocumentFormattingEditProvider {
//     provideDocumentFormattingEdits(
//         document: vscode.TextDocument
//     ): vscode.TextEdit[] {
//         const edits: vscode.TextEdit[] = [];
//         let indentLevel = 0;

//         // Get current editor options for indentation
//         const editorOptions = vscode.window.activeTextEditor?.options;
//         const useSpaces = editorOptions?.insertSpaces === true;
//         const tabSize =  2;  // Default to 2 spaces if tab size is not set

//         // Define function to create indentation string based on the current editor settings
//         const createIndentation = (level: number) => {
//             if (useSpaces) {
//                 return ' '.repeat(level * tabSize);
//             } else {
//                 return '\t'.repeat(level);  // Use tabs if insertSpaces is false
//             }
//         };

//         for (let i = 0; i < document.lineCount; i++) {
//             const line = document.lineAt(i);
//             const text = line.text.trimStart();
//             var currentIndent = line.text.substring(0, line.firstNonWhitespaceCharacterIndex);

//             // Determine indentation level
//             if (SEMGREP_KEYWORDS.ROOT_LEVEL.some(({keyword}) => text.startsWith(keyword))) {
//                 indentLevel = 0;
//             } else if (SEMGREP_KEYWORDS.RULE_LEVEL.some(({keyword}) => text.startsWith(keyword.trim()))) {
//                 indentLevel = 1;
//             } else if (SEMGREP_KEYWORDS.PATTERN_LEVEL.some(({keyword}) => text.startsWith(keyword.trim()))) {
//                 indentLevel = 2;
//             } else if (text && text.startsWith('-') && indentLevel === 1) {
//                 indentLevel = 2;
//             } else if (text && indentLevel === 0) {
//                 indentLevel = 1;
//             }

//             // Create indentation string based on the determined indentation level
//             const newIndentation = createIndentation(indentLevel);

//             // Only create an edit if the indentation needs to change
//             if (line.firstNonWhitespaceCharacterIndex !== newIndentation.length) {
//                 const currentIndentation = line.text.substring(0, line.firstNonWhitespaceCharacterIndex);
//                 edits.push(vscode.TextEdit.replace(
//                     new vscode.Range(
//                         new vscode.Position(i, 0),
//                         new vscode.Position(i, currentIndentation.length)
//                     ),
//                     newIndentation
//                 ));
//             }
//         }

//         return edits;
//     }
// }

class SemgrepDocumentFormatter implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: vscode.TextDocument
    ): vscode.TextEdit[] {
        const edits: vscode.TextEdit[] = [];
        let indentLevel = 0;

        // Get current editor options for indentation
        const editorOptions = vscode.window.activeTextEditor?.options;
        const useSpaces = editorOptions?.insertSpaces === true;
        const tabSize =  2;  // Default to 2 spaces if tab size is not set

        // Define function to create indentation string based on the current editor settings
        const createIndentation = (level: number) => {
            if (useSpaces) {
                return ' '.repeat(level * tabSize);
            } else {
                return '\t'.repeat(level);  // Use tabs if insertSpaces is false
            }
        };

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text.trimStart();
            const currentIndentLength = line.firstNonWhitespaceCharacterIndex;

            // Determine indentation level
            if (SEMGREP_KEYWORDS.ROOT_LEVEL.some(({ keyword }) => text.startsWith(keyword))) {
                indentLevel = 0;
            } else if (SEMGREP_KEYWORDS.RULE_LEVEL.some(({ keyword }) => text.startsWith(keyword.trim()))) {
                indentLevel = 1;
            } else if (SEMGREP_KEYWORDS.PATTERN_LEVEL.some(({ keyword }) => text.startsWith(keyword.trim()))) {
                indentLevel = 2;
            } else if (text && text.startsWith('-') && indentLevel === 1) {
                indentLevel = 2;
            } else if (text && indentLevel === 0) {
                indentLevel = 1;
            }

            // Create indentation string based on the determined indentation level
            const newIndentation = createIndentation(indentLevel);

            // Only create an edit if the current indentation doesn't match the expected indentation
            if (currentIndentLength !== newIndentation.length) {
                edits.push(vscode.TextEdit.replace(
                    new vscode.Range(
                        new vscode.Position(i, 0),
                        new vscode.Position(i, currentIndentLength)
                    ),
                    newIndentation
                ));
            }
        }

        return edits;
    }
}


export function activate(context: vscode.ExtensionContext) {
    // Register formatter
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('semgrep', new SemgrepDocumentFormatter())
    );

    // Register completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider('semgrep', {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
            const linePrefix = document.lineAt(position).text.substr(0, position.character);
            const completionItems: vscode.CompletionItem[] = [];

            // Helper function to add completion items
            const addKeywordCompletions = (keywords: any[], indentLevel: number = 0) => {
                keywords.forEach(keyword => {
                    const item = new vscode.CompletionItem(
                        typeof keyword === 'string' ? keyword : keyword.keyword.trim(),
                        vscode.CompletionItemKind.Keyword
                    );
                    
                    if (typeof keyword !== 'string') {
                        const snippetText = ' '.repeat(indentLevel * 2) + keyword.snippetText;
                        item.insertText = new vscode.SnippetString(snippetText);
                        item.documentation = new vscode.MarkdownString(keyword.docs);
                    }
                    
                    completionItems.push(item);
                });
            };

            // Add root level keywords
            addKeywordCompletions(SEMGREP_KEYWORDS.ROOT_LEVEL);

            // Add rule level keywords
            addKeywordCompletions(SEMGREP_KEYWORDS.RULE_LEVEL, 1);

            // Add pattern level keywords
            addKeywordCompletions(SEMGREP_KEYWORDS.PATTERN_LEVEL, 2);

            // Add severity levels
            const severityLevels = ['INFO', 'WARNING', 'ERROR'];
            severityLevels.forEach(level => {
                const item = new vscode.CompletionItem(level, vscode.CompletionItemKind.EnumMember);
                completionItems.push(item);
            });

            // Add common languages
            const languages = ['python', 'javascript', 'java', 'go', 'ruby', 'php', 'c', 'cpp', 'csharp'];
            languages.forEach(lang => {
                const item = new vscode.CompletionItem(lang, vscode.CompletionItemKind.Value);
                completionItems.push(item);
            });

            // Add common metavariables
            const metavariables = ['$X', '$Y', '$FOO', '$BAR', '$PATTERN', '$REGEX'];
            metavariables.forEach(metavar => {
                const item = new vscode.CompletionItem(metavar, vscode.CompletionItemKind.Variable);
                completionItems.push(item);
            });

            return completionItems;
        }
    });

    context.subscriptions.push(completionProvider);
}

export function deactivate() {}