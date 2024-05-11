import chroma, { ChromaStatic } from "chroma-js";
import Vec2 from "./vec2";

export type KartmakerProperties = {
    name: string;
    realname: string;
    prefix: string;
    stats: [number, number];
    startcolor: number;
    prefcolor: string;
    rivals: string[];

    transparent_colors: number[];

    sprite_size: [number, number];
    layer_step_size: [number, number];
    sprites: Record<string, Record<string, FrameDef>>;
    sfx: Record<string, string>;
};

export type FrameDef = {
    offset?: [number, number];
    layers: [number, number][];
    ditherstyle?: number;
    flip?: boolean;
    overwrite_sprite_size?: [number, number];
    overwrite_layer_step_size?: [number, number];
};

export type FrameData = {
    offset: Vec2;
    layers: Vec2[];
    ditherStyle: number | undefined;
    flip: boolean | undefined;
    overwriteSpriteSize: Vec2 | undefined;
    overwriteLayerStepSize: Vec2 | undefined;
};

export type Properties = {
    name: string;
    realName: string;
    prefix: string;
    speed: number;
    weight: number;
    startColor: number;
    prefColor: string;
    rivals: string[];
    transparentColors: chroma.Color[];
    spriteSize: Vec2;
    stepSize: Vec2;
    sprites: Map<string, Map<string, FrameData>>;
    sfx: Map<string, string>;
};

// export let spriteSize = new Vec2();
// export let stepSize = new Vec2();
// const sprites = new Map<string, Map<string, FrameData>>();

let properties: Properties = {
    name: "Default",
    prefColor: "",
    prefix: "",
    realName: "",
    rivals: [],
    sfx: new Map(),
    speed: 5,
    weight: 5,
    sprites: new Map(),
    spriteSize: new Vec2(),
    startColor: 96,
    stepSize: new Vec2(),
    transparentColors: [],
};

addEventListener("drop", async (ev) => {
    ev.preventDefault();

    const f = ev.dataTransfer?.items[0].getAsFile() ?? null;
    if (f == null) {
        return;
    }

    if (f.type == "text/plain" || f.type == "application/json") {
        properties = parseProperties(JSON.parse(await f.text()));
        console.log(properties);
        dispatchEvent(new Event("framelistloaded"));
    }
});

export function parseProperties(data: KartmakerProperties) {
    const spriteSize = new Vec2(data.sprite_size[0], data.sprite_size[1]);
    const stepSize = new Vec2(data.layer_step_size[0], data.layer_step_size[1]);

    const transparentColors = [];
    if (data.transparent_colors.length % 3 != 0) {
        throw Error("transparent_colors must be a length multiple of 3.");
    }
    for (let i = 0; i < transparentColors.length / 3; i++) {
        transparentColors.push(
            chroma.rgb(
                data.transparent_colors[i * 3],
                data.transparent_colors[i * 3 + 1],
                data.transparent_colors[i * 3 + 2]
            )
        );
    }

    const sprites = new Map<string, Map<string, FrameData>>();
    for (const spriteName of Object.getOwnPropertyNames(data.sprites)) {
        const sprite = new Map<string, FrameData>();
        for (const frame of Object.getOwnPropertyNames(
            data.sprites[spriteName]
        )) {
            const frameData = data.sprites[spriteName][frame];
            sprite.set(frame, {
                offset:
                    frameData.offset != undefined
                        ? new Vec2(frameData.offset[0], frameData.offset[1])
                        : new Vec2(),
                layers: frameData.layers.map((v) => new Vec2(v[0], v[1])),
                ditherStyle: frameData.ditherstyle,
                flip: frameData.flip,
                overwriteSpriteSize:
                    frameData.overwrite_sprite_size != undefined
                        ? new Vec2(
                              frameData.overwrite_sprite_size[0],
                              frameData.overwrite_sprite_size[1]
                          )
                        : undefined,
                overwriteLayerStepSize:
                    frameData.overwrite_layer_step_size != undefined
                        ? new Vec2(
                              frameData.overwrite_layer_step_size[0],
                              frameData.overwrite_layer_step_size[1]
                          )
                        : undefined,
            });
        }
        sprites.set(spriteName, sprite);
    }

    const sfx = new Map<string, string>();
    for (const sound of Object.getOwnPropertyNames(data.sfx)) {
        sfx.set(sound, data.sfx[sound]);
    }

    return {
        name: data.name,
        realName: data.realname.replace("_", " "),
        prefix: data.prefix,
        speed: data.stats[0],
        weight: data.stats[1],
        startColor: data.startcolor,
        prefColor: data.prefcolor,
        rivals: data.rivals,
        transparentColors: transparentColors,
        spriteSize: spriteSize,
        stepSize: stepSize,
        sprites: sprites,
        sfx: sfx,
    } satisfies Properties as Properties;
}

export function getSprite(spriteName: string) {
    const spr = properties.sprites.get(spriteName);
    if (spr == undefined) {
        throw Error(`Failed to retreve sprite ${spriteName}`);
    }
    return spr;
}

export function getFrame(spriteName: string, frameName: string) {
    const frame = getSprite(spriteName).get(frameName);
    if (frame == undefined) {
        throw Error(
            `Failed to retreve frame ${frameName} from sprite ${spriteName}`
        );
    }

    return frame;
}

export function getSprites() {
    return properties.sprites.entries();
}

export function getDefaultSpriteSize() {
    return properties.spriteSize;
}

export function getDefaultStepSize() {
    return properties.stepSize;
}
