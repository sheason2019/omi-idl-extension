import * as vscode from "vscode";
import { fetchToken, IToken } from "@omi-stack/omi-idl";

const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

let diagnosticCollection: vscode.DiagnosticCollection;
let ctx: vscode.ExtensionContext;

const legend = (function () {
  const tokenTypesLegend = [
    "label",
    "comment",
    "string",
    "keyword",
    "operator",
    "type",
    "struct",
    "class",
    "interface",
    "format",
    "typeParameter",
    "formatProperty",
    "function",
    "variable",
    "parameter",
    "property",
  ];
  tokenTypesLegend.forEach((tokenType, index) =>
    tokenTypes.set(tokenType, index)
  );

  const tokenModifiersLegend = [
    "declaration",
    "documentation",
    "readonly",
    "static",
    "abstract",
    "deprecated",
    "modification",
    "async",
  ];
  tokenModifiersLegend.forEach((tokenModifier, index) =>
    tokenModifiers.set(tokenModifier, index)
  );

  return new vscode.SemanticTokensLegend(
    tokenTypesLegend,
    tokenModifiersLegend
  );
})();

async function parseText(text: string, uri: vscode.Uri): Promise<IToken[]> {
  const output = await fetchToken(uri.path, text);
  if (!output) {
    return [];
  }
  if (output.Type !== "output/token") {
    return [];
  }

  const tokenOutput = output.Payload;
  diagnosticCollection.clear();

  if (tokenOutput?.ErrorBlocks) {
    const list: vscode.Diagnostic[] = [];
    for (let err of tokenOutput.ErrorBlocks) {
      const range = new vscode.Range(
        err.FromRow,
        err.FromCol,
        err.ToRow,
        err.ToCol
      );
      list.push(new vscode.Diagnostic(range, err.Message));
    }
    diagnosticCollection.set(uri, list);
  }

  return tokenOutput?.TokenList ?? [];
}

function encodeTokenType(tokenType: string): number {
  if (tokenTypes.has(tokenType)) {
    return tokenTypes.get(tokenType)!;
  } else if (tokenType === "notInLegend") {
    return tokenTypes.size + 2;
  }
  return 0;
}

function encodeTokenModifiers(strTokenModifiers: string[]): number {
  let result = 0;
  for (let i = 0; i < strTokenModifiers.length; i++) {
    const tokenModifier = strTokenModifiers[i];
    if (tokenModifiers.has(tokenModifier)) {
      result = result | (1 << tokenModifiers.get(tokenModifier)!);
    } else if (tokenModifier === "notInLegend") {
      result = result | (1 << (tokenModifiers.size + 2));
    }
  }
  return result;
}

const provider: vscode.DocumentSemanticTokensProvider = {
  async provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens | null | undefined> {
    try {
      const allTokens = await parseText(document.getText(), document.uri);

      const builder = new vscode.SemanticTokensBuilder();
      allTokens.forEach((token) => {
        builder.push(
          token.line,
          token.startCharacter,
          token.length,
          encodeTokenType(token.tokenType),
          encodeTokenModifiers(token.tokenModifiers ?? [])
        );
      });
      return builder.build();
    } catch (e) {
      console.log(e);
    }
  },
};

// 插件入口
export function activate(context: vscode.ExtensionContext) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection("omi");
  context.subscriptions.push(diagnosticCollection);
}

vscode.languages.registerDocumentSemanticTokensProvider(
  { language: "omi", scheme: "file" },
  provider,
  legend
);
