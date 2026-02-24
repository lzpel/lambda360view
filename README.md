# lambda360view

**[Live Demo](https://lzpel.github.io/lambda360view/)**

A React component library for displaying 3D CAD-like models with edge rendering, built with [react-three-fiber](https://github.com/pmndrs/react-three-fiber).

![Hexapod Demo](figure/screenshot.png)

## Features

- 📦 Load GLB binary models directly from ArrayBuffer
- ✏️ Edge line rendering for CAD-style visualization using orphan accessors
- 🖱️ Built-in orbit controls (rotate, zoom, pan)
- 📐 Automatic camera positioning based on bounding box
- 📏 Distance and point annotations support
- 🔄 Seamless model switching without flickering or resetting camera state
- 🎛️ Built-in View Menu (Isometric, Front, Top, etc.) and Axis Helper
- ⚛️ Pure React + TypeScript implementation

## Installation

```bash
npm install lambda360view
```

### Peer Dependencies

This library requires React 18+ and Three.js as peer dependencies:

```bash
npm install react react-dom three @react-three/fiber @react-three/drei
```

## Usage

```tsx
import { useState, useEffect } from 'react';
import { Lambda360View } from 'lambda360view';

function App() {
  const [model, setModel] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    // Load GLB file as ArrayBuffer
    fetch('/my-model.glb')
      .then((res) => res.arrayBuffer())
      .then((buffer) => setModel(buffer));
  }, []);

  return (
    <Lambda360View
      model={model}
      center={!model ? <div>Loading model...</div> : undefined}
      backgroundColor="#f0f0f0"
      edgeColor="#000000"
      showEdges={true}
      showViewMenu={true}
      orthographic={true}
      upAxis="Z"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
```

## Props

`Lambda360View` inherits all standard `React.HTMLAttributes<HTMLDivElement>` props (such as `style`, `className`, `onClick`, etc.) and accepts the following specific props. 
*(Note: Because the root element of this component is a `<div />`, any standard HTML attributes passed to `Lambda360View` will be applied directly to that root `div`.)*

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `model` | `ArrayBuffer \| null` | required | GLB binary data to load directly, or `null` for empty state |
| `center`| `React.ReactNode` | - | Arbitrary React node to display in the center (e.g. loading spinner, error message) |
| `backgroundColor` | `string` | `"#1a1a2e"` | Canvas background color |
| `edgeColor` | `string` | `"#000000"` | Color for edge lines |
| `showEdges` | `boolean` | `true` | Whether to render edges |
| `upAxis` | `'Y' \| 'Z' \| '-Y' \| '-Z'` | `'Y'` | Up axis direction of the model |
| `orthographic` | `boolean` | `false` | Use orthographic camera instead of perspective |
| `showViewMenu` | `boolean` | `false` | Show built-in view control menu bar |
| `footer` | `React.ReactNode` | - | Footer content to display at the bottom |
| `annotations` | `Annotation[]` | - | Array of point/distance annotations to display |
| `preserveCamera` | `boolean` | `true` | Preserve camera state (pos/zoom) when model changes |

### Annotations

You can pass an array of annotations to display labels or measurements on the 3D model:

```typescript
import type { Annotation } from 'lambda360view';

const annotations: Annotation[] = [
  {
    type: 'point',
    position: [152, 100, 44],
    label: 'Material: SUS304',
  },
  {
    type: 'distance',
    start: [-152, -87, -62],
    end: [152, -87, -62],
    label: '304mm',
  }
];
```

## GLB Specification Requirements

For the edge rendering to work correctly, the GLB file must follow our specific structure.
Please refer to the detailed **[GLB Specification](./GLB-SPEC.md)** document.

Key requirements:
- Edges must be stored as an **orphan accessor** (FLOAT, VEC3) containing line segment pairs
- The root `extras` object must contain `edgeAccessor` pointing to the correct accessor index:
  ```json
  {
    "extras": {
      "edgeAccessor": 3
    }
  }
  ```

## Example

See the [examples](./examples) directory for a complete Next.js example displaying a hexapod robot model.

```bash
# Run the example
make -C examples generate run
```

## License

MIT

## Author

[lzpel](https://github.com/lzpel)
