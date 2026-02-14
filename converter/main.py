#!/usr/bin/env python3
"""Convert hexapod.js to hexapod.glb with edge data in extras."""

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from pygltflib import (
    ANIM_LINEAR,
    ARRAY_BUFFER,
    ELEMENT_ARRAY_BUFFER,
    FLOAT,
    SCALAR,
    UNSIGNED_INT,
    VEC3,
    Accessor,
    Asset,
    Buffer,
    BufferView,
    Mesh,
    Node,
    Primitive,
    Scene,
    Attributes,
    Material,
    PbrMetallicRoughness,
    GLTF2,
)


def parse_hexapod_js(js_path: str) -> dict:
    """Parse hexapod.js using Node.js to handle typed arrays."""
    node_script = r"""
const fs = require('fs');
let content = fs.readFileSync(process.argv[1], 'utf-8');
content = content.replace(/new Float32Array\(/g, '(');
content = content.replace(/new Uint32Array\(/g, '(');
eval(content);
function serialize(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(serialize);
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = serialize(value);
    }
    return result;
}
process.stdout.write(JSON.stringify(serialize(hexapod)));
"""
    result = subprocess.run(
        ["node", "-e", node_script, js_path],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Node.js failed: {result.stderr}")
    return json.loads(result.stdout)


class GltfBuilder:
    def __init__(self):
        self.gltf = GLTF2(
            asset=Asset(version="2.0", generator="hexapod-converter"),
            extensionsUsed=["KHR_materials_unlit"],
            scenes=[],
            nodes=[],
            meshes=[],
            accessors=[],
            bufferViews=[],
            buffers=[],
            materials=[],
        )
        self.binary_data = bytearray()
        self.materials_cache: dict[tuple[str, float], int] = {}

    def _align(self):
        """Pad binary data to 4-byte alignment."""
        padding = (4 - (len(self.binary_data) % 4)) % 4
        self.binary_data.extend(b"\x00" * padding)

    def _add_buffer_view(self, data: bytes, target: int | None = None) -> int:
        self._align()
        offset = len(self.binary_data)
        self.binary_data.extend(data)
        bv = BufferView(
            buffer=0,
            byteOffset=offset,
            byteLength=len(data),
        )
        if target is not None:
            bv.target = target
        idx = len(self.gltf.bufferViews)
        self.gltf.bufferViews.append(bv)
        return idx

    def _add_accessor(
        self,
        buffer_view: int,
        component_type: int,
        count: int,
        accessor_type: str,
        min_vals: list | None = None,
        max_vals: list | None = None,
    ) -> int:
        acc = Accessor(
            bufferView=buffer_view,
            componentType=component_type,
            count=count,
            type=accessor_type,
        )
        if min_vals is not None:
            acc.min = min_vals
        if max_vals is not None:
            acc.max = max_vals
        idx = len(self.gltf.accessors)
        self.gltf.accessors.append(acc)
        return idx

    def _get_or_create_material(self, color: str, alpha: float) -> int:
        key = (color, alpha)
        if key in self.materials_cache:
            return self.materials_cache[key]

        r = int(color[1:3], 16) / 255
        g = int(color[3:5], 16) / 255
        b = int(color[5:7], 16) / 255

        mat = Material(
            pbrMetallicRoughness=PbrMetallicRoughness(
                baseColorFactor=[r, g, b, alpha],
                metallicFactor=0,
                roughnessFactor=1,
            ),
            doubleSided=True,
            extensions={"KHR_materials_unlit": {}},
        )
        if alpha < 1.0:
            mat.alphaMode = "BLEND"

        idx = len(self.gltf.materials)
        self.gltf.materials.append(mat)
        self.materials_cache[key] = idx
        return idx

    def _add_mesh(self, part: dict) -> int:
        shape = part["shape"]

        vertices = np.array(shape["vertices"], dtype=np.float32)
        normals = np.array(shape["normals"], dtype=np.float32)
        indices = np.array(shape["triangles"], dtype=np.uint32)

        verts_3d = vertices.reshape(-1, 3)
        pos_min = verts_3d.min(axis=0).tolist()
        pos_max = verts_3d.max(axis=0).tolist()

        pos_bv = self._add_buffer_view(vertices.tobytes(), ARRAY_BUFFER)
        pos_acc = self._add_accessor(
            pos_bv, FLOAT, len(vertices) // 3, VEC3, pos_min, pos_max
        )

        norm_bv = self._add_buffer_view(normals.tobytes(), ARRAY_BUFFER)
        norm_acc = self._add_accessor(norm_bv, FLOAT, len(normals) // 3, VEC3)

        idx_bv = self._add_buffer_view(indices.tobytes(), ELEMENT_ARRAY_BUFFER)
        idx_acc = self._add_accessor(idx_bv, UNSIGNED_INT, len(indices), SCALAR)

        color = part.get("color", "#808080")
        alpha = part.get("alpha", 1.0)
        mat_idx = self._get_or_create_material(color, alpha)

        mesh = Mesh(
            primitives=[
                Primitive(
                    attributes=Attributes(POSITION=pos_acc, NORMAL=norm_acc),
                    indices=idx_acc,
                    material=mat_idx,
                )
            ]
        )

        idx = len(self.gltf.meshes)
        self.gltf.meshes.append(mesh)
        return idx

    def _process_part(self, part: dict) -> int:
        """Recursively process a part, return node index."""
        node = Node(name=part.get("name", part.get("id", "")))

        # Apply transform
        loc = part.get("loc")
        if loc:
            node.translation = loc[0]
            node.rotation = loc[1]

        # If has shape, create mesh
        if "shape" in part and part["shape"]:
            node.mesh = self._add_mesh(part)

            # Store edges in extras (approach c: number array)
            edges = part["shape"].get("edges")
            if edges and len(edges) > 0:
                node.extras = {"edges": edges}

        # Reserve node index
        node_idx = len(self.gltf.nodes)
        self.gltf.nodes.append(node)

        # Process children
        if "parts" in part and part["parts"]:
            child_indices = []
            for child_part in part["parts"]:
                child_idx = self._process_part(child_part)
                child_indices.append(child_idx)
            node.children = child_indices

        return node_idx

    def build(self, data: dict):
        """Build GLTF from parsed hexapod data."""
        # Create root node
        root_node = Node(name=data.get("name", "root"))
        loc = data.get("loc")
        if loc:
            root_node.translation = loc[0]
            root_node.rotation = loc[1]

        root_idx = len(self.gltf.nodes)
        self.gltf.nodes.append(root_node)

        # Process children
        child_indices = []
        for part in data.get("parts", []):
            child_idx = self._process_part(part)
            child_indices.append(child_idx)
        root_node.children = child_indices

        # Set up scene
        self.gltf.scenes = [Scene(nodes=[root_idx])]
        self.gltf.scene = 0

        # Finalize buffer
        self._align()
        self.gltf.buffers = [Buffer(byteLength=len(self.binary_data))]
        self.gltf.set_binary_blob(bytes(self.binary_data))

    def save(self, output_path: str):
        self.gltf.save(output_path)


def main():
    script_dir = Path(__file__).parent
    js_path = script_dir / ".." / "examples" / "public" / "hexapod.js"
    output_path = script_dir / ".." / "examples" / "public" / "hexapod.glb"

    if len(sys.argv) > 1:
        js_path = Path(sys.argv[1])
    if len(sys.argv) > 2:
        output_path = Path(sys.argv[2])

    print(f"Parsing {js_path} ...")
    data = parse_hexapod_js(str(js_path.resolve()))

    print("Building GLB ...")
    builder = GltfBuilder()
    builder.build(data)

    print(f"Saving {output_path} ...")
    builder.save(str(output_path.resolve()))

    file_size = output_path.stat().st_size
    print(f"Done! {file_size:,} bytes")


if __name__ == "__main__":
    main()
