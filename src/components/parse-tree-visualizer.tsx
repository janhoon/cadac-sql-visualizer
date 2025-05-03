import { Alert, AlertDescription } from "@/components/ui/alert";
import { debounce } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Node, Parser as ParserType, Tree } from "web-tree-sitter";
// @ts-ignore - this is a vite thing to load the related wasm
import { Language, Parser } from "web-tree-sitter?init";

interface ParseTreeVisualizerProps {
	sqlQuery: string;
	onHoverNode: (node: Node | null) => void;
}

export default function ParseTreeVisualizer({
	sqlQuery,
	onHoverNode,
}: ParseTreeVisualizerProps) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [treeData, setTreeData] = useState<Tree | null>(null);
	const parserRef = useRef<ParserType | null>(null);
	const initialized = useRef(false);

	// Create a debounced update function
	const debouncedParseAndUpdate = useCallback(
		debounce((sql: string) => {
			console.log("starting parse");
			console.log(initialized.current, parserRef.current);
			if (!initialized.current || !parserRef.current) return;
			console.log("Parsing SQL:", sql);

			try {
				// Parse SQL query
				const tree: Tree | null = parserRef.current.parse(sql, treeData);

				console.log("Parsed tree:", tree);
				if (!tree || !tree.rootNode) {
					setError("Failed to parse SQL query: Empty result");
					return;
				}

				setTreeData(tree);
				setError(null);
			} catch (err) {
				console.error("Error parsing SQL:", err);
				setError("Failed to parse SQL query.");
			}
		}, 300),
		[], // onTreeUpdate is stable and doesn't need to be in deps
	);

	// Initialize tree-sitter only once on mount
	useEffect(() => {
		const initTreeSitter = async () => {
			if (initialized.current) return;

			try {
				console.log("Initializing tree-sitter...");
				setLoading(true);
				setError(null);

				// Initialize the Parser
				await Parser.init();

				// Initialize parser with SQL grammar
				const sqlParser = new Parser();
				const SQL = await Language.load("/tree-sitter-sql.wasm");
				await sqlParser.setLanguage(SQL);

				parserRef.current = sqlParser;
				initialized.current = true;
			} catch (err) {
				console.error("Failed to initialize tree-sitter:", err);
				// setError("Failed to load SQL parser. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		initTreeSitter();

		// Cleanup
		return () => {};
	}, []);

	// Parse SQL query when it changes with debounce
	useEffect(() => {
		if (!sqlQuery) return;
		debouncedParseAndUpdate(sqlQuery);
	}, [sqlQuery, debouncedParseAndUpdate]);

	// Render tree node
	const renderTreeNode = (nodeTree: Tree) => {
		// Generate array of all visible nodes with their metadata
		interface VisibleNode {
			node: Node;
			depth: number;
			fieldName: string | null;
		}

		const visibleNodes: VisibleNode[] = [];

		// Follows the approach from tree-sitter playground
		// Uses cursor to walk the tree and collect visible nodes
		const walkTree = (rootNode: Node) => {
			// Use cursor based approach like in the playground example
			const cursor = rootNode.walk();
			const visited = new Set<number>();

			// Keep track of current field name during traversal
			function addNodeToVisibleNodes(
				node: Node,
				depth: number,
				fieldName: string | null,
			) {
				if (visited.has(node.id)) return;
				visited.add(node.id);

				visibleNodes.push({
					node,
					depth,
					fieldName,
				});
			}

			// Add root node
			addNodeToVisibleNodes(rootNode, 0, null);

			// Use a similar traversal approach to the playground
			let depth = 0;
			let visitedChildren = false;

			while (true) {
				if (visitedChildren) {
					if (cursor.gotoNextSibling()) {
						visitedChildren = false;
					} else if (cursor.gotoParent()) {
						depth--;
						visitedChildren = true;
					} else {
						break;
					}
				} else {
					const node = cursor.currentNode;

					// Get actual field names from current position in tree
					// Only include the node if it's named (skip anonymous nodes)
					if (node !== rootNode && node.isNamed) {
						const fieldName = cursor.currentFieldName;
						addNodeToVisibleNodes(node, depth, fieldName);
					}

					if (cursor.gotoFirstChild()) {
						depth++;
						visitedChildren = false;
					} else {
						visitedChildren = true;
					}
				}
			}
		};

		// Build the array of nodes
		walkTree(nodeTree.rootNode);

		// Render the nodes as a list (like in the playground)
		return (
			<div className="p-4 font-mono overflow-auto">
				{visibleNodes.map((item) => {
					const { node, depth, fieldName } = item;
					const nodeId = `node-${node.id}`;
					const hasError = node.hasError;

					const startPosition = node.startPosition;
					const endPosition = node.endPosition;
					const positionStr = `[${startPosition.row},${startPosition.column}] - [${endPosition.row},${endPosition.column}]`;

					return (
						<div key={nodeId} className="whitespace-nowrap mb-1">
							<div
								className={`flex items-start cursor-pointer px-2 py-0.5 rounded hover:bg-gray-800 ${hasError ? "text-red-500" : ""}`}
								style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
								onMouseEnter={() => {
									onHoverNode(node);
								}}
								onMouseLeave={() => {
									onHoverNode(null);
								}}
							>
								<div className="flex flex-col">
									<div className="flex items-center">
										{fieldName && (
											<span className="text-sm text-emerald-400 mr-1">
												{fieldName}:
											</span>
										)}
										<span className="font-semibold text-sm">{node.type}</span>

										<span className="ml-2 text-xs text-gray-400">
											{positionStr}
										</span>
									</div>

									{node.text && (
										<div className="mt-0.5 ml-4 text-xs text-gray-500 italic break-all">
											"{node.text.replace(/\n/g, "\\n").substring(0, 50)}
											{node.text.length > 50 ? "..." : ""}"
										</div>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				<span>Loading SQL parser...</span>
			</div>
		);
	}

	if (error) {
		return (
			<Alert variant="destructive" className="m-4">
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="h-full w-full overflow-auto">
			{treeData ? (
				renderTreeNode(treeData)
			) : (
				<div className="flex h-full items-center justify-center">
					<p className="text-muted-foreground">Enter SQL to see parse tree</p>
				</div>
			)}
		</div>
	);
}
