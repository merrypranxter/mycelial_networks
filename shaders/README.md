# Shaders

This directory contains the GLSL fragment shaders for `mycelial_networks`: fungal growth studies, transport overlays, and substrate-decay passes inspired by real mycology.

## Shader Index

| Filename | Species/Type | Description | Key Uniforms |
|---|---|---|---|
| `_white_rot_lace_base.frag` | White-rot saprotroph / base study | Baseline wood-colonizing hyphal lace with branching and anastomosis glow | `u_time`, `u_resolution` |
| `growth_wood_white_rot.frag` | *Phanerochaete chrysosporium*, *Trametes versicolor* | White-rot colony growth on lignified wood; pale branching mesh with bleaching halo | `u_growthRate`, `u_branchRate`, `u_decayMix`, `u_moisture` |
| `growth_wood_brown_rot.frag` | *Gloeophyllum trabeum*, *Serpula lacrymans* | Brown-rot exploratory front with cellulose-targeted substrate loss and warmer core tones | `u_growthRate`, `u_branchRate`, `u_celluloseFraction`, `u_decayMix` |
| `growth_soil_mycorrhizal.frag` | Ectomycorrhizal web | Root-associated soil network emphasizing exchange corridors and patch linking | `u_rootAttractor`, `u_fluxGain`, `u_nutrientBias`, `u_moisture` |
| `growth_wood_cord_former.frag` | Cord former / rhizomorph study | Thick transport trunks, cord hierarchy, and long-distance foraging structure | `u_cordWidth`, `u_fluxGain`, `u_pruneThreshold`, `u_growthRate` |
| `growth_host_pathogen.frag` | Pathogenic invasion | Host-tracking, lesion-focused invasive growth with aggressive front behavior | `u_pathogenAggression`, `u_growthRate`, `u_branchRate`, `u_moisture` |
| `growth_soil_sclerotium.frag` | Sclerotium-forming survival strategy | Dense storage-oriented growth with dormancy and stress responses | `u_sclerotiumDormancy`, `u_branchRate`, `u_moisture`, `u_nutrientBias` |
| `growth_gill_ink_cap.frag` | Ink-cap developmental study | Fruiting-associated network patterns and deliquescent gill-inspired dissolution motifs | `u_growthRate`, `u_branchAngle`, `u_decayMix`, `u_time` |
| `growth_wood_bioluminescent.frag` | Bioluminescent wood colonizer | Foxfire-like luminous network with metabolically active glowing cords | `u_biolumIntensity`, `u_fluxGain`, `u_moisture`, `u_growthRate` |
| `network_flow_visualization.frag` | Transport overlay | Visualizes flux, pressure, and edge reinforcement across an established network | `u_fluxGain`, `u_cordWidth`, `u_feedbackTex`, `u_resolution` |
| `network_anastomosis_detection.frag` | Fusion / compatibility overlay | Highlights candidate fusion zones, loop formation, and incompatibility barriers | `u_fusionRadius`, `u_compatibility`, `u_feedbackTex`, `u_resolution` |
| `decay_hardwood_white_rot.frag` | White-rot decay field | Hardwood delignification, bleaching, and pore-forming oxidative decay pass | `u_decayMix`, `u_ligninFraction`, `u_substrateTex`, `u_moisture` |
| `decay_softwood_brown_rot.frag` | Brown-rot decay field | Softwood cellulose loss, shrinkage, and cubical cracking pattern pass | `u_decayMix`, `u_celluloseFraction`, `u_substrateTex`, `u_moisture` |

## Naming Conventions

- `growth_*` shaders generate colony form, tip advance, branching, or developmental morphology.
- `network_*` shaders focus on transport, fusion, or graph-style overlays.
- `decay_*` shaders focus on substrate transformation and post-colonization chemistry.
- Leading-underscore files such as `_white_rot_lace_base.frag` are base studies, prototypes, or shared visual references.
- Habitat / substrate cues are embedded in the middle of filenames: `wood`, `soil`, `host`, `hardwood`, `softwood`.

## WebGL Compatibility Notes

- The current base shader is written in a WebGL 1.0 friendly GLSL ES style (`precision highp float`, `gl_FragColor`).
- Keep loop bounds constant where possible for mobile and older desktop drivers.
- If porting to WebGL2 / GLSL ES 3.00, update `gl_FragColor`, `varying`, and attribute syntax accordingly.
- Feedback-based versions should use ping-pong framebuffers, because a single fragment pass cannot preserve colony state across frames by itself.
- Shadertoy users can map `iTime` -> `u_time` and `iResolution.xy` -> `u_resolution` for quick experiments.
