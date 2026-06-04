// network_anastomosis_detection.frag
// Anastomosis, HET loci, and sector boundaries in fungal mycelial networks
// Biology: Anastomosis = hyphal tip-to-tip fusion, forming closed loops for
//   network redundancy. Governed by HET (heterokaryon incompatibility) loci.
//   SELF RECOGNITION (same alleles at all HET loci): fusion proceeds; cytoplasm
//   bridges form; warm gold glow at junction. Creates genetically uniform network.
//   NON-SELF (different alleles at ≥1 HET locus): programmed cell death at contact
//   zone — HI reaction (heterokaryon incompatibility). Purple-red necrosis.
//   Dense melanised boundary hyphae mark incompatible sector edges.
//   LOOP FORMATION: when self-hyphae fuse, closed loops create redundant pathways
//   visible as highlighted circuits in the network graph.
//   Sectors: genetically distinct zones (different nuclear combinations) in one colony.
// Reference: Glass et al. (2000), Worall (1997), Rayner (1991)

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_het_loci;    // number of HET loci (1–6); higher = more incompatibility

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

// ── Voronoi with cell ID and F1, F2 (two nearest) ─────────────────────────────

// Returns vec4: .x=F1 distance, .y=F2-F1 (boundary width), .z=cell1 ID, .w=cell2 ID
vec4 voronoiID(vec2 p) {
    vec2  cell = floor(p);
    float F1   = 100.0, F2 = 100.0;
    float ID1  = 0.0,   ID2 = 0.0;

    for (float gy = -2.0; gy <= 2.0; gy += 1.0) {
        for (float gx = -2.0; gx <= 2.0; gx += 1.0) {
            vec2 n   = cell + vec2(gx, gy);
            vec2 pt  = n + 0.5 + (vec2(hash(n), hash(n + vec2(7.3, 13.7))) - 0.5) * 0.78;
            float d  = length(p - pt);
            if (d < F1) { F2 = F1; ID2 = ID1; F1 = d; ID1 = hash(n); }
            else if (d < F2) { F2 = d; ID2 = hash(n); }
        }
    }
    return vec4(F1, F2 - F1, ID1, ID2);
}

// ── HET locus typing ──────────────────────────────────────────────────────────

// Given a cell ID (0–1) and number of loci, determine HET type (0–N integer as float)
float hetType(float cellID, float numLoci) {
    numLoci = max(2.0, floor(numLoci));
    return floor(cellID * numLoci * 3.71 + 0.5) - floor(cellID * numLoci * 3.71 + 0.5 - numLoci * 0.5);
}

// Check if two cells are compatible (same HET type)
float compatible(float id1, float id2, float numLoci) {
    float t1 = mod(floor(id1 * 47.3), floor(numLoci));
    float t2 = mod(floor(id2 * 47.3), floor(numLoci));
    return step(abs(t1 - t2), 0.5);  // 1.0 if same type, 0.0 if different
}

// ── Sector colouring ──────────────────────────────────────────────────────────

// Each sector gets a distinct muted colour based on its HET type
vec3 sectorColor(float cellID, float numLoci) {
    float type  = mod(floor(cellID * 47.3), max(2.0, floor(numLoci)));
    float hue   = type / floor(numLoci);  // distribute hues around circle

    // Convert hue to pastel colour (low saturation, medium luminance)
    float h6 = hue * 6.0;
    float r  = clamp(abs(h6 - 3.0) - 1.0, 0.0, 1.0);
    float g  = clamp(2.0 - abs(h6 - 2.0), 0.0, 1.0);
    float b  = clamp(2.0 - abs(h6 - 4.0), 0.0, 1.0);
    vec3 col = vec3(r, g, b);

    // Pastel: mix toward light grey
    return mix(col, vec3(0.65), 0.55) * 0.85;
}

// ── Mycelial threads within sectors ──────────────────────────────────────────

float sectorThreads(vec2 uv, float cellID) {
    // Fine radiating threads in each sector, direction based on sector centre
    float ang  = cellID * TAU * 7.3;
    float fine = vnoise(uv * vec2(30.0) + vec2(cos(ang), sin(ang)) * 5.0) * 0.5
               + vnoise(uv * vec2(60.0) + vec2(cos(ang + 1.0), sin(ang + 0.5)) * 3.0) * 0.3;
    return fine;
}

// ── Anastomosis event glow ────────────────────────────────────────────────────

// At compatible boundaries: gold fusion event glow
// Returns the glow intensity at a boundary point, coloured by compatibility
vec3 boundaryGlow(vec2 uv, vec4 voro, float numLoci) {
    float boundary   = smoothstep(0.06, 0.0, voro.y);   // at Voronoi edge
    if (boundary < 0.005) return vec3(0.0);

    float compat = compatible(voro.z, voro.w, numLoci);
    float pulse  = 0.6 + 0.4 * sin(u_time * 2.5 + voro.z * 31.4 + voro.w * 17.3);

    // Compatible: warm gold anastomosis glow
    vec3 goldGlow   = vec3(1.00, 0.88, 0.30) * boundary * pulse * 1.1;
    // Incompatible: purple-red HI reaction
    vec3 rejectGlow = vec3(0.72, 0.08, 0.35) * boundary * (0.7 + 0.3 * pulse) * 0.9;

    return mix(rejectGlow, goldGlow, compat);
}

// ── Melanised incompatible boundary hyphae ────────────────────────────────────

float melanisedBoundary(vec2 uv, vec4 voro, float numLoci) {
    float compat = compatible(voro.z, voro.w, numLoci);
    if (compat > 0.5) return 0.0;  // no melanisation at compatible boundaries

    // Wide dark zone at incompatible junction
    float boundary = smoothstep(0.12, 0.0, voro.y);
    // Slightly uneven melanisation
    float texture  = vnoise(uv * 45.0) * 0.5 + 0.5;
    return boundary * texture * 0.9;
}

// ── Loop formation highlight ──────────────────────────────────────────────────

// When two compatible tips meet they form a loop: highlight with gold ring
float loopHighlight(vec2 uv, float numLoci) {
    float loops = 0.0;
    // Sample random compatible fusion points as loop centres
    for (float i = 0.0; i < 12.0; i++) {
        float id1 = hash1(i * 1.618);
        float id2 = hash1(i * 2.718 + 7.0);
        float compat = compatible(id1, id2, numLoci);
        if (compat > 0.5) {
            vec2  lPos = vec2(hash1(i * 3.14) * 0.7 + 0.15,
                              hash1(i * 4.67) * 0.7 + 0.15);
            float r    = 0.025 + hash1(i * 5.9) * 0.035;
            float d    = length(uv - lPos);
            float ring = smoothstep(r + 0.004, r, d) * smoothstep(r - 0.01, r - 0.004, d);
            float pulse = 0.5 + 0.5 * sin(u_time * 2.0 + i * 1.3);
            loops += ring * pulse * 0.75;
        }
    }
    return clamp(loops, 0.0, 1.0);
}

// ── Background ────────────────────────────────────────────────────────────────

vec3 background(vec2 uv) {
    return mix(vec3(0.06, 0.05, 0.07), vec3(0.12, 0.10, 0.14), fbm4(uv * 4.0));
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2  uv       = gl_FragCoord.xy / u_resolution.xy;
    float numLoci  = clamp(u_het_loci, 1.0, 6.0);

    // Scale UV to show interesting Voronoi cell count (~8–15 cells)
    vec2  scaledUV = uv * 4.5 + vec2(0.3, 0.2);
    vec4  voro     = voronoiID(scaledUV);

    vec3  color    = background(uv);

    // --- Sector colouring ---
    vec3 secCol     = sectorColor(voro.z, numLoci);
    float threads   = sectorThreads(uv, voro.z);
    vec3  tissueCol = mix(secCol * 0.7, secCol, threads * 0.6);
    color = mix(color, tissueCol, 0.75);

    // --- Boundary interactions ---
    vec3  bndGlow = boundaryGlow(uv, voro, numLoci);
    color        += bndGlow;

    // --- Melanised boundary (incompatible) ---
    float melanised = melanisedBoundary(uv, voro, numLoci);
    color = mix(color, vec3(0.05, 0.03, 0.05), melanised * 0.88);

    // --- Loop formation highlights ---
    float loops = loopHighlight(uv, numLoci);
    color += vec3(0.92, 0.78, 0.20) * loops * 0.70;

    // --- Sector boundary line (sharp) ---
    float sharpBnd = smoothstep(0.025, 0.0, voro.y);
    float compat   = compatible(voro.z, voro.w, numLoci);
    // Compatible boundary: thin gold line
    color += vec3(0.8, 0.65, 0.1) * sharpBnd * compat * 0.4;
    // Incompatible boundary: thin dark line
    color *= 1.0 - sharpBnd * (1.0 - compat) * 0.6;

    // Vignette
    float vig = 1.0 - smoothstep(0.44, 0.88, length(uv - vec2(0.5)));
    color *= vig;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
