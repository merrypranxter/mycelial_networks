// growth_wood_white_rot.frag
// Species: Phanerochaete chrysosporium (white rot basidiomycete)
// Biology: Secretes lignin peroxidase (LiP), manganese peroxidase (MnP), and laccase
//   in tandem with cellulases — both lignin AND cellulose are dismantled simultaneously.
//   Result: delicate open lace mesh of near-white residue; void spaces where cell walls
//   fully consumed. Enzymatic halos: peroxidases diffuse ahead of hyphal tips, creating
//   pale bleached zones 0.1–0.3 mm ahead of visible colonisation front.
//   Anastomosis: tip-to-tip fusion events form closed loops; warm cream glow at junctions.
//   Moisture optimum ~30% MC; dry conditions arrest growth (u_moisture effect).
// Reference: Rayner & Boddy (1988), Kirk & Cullen (1998), Hatakka (1994)

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_decay_rate;   // 0.0–1.0  enzymatic attack intensity
uniform float u_moisture;     // 0.0–1.0  substrate moisture content

#define PI     3.14159265359
#define TAU    6.28318530718
#define GOLDEN 2.39996322973

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

// ── Oak substrate (dark heartwood) ───────────────────────────────────────────

vec3 darkOakGrain(vec2 uv, float decay) {
    // Annual rings from off-screen pith — creates parallel-ish bands
    vec2 pith = vec2(-0.2, -0.5);
    float r = length(uv - pith) * 2.6;

    // Domain-warp for organic ring curvature
    float wx = fbm4(uv * vec2(1.2, 4.0) + vec2(1.7, 0.9));
    float wy = fbm4(uv * vec2(1.2, 4.0) + vec2(9.2, 5.1));
    float rings = sin((r + wx * 0.28) * 17.0) * 0.5 + 0.5;

    // Ray parenchyma: faint radial streaks
    float ang  = atan(uv.y - pith.y, uv.x - pith.x);
    float rays = vnoise(vec2(ang * 7.0, r * 2.5)) * 0.22;

    // Early-wood / late-wood luminance split
    float ew = smoothstep(0.2, 0.8, rings);

    vec3 darkOak   = vec3(0.18, 0.11, 0.05);
    vec3 midOak    = vec3(0.34, 0.22, 0.11);
    vec3 lightOak  = vec3(0.48, 0.33, 0.18);
    vec3 col = mix(darkOak, midOak, ew);
    col = mix(col, lightOak, rays);
    // Micro-texture
    col += (vnoise(uv * 90.0) - 0.5) * 0.03;

    // Bleaching: decay turns both polymers to white
    vec3 bleached = mix(vec3(0.85, 0.83, 0.77), vec3(0.97, 0.95, 0.91), fbm4(uv * 4.0));
    col = mix(col, bleached, decay * u_decay_rate * 0.65);

    return col;
}

// ── Single hyphal thread ──────────────────────────────────────────────────────

float singleHypha(vec2 uv, vec2 origin, vec2 initDir, float seed, float growT, float thick) {
    vec2 pos  = origin;
    vec2 dir  = normalize(initDir);
    float acc = 0.0;
    float stepSz = 0.018;
    for (float j = 0.0; j < 32.0; j++) {
        float travel = j * stepSz;
        if (travel > growT) break;
        float d = length(uv - pos);
        acc += smoothstep(thick, thick * 0.15, d);
        // Tip wander: apical dominance allows slight angular drift
        float w = (vnoise(pos * 38.0 + seed + u_time * 0.04) - 0.5) * 0.85;
        dir = normalize(rot2(dir, w * 0.65));
        pos += dir * stepSz;
    }
    return acc;
}

// ── Full hyphal network ───────────────────────────────────────────────────────

float hyphalNetwork(vec2 uv, float t) {
    float net   = 0.0;
    float speed = t * mix(0.35, 1.0, u_moisture);

    // Primary cords (6 radial trunks from inoculation centre)
    for (float i = 0.0; i < 6.0; i++) {
        float ang   = i * GOLDEN + hash1(i * 3.1) * 0.35;
        vec2  dir   = vec2(cos(ang), sin(ang));
        vec2  orig  = vec2(0.5) + dir * 0.04;
        net += singleHypha(uv, orig, dir, i * 7.13, speed * 0.9, 0.0045) * 0.9;

        // 3 secondary branches per trunk
        for (float k = 0.0; k < 3.0; k++) {
            float bAng  = ang + (k - 1.0) * 0.44 + hash1(i * 11.0 + k) * 0.18;
            vec2  bDir  = vec2(cos(bAng), sin(bAng));
            vec2  bOrig = orig + dir * (0.07 + k * 0.09);
            float bT    = max(0.0, speed * 0.9 - 0.07 - k * 0.06);
            net += singleHypha(uv, bOrig, bDir, i * 19.0 + k * 5.3, bT, 0.0024) * 0.65;
        }
    }

    // Fine tertiary lace threads
    for (float i = 0.0; i < 12.0; i++) {
        float ang  = i * TAU / 12.0 + hash1(i * 3.7) * 1.6;
        vec2  dir  = vec2(cos(ang), sin(ang));
        vec2  orig = vec2(0.5) + vec2(hash1(i * 2.1) - 0.5, hash1(i * 4.9) - 0.5) * 0.38;
        float bT   = max(0.0, speed * 0.9 - 0.22 - hash1(i) * 0.22);
        net += singleHypha(uv, orig, dir, i * 31.7 + 200.0, bT, 0.0013) * 0.4;
    }

    return clamp(net, 0.0, 1.0);
}

// ── Enzymatic decay halo ──────────────────────────────────────────────────────

float enzymaticHalo(vec2 uv, float t) {
    float halo  = 0.0;
    float speed = t * mix(0.35, 1.0, u_moisture);
    for (float i = 0.0; i < 6.0; i++) {
        float ang  = i * GOLDEN + hash1(i * 3.1) * 0.35;
        vec2  dir  = vec2(cos(ang), sin(ang));
        vec2  pos  = vec2(0.5) + dir * 0.04;
        float sz   = 0.022;
        for (float j = 0.0; j < 22.0; j++) {
            float tr = j * sz;
            if (tr > speed * 0.9) break;
            float d = length(uv - pos);
            halo += exp(-d * d * 180.0) * 0.22;
            float w = (vnoise(pos * 22.0 + i) - 0.5) * 0.6;
            dir = normalize(rot2(dir, w * 0.5));
            pos += dir * sz;
        }
    }
    return clamp(halo, 0.0, 1.0);
}

// ── Anastomosis fusion glow ───────────────────────────────────────────────────

float anastomosisGlow(vec2 uv, float t) {
    float glow = 0.0;
    for (float i = 0.0; i < 22.0; i++) {
        vec2  pt = vec2(hash1(i * 1.618) * 0.72 + 0.14, hash1(i * 2.718) * 0.72 + 0.14);
        float d  = length(uv - pt);
        float appear = smoothstep(0.0, 0.25, t - 0.12 - hash1(i) * 0.45);
        float pulse  = 0.6 + 0.4 * sin(u_time * 2.7 + i * 1.37);
        glow += exp(-d * d * 5500.0) * appear * pulse * 0.75;
        glow += exp(-d * d * 650.0)  * appear * 0.14;
    }
    return clamp(glow, 0.0, 1.0);
}

// ── Lacy voids (cell walls fully consumed) ───────────────────────────────────

float lacyVoids(vec2 uv, float t) {
    float v     = 0.0;
    float dAge  = t * u_decay_rate;
    for (float i = 0.0; i < 18.0; i++) {
        vec2  c      = vec2(hash1(i * 2.3) * 0.72 + 0.14, hash1(i * 3.7) * 0.72 + 0.14);
        float radius = 0.008 + hash1(i * 5.1) * 0.024;
        float d      = length(uv - c);
        float warp   = fbm4(uv * 14.0 + i) * 0.016;
        float appear = smoothstep(0.0, 0.12, dAge - 0.38 - hash1(i) * 0.42);
        v += smoothstep(radius + warp, radius * 0.25, d) * appear;
    }
    return clamp(v, 0.0, 1.0);
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    float t = u_time * 0.11;

    // Substrate — dark oak with progressive bleaching
    float decayMask = fbm4(uv * 3.2 + 0.7) * u_decay_rate;
    vec3  substrate = darkOakGrain(uv, decayMask);

    // Biological layers
    float network     = hyphalNetwork(uv, t);
    float halo        = enzymaticHalo(uv, t);
    float anastomosis = anastomosisGlow(uv, t);
    float voids       = lacyVoids(uv, t);

    vec3 color = substrate;

    // Enzymatic halo: pale zone of active oxidative attack
    color = mix(color, vec3(0.79, 0.77, 0.68), halo * u_decay_rate * 0.58);

    // Hyphal threads: delicate white lace, cream-tinted
    color = mix(color, vec3(0.97, 0.95, 0.91), clamp(network * 0.95, 0.0, 0.95));

    // Aged zones: white rot residue — only structural ghost remains
    float residueAge = clamp((t - 0.5) * u_decay_rate * 1.4, 0.0, 1.0);
    color = mix(color, vec3(0.94, 0.92, 0.88), residueAge * 0.55);

    // Anastomosis: warm cream glow at fusion nodes
    color += vec3(1.0, 0.96, 0.78) * anastomosis * 0.80;

    // Lacy voids: near-black holes punched through wood texture
    color = mix(color, vec3(0.04, 0.02, 0.01), voids * 0.93);

    // Faint moisture sheen on wood surface
    color += vec3(0.01, 0.02, 0.03) * u_moisture * (1.0 - network) * 0.5;

    // Subtle vignette
    float vig = 1.0 - smoothstep(0.42, 0.82, length(uv - vec2(0.5)));
    color *= vig;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
