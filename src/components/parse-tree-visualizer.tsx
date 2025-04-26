import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Parser as ParserType, Tree, Node } from "web-tree-sitter";
// @ts-ignore - this is a vite thing to load the related wasm
import { Parser, Language } from "web-tree-sitter?init";
import { debounce } from "@/lib/utils";

interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
  originalNode: Node;
  attributes?: {
    text: string;
  };
}

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
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const parserRef = useRef<ParserType | null>(null);
  const initialized = useRef(false);

  // Create a debounced update function
  const debouncedParseAndUpdate = useCallback(
    debounce((sql: string) => {
      console.log("starting parse")
      console.log(initialized.current, parserRef.current)
      if (!initialized.current || !parserRef.current) return;
      console.log("Parsing SQL:", sql);

      try {
        // Parse SQL query
        const tree: Tree | null = parserRef.current.parse(sql);
        
        console.log("Parsed tree:", tree);
        if (!tree || !tree.rootNode) {
          setError("Failed to parse SQL query: Empty result");
          return;
        }

        // Convert tree to visualizable format
        const processedTree = processTreeData(tree.rootNode);

        setTreeData(processedTree);
        setError(null);
      } catch (err) {
        console.error("Error parsing SQL:", err);
        setError("Failed to parse SQL query.");
      }
    }, 300),
    [] // onTreeUpdate is stable and doesn't need to be in deps
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
    return () => {
      // if (parserRef.current) {
      //   parserRef.current.delete();
      //   parserRef.current = null;
      // }
    };
  }, []);

  // Parse SQL query when it changes with debounce
  useEffect(() => {
    if (!sqlQuery) return;
    debouncedParseAndUpdate(sqlQuery);
  }, [sqlQuery, debouncedParseAndUpdate]);

  // Process tree data for visualization
  const processTreeData = (node: Node, parentId = "root"): TreeNode => {
    const id = `${parentId}-${node.id.toString() || Math.random().toString(36).substr(2, 9)}`;

    const result: TreeNode = {
      id,
      name: node.type,
      children: [],
      originalNode: node,
    };

    // Add text content if this is a leaf node
    if (node.childCount === 0) {
      result.attributes = {
        text: node.text,
      };
    }

    // Process children
    for (let i = 0; i < node.childCount; i++) {
      const childNode = node.child(i);
      if (childNode) {
        result.children.push(processTreeData(childNode, id));
      }
    }

    return result;
  };

  // Render tree node
  const renderTreeNode = (node: TreeNode, depth = 0) => {
    if (!node) return null;

    const isHovered = hoveredNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="ml-4">
        <div
          className={`flex cursor-pointer items-start rounded px-1 py-0.5 text-sm ${
            isHovered ? "bg-blue-100 dark:bg-blue-900/30" : "hover:bg-muted/50"
          }`}
          onMouseEnter={() => {
            setHoveredNodeId(node.id);
            onHoverNode(node.originalNode);
          }}
          onMouseLeave={() => {
            setHoveredNodeId(null);
            onHoverNode(null);
          }}
        >
          <span className="font-mono font-medium">{node.name}</span>
          {node.attributes?.text && (
            <span className="ml-2 text-muted-foreground">
              "{node.attributes.text}"
            </span>
          )}
        </div>
        {hasChildren && (
          <div className="border-l pl-2">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
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
    <div className="h-full overflow-auto p-4">
      {treeData ? (
        <div className="tree-container">{renderTreeNode(treeData)}</div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Enter SQL to see parse tree</p>
        </div>
      )}
    </div>
  );
}
