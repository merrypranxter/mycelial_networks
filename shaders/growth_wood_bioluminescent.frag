// growth_wood_bioluminescent.frag
// Species: Panellus stipticus (bitter oyster / foxfire fungus)
// Biology: FMNH2-dependent luciferase catalyses oxidation of a reduced riboflavin
//   derivative (FMNH2) in the presence of O2 → FMN + H2O + ~520 nm photon.
//   Emission peak: ~520 nm (vivid blue-green).  Quantum yield ≈ 0.01%.
//   Living cords glow; dead/senescent zones fade.  Glow is CONTINUOUS not flashing
//   (unlike insect bioluminescence), but modulated by a ~24-hour CIRCADIAN RHYTHM
//   driven by the fungal biological clock (compressed here to ~20 s period).
//   Branch points accumulate more luciferase substrate → secondary glow hotspots.
//   Only seen in complete darkness — any ambient light overwhelms the emission.
//   Foxfire: the faint green glow visible on rotting wood in dark forests.
// Reference: Oliveira et al. (2012), Oliveira & Stevani (2009), Pocroft et al. (2020)

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_atp_level;   // 0–1 metabolic activity / FMNH2 availability
uniform float u_darkness;    // 0–1 ambient darkness (1 = pitch dark, 0 = bright)

#define PI     3.14159265359
#define TAU    6.28318530718
#define GOLDEN 2.39996322973

// 520 nm emission in sRGB approx: vivid blue-green
#define FOXFIRE_COLOR vec3(0.02, 0.95, 0.48)

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

vec2 rot2(vec2 v, float a) {
    float c = cos(a), s = sin(a);
    return vec2(v.x*c - v.y*s, v.x*s + v.y*c);
}

// ── Dead night-wood substrate ─────────────────────────────────────────────────

vec3 nightWood(vec2 uv) {
    // Near-black decayed wood, visible only as faint ambient form
    float grain = fbm4(uv * vec2(2.0, 8.0)) * 0.4;
    float micro = vnoise(uv * 60.0) * 0.12;
    // Very dark — barely perceptible wood structure in darkness
    return mix(vec3(0.008, 0.005, 0.003), vec3(0.025, 0.018, 0.010), grain + micro);
}

// ── Circadian rhythm modulation ────────────────────────────────────────────────

// ~24h clock compressed to 20s. Smooth sinusoidal with slight asymmetry.
float circadianPhase() {
    float cycle = u_time * (TAU / 20.0);  // 20 second period = compressed 24h
    // Slightly asymmetric wave: longer bright phase than dark (peak ~60% of cycle)
    float wave = sin(cycle) * 0.5 + 0.5;
    wave       = pow(wave, 0.7);  // flatten dark trough slightly
    return wave;
}

// ── Single glowing cord ───────────────────────────────────────────────────────

// Returns vec2: .x = cord presence, .y = branch-point glow accumulation
vec2 glowCord(vec2 uv, vec2 origin, vec2 initDir, float seed, float thick) {
    vec2 pos  = origin;
    vec2 dir  = normalize(initDir);
    float cordAcc   = 0.0;
    float branchAcc = 0.0;
    float stepSz    = 0.018;

    for (float j = 0.0; j < 28.0; j++) {
        float d = length(uv - pos);

        // Cord itself
        cordAcc += smoothstep(thick, thick * 0.15, d);

        // Branch-point glow: every ~5 steps a node with extra luciferase
        float isBranch = step(0.95, fract(j * 0.199 + seed));
        branchAcc += exp(-d * d * 800.0) * isBranch * 0.5;

        // Tip wander
        float w = (vnoise(pos * 30.0 + seed + u_time * 0.02) - 0.5) * 0.9;
        dir = normalize(rot2(dir, w * 0.65));
        pos += dir * stepSz;
    }
    return vec2(clamp(cordAcc, 0.0, 1.0), clamp(branchAcc, 0.0, 1.0));
}

// ── Full glowing network ──────────────────────────────────────────────────────

vec2 glowingNetwork(vec2 uv) {
    float netCord    = 0.0;
    float netBranch  = 0.0;

    // Primary cords
    for (float i = 0.0; i < 6.0; i++) {
        float ang  = i * GOLDEN + hash1(i * 3.1) * 0.4;
        vec2  dir  = vec2(cos(ang), sin(ang));
        vec2  orig = vec2(0.5) + dir * 0.03;
        vec2  g    = glowCord(uv, orig, dir, i * 13.7, 0.0042);
        netCord   += g.x * 0.9;
        netBranch += g.y;

        // Secondary branches
        for (float k = 0.0; k < 3.0; k++) {
            float bAng  = ang + (k - 1.0) * 0.42 + hash1(i * 11.0 + k) * 0.2;
            vec2  bDir  = vec2(cos(bAng), sin(bAng));
            vec2  bOrig = orig + dir * (0.06 + k * 0.08);
            vec2  bg    = glowCord(uv, bOrig, bDir, i * 19.0 + k * 7.1, 0.0022);
            netCord   += bg.x * 0.55;
            netBranch += bg.y * 0.7;
        }
    }

    // Fine tertiary threads — dimmer (less substrate)
    for (float i = 0.0; i < 8.0; i++) {
        float ang  = i * TAU / 8.0 + hash1(i * 4.1) * 1.2;
        vec2  dir  = vec2(cos(ang), sin(ang));
        vec2  orig = vec2(0.5) + vec2(hash1(i * 2.3) - 0.5, hash1(i * 5.7) - 0.5) * 0.35;
        vec2  g    = glowCord(uv, orig, dir, i * 37.0 + 200.0, 0.0012);
        netCord   += g.x * 0.28;
        netBranch += g.y * 0.4;
    }

    return vec2(clamp(netCord, 0.0, 1.0), clamp(netBranch, 0.0, 1.0));
}

// ── Glow bloom kernel ─────────────────────────────────────────────────────────

// Additive soft bloom: each cord contributes multiple Gaussian halos
float cordBloom(float cordDist) {
    // Tight core + wide soft halo
    return exp(-cordDist * cordDist * 3500.0) * 1.0    // tight core
         + exp(-cordDist * cordDist * 400.0)  * 0.35   // soft halo
         + exp(-cordDist * cordDist * 60.0)   * 0.08;  // very wide ambient
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Base: very dark wood, only visible as shadow
    vec3 color = nightWood(uv);

    // Biological rhythm
    float circ  = circadianPhase();
    float atpEff = u_atp_level * circ;  // effective luciferase activity

    // Network
    vec2 net = glowingNetwork(uv);
    float cord   = net.x;
    float branch = net.y;

    // Glow is purely additive (luminescence adds to darkness)
    // Only visible when dark (u_darkness) AND ATP available
    float glowFactor = atpEff * u_darkness;

    // Core cord glow: tight bright line
    float coreGlow = cord * glowFactor;
    color += FOXFIRE_COLOR * coreGlow * 1.4;

    // Soft bloom halo around cords
    // Simulate bloom by sampling glow from cord field blurred
    float bloomGlow = (cord * 0.6 + cord * cord * 0.4) * glowFactor;
    color += FOXFIRE_COLOR * bloomGlow * 0.6;

    // Ambient scatter: very faint green cast on nearby wood
    color += FOXFIRE_COLOR * glowFactor * 0.06 * (1.0 - cord);

    // Branch-node secondary glow: nutrient-rich nodes accumulate more FMNH2
    float nodeGlow = branch * glowFactor * (0.7 + 0.3 * sin(u_time * 3.5));
    color += mix(FOXFIRE_COLOR, vec3(0.50, 1.0, 0.70), 0.3) * nodeGlow * 0.9;

    // Circadian breathing: subtle pulse of entire network
    float breathPulse = 0.85 + 0.15 * sin(u_time * (TAU / 20.0) + 0.5);
    color *= (1.0 - cord * 0.1) + cord * breathPulse;

    // Dead/senescent zones: no FMNH2 substrate
    // (naturally darker — cord color only present where alive)

    // Vignette (very slight — don't crush the glow)
    float vig = 1.0 - smoothstep(0.46, 0.90, length(uv - vec2(0.5))) * 0.5;
    color *= vig;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
