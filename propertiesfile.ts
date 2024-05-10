import Vec2 from "./vec2";

export type PropertiesFile = {
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

export let spriteSize = new Vec2();
export let stepSize = new Vec2();
export const sprites = new Map<string, Map<string, FrameData>>();

addEventListener("drop", async (ev) => {
    ev.preventDefault();

    const f = ev.dataTransfer?.items[0].getAsFile() ?? null;
    if (f == null) {
        return;
    }

    if (f.type == "text/plain" || f.type == "application/json") {
        parseProperties(JSON.parse(await f.text()));
    }
});

export function parseProperties(data: PropertiesFile) {
    spriteSize = new Vec2(data.sprite_size[0], data.sprite_size[1]);
    stepSize = new Vec2(data.layer_step_size[0], data.layer_step_size[1]);

    sprites.clear();
    for (const spr of Object.getOwnPropertyNames(data.sprites)) {
        for (const frame of Object.getOwnPropertyNames(data.sprites[spr])) {
            const frameData = data.sprites[spr][frame];
            if (!sprites.has(spr)) {
                sprites.set(spr, new Map<string, FrameData>());
            }
            sprites.get(spr)!.set(frame, {
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
    }

    dispatchEvent(new Event("framelistloaded"));
}
