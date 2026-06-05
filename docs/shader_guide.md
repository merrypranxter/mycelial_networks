# Shader Guide

How to use the shaders in `mycelial_networks` in Shadertoy, Three.js, or raw WebGL.

## 1. Overview

These shaders visualize fungal growth, transport, decay, fusion, and substrate response. They are best suited to:
- generative art,
- biologically inspired UI backgrounds,
- simulation sketches,
- experimental ecology visualizations,
- educational demos about mycelial organization.

The repository mixes:
- **growth shaders** for colony form,
- **network shaders** for flow and fusion,
- **decay shaders** for substrate transformation,
- a **base shader** for the core white-rot lace aesthetic.

## 2. Quick Start (Shadertoy)

1. Create a new Shadertoy fragment shader.
2. Paste the GLSL from one of the `.frag` files into the `Image` pass.
3. Map Shadertoy uniforms to repo conventions:
   - `iTime` -> `u_time`
   - `iResolution.xy` -> `u_resolution`
4. Replace the entry point if needed:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    // ... shader logic ...
    fragColor = vec4(color, 1.0);
}
```

If a shader expects biological parameters, add them as extra uniforms in a local environment such as Three.js, because vanilla Shadertoy exposes only its built-in uniform set unless you hard-code constants.

## 3. Three.js Setup

Minimal fragment-shader setup:

```js
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.style.margin = '0';
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = await fetch('./shaders/_white_rot_lace_base.frag').then(r => r.text());

const uniforms = {
  u_time: { value: 0 },
  u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  u_growthRate: { value: 0.65 },
  u_branchRate: { value: 0.28 },
  u_fusionRadius: { value: 0.03 },
  u_fluxGain: { value: 1.0 },
  u_decayMix: { value: 0.35 },
  u_biolumIntensity: { value: 0.0 }
};

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms
});

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(mesh);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  uniforms.u_time.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}
animate();
```

Notes:
- The current base shader already uses `u_time` and `u_resolution`.
- Future shaders can share the same uniform block and ignore values they do not need.
- Use `RawShaderMaterial` only if you want tighter control over GLSL boilerplate.

## 4. Raw WebGL Setup

```html
<canvas id="c"></canvas>
<script>
const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl');
canvas.width = innerWidth;
canvas.height = innerHeight;
gl.viewport(0, 0, canvas.width, canvas.height);

const vertexSource = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentSource = `
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 color = vec3(uv, 0.5 + 0.5 * sin(u_time));
  gl_FragColor = vec4(color, 1.0);
}
`;

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

const program = gl.createProgram();
gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramInfoLog(program));
}
gl.useProgram(program);

const quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1,  1, -1, -1,  1,
  -1,  1,  1, -1,  1,  1
]), gl.STATIC_DRAW);

const positionLoc = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

const timeLoc = gl.getUniformLocation(program, 'u_time');
const resLoc = gl.getUniformLocation(program, 'u_resolution');

function frame(t) {
  gl.uniform1f(timeLoc, t * 0.001);
  gl.uniform2f(resLoc, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
</script>
```

## 5. Uniform Reference

Canonical uniform set across the shader families:

| Uniform | Type | Meaning | Used by |
|---|---|---|---|
| `u_time` | `float` | Elapsed seconds | all shaders |
| `u_resolution` | `vec2` | Viewport size in pixels | all shaders |
| `u_growthRate` | `float` | Tip extension speed | growth shaders |
| `u_branchRate` | `float` | Branch initiation probability | growth shaders |
| `u_branchAngle` | `float` | Preferred branching spread | growth shaders |
| `u_fusionRadius` | `float` | Anastomosis capture radius | growth + anastomosis |
| `u_compatibility` | `float` | Probability of self-compatible fusion | anastomosis / sector shaders |
| `u_tipNoise` | `float` | Directional wander amplitude | growth shaders |
| `u_nutrientBias` | `float` | Strength of substrate-guided turning | growth + decay |
| `u_fluxGain` | `float` | Reinforcement response to flow | network flow / cord shaders |
| `u_pruneThreshold` | `float` | Flux below which edges shrink | network flow / cord shaders |
| `u_cordWidth` | `float` | Base cord thickness | cord-former / flow shaders |
| `u_decayMix` | `float` | Visual blend between intact and decayed substrate | decay shaders |
| `u_ligninFraction` | `float` | Relative lignin presence in substrate | wood-decay shaders |
| `u_celluloseFraction` | `float` | Relative cellulose presence | wood-decay shaders |
| `u_moisture` | `float` | Water availability field or scalar | wood / soil shaders |
| `u_rootAttractor` | `vec2` or texture | Root position / attractor field | mycorrhizal shaders |
| `u_pathogenAggression` | `float` | Host-tracking invasion intensity | pathogen shader |
| `u_sclerotiumDormancy` | `float` | Transition toward storage-state behavior | sclerotium shader |
| `u_biolumIntensity` | `float` | Luminous emission strength | bioluminescent shader |
| `u_feedbackTex` | `sampler2D` | Previous-frame state for ping-pong simulation | feedback-based variants |
| `u_substrateTex` | `sampler2D` | Wood grain, soil, or nutrient map | substrate-aware shaders |

## 6. Ping-Pong Texture Technique

For true agent-like growth, render into alternating framebuffers:
1. Read previous state from texture A.
2. Write updated state into texture B.
3. Swap A and B.
4. Use the new texture for the next frame.

Typical state channels:
- `R`: biomass density
- `G`: nutrient reserve
- `B`: age / flux / decay marker
- `A`: occupancy or mask

This lets you accumulate persistent trails, branch memory, pruning history, and substrate depletion. Without ping-pong feedback, a fragment shader only redraws an illusion each frame.

## 7. Compositing Layers

A good multi-pass stack is:
1. **Substrate pass** - wood grain, soil gradient, litter texture
2. **Environmental pass** - moisture, temperature, pH, competitors
3. **Growth pass** - hyphal occupancy and branching
4. **Network pass** - flux, reinforcement, anastomosis overlays
5. **Decay pass** - lignin bleaching or brown-rot cracking
6. **Emission pass** - bioluminescence or stress glow
7. **Composite pass** - color grading, bloom, fog, vignette

This separation keeps biological logic legible and makes it easier to mix white rot, brown rot, and mycorrhizal scenes.

## 8. Performance Notes

- Prefer fixed loop bounds for WebGL 1.0 compatibility.
- Avoid very large nested loops on mobile GPUs.
- Use `mediump` only if the shader remains stable; branching and feedback often look better with `highp`.
- Keep noise calls under control; layered FBM can dominate cost.
- For feedback simulations, store state in low-resolution buffers and upscale for display.
- If you port to WebGL2, you can improve structure with multiple render targets and modern GLSL syntax.

## 9. Shader Index

| Shader | File | Purpose | Key uniforms |
|---|---|---|---|
| Base white-rot lace | `_white_rot_lace_base.frag` | Minimal wood + mycelium aesthetic | `u_time`, `u_resolution` |
| White-rot growth | `growth_wood_white_rot.frag` | Fine branching mesh over hardwood | `u_growthRate`, `u_branchRate`, `u_decayMix` |
| Brown-rot growth | `growth_wood_brown_rot.frag` | Sparse support network with aggressive substrate loss | `u_growthRate`, `u_branchRate`, `u_ligninFraction` |
| Mycorrhizal growth | `growth_soil_mycorrhizal.frag` | Root-oriented soil web and exchange zones | `u_rootAttractor`, `u_fluxGain`, `u_nutrientBias` |
| Cord former | `growth_wood_cord_former.frag` | Rhizomorph / cord hierarchy | `u_cordWidth`, `u_fluxGain`, `u_pruneThreshold` |
| Host pathogen | `growth_host_pathogen.frag` | Invasive host colonization front | `u_pathogenAggression`, `u_growthRate`, `u_moisture` |
| Sclerotium former | `growth_soil_sclerotium.frag` | Dormancy and compact survival-body behavior | `u_sclerotiumDormancy`, `u_branchRate`, `u_moisture` |
| Ink-cap growth | `growth_gill_ink_cap.frag` | Fruiting and deliquescent gill motifs | `u_growthRate`, `u_branchAngle`, `u_decayMix` |
| Bioluminescent growth | `growth_wood_bioluminescent.frag` | Foxfire-like luminous cords | `u_biolumIntensity`, `u_fluxGain`, `u_moisture` |
| Flow visualization | `network_flow_visualization.frag` | Direction, pressure, and throughput overlay | `u_fluxGain`, `u_cordWidth`, `u_feedbackTex` |
| Anastomosis detection | `network_anastomosis_detection.frag` | Highlights fusion zones and incompatibility barriers | `u_fusionRadius`, `u_compatibility`, `u_feedbackTex` |
| Hardwood white-rot decay | `decay_hardwood_white_rot.frag` | Delignification and bleaching fields | `u_decayMix`, `u_ligninFraction`, `u_substrateTex` |
| Softwood brown-rot decay | `decay_softwood_brown_rot.frag` | Cellulose loss and cubical crack fields | `u_decayMix`, `u_celluloseFraction`, `u_substrateTex` |
