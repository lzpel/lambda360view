export interface HexapodPart {
    id: string;
    type: string;
    subtype: string;
    name: string;
    shape: {
        vertices: Float32Array;
        triangles: Uint32Array;
        normals?: Float32Array;
    };
}

export interface HexapodData {
    version: number;
    parts: HexapodPart[];
}

// @ts-ignore
import rawData from '../hexapod.js?raw';

export function getHexapodData(): HexapodData {
    // The hexapod.js file starts with 'var hexapod = { ... };'
    // We can extract the object by removing the variable declaration and semicolon.
    const jsonString = rawData
        .replace(/^var hexapod\s*=\s*/, '')
        .replace(/;\s*$/, '')
        .replace(/new Float32Array\(\[([\s\S]*?)\]\)/g, '[$1]')
        .replace(/new Uint32Array\(\[([\s\S]*?)\]\)/g, '[$1]');

    // Eval is used here because the format is JS (with new Float32Array calls), not pure JSON.
    // Given the requirements and the input format, this is a practical approach for a static file.
    // Alternatively, we can use the hexapod object directly if it were imported as a script,
    // but for local dev with Vite, we'll try to parse it or use it as is.

    // Actually, since it's var hexapod, we can just eval the whole thing and return hexapod.
    (0, eval)(rawData);
    // @ts-ignore
    return hexapod;
}
