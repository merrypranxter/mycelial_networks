# substrates

## Overview

`substrates/` contains fragment shaders that render the resource field underneath a fungal growth pass. These shaders are meant to be used as base layers: draw the substrate first, then blend or mask growth, enzyme halos, moisture fields, or nutrient overlays on top.

## How they are used

- Render a full-screen quad with one substrate shader to generate the background texture.
- Feed the result into later growth shaders as a sampler or simply composite hyphal trails over it.
- Treat bright, porous, organic, or highlighted regions as places where a simulation can bias branching, tip steering, or colonization probability.

## Uniform inputs

Shared uniform:

- `u_resolution` — viewport size in pixels. Each shader normalizes coordinates with `gl_FragCoord.xy / u_resolution.xy`.

Shader-specific uniforms:

- `substrate_hardwood_grain.frag`
  - `u_cut_angle` — `0.0` transverse, `0.5` radial, `1.0` tangential.
  - `u_ring_count` — annual ring count, typically `5.0-20.0`.
- `substrate_softwood_grain.frag`
  - `u_resin_content` — resin duct density/intensity from `0.0-1.0`.
- `substrate_leaf_litter.frag`
  - `u_decomposition` — litter age from `0.0` fresh to `1.0` humified.
- `substrate_soil_horizon.frag`
  - `u_depth` — surface-to-bedrock emphasis from `0.0-1.0`.
  - `u_mycorrhizal_zone` — intensity of the A/B-boundary highlight.

## Coordinate system

All shaders use normalized UV coordinates:

```glsl
vec2 uv = gl_FragCoord.xy / u_resolution.xy;
```

- `uv.x = 0.0` is the left edge, `uv.x = 1.0` is the right edge.
- `uv.y = 0.0` is the bottom of the frame, `uv.y = 1.0` is the top.
- Wood shaders interpret UV as a cut surface.
- Leaf litter and soil shaders interpret `uv.y` as vertical depth through the profile.

In Three.js, pass them into a `ShaderMaterial` and render them to a plane, screen quad, or framebuffer used by later growth stages.
