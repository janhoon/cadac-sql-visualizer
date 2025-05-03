import { useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import ParseTreeVisualizer from "./components/parse-tree-visualizer";
import SQLEditor from "./components/sql-editor";
import { ThemeProvider } from "@/components/theme-provider";
import type { Node } from "web-tree-sitter";
import { Badge } from "./components/ui/badge";
import { GithubIcon, HomeIcon } from "lucide-react";

// Sample SQL queries for examples
const EXAMPLE_QUERIES = [
    {
        name: "Basic",
        query: `\
SELECT
	name,
	email,
	phone
FROM users;`,
    },
    {
        name: "Comments",
        query: `\
SELECT
	-- this comment relates to col1
	col1,
	col2, -- this comment relates to col2
	-- this comment relates to col3
	col3 -- this comment also relates to col3
FROM users;`,
    },
    {
        name: "Aliases",
        query: `\
SELECT
	u.name AS user_name,
	u.email AS user_email,
	u.phone AS user_phone
FROM users AS u;`,
    },
];

function App() {
    const [sqlQuery, setSqlQuery] = useState<string>(EXAMPLE_QUERIES[0].query);
    const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

    // Handle SQL query changes
    const handleSqlChange = (value: string) => {
        setSqlQuery(value);
    };

    // Load example query
    const loadExample = (query: string) => {
        setSqlQuery(EXAMPLE_QUERIES.find((q) => q.name === query)?.query || "");
    };

    return (
        <>
            <ThemeProvider defaultTheme="dark">
                <main className="flex min-h-screen flex-col w-screen antialiased bg-gray-800 text-gray-100">
                    <header className="border-b p-4 flex felx-row">
                        <div className="w-full">
                            <h1 className="text-2xl font-bold">
                                CADAC SQL Previewer
                            </h1>
                            <p className="text-muted-foreground">
                                Visualize SQL parse trees in real-time using
                                tree-sitter
                            </p>
                            <div className="flex flex-wrap gap-2 pt-4">
                                <p className="text-muted-foreground">
                                    <a
                                        href="https://github.com/janhoon/tree-sitter-sql"
                                        className="text-blue-500 hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Badge className="rounded-full w-36">
                                            <GithubIcon /> Parser
                                        </Badge>
                                    </a>
                                </p>
                                <p className="text-muted-foreground">
                                    <a
                                        href="https://github.com/janhoon/cadac-sql-visualizer"
                                        className="text-blue-500 hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Badge className="rounded-full w-36">
                                            <GithubIcon /> Visualizer
                                        </Badge>
                                    </a>
                                </p>
                            </div>
                        </div>
                        <a href="https://janhoon.com">
                            <HomeIcon className="mr-2 text-white hover:text-green-700" />
                        </a>
                    </header>

                    <div className="w-full flex flex-1 flex-col gap-4 p-4">
                        <div className="flex flex-wrap gap-2 justify-start items-center">
                            <h2 className="mr-2 text-sm font-medium">
                                Examples:
                            </h2>
                            {EXAMPLE_QUERIES.map((query) => (
                                <Button
                                    key={query.name}
                                    onClick={() => loadExample(query.name)}
                                    className="text-white bg-green-500"
                                >
                                    {query.name}
                                </Button>
                            ))}
                        </div>

                        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
                            {/* Parse Tree Visualization (Left) */}
                            <Card className="flex flex-col overflow-hidden p-4 bg-gray-900">
                                <h2 className="mb-2 text-sm font-medium">
                                    Parse Tree
                                </h2>
                                <div className="flex-1 overflow-auto rounded border bg-muted/30">
                                    <ParseTreeVisualizer
                                        sqlQuery={sqlQuery}
                                        onHoverNode={setHoveredNode}
                                    />
                                </div>
                            </Card>

                            {/* SQL Editor (Right) */}
                            <Card className="flex flex-col overflow-hidden p-4 bg-gray-900">
                                <h2 className="mb-2 text-sm font-medium">
                                    SQL Editor
                                </h2>
                                <div className="flex-1 overflow-hidden rounded border">
                                    <SQLEditor
                                        value={sqlQuery}
                                        onChange={handleSqlChange}
                                        hoveredNode={hoveredNode}
                                    />
                                </div>
                            </Card>
                        </div>
                    </div>
                </main>
            </ThemeProvider>
        </>
    );
}

export default App;
