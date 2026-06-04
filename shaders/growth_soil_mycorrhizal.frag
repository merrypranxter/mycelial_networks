// growth_soil_mycorrhizal.frag
// Species: Amanita muscaria / Suillus luteus (ectomycorrhizal basidiomycetes)
// Biology: Bidirectional mutualistic exchange at the root–fungus interface.
//   CARBON (sugars, sucrose): photosynthate flows FROM host tree OUTWARD along
//   hyphal cords — visualised as warm amber pulses moving away from root.
//   PHOSPHORUS (HPO₄²⁻): mineral-derived P flows INWARD toward root tip —
//   visualised as blue-violet pulses traveling back along the same cords.
//   Ectomycorrhizal mantle: dense fungal sheath (2–20 cell layers) wraps root tip.
//   Hartig net: hyphae penetrate the apoplast BETWEEN epidermal cells
//   (visible as dense lacework at root surface, NOT inside cells).
//   Hyphal cords fan outward to explore soil; thickening with resource flow.
// Reference: Smith & Read (2008), Nehls et al. (2010), Bücking & Shachar-Hill (2005)

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec2  u_root_pos;    // UV-space root attachment (e.g. vec2(0.5, 0.38))
uniform float u_nutrient_c;  // 0–1 carbon (sugar) flux from tree
uniform float u_nutrient_p;  // 0–1 phosphorus flux from fungus to root

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

// ── Dark humus soil substrate ─────────────────────────────────────────────────

vec3 humusSoil(vec2 uv) {
    // Layered organic matter: darker at top (surface litter), mid-tone humus
    float depth = fbm4(uv * 3.5);
    float litter = fbm4(uv * vec2(8.0, 3.0)) * 0.4;

    vec3 darkHumus  = vec3(0.12, 0.09, 0.06);
    vec3 midHumus   = vec3(0.20, 0.15, 0.09);
    vec3 lightHumus = vec3(0.30, 0.22, 0.13);

    vec3 col = mix(darkHumus, midHumus, depth);
    col = mix(col, lightHumus, litter * 0.5);
    // Fine soil aggregate texture
    col += (vnoise(uv * 180.0) - 0.5) * 0.02;
    return col;
}

// ── Closest point on line segment + parameter ─────────────────────────────────

vec2 closestOnSeg(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h  = clamp(dot(pa, ba) / (dot(ba, ba) + 1e-6), 0.0, 1.0);
    float d  = length(pa - ba * h);
    return vec2(d, h);   // .x = perp distance, .y = parameter (0=a, 1=b)
}

// ── Root shape ────────────────────────────────────────────────────────────────

float rootMask(vec2 uv, vec2 rootPos) {
    // Tapered root: thick at collar, thinning to tip
    // Drawn as elongated oval oriented downward
    vec2  tipPos   = rootPos + vec2(0.0, 0.18);   // tip below attachment
    vec2  cs       = closestOnSeg(uv, rootPos, tipPos);
    float taper    = mix(0.022, 0.008, cs.y);      // thicker at top
    return smoothstep(taper, taper * 0.3, cs.x);
}

// ── Ectomycorrhizal mantle (dense sheath around root tip) ─────────────────────

float mantleLayer(vec2 uv, vec2 rootPos) {
    vec2  tip     = rootPos + vec2(0.0, 0.16);
    float d       = length(uv - tip);
    float mantleR = 0.055;
    float core    = 0.018;
    // Thick sheath around tip, thinner up the root
    float sheath  = smoothstep(mantleR, mantleR * 0.6, d)
                  * (1.0 - smoothstep(core, core * 0.5, d));
    // Slight textured density variation
    sheath *= 0.6 + vnoise(uv * 60.0) * 0.4;
    return sheath;
}

// ── Hartig net (hyphal lacework between epidermal cells) ──────────────────────

float hartighNet(vec2 uv, vec2 rootPos) {
    // Dense fine mesh right at root surface
    vec2  tipPos = rootPos + vec2(0.0, 0.16);
    float dRoot  = length(uv - tipPos);
    float inZone = smoothstep(0.06, 0.035, dRoot);    // only near root surface
    float mesh   = vnoise(uv * 55.0) * vnoise(uv * 30.0 + 2.1);
    return inZone * step(0.35, mesh) * 0.8;
}

// ── Hyphal cords + bidirectional flow ─────────────────────────────────────────

// Returns vec3: .x = cord distance mask, .y = carbon flow, .z = phosphorus flow
vec3 hyphaCordFlow(vec2 uv, vec2 rootPos, float seedIdx) {
    // Cord tip direction: radiating from root attachment
    float ang  = seedIdx * GOLDEN + hash1(seedIdx * 7.3) * 0.6 - PI * 0.25;
    vec2  dir  = vec2(cos(ang), sin(ang));
    // Tip wanders slightly
    float wander = fbm4(dir * 10.0 + seedIdx) * 0.3;
    dir = normalize(rot2(dir, wander * 0.8));

    vec2  cordEnd = rootPos + dir * (0.3 + hash1(seedIdx * 3.1) * 0.2);

    // Cord grows over time
    float growFrac = clamp(u_time * 0.08 - seedIdx * 0.04, 0.0, 1.0);
    vec2  tip      = mix(rootPos, cordEnd, growFrac);

    vec2 cs    = closestOnSeg(uv, rootPos, tip);
    float dist = cs.x;
    float h    = cs.y;   // 0 = root end, 1 = tip end

    // Cord thickness: thicker at root, thinner at tip
    float thick = mix(0.009, 0.004, h) * (0.5 + hash1(seedIdx) * 0.5);
    float cord  = smoothstep(thick, thick * 0.2, dist);

    // Carbon flow (C): outward amber pulses from root → tip
    float flowC = 0.0;
    for (float p = 0.0; p < 4.0; p++) {
        float phase = fract(p * 0.25 + u_time * 0.22 * u_nutrient_c);
        float ph    = abs(h - phase);
        ph = min(ph, 1.0 - ph);
        flowC += exp(-ph * ph * 220.0) * exp(-dist * dist * 2800.0);
    }

    // Phosphorus flow (P): inward blue-violet pulses from tip → root
    float flowP = 0.0;
    for (float p = 0.0; p < 4.0; p++) {
        float phase = fract(p * 0.25 - u_time * 0.18 * u_nutrient_p);
        float ph    = abs(h - phase);
        ph = min(ph, 1.0 - ph);
        flowP += exp(-ph * ph * 220.0) * exp(-dist * dist * 2800.0);
    }

    return vec3(cord, flowC * cord, flowP * cord);
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2  uv      = gl_FragCoord.xy / u_resolution.xy;
    vec2  rootPos = u_root_pos;

    vec3  color   = humusSoil(uv);

    // Accumulate cords and flow
    float totalCord  = 0.0;
    float totalFlowC = 0.0;
    float totalFlowP = 0.0;

    for (float i = 0.0; i < 8.0; i++) {
        vec3 cf = hyphaCordFlow(uv, rootPos, i);
        totalCord  += cf.x;
        totalFlowC += cf.y;
        totalFlowP += cf.z;
    }
    totalCord  = clamp(totalCord,  0.0, 1.0);
    totalFlowC = clamp(totalFlowC, 0.0, 1.0);
    totalFlowP = clamp(totalFlowP, 0.0, 1.0);

    // Cord base colour: warm amber (C-rich; loaded with sugars from tree)
    vec3 cordColor = mix(vec3(0.55, 0.38, 0.18), vec3(0.72, 0.52, 0.28), totalCord);
    color = mix(color, cordColor, totalCord * 0.88);

    // Carbon flow: bright amber-gold pulses
    color += vec3(0.95, 0.72, 0.22) * totalFlowC * u_nutrient_c * 1.2;

    // Phosphorus flow: blue-violet pulses on same cords
    color += vec3(0.35, 0.25, 0.90) * totalFlowP * u_nutrient_p * 1.1;

    // Ectomycorrhizal mantle at root tip: dense cream-coloured sheath
    float mantle = mantleLayer(uv, rootPos);
    color = mix(color, vec3(0.82, 0.76, 0.62), mantle * 0.85);

    // Hartig net: fine pale mesh between epidermal cells
    float hartig = hartighNet(uv, rootPos);
    color = mix(color, vec3(0.90, 0.86, 0.74), hartig * 0.75);

    // Root itself: warm tan-brown
    float root = rootMask(uv, rootPos);
    color = mix(color, vec3(0.52, 0.38, 0.22), root * 0.90);

    // Fine exploratory hyphae off main cords
    float exploreHyphae = vnoise(uv * 45.0 + u_time * 0.05) * 0.35;
    float exploreMask   = totalCord * exploreHyphae;
    color = mix(color, vec3(0.70, 0.60, 0.42), exploreMask * 0.25);

    // Vignette
    float vig = 1.0 - smoothstep(0.42, 0.82, length(uv - vec2(0.5)));
    color *= vig;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
