document.addEventListener("DOMContentLoaded", () => {
  // Keep track of generated nodes
  const nodes = new vis.DataSet();
  const edges = new vis.DataSet();
  const initialCapacity = 14;
  const allPaths = [];
  let optimalPathInfo = { path: null, profit: -1, weight: -1, items: [] };
  let currentStep = 0;
  let traversalPaths = [];

  // Define items
  const items = [
    { id: 0, weight: 4, profit: 7 },
    { id: 1, weight: 6, profit: 6 },
    { id: 2, weight: 8, profit: 9 },
  ];

  // Create hardcoded graph structure to match reference image
  function createGraph() {
    // Add all nodes first
    nodes.add([
      { id: 0, label: "P(14)", capacity: 15, level: 0 },
      { id: 1, label: "P(10)", capacity: 10, level: 1 },
      { id: 2, label: "P(8)", capacity: 8, level: 1 },
      { id: 3, label: "P(6)", capacity: 6, level: 1 },
      { id: 4, label: "P(4)", capacity: 4, level: 2 },
      { id: 5, label: "P(6)", capacity: 6, level: 2 },
      { id: 6, label: "P(6)", capacity: 6, level: 2 },
      { id: 7, label: "P(0)", capacity: 0, level: 2 },
      { id: 8, label: "P(2)", capacity: 2, level: 2 },
      { id: 9, label: "P(0)", capacity: 0, level: 3 },
      { id: 10, label: "P(0)", capacity: 0, level: 3 },
      { id: 11, label: "P(-4)", capacity: -4, level: 3 },
      { id: 12, label: "P(-2)", capacity: -2, level: 3 },
      { id: 13, label: "P(2)", capacity: 2, level: 3 },
      { id: 15, label: "P(-2)", capacity: -2, level: 3 },
      { id: 16, label: "P(2)", capacity: 2, level: 3 },
      { id: 17, label: "P(-6)", capacity: -6, level: 4 },
      { id: 18, label: "P(-4)", capacity: -4, level: 4 },
      { id: 20, label: "P(-4)", capacity: -4, level: 4 },
    ]);

    // Add all edges with profits
    edges.add([
      // From P(14) to children
      { id: 0, from: 0, to: 1, label: "+7", profit: 7, weight: 4, itemId: 0 }, // To P(10) with item 0
      { id: 1, from: 0, to: 2, label: "+6", profit: 6, weight: 6, itemId: 1 }, // To P(8) with item 1
      { id: 2, from: 0, to: 3, label: "+9", profit: 9, weight: 8, itemId: 2 }, // To P(6) with item 2

      // From P(10) to children
      { id: 3, from: 1, to: 4, label: "+6", profit: 6, weight: 6, itemId: 1 }, // To P(4) with item 1
      { id: 4, from: 1, to: 5, label: "+7", profit: 7, weight: 4, itemId: 0 }, // To P(4) with item 0
      { id: 5, from: 1, to: 6, label: "+7", profit: 7, weight: 4, itemId: 0 }, // To P(6) with item 0

      // From P(8) to children
      { id: 6, from: 2, to: 7, label: "+9", profit: 9, weight: 8, itemId: 2 }, // To P(0) with item 2
      { id: 7, from: 2, to: 8, label: "+6", profit: 6, weight: 6, itemId: 1 }, // To P(2) with item 1

      // From P(6) to children
      { id: 8, from: 3, to: 9, label: "+7", profit: 7, weight: 4, itemId: 0 }, // To P(2) with item 0
      { id: 9, from: 3, to: 10, label: "+6", profit: 6, weight: 6, itemId: 1 }, // To P(0) with item 1

      // From P(4) to children
      { id: 10, from: 4, to: 9, label: "+7", profit: 7, weight: 4, itemId: 0 }, // To P(2) with item 0
      { id: 11, from: 4, to: 11, label: "+9", profit: 9, weight: 8, itemId: 2 }, // To P(-4) with item 2
      { id: 12, from: 4, to: 12, label: "+6", profit: 6, weight: 6, itemId: 1 }, // To P(-2) with item 1

      // From P(4) (second node) to children
      { id: 13, from: 5, to: 13, label: "+7", profit: 7, weight: 4, itemId: 0 }, // To P(2) with item 0

      // From P(6) to children
      { id: 15, from: 6, to: 15, label: "+9", profit: 9, weight: 8, itemId: 2 }, // To P(-2) with item 2
      { id: 16, from: 6, to: 16, label: "+7", profit: 7, weight: 4, itemId: 0 }, // To P(2) with item 0

      // From P(6) (another node) to children
      { id: 17, from: 8, to: 17, label: "+9", profit: 9, weight: 8, itemId: 2 }, // To P(-2) with item 2
      { id: 18, from: 8, to: 18, label: "+6", profit: 6, weight: 6, itemId: 1 }, // To P(-4) with item 1

      // From P(2) to children

      // From P(2) (ID 16) to children - more 4th level
      {
        id: 21,
        from: 16,
        to: 17,
        label: "+7",
        profit: 7,
        weight: 4,
        itemId: 0,
      }, // To P(-2) with item 0
      {
        id: 22,
        from: 16,
        to: 20,
        label: "+6",
        profit: 6,
        weight: 6,
        itemId: 1,
      }, // To P(-2) with item 1
    ]);
  }

  // --- Path Finding (DFS) ---
  function findAllPathsDFS(startNodeId, currentPathEdges = []) {
    const outgoingEdges = edges.get({
      filter: (edge) => edge.from === startNodeId,
    });

    // Check if it's a terminal node (no outgoing edges in our built graph)
    if (outgoingEdges.length === 0) {
      // Consider any node with no outgoing edges as an end point for path analysis
      allPaths.push([...currentPathEdges]);
      return;
    }

    // Explore neighbours
    outgoingEdges.forEach((edge) => {
      // Ensure the target node actually exists before recursing
      if (nodes.get(edge.to)) {
        currentPathEdges.push(edge);
        findAllPathsDFS(edge.to, currentPathEdges);
        currentPathEdges.pop(); // Backtrack
      } else {
        // If the target node doesn't exist, treat this edge as leading to a terminal state
        allPaths.push([...currentPathEdges, edge]);
      }
    });
  }

  // Create traversal path steps
  function createTraversalSteps() {
    // First step is the initial state - just showing the graph
    traversalPaths = [
      {
        title: "Initial Graph",
        nodeIds: [],
        edgeIds: [],
        tableRows: [],
      },
    ];

    // Second step is just the starting node
    traversalPaths.push({
      title: "Start at P(14)",
      nodeIds: [0],
      edgeIds: [],
      tableRows: [],
    });

    // For each path, create a sequence of steps showing graph traversal
    allPaths.forEach((path, pathIndex) => {
      let currentNodeIds = [0]; // Start with root node
      let currentEdgeIds = [];
      let tableRows = [];

      if (path.length > 0) {
        let totalWeight = 0;
        let totalProfit = 0;

        // Add steps for each edge in the path
        for (let i = 0; i < path.length; i++) {
          const edge = path[i];
          totalWeight += edge.weight;
          totalProfit += edge.profit;

          // Add target node ID to our list of highlighted nodes
          currentNodeIds.push(edge.to);
          // Add edge ID to our list of highlighted edges
          currentEdgeIds.push(edge.id);

          // Create a table row for this step
          const isValid = totalWeight <= initialCapacity;
          const pathDescription = `Path to P(${
            nodes.get(edge.to).capacity
          }) with ${i + 1} items`;
          const status = isValid ? "Valid (<= 14)" : "Invalid (> 14)";
          const rowClass = isValid ? "valid" : "invalid";

          // For final rows of paths, check if it's optimal
          let isOptimal = false;
          if (i === path.length - 1 && isValid) {
            if (!optimalPathInfo.path || totalProfit > optimalPathInfo.profit) {
              optimalPathInfo = {
                path: path,
                profit: totalProfit,
                weight: totalWeight,
                index: pathIndex,
              };
            }

            // Mark as optimal if it matches our current best
            isOptimal = pathIndex === optimalPathInfo.index;
          }

          tableRows.push({
            path: pathDescription,
            weight: totalWeight,
            profit: totalProfit,
            status: status,
            class: isOptimal ? "optimal" : rowClass,
          });

          // Add step for this node/edge addition
          traversalPaths.push({
            title: `Explore Path ${pathIndex + 1} Step ${i + 1}`,
            nodeIds: [...currentNodeIds],
            edgeIds: [...currentEdgeIds],
            tableRows: [...tableRows],
            isPathComplete: i === path.length - 1,
          });
        }
      }
    });

    // Add final step showing optimal path
    if (optimalPathInfo.path) {
      const optimalNodeIds = [0]; // Start with root node
      const optimalEdgeIds = [];
      optimalPathInfo.path.forEach((edge) => {
        optimalNodeIds.push(edge.to);
        optimalEdgeIds.push(edge.id);
      });

      traversalPaths.push({
        title: "Optimal Path Found",
        nodeIds: optimalNodeIds,
        edgeIds: optimalEdgeIds,
        tableRows: [...traversalPaths[traversalPaths.length - 1].tableRows], // Keep the complete table
        isOptimal: true,
      });
    }
  }

  // --- Table Population ---
  function updateTableForStep(step) {
    const tableBody = document
      .getElementById("pathsTable")
      .getElementsByTagName("tbody")[0];
    tableBody.innerHTML = ""; // Clear existing rows

    const stepData = traversalPaths[step];
    if (!stepData || !stepData.tableRows || stepData.tableRows.length === 0) {
      return; // No table data for this step
    }

    // Add rows from the current step
    stepData.tableRows.forEach((row) => {
      const tableRow = tableBody.insertRow();
      tableRow.className = row.class;

      tableRow.insertCell(0).textContent = row.path;
      tableRow.insertCell(1).textContent = row.weight;
      tableRow.insertCell(2).textContent = row.profit;
      tableRow.insertCell(3).textContent = row.status;
    });

    // Update summary info
    document.getElementById("total-paths").textContent = allPaths.length;
    document.getElementById("optimal-profit").textContent =
      optimalPathInfo.profit >= 0 ? optimalPathInfo.profit : "N/A";

    // Only show optimal items in the final step
    if (stepData.isOptimal && optimalPathInfo.path) {
      const items = optimalPathInfo.path
        .map((e) => `(w:${e.weight}, p:${e.profit})`)
        .join(", ");
      document.getElementById("optimal-items").textContent = items;
    } else {
      document.getElementById("optimal-items").textContent = "Searching...";
    }
  }

  // --- Graph Visualization ---
  function drawGraph() {
    const container = document.getElementById("network");

    // Hard-code positions for specific nodes to better match the reference image
    const nodePositions = {
      // Positions are relative to the container (0,0 is top-left)
      0: { x: 500, y: 50 }, // P(14) at center top

      // Level 1
      1: { x: 300, y: 150 }, // P(10)+7 left
      2: { x: 500, y: 150 }, // P(8)+6 center
      3: { x: 700, y: 150 }, // P(6)+9 right

      // Level 2
      4: { x: 200, y: 250 }, // P(4)+6
      5: { x: 350, y: 250 }, // P(4)+7
      6: { x: 500, y: 250 }, // P(6)+7
      7: { x: 650, y: 250 }, // P(0)+9
      8: { x: 800, y: 250 }, // P(6)+6/P(0)+9_2

      // Level 3 - positioned to minimize line crossings
      9: { x: 100, y: 350 }, // P(2)+9
      10: { x: 200, y: 350 }, // P(0)+7
      11: { x: 300, y: 350 }, // P(-4)+9
      12: { x: 400, y: 350 }, // P(-2)+6
      13: { x: 500, y: 350 }, // P(-2)+9/P(2)+7
      14: { x: 600, y: 350 }, // P(0)+6
      15: { x: 700, y: 350 }, // P(-2)+7
      16: { x: 800, y: 350 }, // P(2)+6

      // Level 4
      17: { x: 350, y: 450 }, // P(-2)+9
      18: { x: 450, y: 450 }, // P(-4)+6
      19: { x: 550, y: 450 }, // P(-6)+9
      20: { x: 650, y: 450 }, // P(-2)+7
    };

    // Update nodes with fixed positions
    nodes.get().forEach((node) => {
      if (nodePositions[node.id]) {
        nodes.update({
          id: node.id,
          x: nodePositions[node.id].x,
          y: nodePositions[node.id].y,
          fixed: {
            x: true,
            y: true,
          },
        });
      }
    });

    // Update node labels to match reference image
    nodes.get().forEach((node) => {
      if (node.id !== 0) {
        // For children nodes, add the "+" profit in the label
        const incomingEdges = edges.get({
          filter: (edge) => edge.to === node.id,
        });
        if (incomingEdges.length > 0) {
          const profit = incomingEdges[0].profit;
          nodes.update({
            id: node.id,
            label: `P(${node.capacity}) + ${profit}`,
            font: { size: 12 },
          });
        }
      }
    });

    const data = {
      nodes: nodes,
      edges: edges,
    };

    const options = {
      layout: {
        hierarchical: {
          enabled: false, // Disable hierarchical layout because we're using fixed positions
        },
      },
      physics: {
        enabled: false, // No physics simulation
      },
      nodes: {
        shape: "circle",
        size: 25,
        color: {
          background: "#b4e2e4", // Light blue as in reference
          border: "#4f81bd", // Blue border
        },
        font: {
          color: "#000",
          size: 12,
          face: "arial",
          vadjust: 0,
        },
        borderWidth: 1,
        shadow: false,
      },
      edges: {
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.5, // Smaller arrows
          },
        },
        color: { color: "#999" },
        width: 1,
        shadow: false,
        smooth: {
          enabled: false, // Straight lines
          type: "continuous",
        },
        font: {
          align: "horizontal",
          size: 12,
          color: "#555",
          face: "arial",
          vadjust: -10,
        },
      },
      interaction: {
        dragNodes: false,
        dragView: false,
        zoomView: false,
        hover: true,
        selectable: false,
      },
    };

    // Update edge labels to just show the profit number
    edges.get().forEach((edge) => {
      edges.update({
        id: edge.id,
        label: `${edge.profit}`,
      });
    });

    return new vis.Network(container, data, options);
  }

  // Update visualization for the current step
  function updateStep() {
    const stepData = traversalPaths[currentStep];

    // Update step info text
    document.getElementById(
      "step-info"
    ).textContent = `Step: ${currentStep} - ${stepData.title}`;

    // Reset all node and edge colors
    nodes.get().forEach((node) => {
      nodes.update({
        id: node.id,
        color: {
          background: "#dbe5f0",
          border: "#4f81bd",
        },
        borderWidth: 2,
      });
    });

    edges.get().forEach((edge) => {
      edges.update({
        id: edge.id,
        color: "#848484",
        width: 1.5,
      });
    });

    // Highlight nodes for this step
    stepData.nodeIds.forEach((nodeId) => {
      nodes.update({
        id: nodeId,
        color: {
          background: stepData.isOptimal ? "#00cc00" : "#ffcc00",
          border: stepData.isOptimal ? "#009900" : "#ff9900",
        },
        borderWidth: 3,
      });
    });

    // Highlight edges for this step
    stepData.edgeIds.forEach((edgeId) => {
      edges.update({
        id: edgeId,
        color: stepData.isOptimal ? "#00cc00" : "#ff7700",
        width: 3,
      });
    });

    // Update table
    updateTableForStep(currentStep);
  }

  // --- Event Handlers for Step Navigation ---
  function setupEventListeners() {
    document.getElementById("prev").addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--;
        updateStep();
      }
    });

    document.getElementById("next").addEventListener("click", () => {
      if (currentStep < traversalPaths.length - 1) {
        currentStep++;
        updateStep();
      }
    });

    document.getElementById("reset").addEventListener("click", () => {
      currentStep = 0;
      updateStep();
    });
  }

  // --- Main Execution ---
  createGraph(); // Create the graph structure
  const network = drawGraph(); // Visualize the graph

  findAllPathsDFS(0); // Find all paths starting from root
  createTraversalSteps(); // Create step-by-step traversal data

  setupEventListeners(); // Set up event handlers for navigation
  updateStep(); // Initialize with the first step
});
