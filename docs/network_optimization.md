# Network Optimization

Implementation notes for fungal transport networks, centered on **Bebber et al. (2007)** and related biological-network literature.

## 1. Introduction

Fungal mycelia interest network scientists because they grow, repair, reinforce, and prune themselves without central control. A colony must simultaneously:
- explore space,
- exploit discovered nutrient patches,
- keep transport costs low,
- survive breakage, grazing, drying, and competition.

Unlike roads or pipes, fungal networks are alive: edges can thicken, shrink, fuse, or disappear as resource flux changes.

## 2. Key Papers

### Bebber et al. 2007
- **Bebber, D. P., Hynes, J., Darrah, P. R., Boddy, L., & Fricker, M. D. (2007)**, *Biological Solutions to Transport Network Design*, Proc. R. Soc. B.
- Showed that fungal networks can approach efficient cost-performance tradeoffs comparable to engineered transport systems.
- Important for this repo because it justifies flux-driven reinforcement and selective pruning.

### Tero et al. 2010
- **Tero, A. et al. (2010)**, *Rules for Biologically Inspired Adaptive Network Design*, Science.
- Focused on *Physarum polycephalum*, but the adaptive conductance logic is highly transferable.
- Useful as a mathematical template for edge-thickening shaders.

### Boddy and Fricker reviews
- Lynne Boddy and Mark Fricker's reviews on cord-forming fungi, resource translocation, and fungal ecology explain how local foraging decisions scale into large transport networks.
- These papers are especially useful for differentiating exploratory margins from reinforced transport cords.

## 3. The Bebber Rules

A practical seven-rule interpretation for hyphal network simulation:

### Rule 1: Tip growth
Only apical cells extend. Existing hyphae mostly transport, branch, fuse, or differentiate.
- Shader consequence: growth should advance from active front pixels or agent tips, not by uniformly dilating the whole mask.

### Rule 2: Branching
Branches appear at intervals set by age, geometry, and local resources.
- Resource-rich fronts branch more.
- Crowded fronts branch less.
- A refractory distance behind the tip prevents unrealistic fuzz.

### Rule 3: Anastomosis
Nearby compatible hyphae can fuse with a probability controlled by encounter rate and recognition.
- Fusion should be spatially local and compatibility-gated.
- Not every crossing becomes a loop.

### Rule 4: Resource allocation
Resources move preferentially through low-resistance, high-capacity paths.
- In thick cords, flow is approximately consistent with **Hagen-Poiseuille** scaling, where conductance rises strongly with radius.
- Wider edges should carry disproportionately more flux.

### Rule 5: Reinforcement
High-flux edges thicken.
- This is the key step that turns a fuzzy exploratory web into a hierarchy of trunks and side branches.
- In code, flux can update radius, opacity, brightness, or persistence.

### Rule 6: Pruning
Low-flux edges retract or become visually subordinate.
- Pruning lowers maintenance cost.
- This is essential for capturing the efficiency-versus-cost tradeoff seen in real fungal colonies.

### Rule 7: Exploration-exploitation tradeoff
The colony must continue outward searching while maintaining profitable connections.
- Excess exploration wastes biomass.
- Excess exploitation traps the colony in old patches.
- Good visuals keep both a dynamic frontier and a stabilized interior.

## 4. Comparison to Slime Mold

Fungal mycelia are often compared with slime-mold transport networks, but they are not the same system.

| Feature | Fungal mycelium | *Physarum* slime mold |
|---|---|---|
| Growth mode | Tip-growing filaments | Contractile tubular sheet/network |
| Persistence | Hyphae can remain for long periods | Tubes reorganize rapidly with shuttle streaming |
| Hierarchy | Strong trunk-to-branch differentiation | Often less hierarchically fixed |
| Fusion logic | Genetic compatibility matters | No fungal-style het system |
| Transport | Cytoplasmic streaming, diffusion, mass flow in cords | Oscillatory shuttle streaming |

This repo therefore benefits from borrowing adaptive-network math from slime mold while keeping fungal biology for morphology and decision rules.

## 5. Network Metrics

### Efficiency
A common graph-theoretic metric is global efficiency, based on inverse shortest-path distance between nodes.
- High efficiency means resources can move quickly between patches.
- Fungal loops improve efficiency after damage.

### Resilience
Resilience is the ability to keep functioning after edge removal.
- Anastomosis and redundant cords raise resilience.
- Completely tree-like growth is cheap but fragile.

### Cost
Cost is roughly total biomass investment: total edge length multiplied by thickness.
- Real fungi do not maximize connectivity indiscriminately because thick cords are expensive.

### Fault tolerance
Fault tolerance measures how gracefully a network degrades when paths are cut.
- Fungal systems often accept moderate redundancy rather than perfect minimality.

## 6. Implementation in Shaders

The repository's shader families map naturally to the seven rules:

| Shader | Primary role | Relevant rules |
|---|---|---|
| `_white_rot_lace_base.frag` | Baseline wood-colonizing hyphal pattern | 1, 2, 3 |
| `growth_wood_white_rot.frag` | Exploratory white-rot mesh | 1, 2, 3, 7 |
| `growth_wood_brown_rot.frag` | Aggressive front with sparse interior support | 1, 2, 7 |
| `growth_soil_mycorrhizal.frag` | Root-seeking bidirectional network | 2, 4, 5, 7 |
| `growth_wood_cord_former.frag` | Cord/rhizomorph differentiation | 4, 5, 6 |
| `growth_host_pathogen.frag` | Host-tracking invasion front | 1, 2, 7 |
| `growth_soil_sclerotium.frag` | Storage-heavy, stress-tolerant strategy | 5, 6, 7 |
| `growth_gill_ink_cap.frag` | Fruiting-body linked developmental geometry | 2, 7 |
| `growth_wood_bioluminescent.frag` | Metabolically active luminous cords | 4, 5 |
| `network_flow_visualization.frag` | Flux, pressure, and direction overlays | 4, 5 |
| `network_anastomosis_detection.frag` | Fusion / compatibility overlay | 3 |
| `decay_hardwood_white_rot.frag` | Delignification field | 4, 5, 6 |
| `decay_softwood_brown_rot.frag` | Cellulose-loss and crack field | 4, 6 |

Practical mapping ideas:
- Rule 1 -> update only frontier pixels or agent tips.
- Rule 2 -> branch from age + nutrient threshold.
- Rule 3 -> fuse when tips enter a capture radius and compatibility passes.
- Rule 4 -> solve or approximate flux on the current graph.
- Rule 5 -> map flux to radius/brightness.
- Rule 6 -> decay thickness when flux stays below threshold.
- Rule 7 -> keep a fraction of resources reserved for frontier growth.

## 7. Mathematical Formulation

### Kirchhoff-style network flow
Treat nodes as junctions and edges as conductive links.

At each node `i`:

`sum_j Q_ij = S_i`

where `Q_ij` is flux between nodes `i` and `j`, and `S_i` is a source or sink term.

For each edge:

`Q_ij = C_ij (P_i - P_j)`

where `C_ij` is conductance and `P_i - P_j` is the pressure or potential difference.

### Adaptive conductance
A biologically inspired update is:

`dC_ij/dt = alpha * |Q_ij|^beta - mu * C_ij`

- `alpha`: reinforcement gain
- `beta`: nonlinearity of response
- `mu`: maintenance / decay term

If `beta > 1`, high-flux links dominate strongly; if `beta < 1`, reinforcement is more distributed.

### Radius and Hagen-Poiseuille intuition
For cylindrical conduits, hydraulic conductance scales approximately with the fourth power of radius:

`C ~ r^4 / (8 eta L)`

where `eta` is viscosity and `L` is edge length.

Real cords are more complex than ideal pipes, but the qualitative result holds: a slightly thicker edge can carry much more flow.

## 8. Emergent Properties

### Small-world behavior
Because anastomosis adds shortcuts, fungal networks can reduce path length without becoming fully dense.

### Broad degree distribution
Most nodes have low degree, while a minority of junctions become hubs or trunk intersections. In some datasets this approaches a broad or scale-free-like distribution rather than a uniform lattice.

### Modularity
Colonies often organize into semi-independent foraging sectors linked by major cords.
- Modular structure helps local damage stay local.
- It also supports multi-patch exploration in noisy substrates.

### Adaptive hierarchy
The most fungal emergent property is hierarchy: thin exploratory hyphae feed into thicker transport routes, which are then selectively maintained.

## Implementation Notes
- Use local rules, but compute global-looking consequences through repeated feedback.
- Pair a growth pass with a transport pass for the most convincing results.
- Keep loops valuable but not ubiquitous; fungal networks are neither pure trees nor uniform meshes.
