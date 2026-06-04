# mycelial_networks

A creative coding project exploring **mycelial network growth** — the branching, adaptive, nutrient-seeking structures formed by fungal hyphae, operating as decentralized intelligence networks that optimize for efficiency, resilience, and opportunistic expansion.

## What Are Mycelial Networks?

Unlike slime molds (which you already have), mycelial networks are persistent, hierarchical branching structures. Hyphae grow from tips, branch at intervals, fuse with compatible mates (anastomosis), and redirect resources based on nutrient gradients. The result is a mesh that repairs itself, fights contamination, and occasionally produces fruiting bodies (mushrooms) when conditions are right.

Key differences from slime molds:
- **Persistent structure**: network remains; doesn't dissolve when nutrients shift
- **Tip growth**: only apical cells divide; subapical cells differentiate
- **Anastomosis**: tip fusion creates loops, redundancy, circuit-like behavior
- **Sectoring**: genetically distinct sectors compete within a single network
- **Wood decay**: enzymatic decomposition creates patterned substrate damage

## Project Structure

```
shaders/              # GLSL fragment shaders — network growth simulation
hyphal_types/         # Parameter sets: saprotroph, mycorrhizal, pathogen
substrates/           # Nutrient maps: wood grain, leaf litter, soil horizons
environmental/        # Moisture, temperature, pH, competition fields
fruiting/             # Trigger conditions for mushroom primordia formation
anastomosis/          # Fusion rules, genetic compatibility, sector boundaries
enzymatic_patterns/   # Decay front geometry, lignin degradation textures
```

## Running

Shaders are written for WebGL/Three.js. Each shader is self-contained — drop it into any fragment shader environment (Shadertoy, The Book of Shaders editor, local Three.js setup). Agent-based growth requires compute shader or ping-pong texture feedback.

## Current Network Types

- [ ] _white_rot_lace — simultaneous decay of lignin and cellulose, delicate open mesh
- [ ] _brown_rot_cubes — selective cellulose removal, cubical cracking patterns
- [ ] _mycorrhizal_web — tree-root partnership, bidirectional nutrient flow visualization
- [ ] _cord_former — thick rhizomorphs, highway-like resource superhighways
- [ ] _pathogen_raid — aggressive necrotrophic growth, host tissue colonization
- [ ] _sclerotium_wait — dormant survival bodies, compressed patience
- [ ] _ink_cap_dissolution — deliquescence, self-digesting gill liquefaction
- [ ] _bioluminescent_network — glowing cords, foxfire, ATP-driven chemiluminescence

## Anastomosis Rules

- **Tip-to-tip**: self-recognition, same genotype = fuse, different = reject
- **Loop formation**: creates redundant pathways, network resilience
- **Sector boundaries**: incompatible fusions produce dense border lines
- **Nutrient priority**: fused loops direct flow to highest gradient

## References

- Rayner, A. D. M. (1991). *The Challenge of the Fungal Individual*. Mycological Research.
- Boddy, L. (1999). *Fungal Community Ecology and Wood Decomposition Processes*. In: Fungal Ecology.
- Bebber, D. P. et al. (2007). *Biological Solutions to Transport Network Design*. Proc. R. Soc. B.
- Tero, A. et al. (2010). *Rules for Biologically Inspired Adaptive Network Design*. Science.
- Cairney, J. W. G. (2005). *Basidiomycete Mycelia in Forest Soils*. FEMS Microbiology Reviews.
- Fraust, C. J. & Rayner, A. D. M. (1991). *Innate and Intelligent Behaviour*. Mycologist.

---

*The forest's nervous system. No brain, yet it learns where to grow, where to wait, and where to fruit.*