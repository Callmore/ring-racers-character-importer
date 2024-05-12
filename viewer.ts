import stc from "string-to-color";
import {
    FrameData,
    getFrame,
    getSprite,
    getSprites,
    getDefaultSpriteSize,
    getDefaultStepSize,
} from "./skin";
import Vec2 from "./vec2";
import chroma from "chroma-js";

let viewer: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const viewerTransform = {
    coords: new Vec2(),
    zoom: 0,
};

let viewerPointer = new Vec2();

// let hoveredSprite: string | undefined;
// let hoveredFrame: string | undefined;

export type SliceInfo = {
    sprite: string;
    frame: string | undefined;
};

export type SliceFrameInfo = {
    sprite: string;
    frame: string;
};

let hoveredSlice: SliceInfo | undefined = undefined;

let selectedSlice: SliceFrameInfo | undefined = undefined;

addEventListener("load", () => {
    const v = document.querySelector<HTMLCanvasElement>("#slice-viewer");
    if (v == null) {
        throw Error("Could not find viewer.");
    }

    viewer = v;

    v.addEventListener("pointerdown", viewerPointerDown);
    v.addEventListener("pointerup", viewerPointerUp);
    v.addEventListener("pointermove", viewerPointerMove);
    v.addEventListener("pointerleave", viewerPointerLeave);
    v.addEventListener("wheel", viewerWheel);

    const obserber = new ResizeObserver((entries) => {
        for (const entry of entries) {
            const elm = entry.target as HTMLCanvasElement;
            elm.width = entry.contentRect.width;
            elm.height = entry.contentRect.height;
        }
        viewerDraw();
    });
    obserber.observe(v);

    viewer = v;

    const viewerCtx = v.getContext("2d");
    if (viewerCtx == null) {
        throw Error("Could not get 2D rendering context.");
    }
    ctx = viewerCtx;

    const r = () => {
        requestAnimationFrame(r);
        viewerDraw();
    };
    requestAnimationFrame(r);
});

addEventListener("drop", async (ev) => {
    ev.preventDefault();

    const f = ev.dataTransfer?.items[0].getAsFile() ?? null;
    if (f == null) {
        return;
    }

    if (f.type.startsWith("image/")) {
        setImage(await createImageBitmap(f));
    }
});

let loadedImage: CanvasImageSource;
export function setImage(i: CanvasImageSource) {
    loadedImage = i;
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function getViewerZoom() {
    // return Math.pow(2, viewerTransform.zoom / 4);
    const r = viewerTransform.zoom % 4;
    if (r == 0) {
        return Math.pow(2, viewerTransform.zoom / 4);
    }
    const ceil = Math.ceil(viewerTransform.zoom / 4);
    const floor = Math.floor(viewerTransform.zoom / 4);

    if (r < 0) {
        return lerp(
            Math.pow(2, floor),
            Math.pow(2, ceil),
            (4 - Math.abs(r)) / 4
        );
    }
    return lerp(Math.pow(2, floor), Math.pow(2, ceil), Math.abs(r) / 4);
}

function viewerTransformPoint(v: Vec2) {
    return v.sub(viewerTransform.coords).div(getViewerZoom());
}

function viewerDraw() {
    ctx.reset();

    ctx.imageSmoothingEnabled = false;

    drawTransparentGrid();

    drawSpritesheet();

    drawSliceOutlines();

    drawDebugTransformCoords();

    drawPointerPosition();
}

function drawTransparentGrid() {
    ctx.save();

    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            ctx.fillStyle = (x + y) % 2 == 0 ? "#808080" : "#c0c0c0";
            ctx.fillRect(x * 32, y * 32, 32, 32);
        }
    }

    ctx.restore;
}

function drawSpritesheet() {
    const zoom = getViewerZoom();

    ctx.save();

    ctx.transform(
        zoom,
        0,
        0,
        zoom,
        viewerTransform.coords.x,
        viewerTransform.coords.y
    );

    if (loadedImage != null) {
        ctx.drawImage(loadedImage, 0, 0);
    }

    ctx.restore();
}

function drawSliceOutlines() {
    ctx.save();

    ctx.transform(
        1, // zoom,
        0,
        0,
        1, // zoom,
        viewerTransform.coords.x,
        viewerTransform.coords.y
    );

    ctx.lineWidth = 4;
    ctx.font = "16px sans-serif";

    if (hoveredSlice != undefined || selectedSlice != undefined) {
        const slice = hoveredSlice ?? selectedSlice;
        if (slice == undefined) {
            throw Error("No slice?");
        }
        for (const [name, frame] of getSprite(slice.sprite)) {
            ctx.strokeStyle = chroma(stc(slice.sprite))
                .darken(slice.frame != undefined ? 2 : 0)
                .css("hsl");
            drawSingleSliceOutline(name, frame, false);
        }
    }

    if (hoveredSlice != undefined && hoveredSlice.frame == undefined) {
    } else if (
        (hoveredSlice != undefined && hoveredSlice.frame != undefined) ||
        selectedSlice != undefined
    ) {
        let slice: SliceInfo;
        if (hoveredSlice != undefined && hoveredSlice.frame != undefined) {
            slice = hoveredSlice;
        } else if (selectedSlice != undefined) {
            slice = selectedSlice;
        } else {
            throw Error("Somehow everything broken?");
        }
        ctx.strokeStyle = chroma(stc(slice.sprite)).css("hsl");
        drawSingleSliceOutline(
            slice.frame!,
            getFrame(slice.sprite, slice.frame!),
            true
        );
    } else {
        for (const [spr, frames] of getSprites()) {
            ctx.strokeStyle = stc(spr);
            for (const [name, frame] of frames) {
                drawSingleSliceOutline(name, frame, false);
            }
        }
    }

    ctx.restore();
}

function drawSingleSliceOutline(
    name: string,
    frame: FrameData,
    drawLabel: boolean
) {
    const zoom = getViewerZoom();
    const frameSize = frame.overwriteSpriteSize ?? getDefaultSpriteSize();
    const frameStep = frame.overwriteLayerStepSize ?? getDefaultStepSize();
    for (const [i, layer] of frame.layers.entries()) {
        const layerOffset = layer.mul(frameStep).mul(zoom);
        const sizeOffset = frameSize.mul(zoom);

        ctx.strokeRect(
            layerOffset.x,
            layerOffset.y,
            sizeOffset.x,
            sizeOffset.y
        );

        if (drawLabel) {
            const s = `${name}: ${i}`;

            ctx.fillStyle = "blue";
            const m = ctx.measureText(s);
            ctx.fillRect(layerOffset.x, layerOffset.y, m.width, 16);

            ctx.fillStyle = "white";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText(s, layerOffset.x, layerOffset.y);
        }
    }
}

function drawDebugTransformCoords() {
    const zoom = getViewerZoom();

    ctx.save();

    ctx.fillStyle = "black";
    ctx.textBaseline = "top";
    ctx.font = `32px sans-serif`;
    ctx.fillText(
        `${viewerTransform.coords.x}, ${viewerTransform.coords.y}`,
        0,
        0
    );
    ctx.fillText(`${Math.round(zoom * 100)}`, 0, 32);
    ctx.textAlign = "right";
    ctx.fillText(
        `${viewerTransform.coords.x + viewer.width}, ${
            viewerTransform.coords.y
        }`,
        viewer.width,
        0
    );

    ctx.restore();
}

function drawPointerPosition() {
    ctx.save();

    ctx.font = `16px sans-serif`;
    ctx.fillStyle = "black";
    const p = viewerTransformPoint(viewerPointer);
    ctx.fillText(
        `${Math.floor(p.x)}, ${Math.floor(p.y)}`,
        viewerPointer.x,
        viewerPointer.y
    );

    ctx.restore();
}

let isPointerDown = false;
let draggedInfo:
    | {
          index: number;
          offset: Vec2;
      }
    | undefined = undefined;

function viewerPointerDown(ev: PointerEvent) {
    isPointerDown = true;
    checkIsOverSlice();
}

function viewerPointerUp(ev: PointerEvent) {
    isPointerDown = false;
}

function viewerPointerMove(ev: PointerEvent) {
    viewerPointer = new Vec2(ev.offsetX, ev.offsetY);

    if (isPointerDown) {
        if (draggedInfo == undefined) {
            viewerTransform.coords = viewerTransform.coords.add(
                new Vec2(ev.movementX, ev.movementY)
            );
        } else {
            doLayerDrag();
        }
    }
}

function viewerPointerLeave(ev: PointerEvent) {
    isPointerDown = false;
}

function viewerWheel(ev: WheelEvent) {
    ev.preventDefault();
    const oldZoom = getViewerZoom();
    viewerTransform.zoom += -Math.sign(ev.deltaY);
    const newZoom = getViewerZoom();

    const localPos = new Vec2(ev.offsetX, ev.offsetY);

    viewerTransform.coords = localPos
        .sub(localPos.sub(viewerTransform.coords).mul(newZoom / oldZoom))
        .round();
}

function checkIsOverSlice() {
    if (selectedSlice == undefined) {
        return;
    }

    const frame = getFrame(selectedSlice.sprite, selectedSlice.frame);
    if (frame == undefined) {
        throw Error(
            `Unable to find sprite: ${selectedSlice.sprite}${selectedSlice.frame}`
        );
    }

    const mousePos = viewerTransformPoint(viewerPointer);

    for (const [i, layer] of frame.layers.entries()) {
        const layerRealTL = layer.mul(
            frame.overwriteLayerStepSize ?? getDefaultStepSize()
        );
        const layerRealBR = layer
            .mul(frame.overwriteLayerStepSize ?? getDefaultStepSize())
            .add(frame.overwriteSpriteSize ?? getDefaultSpriteSize());
        if (
            mousePos.x >= layerRealTL.x &&
            mousePos.x <= layerRealBR.x &&
            mousePos.y >= layerRealTL.y &&
            mousePos.y <= layerRealBR.y
        ) {
            draggedInfo = { index: i, offset: mousePos.sub(layerRealTL) };
            return;
        }
    }
    draggedInfo = undefined;
}

function doLayerDrag() {
    if (draggedInfo == undefined || selectedSlice == undefined) {
        return;
    }

    const dragPos = viewerTransformPoint(viewerPointer).sub(draggedInfo.offset);

    const newPos = dragPos
        .div(
            getFrame(selectedSlice.sprite, selectedSlice.frame)
                ?.overwriteLayerStepSize ?? getDefaultStepSize()
        )
        .round();

    getFrame(selectedSlice.sprite, selectedSlice.frame).layers[
        draggedInfo.index
    ] = newPos.round();
}

addEventListener("slicelistitementer", (ev) => {
    hoveredSlice = ev.detail;
});
addEventListener("slicelistitemleave", (ev) => {
    hoveredSlice = undefined;
});

addEventListener("slicelistitemdown", (ev) => {
    selectedSlice = ev.detail;
    console.log(selectedSlice);
});
