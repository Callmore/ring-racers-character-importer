import { SliceFrameInfo, SliceInfo } from "./viewer";

interface CustomEventMap {
    slicelistitementer: CustomEvent<SliceInfo>;
    slicelistitemleave: Event;
    slicelistitemdown: CustomEvent<SliceFrameInfo>;
}

declare global {
    function addEventListener<K extends keyof CustomEventMap>(
        type: K,
        listener: (this: Window, ev: CustomEventMap[K]) => void
    ): void;
    function dispatchEvent<K extends keyof CustomEventMap>(
        ev: CustomEventMap[K]
    ): void;
}

export {};
