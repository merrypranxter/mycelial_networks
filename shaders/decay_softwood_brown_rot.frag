// decay_softwood_brown_rot.frag
// Decay texture: Scots pine (Pinus sylvestris) cross-section under brown rot
// Biology: Selective cellulose removal by Fenton-chemistry brown rot fungi
//   (Coniophora puteana, Serpula lacrymans, Postia placenta).
//   Tracheid cells: radially elongated, thin-walled early-wood (large lumen)
//   and thick-walled late-wood (narrow lumen). Arranged in strict radial files.
//   As cellulose removed: cell walls collapse inward but LIGNIN SKELETON remains.
//   Cubical cracking: characteristic brown rot pattern — shrinkage cracks along
//   and across grain, creating ~5–30 mm³ brown cubes.
//   Resin canals: prominent features in pine cross-section — circular voids
//   surrounded by epithelial cells, distributed in rows in early-wood.
//   End-stage: crumbled brown cubes; resin channels still visible as dark rings.
// Reference: Schwarze (2007), Eriksson et al. (1990), Goodell (2003)

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_decay_age;   // 0.0 = fresh Pinus cross-section → 1.0 = crumbled brown cubes

#define PI 3.14159265359
#define TAU 6.28318530718

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

// ── Pine annual rings (cross-section = concentric circles) ───────────────────

float pineRings(vec2 uv) {
    vec2  pith = vec2(0.5, 0.5);
    float r    = length(uv - pith) * 3.0;

    // Domain warp: rings slightly elliptical (faster growth in one direction)
    float wx = fbm4(uv * vec2(2.0, 5.0)) * 0.12;
    float r2 = length((uv + vec2(wx, wx * 0.5)) - pith) * 3.0;

    // Sharp transition early-wood / late-wood (pine is more abrupt than oak)
    float rings = sin(r2 * 13.0) * 0.5 + 0.5;
    float sharp = smoothstep(0.3, 0.7, rings); // sharpen transition
    return sharp;
}

// ── Tracheid cell pattern ─────────────────────────────────────────────────────

// Pine tracheids: rectangular cells in radial files
// Cross-section shows a grid-like pattern, cells ~30–70 µm
float tracheids(vec2 uv) {
    vec2  pith  = vec2(0.5, 0.5);
    float angle = atan(uv.y - pith.y, uv.x - pith.x);
    float r     = length(uv - pith);

    // Radial files: tangential coordinate
    float tangCoord = angle * (1.0 / (2.0 * PI)) * 80.0;  // ~80 cells around circumference
    // Radial coordinate: along radius
    float radCoord  = r * 150.0;  // scale to cell size

    float rings   = pineRings(uv);
    // Early-wood: large lumens (big cells, thin walls)
    float earlyLumenSize = mix(0.7, 0.3, rings);
    // Late-wood: small lumens (small cells, thick walls)

    // Cell wall / lumen pattern
    float cellX  = fract(tangCoord);
    float cellY  = fract(radCoord);
    float wall   = step(earlyLumenSize, cellX) + step(earlyLumenSize, cellY);
    // Clamp so wall is binary
    float wallMask = clamp(wall, 0.0, 1.0);

    return wallMask;
}

// ── Resin canals ──────────────────────────────────────────────────────────────

// Pine resin canals: circular voids ~50–200 µm, in rows in early-wood
float resinCanals(vec2 uv) {
    float resin = 0.0;
    for (float i = 0.0; i < 18.0; i++) {
        // Distribute in radial rows (early-wood bands)
        float ang = i * 2.39996;
        float rv  = 0.06 + hash1(i * 1.618) * 0.38;
        vec2  pos = vec2(0.5, 0.5) + vec2(cos(ang), sin(ang)) * rv;
        pos       += vec2(hash1(i * 2.3) - 0.5, hash1(i * 3.7) - 0.5) * 0.025;
        float d   = length(uv - pos);
        float canalR = 0.006 + hash1(i * 4.1) * 0.006;
        // Canal lumen: open void with epithelial cell ring
        float lumen    = smoothstep(canalR,       canalR * 0.3,   d);
        float epithelium = smoothstep(canalR * 1.5, canalR,       d)
                         * (1.0 - lumen);
        resin += lumen * 2.0 + epithelium * 0.5;
    }
    return clamp(resin, 0.0, 1.0);
}

// ── Anisotropic Voronoi for cubical cracks ────────────────────────────────────

vec2 crackVoronoi(vec2 p) {
    vec2  cell = floor(p);
    float F1 = 100.0, F2 = 100.0;

    for (float gy = -2.0; gy <= 2.0; gy += 1.0) {
        for (float gx = -1.0; gx <= 1.0; gx += 1.0) {
            vec2 n = cell + vec2(gx, gy);
            vec2 jitter = vec2(
                (hash(n) - 0.5) * 0.80,
                (hash(n + vec2(17.0, 31.0)) - 0.5) * 0.42   // elongated along grain
            );
            vec2  pt = n + 0.5 + jitter;
            float d  = length(p - pt);
            if (d < F1) { F2 = F1; F1 = d; }
            else if (d < F2) { F2 = d; }
        }
    }
    return vec2(F1, F2 - F1);
}

float cubicalCracks(vec2 uv, float stage) {
    float warpX = fbm4(uv * vec2(2.0, 7.0)) * 0.09;
    float warpY = fbm4(uv * vec2(6.0, 2.0) + 4.7) * 0.045;
    vec2  wUV   = uv + vec2(warpX, warpY);

    // Large primary cracks along grain
    vec2 vL = crackVoronoi(vec2(wUV.x * 5.5, wUV.y * 10.0));
    // Small secondary cross-checks
    vec2 vS = crackVoronoi(vec2(wUV.x * 13.0, wUV.y * 15.0));

    float cwL = smoothstep(0.0, 0.12, stage) * 0.13;
    float cwS = smoothstep(0.0, 0.08, stage) * 0.08;

    float crack = 0.0;
    crack += 1.0 - smoothstep(0.0, cwL, vL.y);
    crack += (1.0 - smoothstep(0.0, cwS, vS.y)) * 0.55;

    // Wavefront: cracks spread outward from centre
    float distC = length(uv - vec2(0.5));
    float front = stage * 1.3;
    crack *= smoothstep(front, front - 0.20, distC);

    return clamp(crack, 0.0, 1.0);
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2  uv    = gl_FragCoord.xy / u_resolution.xy;
    float decay = clamp(u_decay_age, 0.0, 1.0);

    float rings    = pineRings(uv);
    float walls    = tracheids(uv);
    float resin    = resinCanals(uv);
    float cracks   = cubicalCracks(uv, decay);

    // ── Fresh pine colours ────────────────────────────────────────────────────
    vec3 earlyWoodFresh  = vec3(0.76, 0.60, 0.38);  // pale yellow-tan
    vec3 lateWoodFresh   = vec3(0.48, 0.34, 0.19);  // darker tan-brown
    vec3 wallFresh       = vec3(0.30, 0.20, 0.10);  // cell walls darker

    vec3 freshPine = mix(earlyWoodFresh, lateWoodFresh, 1.0 - rings);
    freshPine = mix(freshPine, wallFresh, walls * 0.45);

    // Resin canals in fresh wood: darker resin-filled voids, epithelium
    freshPine = mix(freshPine, vec3(0.20, 0.12, 0.05), resin * 0.80);

    // ── Brown rot decay transformation ────────────────────────────────────────
    // Lignin skeleton turns deeper brown; cellulose consumed → cell walls collapse

    // Brown residue: lignin remains as rich warm brown, darkening with decay
    vec3 brownEarly  = vec3(0.52, 0.30, 0.12);
    vec3 brownMid    = vec3(0.38, 0.20, 0.07);
    vec3 brownDark   = vec3(0.22, 0.11, 0.03);
    vec3 brownResidue = mix(brownEarly,
                            mix(brownMid, brownDark, clamp((decay - 0.5) * 2.0, 0.0, 1.0)),
                            clamp(decay * 1.5, 0.0, 1.0));

    // Cell wall contribution fades (walls collapse with cellulose removal)
    float wallFade = 1.0 - decay * 0.75;
    brownResidue = mix(brownResidue, brownResidue * 0.7, walls * wallFade);

    // Resin channels persist even in fully decayed wood (resin ≠ cellulose)
    vec3 brownWithResin = mix(brownResidue, vec3(0.12, 0.06, 0.02), resin * 0.85);

    // ── Crack overlay ─────────────────────────────────────────────────────────
    // Crack faces: slightly lighter brown (newly exposed surface, less compact)
    vec3 crackFace = mix(vec3(0.15, 0.08, 0.03), vec3(0.08, 0.04, 0.01), decay);
    brownWithResin = mix(brownWithResin, crackFace, cracks * 0.88);

    // Thin crack edge: near-black
    brownWithResin = mix(brownWithResin, vec3(0.03, 0.01, 0.005),
                         cracks * smoothstep(0.20, 0.0, cracks) * 0.5);

    // Cube face shading: slight brightness variation per cell (3D cube illusion)
    vec2  vCheck    = crackVoronoi(vec2(uv.x * 5.5, uv.y * 10.0));
    float cubeFace  = vCheck.x * 0.10;
    brownWithResin += vec3(cubeFace - 0.05) * decay * 0.15 * (1.0 - cracks);

    // ── Final blend ───────────────────────────────────────────────────────────
    vec3 color = mix(freshPine, brownWithResin, decay);

    // Slow crumbling texture (Fenton reaction still active at crack tips)
    float crumble = vnoise(uv * 40.0 + u_time * 0.02) * decay * 0.05;
    color *= 1.0 - crumble;

    // Vignette
    float vig = 1.0 - smoothstep(0.44, 0.88, length(uv - vec2(0.5)));
    color *= vig;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
