import { useEffect, useRef } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { Node } from "web-tree-sitter";

interface SQLEditorProps {
    value: string;
    onChange: (value: string) => void;
    hoveredNode: Node | null;
}

export default function SQLEditor({
    value,
    onChange,
    hoveredNode,
}: SQLEditorProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const decorationsRef = useRef<string[]>([]);

    // Handle editor initialization
    const handleEditorDidMount = (
        editor: editor.IStandaloneCodeEditor,
        monaco: Monaco,
    ) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Set editor options
        editor.updateOptions({
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            automaticLayout: true,
        });
    };

    // Update highlighting when hoveredNode changes
    useEffect(() => {
        if (!editorRef.current || !monacoRef.current || !hoveredNode) return;

        const monaco = monacoRef.current;
        const editor = editorRef.current;

        // Clear previous decorations
        if (decorationsRef.current.length) {
            decorationsRef.current = editor.deltaDecorations(
                decorationsRef.current,
                [],
            );
        }

        if (hoveredNode?.startPosition && hoveredNode.endPosition) {
            const startPos = hoveredNode.startPosition;
            const endPos = hoveredNode.endPosition;

            // Create new decoration
            const newDecorations = [
                {
                    range: new monaco.Range(
                        startPos.row + 1,
                        startPos.column + 1,
                        endPos.row + 1,
                        endPos.column + 1,
                    ),
                    options: {
                        inlineClassName: "highlighted-sql",
                        className: "highlighted-sql-line",
                    },
                },
            ];

            // Apply new decorations
            decorationsRef.current = editor.deltaDecorations(
                [],
                newDecorations,
            );
        }
    }, [hoveredNode]);

    return (
        <div className="h-full w-full">
            <Editor
                height="100%"
                defaultLanguage="sql"
                value={value}
                onChange={(value) => onChange(value || "")}
                onMount={handleEditorDidMount}
                theme="hc-black"
                options={{
                    fontSize: 14,
                    tabSize: 2,
                    wordWrap: "on",
                }}
                className="rounded"
                loading={
                    <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            Loading editor...
                        </p>
                    </div>
                }
            />
            <style>{`
        .highlighted-sql {
          background-color: rgba(173, 216, 230, 0.3);
          border-radius: 2px;
        }
        .highlighted-sql-line {
          background-color: rgba(173, 216, 230, 0.1);
        }
      `}</style>
        </div>
    );
}
