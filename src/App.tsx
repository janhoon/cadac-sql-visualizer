import { useState } from "react";
import "./App.css";
import ParseTreeVisualizer from "@/components/parse-tree-visualizer";
import SQLEditor from "@/components/sql-editor";
import { Button } from "@/components/ui/button";
import { GithubIcon, HomeIcon, InfoIcon } from "lucide-react";
import type { Node } from "web-tree-sitter";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "./components/ui/popover";

// Sample SQL queries for examples
const EXAMPLE_QUERIES = [
	{
		name: "Basic",
		query: `\
-- Basic SQL query
SELECT
	name,
	email,
	phone
FROM users;`,
	},
	{
		name: "Comments",
		query: `\
-- In this example you can see in the tree how comments
-- are associated with the different parts of the query
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
-- This example shows how aliases are associated with the different parts of the query
SELECT
			u.name AS user_name,
			u.email AS user_email,
			u.phone AS user_phone
FROM mydb.myschema.users AS u;
`,
	},
];

function App() {
	const [sqlQuery, setSqlQuery] = useState<string>(
		"-- Load an example query above or create your own\nSELECT current_date",
	);
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
			<main className="flex h-screen max-h-screen flex-col w-screen antialiased bg-gray-800 text-gray-100">
				<header className="p-4 pb-7 flex felx-row">
					<div className="w-full gap-3 flex flex-col">
						<h1 className="text-2xl font-bold flex flex-row items-start gap-2">
							CADAC SQL Previewer{" "}
							<Popover>
								<PopoverTrigger>
									<InfoIcon className="hover:text-emerald-700 hover:cursor-pointer" />
								</PopoverTrigger>
								<PopoverContent
									className="bg-gray-900 text-gray-200 w-1/3 border-gray-600"
									side="right"
								>
									<div className="flex flex-col gap-2 p-5">
										<p>
											The SQL we create tells us a lot about the data we are
											planning on fetching. Using tools like{" "}
											<a
												href="https://github.com/janhoon/tree-sitter-sql"
												className="text-blue-500 hover:underline"
												target="_blank"
												rel="noopener noreferrer"
											>
												<span className="text-emerald-400 hover:underline">
													Tree Sitter Parsers
												</span>
											</a>{" "}
											we can analyze the structure and semantics of SQL queries.
											Hover over the tree nodes to see how the query is
											structured and how the different parts of the query are
											related to each other.
										</p>
										<p>
											Using the editor below you can create your own SQL queries
											and preview the results. The Resulting tree structure
											shows how the parts of your query are grouped, such as
											comments relating to certain columns as part of your
											select statement.
										</p>
										<p>
											As for the "CADAC" reference... If you know you know, but
											keep an eye out for updates!
										</p>
										<p>
											The source code for this visualizer and the parser can be
											found on GitHub at the following links
										</p>
										<div className="flex flex-wrap gap-6 pt-4 text-emerald-400">
											<a
												href="https://github.com/janhoon/tree-sitter-sql"
												target="_blank"
												rel="noopener noreferrer"
											>
												<div className="text-emerald-400 flex flex-row items-center gap-2 hover:underline">
													<GithubIcon className="h-4 w-4" /> Parser
												</div>
											</a>
											<a
												href="https://github.com/janhoon/cadac-sql-visualizer"
												target="_blank"
												rel="noopener noreferrer"
											>
												<div className="text-emerald-400 flex flex-row items-center gap-2 hover:underline">
													<GithubIcon className="h-4 w-4" /> Visualizer
												</div>
											</a>
										</div>
									</div>
								</PopoverContent>
							</Popover>
						</h1>
					</div>
					<a href="https://janhoon.com">
						<HomeIcon className="mr-2 text-white hover:text-green-700" />
					</a>
				</header>

				<div className="flex flex-col gap-2 w-full border-b border-gray-600 pt-2 pb-4">
					<h2 className="ml-4 mr-2 text-lg font-bold">Load Example:</h2>
					<div className="flex flex-row gap-2">
						{EXAMPLE_QUERIES.map((query) => (
							<Button
								variant="default"
								key={query.name}
								onClick={() => loadExample(query.name)}
								className="bg-gray-800 hover:text-emerald-600 hover:bg-gray-900 w-[100px]"
							>
								{query.name}
							</Button>
						))}
					</div>
				</div>

				<div className="flex flex-col sm:flex-row flex-1 bg-gray-900 overflow-auto">
					{/* SQL Editor */}
					<div className="w-full h-[300px] sm:min-h-min sm:h-full flex flex-col">
						{/* <h2 className="m-3 text-2xl pt-12 sm:pt-0">SQL Editor</h2> */}
						<SQLEditor
							value={sqlQuery}
							onChange={handleSqlChange}
							hoveredNode={hoveredNode}
						/>
					</div>
					{/* Parse Tree Visualization */}
					<div className="w-full border-l border-gray-700 flex flex-col">
						<h2 className="m-3 text-2xl pt-12 sm:pt-0">Parser</h2>
						<ParseTreeVisualizer
							sqlQuery={sqlQuery}
							onHoverNode={setHoveredNode}
						/>
					</div>
				</div>
			</main>
		</>
	);
}

export default App;
