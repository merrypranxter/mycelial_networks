# fruiting

Fruiting bodies emerge when a mycelium shifts from diffuse vegetative expansion to reproductive construction. That transition usually depends on a combination of external cues and internal resource status rather than a single trigger. Common signals include a **drop in temperature**, a **change in photoperiod or day length**, a **pulse of moisture**, and an adequate **carbon:nitrogen balance** that indicates the substrate can support reproduction. Boddy and Frankland both describe fruiting as an environmentally gated developmental program rather than an automatic end state of growth.

The process begins with **primordia formation**: localized knots of hyphae aggregate into tiny pins or initials. If conditions remain favourable, these initials commit to organized tissue differentiation. The **stipe elongates**, lifting the reproductive surface into better airflow, while the **cap expands** and species-specific structures such as gills, pores, rings, or shelf margins become visible. If the environment deteriorates mid-process, primordia may abort, leaving only transient pins in the mycelial mat.

## Files

- `fruiting_primordia_trigger.frag` — fluctuating environmental cues, trigger gauges, and threshold-dependent primordia flashes.
- `fruiting_cap_development.frag` — development from pin to mature fruiting body with species-dependent silhouette.

## Uniforms

All shaders use:

- `uniform float u_time;`
- `uniform vec2 u_resolution;`

Additional uniforms:

### `fruiting_primordia_trigger.frag`
- `uniform float u_temperature_drop;` — magnitude of cooling from `0.0` to `1.0`.
- `uniform float u_day_length;` — photoperiod from `0.0` (short winter day) to `1.0` (long day).
- `uniform float u_moisture_pulse;` — recent rainfall or wetting pulse from `0.0` to `1.0`.

### `fruiting_cap_development.frag`
- `uniform float u_development_stage;` — progression from pin (`0.0`) to mature fruiting body (`1.0`).
- `uniform float u_species_type;` — `0.0` agaric, `1.0` bolete, `2.0` polypore.

## Biological Notes

- Primordia are most likely to appear when **cooling**, **wetting**, and a suitable **shortening day length** converge.
- Fruiting requires carbon reserves and favourable stoichiometry; a rich but imbalanced substrate may support vegetative spread without reproductive commitment.
- Agarics emphasize stipe-plus-cap architecture with gills, boletes replace gills with pores, and polypores often produce shelf-like brackets from wood.

## Reference Context

- Boddy on fungal ecology, resource allocation, and reproductive transitions in decaying wood systems.
- Frankland on the influence of environmental cues and seasonality on fungal sporophore initiation.
