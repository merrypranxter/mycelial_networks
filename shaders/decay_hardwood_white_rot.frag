// decay_hardwood_white_rot.frag
// Decay texture: English oak (Quercus robur) cross-section under white rot
// Biology: Simultaneous delignification and cellulose hydrolysis by basidiomycetes
//   such as Phanerochaete chrysosporium, Trametes versicolor, Ganoderma applanatum.
//   As both polymers are removed, the once-brown cell walls bleach toward white.
//   Annual rings remain visible as ghost structures — their density differences
//   leave slightly different rates of decay, creating concentric pale bands.
//   Vessel lumens (large pores in ring-porous oak): still present as larger voids.
//   Fibre cells and ray parenchyma: completely consumed → lace-like void spaces.
//   End-stage: near-white spongy mass with ghost ring pattern and large voids.
// Reference: Blanchette (1991), Rayner & Boddy (1988), Schwarze et al. (2000)

precision highp float;

uniform float u_time;        // slow animation for settling / shrinkage effect
uniform vec2  u_resolution;
uniform float u_decay_age;   // 0.0 = fresh oak cross-section → 1.0 = fully decayed

#define PI 3.14159265359

// ── Utilities ────────────────────────────────────────────────────────────────

float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 47.53);
    return fract(p.x * p.y);
}

float hash1(float n) {
    return fract(sin(n * 127.1) * 43758.5453);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i),             hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i+vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm4(vec2 p) {
    return vnoise(p)        * 0.5000
         + vnoise(p * 2.13) * 0.2500
         + vnoise(p * 4.37) * 0.1250
         + vnoise(p * 8.71) * 0.0625;
}

// ── Annual ring pattern (cross-section view = concentric rings) ───────────────

float annualRings(vec2 uv) {
    // Cross-section: true concentric rings centred near centre of frame
    vec2  pith = vec2(0.5, 0.52);  // pith at slight offset
    float r    = length(uv - pith) * 3.5;

    // Domain-warp for natural ellipticity and small-scale irregularity
    float wx = fbm4(uv * 3.0 + vec2(1.1, 0.0)) * 0.15;
    float wy = fbm4(uv * 3.0 + vec2(0.0, 1.4)) * 0.10;
    float rWarp = length((uv + vec2(wx, wy)) - pith) * 3.5;

    // Ring: alternating early-wood (wide, light) and late-wood (narrow, dark)
    float rings = sin(rWarp * 14.0) * 0.5 + 0.5;
    return rings;
}

// ── Oak vessel pattern (ring-porous) ─────────────────────────────────────────

// Large vessels in early-wood: big open circles at each annual ring start
float vesselLumens(vec2 uv) {
    vec2  pith = vec2(0.5, 0.52);
    float r    = length(uv - pith) * 3.5;

    // Vessels cluster at early-wood band (rings with low 'rings' value)
    float ringPhase = fract(r * 14.0 / (2.0 * PI));
    float earlyWood = smoothstep(0.0, 0.25, ringPhase)
                    * smoothstep(0.50, 0.25, ringPhase);

    // Individual vessel positions: sparse, large (100–300 µm = ~2–6% of cross-section)
    float vesselPattern = 0.0;
    for (float i = 0.0; i < 22.0; i++) {
        float ang = i * 2.39996;
        float rv  = 0.08 + hash1(i * 1.618) * 0.35;
        vec2  pos = pith + vec2(cos(ang), sin(ang)) * rv;
        pos       += vec2(hash1(i * 3.1) - 0.5, hash1(i * 5.7) - 0.5) * 0.04;
        float d   = length(uv - pos);
        float vrad = 0.008 + hash1(i * 7.3) * 0.010;
        vesselPattern += smoothstep(vrad, vrad * 0.3, d) * earlyWood;
    }
    return clamp(vesselPattern, 0.0, 1.0);
}

// ── Ray parenchyma: radial lines ──────────────────────────────────────────────

float rayParenchyma(vec2 uv) {
    vec2  pith = vec2(0.5, 0.52);
    float ang  = atan(uv.y - pith.y, uv.x - pith.x);
    // Ray cells as fine radial streaks
    float rays = vnoise(vec2(ang * 8.0 + 2.3, length(uv - pith) * 5.0)) * 0.6
               + vnoise(vec2(ang * 16.0 + 5.1, length(uv - pith) * 10.0)) * 0.3;
    return rays;
}

// ── Cell-wall lace voids (white rot consumption) ──────────────────────────────

float laceVoids(vec2 uv) {
    // High-frequency voids where both polymers removed: concentric and radial
    float rings = annualRings(uv);
    float angle = atan(uv.y - 0.52, uv.x - 0.5);
    float r     = length(uv - vec2(0.5, 0.52));

    // Void pattern follows cell-wall geometry: concentric + radial fine mesh
    float concentric = sin(r * 80.0) * 0.5 + 0.5;
    float radial     = sin(angle * 45.0) * 0.5 + 0.5;
    float mesh       = concentric * radial;

    // Modulate by fbm for organic irregularity
    float noiseMask = fbm4(uv * 12.0) * 0.6 + 0.4;
    return mesh * noiseMask;
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2  uv   = gl_FragCoord.xy / u_resolution.xy;
    float decay = clamp(u_decay_age, 0.0, 1.0);

    float rings   = annualRings(uv);
    float vessels = vesselLumens(uv);
    float rays    = rayParenchyma(uv);
    float voids   = laceVoids(uv);

    // ── Fresh oak (decay = 0) ──────────────────────────────────────────────────
    // Early-wood: pale tan; late-wood: dark brown; vessels: open pores
    vec3 earlyWoodCol  = vec3(0.65, 0.48, 0.28);
    vec3 lateWoodCol   = vec3(0.35, 0.22, 0.11);
    vec3 rayCol        = vec3(0.52, 0.36, 0.20);

    vec3 freshOak = mix(lateWoodCol, earlyWoodCol, rings);
    freshOak = mix(freshOak, rayCol, rays * 0.3);
    // Vessel lumens: open holes (darker, near-black)
    freshOak = mix(freshOak, vec3(0.06, 0.04, 0.02), vessels * 0.95);

    // ── Decay transformation ───────────────────────────────────────────────────
    // Both polymers removed → bleaching toward white
    // Ghost rings persist (density difference) but very faint

    // Stage 1 (0–0.4): mild bleaching, cell walls thinning
    // Stage 2 (0.4–0.7): ghost rings, lacy voids appearing
    // Stage 3 (0.7–1.0): near-white mass, only ghost of ring structure

    // Ghost ring signal: faint remnant even at full decay
    float ghostRing = mix(1.0, 0.12, decay) * rings;

    // Bleached base colour
    vec3 bleached1 = vec3(0.78, 0.75, 0.68);  // early bleach: still warm
    vec3 bleached2 = vec3(0.94, 0.92, 0.88);  // advanced: near white
    vec3 bleached3 = vec3(0.98, 0.97, 0.95);  // fully decayed: bright white
    vec3 decayBase = mix(bleached1,
                         mix(bleached2, bleached3, clamp((decay - 0.7) * 3.3, 0.0, 1.0)),
                         clamp(decay * 1.3, 0.0, 1.0));

    // Ghost ring overlay
    vec3 ghostRingCol = mix(decayBase * 0.88, decayBase, ghostRing);

    // Lace voids appear progressively
    float voidAge  = clamp((decay - 0.3) * 2.5, 0.0, 1.0);
    float voidMask = voids * voidAge;
    // Void = near-black (air space / true hole)
    vec3 withVoids = mix(ghostRingCol, vec3(0.03, 0.02, 0.01), voidMask * 0.88);

    // Vessels remain as large voids but widen slightly
    float vesselDecay = mix(vessels, vessels * 1.3, decay);
    withVoids = mix(withVoids, vec3(0.02, 0.01, 0.005), clamp(vesselDecay, 0.0, 1.0) * 0.95);

    // Blend fresh → decayed
    vec3 color = mix(freshOak, withVoids, decay);

    // Slow settling texture variation (wood drying, slight shrinkage)
    float settle = sin(u_time * 0.05) * 0.5 + 0.5;
    color += vec3(0.01) * settle * decay * 0.2;

    // Vignette
    float vig = 1.0 - smoothstep(0.44, 0.88, length(uv - vec2(0.5)));
    color *= vig;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
