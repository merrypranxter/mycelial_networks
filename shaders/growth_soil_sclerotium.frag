// growth_soil_sclerotium.frag
// Species: Sclerotinia sclerotiorum (white mould sclerotia)
// Biology: Sclerotia are compact, melanised resting structures formed when
//   vegetative hyphae aggregate and differentiate into a survival body.
//   Three-layer anatomy (outer → inner):
//     RIND:   densely melanised, near-black, waterproof, UV-resistant (1–3 cells thick)
//     CORTEX: brown, compressed hyphae, mechanical strength
//     MEDULLA: pale, loosely-packed hyphae, lipid and glycogen storage
//   Time rings: concentric growth zones reflect episodic carbohydrate loading.
//   Germination: at low dormancy (soil temp >10°C, wet), myceliogenic germination
//     radiates fine hyphae outward from rind; carpogenic produces apothecia (not modelled).
//   Sclerotia persist 5–10 years in soil; remarkable desiccation tolerance.
// Reference: Willetts & Wong (1980), Coley-Smith & Cooke (1971), Bolton et al. (2006)

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_dormancy;   // 1.0 = fully dormant (hard black bodies) → 0.0 = germinating

#define PI     3.14159265359
#define TAU    6.28318530718
#define GOLDEN 2.39996322973
#define N_SCLEROTIA 7

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

// ── Dark soil substrate ───────────────────────────────────────────────────────

vec3 soilSubstrate(vec2 uv) {
    float n  = fbm4(uv * 4.0);
    float n2 = vnoise(uv * 20.0) * 0.3;
    vec3 deep = vec3(0.09, 0.06, 0.03);
    vec3 mid  = vec3(0.16, 0.11, 0.06);
    return mix(deep, mid, n * 0.6 + n2);
}

// ── Single sclerotium rendering ───────────────────────────────────────────────

// Returns vec4: .x = rind mask, .y = cortex mask, .z = medulla mask, .w = germHyphae
vec4 sclerotium(vec2 uv, vec2 centre, float radius, float seedID) {
    // Slightly irregular shape: warp UV around centre
    vec2  localUV = uv - centre;
    float angle   = atan(localUV.y, localUV.x);
    float warp    = fbm4(vec2(angle * 2.5, seedID) + 0.5) * radius * 0.25;
    float dist    = length(localUV) - warp;

    // Radial normalised distance within body (0 = edge, 1 = centre)
    float rNorm   = 1.0 - dist / radius;

    float rindR   = radius;
    float cortexR = radius * 0.82;
    float medulR  = radius * 0.52;

    float rind    = smoothstep(rindR,    rindR    - 0.006, dist)
                  * (1.0 - smoothstep(rindR * 0.78, rindR * 0.72, dist));
    float cortex  = smoothstep(cortexR,  cortexR  - 0.006, dist)
                  * (1.0 - smoothstep(cortexR * 0.68, cortexR * 0.60, dist));
    float medulla = smoothstep(medulR,   medulR   * 0.25,  dist);

    // Time rings: concentric growth bands in interior
    float timeRing = sin(rNorm * 18.0 + seedID * 3.7) * 0.5 + 0.5;
    medulla *= (0.7 + 0.3 * timeRing);

    // Germination hyphae: radiate outward when dormancy low
    float germActivity = clamp(1.0 - u_dormancy, 0.0, 1.0);
    float germHyphae   = 0.0;
    for (float i = 0.0; i < 8.0; i++) {
        float ang  = i * GOLDEN + seedID * 2.3 + hash1(seedID * 7.1 + i) * 0.5;
        vec2  dir  = vec2(cos(ang), sin(ang));
        vec2  pos  = centre + dir * rindR;
        float step = 0.012;
        for (float j = 0.0; j < 18.0; j++) {
            float trav = j * step;
            if (trav < germActivity * 0.18) {
                float d = length(uv - pos);
                germHyphae += smoothstep(0.0018, 0.0, d) * (1.0 - trav / 0.22) * 0.7;
                float w = (vnoise(pos * 40.0 + seedID + u_time * 0.05) - 0.5) * 0.8;
                dir = normalize(rot2(dir, w * 0.6));
                pos += dir * step;
            }
        }
    }

    return vec4(rind, cortex, medulla, clamp(germHyphae, 0.0, 1.0));
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2  uv    = gl_FragCoord.xy / u_resolution.xy;
    vec3  color = soilSubstrate(uv);

    // Accumulate all sclerotia
    float totalRind    = 0.0;
    float totalCortex  = 0.0;
    float totalMedulla = 0.0;
    float totalGerm    = 0.0;

    // Positions and radii for N_SCLEROTIA = 7 sclerotia
    for (float i = 0.0; i < 7.0; i++) {
        // Scatter positions, avoiding screen edges
        vec2  centre = vec2(
            0.12 + hash1(i * 1.618)  * 0.76,
            0.12 + hash1(i * 2.718)  * 0.76
        );
        float radius = 0.035 + hash1(i * 3.14) * 0.038;

        vec4 sc = sclerotium(uv, centre, radius, i * 17.3);
        totalRind    += sc.x;
        totalCortex  += sc.y;
        totalMedulla += sc.z;
        totalGerm    += sc.w;
    }

    totalRind    = clamp(totalRind,    0.0, 1.0);
    totalCortex  = clamp(totalCortex,  0.0, 1.0);
    totalMedulla = clamp(totalMedulla, 0.0, 1.0);
    totalGerm    = clamp(totalGerm,    0.0, 1.0);

    // Medulla: pale white-cream with time rings
    vec3 medullaCol = mix(vec3(0.88, 0.85, 0.78), vec3(0.95, 0.93, 0.88),
                          vnoise(uv * 25.0));
    color = mix(color, medullaCol, totalMedulla * 0.92);

    // Cortex: brown, compressed hyphae
    vec3 cortexCol = mix(vec3(0.35, 0.22, 0.10), vec3(0.25, 0.15, 0.06),
                         fbm4(uv * 8.0));
    color = mix(color, cortexCol, totalCortex * 0.90);

    // Rind: densely melanised, near-black with slight surface texture
    vec3 rindCol = mix(vec3(0.06, 0.04, 0.02), vec3(0.10, 0.07, 0.03),
                       vnoise(uv * 60.0) * 0.5);
    color = mix(color, rindCol, totalRind * 0.96);

    // Germination hyphae: pale, thread-like
    color = mix(color, vec3(0.78, 0.74, 0.64), totalGerm * 0.80);

    // Germination aura: faint enzyme diffusion halo
    float germAura = clamp(totalGerm * 3.0 + totalMedulla * 0.3, 0.0, 1.0);
    color += vec3(0.08, 0.06, 0.02) * germAura * (1.0 - u_dormancy) * 0.3;

    // Time-ring pulse in dormant bodies (subtle metabolic flicker)
    float pulse = sin(u_time * 0.8) * 0.5 + 0.5;
    color += vec3(0.04, 0.03, 0.01) * totalMedulla * u_dormancy * pulse * 0.2;

    // Vignette
    float vig = 1.0 - smoothstep(0.43, 0.88, length(uv - vec2(0.5)));
    color *= vig;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
