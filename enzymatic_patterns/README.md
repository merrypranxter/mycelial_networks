# enzymatic_patterns

These shaders visualize decay as an enzymatic geography rather than a uniform color wash. Fungi alter wood texture because they secrete different enzyme suites into the substrate, and those suites attack different polymers. **White rot** fungi deploy oxidative enzymes such as **lignin peroxidase**, **manganese peroxidase**, and **laccase**, allowing them to delignify the wall matrix and bleach wood as lignin is removed. **Brown rot** fungi rely more heavily on cellulose- and hemicellulose-focused systems, including **endoglucanase**, **exoglucanase**, and **beta-glucosidase**, often paired with non-enzymatic oxidative chemistry, leaving the lignin-rich residue brown and crumbly.

The visible patterns of decay follow substrate anatomy. Where lignin is oxidized, vessel walls pale, grain contrast softens, and a blue-white reactive halo can appear in visualization. Where cellulose is preferentially removed, the wall framework hollows out, mechanical integrity drops, and crack networks emerge. Laccase-driven oxidation can also stain phenolic material blue-gray, especially along vessel paths or in organic-rich soil microsites.

## Files

- `enzymatic_lignin_peroxidase.frag` — bleaching front and blue-white oxidative halo characteristic of white rot delignification.
- `enzymatic_cellulase_front.frag` — brown rot cellulose removal, wall collapse, and crack initiation.
- `enzymatic_laccase_stain.frag` — blue-gray phenolic staining on wood or soil.

## Enzyme Background

### White rot oxidative enzymes
- **Lignin peroxidase (LiP)** attacks non-phenolic lignin structures and contributes to the pale bleaching front.
- **Mn peroxidase (MnP)** generates diffusible oxidants, extending attack away from the immediate hyphal wall.
- **Laccase** oxidizes phenolics and is visually associated here with cool blue-gray staining and oxidation clouds.

### Brown rot carbohydrate-active enzymes
- **Endoglucanase** opens cellulose chains internally.
- **Exoglucanase** trims chain ends and releases cellobiose.
- **Beta-glucosidase** converts cellobiose into glucose.

Together these activities remove the carbohydrate scaffold more quickly than the lignin matrix, which is why brown-rotted wood darkens, shrinks, and fractures into brittle cubical or irregular residues.

## Uniforms

All shaders use:

- `uniform float u_time;`
- `uniform vec2 u_resolution;`

Additional uniforms:

- `enzymatic_lignin_peroxidase.frag`
  - `uniform float u_enzyme_concentration;` — oxidative enzyme intensity from `0.0` to `1.0`.
- `enzymatic_cellulase_front.frag`
  - `uniform float u_decay_stage;` — progression from intact wood (`0.0`) to advanced collapse (`1.0`).
- `enzymatic_laccase_stain.frag`
  - `uniform float u_substrate_type;` — `0.0` for wood, `1.0` for soil.

These shaders are designed to make biochemical decomposition legible as texture, hue, and motion.
