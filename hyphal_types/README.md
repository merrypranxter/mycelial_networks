# hyphal_types

## Overview

`hyphal_types/` contains JSON agent configs for fungal growth simulations. Each file describes a species-level growth strategy, environmental niche, fusion behavior, enzyme investment, transport direction, and rendering hints so a WebGL or Three.js system can drive branching, substrate choice, and visual styling from a single data object.

## Parameter Schema

Core schema fields used by all configs:

| Field | Type / Range | Biological meaning |
| --- | --- | --- |
| `species` | `string` | Latin binomial for the modeled fungus. |
| `common_name` | `string` | Human-readable species name or ecological label. |
| `strategy` | `"saprotroph" \| "mycorrhizal" \| "pathogen" \| "cord_former" \| "bioluminescent"` | Primary ecological strategy; determines nutrient acquisition logic and host/substrate interactions. |
| `growth_rate` | `float`, 5-200 um/hour | Colony-scale extension capacity under favorable conditions. Higher values fill space faster. |
| `tip_speed` | `float`, 0.1-1.0 | Normalized apical extension speed for each growing tip. Useful for shader or agent timestep scaling. |
| `branching_interval` | `float`, 10-500 um | Mean distance between branch initiation events. Short intervals produce denser mats. |
| `branching_angle` | `float`, 15-90 degrees | Mean divergence angle of lateral branches. Narrow angles produce directed fans; wide angles fill area quickly. |
| `apical_dominance` | `float`, 0-1 | Strength of main-tip suppression on laterals. `0` means laterals grow freely; `1` strongly favors the leading axis. |
| `anastomosis_radius` | `float`, um | Detection radius for self-recognition and possible hyphal fusion. Larger values increase network closure. |
| `anastomosis_frequency` | `float`, 0-1 | Probability that a compatible encounter produces fusion rather than bypassing. |
| `substrate_preference` | `string[]` | Substrates this fungus preferentially colonizes or senses as rewarding. |
| `enzyme_profile` | `object`, each enzyme `0-1` | Relative investment in extracellular enzymes. Core keys are `laccase`, `lignin_peroxidase`, `Mn_peroxidase`, `cellulase`, and `xylanase`; the object can be extended with species-specific chemistry. |
| `moisture_optimum` | `float`, -0.1 to -3.0 MPa | Water potential optimum. Less negative values indicate wetter preferences. |
| `temperature_optimum` | `float`, degrees C | Temperature at which growth is modeled as most efficient. |
| `temperature_range` | `[float, float]` | Lower and upper temperature bounds for active growth. |
| `pH_optimum` | `float`, 3.0-8.0 | Preferred acidity/alkalinity of the substrate microenvironment. |
| `cord_forming` | `boolean` | Whether the species consolidates many hyphae into transport cords or rhizomorphs. |
| `rhizomorph_diameter` | `float \| null`, um | Diameter of mature cords. Use `null` when the species does not form cords. |
| `bioluminescent` | `boolean` | Whether hyphae or associated tissues emit visible light. |
| `bioluminescence_wavelength` | `int \| null`, nm | Peak emission wavelength. Use `null` when not bioluminescent. |
| `nutrient_flow_direction` | `"centripetal" \| "centrifugal" \| "bidirectional" \| null` | Dominant transport direction: toward colony core, toward advancing fronts, both, or unspecified. |
| `HET_loci_count` | `int`, 2-12 | Number of heterokaryon incompatibility loci used as a coarse proxy for self/non-self fusion discrimination. |
| `competitive_strategy` | `"interference" \| "exploitation" \| "antibiosis" \| "passive"` | Main ecological mode of competition: rapid capture, direct obstruction, chemical inhibition, or low-conflict persistence. |
| `visual.primary_color` | `string` | Main rendered hyphal or cord color, typically hex. |
| `visual.secondary_color` | `string` | Accent color for interiors, margins, spores, or branching gradients. |
| `visual.hyphal_thickness_px` | `float` | Suggested screen-space thickness for line or trail rendering. |
| `visual.glow_radius` | `float` | Post-process or sprite glow radius in pixels. Set near `0` for non-luminous species. |

Optional species-specific extension fields used in this directory:

| Field | Type | Meaning |
| --- | --- | --- |
| `enzyme_profile.oxalic_acid` | `float`, 0-1 | Organic-acid mediated host tissue maceration and pH manipulation used by some pathogens. |
| `enzyme_profile.polygalacturonase` | `float`, 0-1 | Pectin-degrading capacity relevant to soft plant tissue invasion. |
| `luciferase_type` | `string` | Describes the light-producing chemistry for bioluminescent taxa. |
| `circadian_rhythm` | `boolean` | Whether emission is modulated by day/night timing. |
| `peak_glow_hours` | `[int, int]` | Local-hour window with strongest visible emission. |

## Usage

Load a config once, then bind its fields into your growth and render systems.

```js
import agentConfig from './hyphal_types/agent_saprotroph_wood_decay.json';

const material = new THREE.ShaderMaterial({
  uniforms: {
    uGrowthRate: { value: agentConfig.growth_rate },
    uTipSpeed: { value: agentConfig.tip_speed },
    uBranchAngle: { value: agentConfig.branching_angle },
    uHyphaColor: { value: new THREE.Color(agentConfig.visual.primary_color) },
    uGlowRadius: { value: agentConfig.visual.glow_radius }
  },
  fragmentShader,
  vertexShader
});
```

Typical mapping in a WebGL/Three.js pipeline:

1. Load the JSON with your bundler or fetch it at runtime.
2. Use the ecological fields to set branching rules, fusion radius, substrate scoring, and transport behavior.
3. Use `visual` fields for the draw pass or particle trails.
4. Combine the config with a substrate shader so growth decisions respond to wood, soil, or litter textures.

## Species Notes

- `agent_saprotroph_wood_decay.json` — *Phanerochaete chrysosporium* is a classic white-rot basidiomycete that aggressively oxidizes lignin and rapidly webs through wood.
- `agent_mycorrhizal_bidirectional.json` — *Suillus luteus* forms ectomycorrhizae with pines, trading soil nutrients for host carbon and transporting resources in both directions.
- `agent_pathogen_necrotrophic.json` — *Botrytis cinerea* is a fast necrotroph that hyper-branches across flowers and fruit while softening host tissues with pectin-active chemistry.
- `agent_cord_former_rhizomorph.json` — *Armillaria mellea* invests in thick rhizomorph highways that move resources through soil and into woody roots.
- `agent_bioluminescent_foxfire.json` — *Panellus stipticus* is a wood-decay saprotroph noted for green foxfire glow, especially under humid night conditions.
