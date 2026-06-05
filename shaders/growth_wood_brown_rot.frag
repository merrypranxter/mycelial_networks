// growth_wood_brown_rot.frag
// Species: Gloeophyllum trabeum (brown rot polypore / timber decay fungus)
// Biology: Fenton chemistry (Fe2+ + H2O2 → •OH) generates hydroxyl radicals that
//   selectively cleave β-1,4-glycosidic bonds in cellulose while LEAVING LIGNIN intact.
//   Result: warm amber-brown residue — the delignified lignin matrix.  NO white residue.
//   Characteristic cubical cracking: anisotropic shrinkage as cellulose removed from
//   tracheids; cracks run along and across grain creating ~1cm³ brown cubes.
//   Growth front: wide, plate-like (merulioid poroid surface) — NOT delicate lace threads.
//   Crack geometry modelled with anisotropic Voronoi + domain warping along grain.
// Reference: Arantes & Goodell (2014), Schwarze (2007), Cohen et al. (2002)

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_decay_stage;  // 0.0 = fresh wood → 1.0 = fully cracked brown cubes

#define PI  3.14159265359
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

// ── Anisotropic Voronoi (cells elongated along wood grain = Y axis) ───────────
// Returns vec3(F1, F2-F1, cellID)

vec3 voronoi(vec2 p) {
    vec2  cell  = floor(p);
    float F1    = 100.0, F2 = 100.0;
    float cellID = 0.0;

    for (float gy = -2.0; gy <= 2.0; gy += 1.0) {
        for (float gx = -1.0; gx <= 1.0; gx += 1.0) {
            vec2 n = cell + vec2(gx, gy);
            // Less jitter in Y → elongated cells along grain
            vec2 jitter = vec2(
                (hash(n)                       - 0.5) * 0.82,
                (hash(n + vec2(17.0, 31.0))    - 0.5) * 0.40
            );
            vec2  pt = n + 0.5 + jitter;
            float d  = length(p - pt);
            if (d < F1) { F2 = F1; F1 = d; cellID = hash(n); }
            else if (d < F2) { F2 = d; }
        }
    }
    return vec3(F1, F2 - F1, cellID);
}

// ── Softwood substrate (pine/spruce — Gloeophyllum loves conifers) ────────────

vec3 freshPineSubstrate(vec2 uv) {
    vec2  pith = vec2(0.5, -0.6);
    float r    = length(uv - pith) * 3.0;

    float wx   = fbm4(uv * vec2(1.5, 5.5) + vec2(2.3, 0.7)) * 0.28;
    float rings = sin((r + wx) * 15.0) * 0.5 + 0.5;

    // Early-wood (light/wide) vs late-wood (dark/narrow)
    float ew = smoothstep(0.18, 0.82, rings);

    vec3 ew_col = vec3(0.70, 0.56, 0.34);
    vec3 lw_col = vec3(0.45, 0.32, 0.18);
    vec3 col    = mix(lw_col, ew_col, ew);

    // Resin canals: sparse darker circles/channels in early-wood rows
    float resinY = fract(uv.y * 18.0);
    float resinX = vnoise(uv * vec2(22.0, 3.0));
    float resin  = smoothstep(0.12, 0.0, abs(resinY - 0.5)) * resinX * 0.5;
    col = mix(col, vec3(0.22, 0.14, 0.07), resin);

    // Micro-texture: cell-wall variation
    col += (vnoise(uv * 120.0) - 0.5) * 0.025;
    return col;
}

vec3 brownResidue(vec2 uv, float stage) {
    // As cellulose removed, substrate darkens to brown-red then near-black
    vec3 amber  = vec3(0.45, 0.26, 0.10);
    vec3 dark   = vec3(0.26, 0.13, 0.04);
    vec3 col    = mix(amber, dark, stage * 0.75);

    // Cube-face variation: each Voronoi cell slightly different shade
    vec2 uvC = vec2(uv.x * 5.0, uv.y * 9.0);
    vec3 vC  = voronoi(uvC + fbm4(uv * 2.5) * 0.07);
    col += vec3(vC.z * 0.08 - 0.04);  // slight brightness jitter per cell

    return col;
}

// ── Crack network ─────────────────────────────────────────────────────────────

float crackMask(vec2 uv, float stage) {
    // Domain-warp along grain direction (Y)
    float warpX = fbm4(uv * vec2(2.0, 6.5)) * 0.09;
    float warpY = fbm4(uv * vec2(5.0, 2.0) + 5.1) * 0.045;
    vec2  wUV   = uv + vec2(warpX, warpY);

    // Large primary cracks (along grain: elongated cells)
    vec3 vL = voronoi(vec2(wUV.x * 4.8, wUV.y * 9.5));
    // Small secondary cross-checks
    vec3 vS = voronoi(vec2(wUV.x * 11.0, wUV.y * 13.0));

    // Crack width widens with decay stage (0 → 0.14 of cell diameter)
    float cwL = smoothstep(0.0, 0.14, stage) * 0.14;
    float cwS = smoothstep(0.0, 0.10, stage) * 0.09;

    float crack = 0.0;
    crack += 1.0 - smoothstep(0.0, cwL, vL.y);
    crack += (1.0 - smoothstep(0.0, cwS, vS.y)) * 0.65;

    // Crack propagation wavefront: radiates from centre outward over time
    float distC = length(uv - vec2(0.5));
    float front = stage * 1.25;
    crack *= smoothstep(front, front - 0.18, distC);

    return clamp(crack, 0.0, 1.0);
}

// ── Plate-like merulioid growth front ─────────────────────────────────────────

float growthFrontMask(vec2 uv, float stage) {
    // Advancing margin from bottom — wide undulating front
    float frontY = mix(1.15, -0.12, stage);
    float wave   = fbm4(vec2(uv.x * 5.5, u_time * 0.08)) * 0.1
                 + fbm4(vec2(uv.x * 11.0, u_time * 0.04 + 3.0)) * 0.04;
    float dist   = uv.y - (frontY + wave);
    return smoothstep(0.0, 0.07, dist);
}

float mycelialMat(vec2 uv, float stage) {
    float front  = growthFrontMask(uv, stage);
    float fibers = vnoise(uv * vec2(60.0, 10.0)) * 0.6
                 + vnoise(uv * vec2(30.0,  5.0)) * 0.4;
    return front * smoothstep(0.3, 0.7, fibers) * 0.75;
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    float stage = clamp(u_decay_stage, 0.0, 1.0);

    // Substrate: blend from fresh pine toward brown residue
    vec3 freshPine = freshPineSubstrate(uv);
    vec3 brown     = brownResidue(uv, stage);
    vec3 color     = mix(freshPine, brown, stage * 0.88);

    // Crack network
    float cracks = crackMask(uv, stage);

    // Crack interiors: darkest brown (deeply degraded cross-section exposed)
    vec3 crackCol = mix(vec3(0.14, 0.07, 0.02), vec3(0.05, 0.02, 0.005), stage);
    color = mix(color, crackCol, cracks * 0.92);

    // Very thin crack-line edge: near-black separation
    float crackEdge = smoothstep(0.18, 0.0, cracks) * cracks;
    color = mix(color, vec3(0.04, 0.015, 0.003), crackEdge * 0.55);

    // Plate-like mycelial mat (active growth margin)
    float mat = mycelialMat(uv, stage);
    color = mix(color, vec3(0.68, 0.63, 0.58), mat * 0.72);

    // Resin channels still visible as darker streaks through brown
    float resinLine = vnoise(uv * vec2(1.8, 35.0));
    color = mix(color, vec3(0.18, 0.09, 0.03), resinLine * 0.22 * (1.0 - cracks));

    // Cube-face highlight: faint 3-D illusion on cell face centres
    vec2 uvC  = vec2(uv.x * 5.0, uv.y * 9.5);
    float cFace = voronoi(uvC).x * 0.12;
    color += vec3(cFace) * stage * 0.13 * (1.0 - cracks);

    // Subtle time-pulsing at crack tips (Fenton reaction still active)
    float reactionGlow = sin(u_time * 1.8 + uv.x * 12.0 + uv.y * 9.0) * 0.5 + 0.5;
    color += vec3(0.08, 0.03, 0.0) * cracks * reactionGlow * (1.0 - stage) * 0.3;

    // Vignette
    float vig = 1.0 - smoothstep(0.43, 0.88, length(uv - vec2(0.5)));
    color *= vig;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
