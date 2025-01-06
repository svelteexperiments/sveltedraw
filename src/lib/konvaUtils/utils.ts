import { Layer } from "konva/lib/Layer.js";
import { Shape } from "konva/lib/Shape.js";
import { Transformer } from "konva/lib/shapes/Transformer.js";
import { Stage } from "konva/lib/Stage.js";
import { selectTool } from "./tools.js";
import { get, writable } from "svelte/store";

export const isHelpModalOpen = writable<boolean>(false)

export const initKonva = (containerDiv: HTMLDivElement, stageWidth: number, stageHeight: number) => {
    let stage = new Stage({
        container: containerDiv,
        width: stageWidth,
        height: stageHeight
    });

    // Add layer
    let layer = new Layer();
    // Add a transform objected
    const tr = new Transformer({
        id: 'global-selector'
    })
    tr.on('transformstart', (evt) => {
        evt.cancelBubble = true;
    });
    tr.on('dragstart', (evt) => {
        evt.cancelBubble = true;
    });

    layer.add(tr)
    stage.add(layer);

    registerDefaultEvents(stage)
    document.addEventListener('keydown', function (event) {
        event.preventDefault()
        const tr: Transformer = <Transformer>layer.getChildren().find((child) => child.id() == "global-selector")
        if (event.key === 'Escape' && !get(isHelpModalOpen)) {
            selectTool(stage, layer, "select")
        }
        if (event.key === "Delete") {
            if (!tr) return;
            tr.getNodes().forEach(node => node.destroy())
            tr.nodes([])
        }
        if (event.ctrlKey && event.key === 'd') {
            if (!tr) return;
            tr.getNodes().forEach(node => {
                if (node instanceof Shape) {
                    const clonedNode = node.clone({
                        // Offset the cloned node to avoid overlap
                        x: node.x() + 20,
                        y: node.y() + 20,
                    });
                    layer.add(clonedNode)
                    tr.nodes([clonedNode])
                }
            })
        }
        if (event.ctrlKey && event.key === 'a') {
            const allNodes = layer.find(".shape");
            if (allNodes.length === 0) return;
            tr.nodes(allNodes);
            layer.batchDraw();
        }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            const selectedNodes = tr.nodes();
            if (selectedNodes.length === 0) return;
            const moveStep = 10;
            selectedNodes.forEach(node => {
                // Move the node based on the arrow key pressed
                switch (event.key) {
                    case 'ArrowUp':
                        node.move({ x: 0, y: -moveStep });
                        break;
                    case 'ArrowDown':
                        node.move({ x: 0, y: moveStep });
                        break;
                    case 'ArrowLeft':
                        node.move({ x: -moveStep, y: 0 });
                        break;
                    case 'ArrowRight':
                        node.move({ x: moveStep, y: 0 });
                        break;
                }
            });
        }
    });

    return { stage, layer }
}

export const registerDefaultEvents = (stage: Stage) => {
    let scale = 1
    // Scale limits
    const MIN_SCALE = 0.5; // 50%
    const MAX_SCALE = 4; // 400%
    // Handle zoom with mouse wheel
    stage.on("wheel", (e) => {
        e.evt.preventDefault();
        if (!stage) return;

        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        let newScale = oldScale * (e.evt.deltaY > 0 ? 0.9 : 1.1);
        newScale = Math.max(MIN_SCALE, Math.min(newScale, MAX_SCALE));
        scale = newScale;

        stage.scale({ x: newScale, y: newScale });

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        stage.position(newPos);
        stage.batchDraw();
    });
}

