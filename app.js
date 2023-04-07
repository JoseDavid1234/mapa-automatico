document.addEventListener("DOMContentLoaded", () => {
  const colorPicker = document.getElementById("changeColor");
  const addNodeButton = document.getElementById("addNode");
  const map = document.querySelector(".map");
  const connectionsCanvas = document.getElementById("connections");
  const ctx = connectionsCanvas.getContext("2d");
  const btnOrdenarNodos = document.getElementById("ordenar");
  const btnCambiarColor = document.getElementById("btnChangeColor");

  let isDragging = false;
  let activeNode = null;
  let offsetX = 0;
  let offsetY = 0;
  let sourceNode = null;
  let destinationNode = null;
  let idCounter = 1;
  let selectedColorValue = "#aaaaff";

  btnCambiarColor.addEventListener("click", function () {
    const nodosColor = document.querySelectorAll(".node");
    selectedColorValue = colorPicker.value;
    nodosColor.forEach((nd) => {
      nd.style.borderColor = `${selectedColorValue}`;
    });
    updateConnections();
  });

  const fileInput = document.getElementById("file-input");

  function assignLevels(rootNode) {
    const nodesWithLevels = document.querySelectorAll(".node");
    nodesWithLevels.forEach((nodeWithLevel) => {
      nodeWithLevel.dataset.level = 0;
    });
    const queue = [{ node: rootNode, level: 1 }];

    while (queue.length > 0) {
      const current = queue.shift();
      const currentNode = current.node;
      const currentLevel = current.level;
      currentNode.dataset.level = currentLevel;

      const connectedIds = currentNode.dataset.connectedTo
        ? JSON.parse(currentNode.dataset.connectedTo)
        : [];

      connectedIds.forEach((connectedId) => {
        const connectedNode = document.getElementById(connectedId);
        if (parseInt(connectedNode.dataset.level) === 0) {
          queue.push({ node: connectedNode, level: currentLevel + 1 });
        }
      });
    }
  }

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file);

    reader.onload = (event) => {
      const contenidoArchivo = event.target.result;
      const lineas = contenidoArchivo.match(/^(\d+)\.\s+(.*)$/gm);
      lineas.forEach((linea) => {
        const [, numero, textoExt] = linea.match(/^(\d+)\.\s+(.*)$/);
        createNode(textoExt);
      });

      const relaciones = contenidoArchivo.match(/(\d+)-(\d+)/gm);
      relaciones.forEach((rela) => {
        const [, pri, seg] = rela.match(/(\d+)-(\d+)/);
        const priNode = document.querySelector(`#node-${pri}`);
        const segNode = document.querySelector(`#node-${seg}`);

        let connectedIds = priNode.dataset.connectedTo
          ? JSON.parse(priNode.dataset.connectedTo)
          : [];
        if (!connectedIds.includes(segNode.id)) {
          connectedIds.push(segNode.id);
        }
        priNode.dataset.connectedTo = JSON.stringify(connectedIds);
      });
      // Asume que el nodo raíz tiene el ID "node-1"
      updateConnections();
    };
  });

  function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = `${selectedColorValue}`;
    ctx.stroke();
  }

  function updateCanvasSize() {
    connectionsCanvas.width = map.clientWidth;
    connectionsCanvas.height = map.clientHeight;
  }

  function getPosition(level, index, totalInLevel) {
    const horizontalSpacing = 400;
    const verticalSpacing = 100;
    const xOffset = 550; // Ajusta este valor según la cantidad que deseas mover los nodos hacia abajo
    const yOffset = 200; // Ajusta este valor según la cantidad que deseas mover los nodos hacia la derecha
    const xPos = (level - 1) * horizontalSpacing + yOffset;
    const yPos =
      index * verticalSpacing -
      ((totalInLevel - 1) * verticalSpacing) / 2 +
      xOffset;
    return { x: xPos, y: yPos };
  }

  function updateConnections() {
    updateCanvasSize();
    ctx.clearRect(0, 0, connectionsCanvas.width, connectionsCanvas.height);

    const nodes = document.querySelectorAll(".node");
    nodes.forEach((node) => {
      if (node.dataset.connectedTo) {
        const connectedIds = JSON.parse(node.dataset.connectedTo);
        connectedIds.forEach((connectedId) => {
          const targetNode = document.querySelector(`#${connectedId}`);
          if (targetNode) {
            drawLine(
              node.offsetLeft + node.clientWidth / 2,
              node.offsetTop + node.clientHeight / 2,
              targetNode.offsetLeft + targetNode.clientWidth / 2,
              targetNode.offsetTop + targetNode.clientHeight / 2
            );
          }
        });
      }
    });
  }

  const ordenarNodos = () => {
    const rootNode = document.querySelector("#node-1");
    assignLevels(rootNode);
    const levels = new Map();

    const nodes = document.querySelectorAll(".node");
    // Organiza los nodos por niveles
    nodes.forEach((node) => {
      const level = parseInt(node.dataset.level);
      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level).push(node);
    });

    // Actualiza la posición de los nodos basándose en su nivel
    levels.forEach((levelNodes, level) => {
      levelNodes.forEach((node, index) => {
        const { x, y } = getPosition(level, index, levelNodes.length);
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
      });
    });

    updateConnections();
  };

  const createNode = (texto) => {
    const newNode = document.createElement("div");
    newNode.className = "node";
    newNode.contentEditable = true;
    newNode.style.top = "50%";
    newNode.style.left = "50%";
    newNode.id = `node-${idCounter}`;
    idCounter++;
    newNode.textContent = texto;
    map.appendChild(newNode);

    newNode.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      isDragging = true;
      activeNode = newNode;
      offsetX = e.clientX - newNode.offsetLeft;
      offsetY = e.clientY - newNode.offsetTop;
    });
    newNode.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      if (!sourceNode) {
        sourceNode = newNode;
        newNode.style.borderColor = "red";
      } else if (!destinationNode) {
        destinationNode = newNode;

        if (sourceNode !== destinationNode) {
          let connectedIds = sourceNode.dataset.connectedTo
            ? JSON.parse(sourceNode.dataset.connectedTo)
            : [];
          if (!connectedIds.includes(destinationNode.id)) {
            connectedIds.push(destinationNode.id);
          }
          sourceNode.dataset.connectedTo = JSON.stringify(connectedIds);
          sourceNode.style.borderColor = "#007bff";
          sourceNode = null;
          destinationNode = null;
          updateConnections();
        } else {
          sourceNode.style.borderColor = "#007bff";
          sourceNode = null;
        }
      }
    });
  };

  addNodeButton.addEventListener("click", () => createNode(""));
  btnOrdenarNodos.addEventListener("click", () => ordenarNodos());

  map.addEventListener("mousemove", (e) => {
    if (isDragging && activeNode) {
      activeNode.style.left = `${e.clientX - offsetX}px`;
      activeNode.style.top = `${e.clientY - offsetY}px`;
      updateConnections();
    }
  });

  map.addEventListener("mouseup", () => {
    isDragging = false;
    activeNode = null;
  });

  map.addEventListener("dblclick", () => {
    if (sourceNode) {
      sourceNode.style.borderColor = "#007bff";
      sourceNode = null;
    }
  });

  window.addEventListener("resize", updateConnections);
  updateCanvasSize();
});
