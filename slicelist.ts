import stc from "string-to-color";
import { getSprites } from "./skin";

let frameList: HTMLElement;

addEventListener("load", () => {
    const elm = document.querySelector<HTMLElement>("#frame-list .body");
    if (elm == null) {
        throw Error("Could not find viewer.");
    }
    frameList = elm;
});

addEventListener("framelistloaded", (ev) => {
    rebuildFrameList();
});

function rebuildFrameList() {
    const elements = [];

    for (const [spriteName, sprite] of getSprites()) {
        const elm = document.createElement("div");
        elm.innerText = spriteName;
        elm.classList.add("sprite");
        elm.style.setProperty("--sprite-color", stc(spriteName));

        elm.addEventListener("pointerenter", () => {
            dispatchEvent(
                new CustomEvent("slicelistitementer", {
                    detail: { sprite: spriteName, frame: undefined },
                })
            );
        });
        elm.addEventListener("pointerleave", () => {
            dispatchEvent(new Event("slicelistitemleave"));
        });

        elements.push(elm);
        const frameElements = [];
        for (const [frame, _] of sprite) {
            const elm = document.createElement("div");
            elm.innerText = frame;
            elm.classList.add("frame");
            elm.dataset["spriteName"] = spriteName;
            elm.dataset["frameName"] = frame;

            elm.addEventListener("pointerenter", () => {
                dispatchEvent(
                    new CustomEvent("slicelistitementer", {
                        detail: { sprite: spriteName, frame: frame },
                    })
                );
            });
            elm.addEventListener("pointerleave", () => {
                dispatchEvent(new Event("slicelistitemleave"));
            });
            elm.addEventListener("pointerdown", () => {
                dispatchEvent(
                    new CustomEvent("slicelistitemdown", {
                        detail: { sprite: spriteName, frame: frame },
                    })
                );
            });

            frameElements.push(elm);
        }

        frameElements.sort((a, b) =>
            a.dataset["frameName"]!.localeCompare(b.dataset["frameName"]!)
        );
        elements.push(...frameElements);
    }

    frameList.replaceChildren(...elements);
}
