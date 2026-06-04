# environmental

Environmental field shaders describe the physical and chemical landscapes that fungal networks inhabit. In practice these fragment shaders are meant to be layered **under** a mycelial growth pass or composited **over** a substrate shader: the substrate establishes wood, soil, litter, or mineral texture; the environmental pass visualizes the invisible gradients that bias tip extension, enzyme output, and allocation of transport through cords. In a WebGL pipeline, these fields can also be sampled conceptually as decision maps for agent-based growth.

Biologically, the collection focuses on four major controls on fungal behaviour. **Water potential** regulates turgor and therefore whether a hyphal tip can extend at all; matric potential becomes increasingly negative as soil dries, and many saprotrophs are strongly limited below roughly -2 MPa. **Thermal gradients** alter enzyme kinetics, membrane fluidity, and respiration, creating a relatively narrow optimum band with rapid decline at lethal heat. **Nutrient diffusion** governs carbon capture, nitrogen scavenging, and phosphorus foraging, while **antibiosis zones** emerge where competitors secrete inhibitory compounds or deploy overgrowth strategies at territorial boundaries.

## How to Layer These Shaders

- **With substrate shaders**: render the substrate first, then multiply or screen the environmental field into it so the field inherits wood grain, soil pore structure, or litter texture.
- **With growth shaders**: use the environmental pass as a reference for where hyphae should brighten, slow, reorient, or abort. Optimal bands can be treated as chemotropic or hydrotropic targets.
- **With decay / fruiting shaders**: these fields can drive downstream events such as enzyme concentration, primordia initiation, or competition-driven barrage formation.

## Files

- `env_moisture_gradient.frag` — water potential and capillary seep through heterogeneous soil.
- `env_temperature_field.frag` — ambient temperature, solar warming, decomposition heat, and isotherms.
- `env_nutrient_gradient.frag` — carbon, nitrogen, phosphorus, glucose hotspots, and a visual C:N balance map.
- `env_competition_field.frag` — spatial territories, inhibition zones, volatile exudates, and mycoparasitic attack fronts.

## Uniforms

All shaders in this directory share:

- `uniform float u_time;` — animation time in seconds.
- `uniform vec2 u_resolution;` — viewport resolution in pixels.

Additional uniforms are shader-specific:

### `env_moisture_gradient.frag`
- `uniform vec2 u_source_pos;` — normalized water source position, such as a stream margin or seep.
- `uniform float u_evaporation;` — drying rate from `0.0` (retentive, humid) to `1.0` (rapid drying).

### `env_temperature_field.frag`
- `uniform float u_ambient_temp;` — ambient background temperature in °C, intended range `0.0–40.0`.
- `uniform vec2 u_heat_source;` — normalized location of a warm decomposing pocket or buried log.

### `env_nutrient_gradient.frag`
- `uniform vec2 u_carbon_source;` — high-carbon source such as wood, litter, or cellulose-rich debris.
- `uniform vec2 u_nitrogen_source;` — high-nitrogen source such as dung, carrion, or protein-rich patches.

### `env_competition_field.frag`
- `uniform float u_competitor_count;` — number of active competitors from `1.0` to `6.0`.

## Biological Notes

- **Water potential** is shown as a continuum from moist, weakly negative conditions toward drought stress. The green band marks a broad fungal comfort zone where extension is usually possible without severe osmotic penalty.
- **Temperature** is visualized as a growth landscape rather than a neutral backdrop: isotherms show where physiology changes, and the green band highlights approximate mesophilic optima.
- **Nutrient fields** are not static resource icons; they diffuse, overlap, and create stoichiometric imbalances. Carbon-rich patches favour exploratory foraging, while nitrogen-rich pulses can strongly redirect allocation.
- **Competition zones** approximate outcomes described in wood-decay ecology: deadlock, barrage formation, diffuse antibiosis, and active replacement or mycoparasitism.

These shaders are designed as production-ready visualization layers for invisible environmental control surfaces acting on fungal networks.
