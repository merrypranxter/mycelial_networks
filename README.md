# mycelial_networks

A creative coding project exploring **mycelial network growth** — the branching, adaptive, nutrient-seeking structures formed by fungal hyphae, operating as decentralized intelligence networks that optimize for efficiency, resilience, and opportunistic expansion.

## What Are Mycelial Networks?

Unlike slime molds, mycelial networks are persistent, hierarchical branching structures. Hyphae grow from tips, branch at intervals, fuse with compatible neighbors through anastomosis, and redirect resources based on nutrient gradients and transport demand. The result is a living mesh that repairs itself, competes, decomposes substrates, and can eventually fruit.

Key differences from slime molds:
- **Persistent structure**: network remains rather than dissolving whenever conditions shift
- **Tip growth**: only apical zones extend; older hyphae mainly transport and differentiate
- **Anastomosis**: tip fusion creates loops, redundancy, and rerouting capacity
- **Sectoring**: genetically distinct sectors may coexist or reject one another
- **Wood decay**: enzymatic decomposition creates patterned substrate damage and color change

## Project Structure

```
shaders/              # GLSL fragment shaders — network growth simulation
  growth_wood_white_rot.frag
  growth_wood_brown_rot.frag
  growth_soil_mycorrhizal.frag
  growth_wood_cord_former.frag
  growth_host_pathogen.frag
  growth_soil_sclerotium.frag
  growth_gill_ink_cap.frag
  growth_wood_bioluminescent.frag
  network_flow_visualization.frag
  network_anastomosis_detection.frag
  decay_hardwood_white_rot.frag
  decay_softwood_brown_rot.frag
hyphal_types/         # Parameter sets: saprotroph, mycorrhizal, pathogen
substrates/           # Nutrient maps: wood grain, leaf litter, soil horizons
environmental/        # Moisture, temperature, pH, competition fields
fruiting/             # Trigger conditions for mushroom primordia formation
anastomosis/          # Fusion rules, genetic compatibility, sector boundaries
enzymatic_patterns/   # Decay front geometry, lignin degradation textures
docs/                 # Biology references, chemistry, network optimization, shader guide
```

## Running

Shaders are written for WebGL/Three.js. Each shader is self-contained — drop it into any fragment shader environment (Shadertoy, The Book of Shaders editor, local Three.js setup). Stateful growth is most convincing with ping-pong texture feedback or another previous-frame simulation technique.

## Current Network Types

- [x] _white_rot_lace — simultaneous decay of lignin and cellulose, delicate open mesh
- [x] _brown_rot_cubes — selective cellulose removal, cubical cracking patterns
- [x] _mycorrhizal_web — tree-root partnership, bidirectional nutrient flow visualization
- [x] _cord_former — thick rhizomorphs, highway-like resource superhighways
- [x] _pathogen_raid — aggressive necrotrophic growth, host tissue colonization
- [x] _sclerotium_wait — dormant survival bodies, compressed patience
- [x] _ink_cap_dissolution — deliquescence, self-digesting gill liquefaction
- [x] _bioluminescent_network — glowing cords, foxfire, ATP-driven chemiluminescence

## Anastomosis Rules

- **Tip-to-tip**: self-recognition, same genotype = fuse, different = reject
- **Loop formation**: creates redundant pathways and better damage tolerance
- **Sector boundaries**: incompatible fusions produce dense border lines or melanized barriers
- **Nutrient priority**: fused loops redirect flow toward the steepest or most profitable gradients

## References

- Rayner, A. D. M. (1991). *The Challenge of the Fungal Individual*. Mycological Research.
- Boddy, L. (1999). *Fungal Community Ecology and Wood Decomposition Processes*. In: *Fungal Ecology*.
- Bebber, D. P. et al. (2007). *Biological Solutions to Transport Network Design*. Proc. R. Soc. B.
- Tero, A. et al. (2010). *Rules for Biologically Inspired Adaptive Network Design*. Science.
- Cairney, J. W. G. (2005). *Basidiomycete Mycelia in Forest Soils*. FEMS Microbiology Reviews.
- Watkinson, S. C., Boddy, L., & Money, N. P. (2016). *The Fungi*.

## Documentation

- `docs/fungal_biology.md` — comprehensive fungal biology reference
- `docs/network_optimization.md` — Bebber et al. biological network rules, implementation notes
- `docs/wood_decay_chemistry.md` — lignin/cellulose chemistry, white vs. brown rot
- `docs/shader_guide.md` — WebGL/Three.js setup and uniform reference

---

*The forest's nervous system. No brain, yet it learns where to grow, where to wait, and where to fruit.*