// growth_host_pathogen.frag
// Species: Botrytis cinerea (grey mould / noble rot necrotrophic pathogen)
// Biology: Necrotrophic strategy — KILLS host cells AHEAD of colonisation using
//   a cocktail of cell-wall-degrading enzymes (polygalacturonases, cellulases),
//   oxalic acid (pH drops to 3–4), and reactive oxygen species.
//   Growth front: dense tangled conidiophore mat — NOT delicate lace.
//   Toxin diffusion: grey necrosis zone 0.5–2 mm ahead of visible hyphae.
//   Resistance battle line: irregular, wavy front where host PR proteins
//   (pathogenesis-related) slow but do not stop invasion.
//   Conidiation: masses of grey conidia (10–15 µm, hydrophobic) on necrotic tissue.
//   Host tissue states: living green → infected grey-brown → necrotic black.
// Reference: van Kan (2006), Williamson et al. (2007), Choquer et al. (2007)

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_infection_age;    // 0.0 = just inoculated → 1.0 = fully colonised
uniform float u_host_resistance;  // 0.0 = susceptible → 1.0 = highly resistant

#define PI     3.14159265359
#define TAU    6.28318530718

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

float fbm6(vec2 p) {
    return vnoise(p)        * 0.5000
         + vnoise(p * 2.13) * 0.2500
         + vnoise(p * 4.37) * 0.1250
         + vnoise(p * 8.71) * 0.0625
         + vnoise(p * 17.5) * 0.0313
         + vnoise(p * 35.1) * 0.0156;
}

// ── Host tissue: healthy leaf / plant surface ─────────────────────────────────

vec3 hostTissue(vec2 uv) {
    // Leaf mesophyll: cellular green with slight speckling
    float cellPattern = vnoise(uv * 35.0) * 0.5 + vnoise(uv * 70.0) * 0.3;
    float veins       = vnoise(uv * vec2(4.0, 20.0)) * vnoise(uv * vec2(20.0, 4.0));

    vec3 greenTissue = vec3(0.28, 0.52, 0.22);
    vec3 paleCell    = vec3(0.40, 0.65, 0.30);
    vec3 veinColor   = vec3(0.20, 0.40, 0.17);

    vec3 col = mix(veinColor, mix(greenTissue, paleCell, cellPattern), 0.75);
    col += (vnoise(uv * 200.0) - 0.5) * 0.02;
    return col;
}

// ── Infection geometry ────────────────────────────────────────────────────────

// Infection radiates from centre of screen; resistance makes front irregular
float infectionRadius(vec2 uv) {
    vec2  dir      = uv - vec2(0.5);
    float baseRad  = u_infection_age * 0.55;

    // Resistance creates irregular battle-line (host PR protein patches slow advance)
    float angle    = atan(dir.y, dir.x);
    float irregular = fbm4(vec2(angle * 2.5, u_time * 0.1)) * 0.12
                    + fbm4(vec2(angle * 5.0, u_time * 0.07 + 3.0)) * 0.06;

    // Resistance shrinks and irregularises the front
    float resistEffect = u_host_resistance * 0.18;
    float frontRad     = baseRad - resistEffect + irregular * (1.0 - u_host_resistance * 0.5);

    return length(dir) - frontRad;
}

// ── Toxin diffusion zone ──────────────────────────────────────────────────────
// Oxalic acid + enzymes diffuse AHEAD of the hyphae (grey necrosis precursor)

float toxinZone(vec2 uv) {
    float baseRad  = u_infection_age * 0.55;
    float toxinRad = baseRad + 0.08 + fbm4(uv * 3.0 + u_time * 0.05) * 0.06;
    float angle    = atan(uv.y - 0.5, uv.x - 0.5);
    float irregular = fbm4(vec2(angle * 3.0, u_time * 0.08)) * 0.1;
    float dist     = length(uv - vec2(0.5));
    return dist - (toxinRad + irregular);
}

// ── Dense hyphal mat (tangled, not lace-like) ─────────────────────────────────

float hyphalMat(vec2 uv, float infRad) {
    // High-frequency tangled mat in colonised zone
    float matNoise = fbm6(uv * 18.0 + u_time * 0.03)
                   * fbm4(uv * 9.0  + u_time * 0.02 + 5.0);
    float inColonised = smoothstep(0.0, -0.04, infRad);
    return matNoise * inColonised;
}

// ── Conidia (grey powdery mass) ───────────────────────────────────────────────

float conidiaMass(vec2 uv, float infRad) {
    float age      = clamp(u_infection_age - 0.6, 0.0, 1.0) * 2.5; // appears late
    float conidia  = vnoise(uv * 80.0) * vnoise(uv * 40.0 + 7.3);
    float inZone   = smoothstep(0.0, -0.08, infRad);
    return conidia * inZone * age;
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2  uv    = gl_FragCoord.xy / u_resolution.xy;
    float infRad = infectionRadius(uv);
    float toxRad = toxinZone(uv);

    // Base: healthy host tissue
    vec3 color = hostTissue(uv);

    // Toxin diffusion zone: pre-necrotic grey (just ahead of hyphae)
    float toxAlpha = smoothstep(0.03, -0.02, toxRad) * smoothstep(-0.03, 0.03, infRad);
    vec3  toxColor = mix(vec3(0.48, 0.46, 0.40), vec3(0.38, 0.35, 0.28), fbm4(uv * 5.0));
    color = mix(color, toxColor, toxAlpha * 0.75);

    // Infection zone gradient: infected grey-brown → necrotic black
    float colonised = smoothstep(0.02, -0.10, infRad);

    // Infected tissue: grey-brown collapse of cell structure
    float distCenter = length(uv - vec2(0.5));
    float necroFrac  = clamp((u_infection_age * 0.6 - distCenter) * 3.5, 0.0, 1.0);

    vec3 infectedCol = vec3(0.42, 0.36, 0.26);   // grey-brown collapsed cells
    vec3 necroticCol = vec3(0.10, 0.07, 0.04);   // black necrotic tissue

    vec3 pathZone = mix(infectedCol, necroticCol, necroFrac);
    color = mix(color, pathZone, colonised * 0.90);

    // Dense hyphal mat
    float mat = hyphalMat(uv, infRad);
    color = mix(color, vec3(0.52, 0.50, 0.48), mat * 0.65);

    // Conidiation: grey powder on dead tissue
    float conidia = conidiaMass(uv, infRad);
    vec3  conidiaCol = mix(vec3(0.58, 0.56, 0.54), vec3(0.72, 0.70, 0.68),
                           vnoise(uv * 150.0));
    color = mix(color, conidiaCol, conidia * 0.82);

    // Battle line: irregular, dynamic border showing resistance zones
    float battleLine = smoothstep(0.018, 0.0, abs(infRad)) * u_host_resistance;
    color += vec3(0.55, 0.38, 0.12) * battleLine * 0.7; // amber host reaction

    // Spreading edge pulse (visible hyphal colonisation front)
    float frontPulse = smoothstep(0.025, 0.0, abs(infRad + 0.01))
                     * (0.5 + 0.5 * sin(u_time * 3.0));
    color += vec3(0.28, 0.28, 0.26) * frontPulse * 0.85;

    // Vignette
    float vig = 1.0 - smoothstep(0.43, 0.85, length(uv - vec2(0.5)));
    color *= vig;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
