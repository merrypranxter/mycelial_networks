# anastomosis

Anastomosis is the fusion of compatible hyphae into a shared transport network. In filamentous fungi this is not merely decorative branching: it establishes redundant loops, redistributes nutrients, repairs local damage, and helps the colony behave as a coordinated physiological individual. Fusion, however, is conditional. Self/non-self recognition at **HET loci** and related vegetative incompatibility systems determines whether approaching tips accept each other, seal off, or trigger a localized incompatibility reaction.

When compatible hyphae meet, adhesion, wall remodeling, and membrane merger allow cytoplasmic continuity. When incompatible hyphae meet, the fusion cell often undergoes rapid death-associated responses including vacuolation, septal plugging, and organelle degradation, preventing unrestricted mixing of genetically distinct cytoplasm. These recognition and rejection systems are central to sectoring, barrage formation, and the patchwork individuality described by Rayner & Boddy in their work on the fungal individual and wood-decay interactions.

## What These Shaders Visualize

- `anastomosis_selfrecognition.frag` — two approaching hyphal tips either fuse cleanly or undergo a red-purple incompatibility reaction depending on `u_het_alleles`.
- `anastomosis_loop_formation.frag` — anastomosis closes transport loops, then redistributes flow through redundant pathways.
- `anastomosis_sector_boundaries.frag` — genetically distinct sectors expand through one substrate, but incompatible contact generates dense melanized boundary lines.

## Key Biology

### HET loci and vegetative incompatibility
Heterokaryon incompatibility systems act as a self-recognition checkpoint. Hyphae sharing compatible allele states can fuse and share resources; mismatched states often trigger programmed rejection at or near the contact cell.

### Self-recognition and loop formation
Within a single compatible mycelium, repeated fusions create loops that improve hydraulic and nutritional resilience. Anastomosis therefore reduces the vulnerability of a tree-like network and helps reroute flow around damaged or low-value paths.

### Sector boundaries
As genetically distinct sectors expand, they produce visible confrontation lines. These margins often become denser, darker, and more melanized than interior growth because they concentrate defense, incompatibility responses, and deadlock.

## Uniforms

All shaders use:

- `uniform float u_time;`
- `uniform vec2 u_resolution;`

Shader-specific uniforms:

- `anastomosis_selfrecognition.frag`
  - `uniform float u_het_alleles;` — compatibility control from `0.0` to `1.0`; lower values favour rejection, higher values favour fusion.
- `anastomosis_loop_formation.frag`
  - `uniform float u_loop_age;` — relative age of the featured loop from newly formed (`0.0`) to established (`1.0`).
- `anastomosis_sector_boundaries.frag`
  - `uniform float u_sector_count;` — number of sectors from `2.0` to `5.0`.

## References

- Rayner, A. D. M. *The Challenge of the Fungal Individual*.
- Rayner, A. D. M. & Boddy, L. *Fungal Decomposition of Wood*.
- Boddy, L. on fungal interaction outcomes and territory formation in decaying wood.
