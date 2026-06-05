// growth_gill_ink_cap.frag
// Species: Coprinopsis atramentaria (common ink cap / tippler's bane)
// Biology: Deliquescence — programmatic autodigestion of gill tissue driven by
//   the fungus's own chitinases and laccases, proceeding from the cap MARGIN
//   INWARD toward the stipe. Autodigestive wave progresses at ~0.5 cm/hour.
//   Purpose: spore dispersal via inky drips that carry basidiospores to soil.
//   Gill anatomy (cross-section): parallel lamellae of tightly-packed basidia
//   on both faces of a central hymenophoral trama.
//   Autodigestion front: dark, liquefying zone that converts white tissue to
//   black, spore-laden fluid. Fluid drips under gravity: characteristic "ink".
//   View: side cross-section of cap showing gill plates edge-on from below.
// Reference: Moore (1998), Walther et al. (2005), Kües (2000)

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_deliquescence;  // 0.0 = fresh white cap → 1.0 = black ink puddle

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

// ── Cap profile (side view) ───────────────────────────────────────────────────

// Returns 1.0 if UV is inside the cap shape
float capMask(vec2 uv) {
    // Convex bell-shaped cap, narrower at top (umbo), wider at margin
    float yCap   = 0.72;                    // top of cap
    float stipeY = 0.20;                    // base of stipe
    float relY   = clamp((uv.y - stipeY) / (yCap - stipeY), 0.0, 1.0);

    // Half-width at each height: bell curve
    float halfW = mix(0.04, 0.32, relY * (1.0 - relY * 0.55));
    float distX = abs(uv.x - 0.5);
    return smoothstep(halfW, halfW - 0.01, distX) * step(stipeY, uv.y) * step(uv.y, yCap);
}

// ── Gill structure ────────────────────────────────────────────────────────────

// Returns: vec2(.x = gill trama mask, .y = lamella detail)
vec2 gillStructure(vec2 uv) {
    // Gills viewed edge-on: vertical plates, visible as thin lines in cross-section
    // From this view (side cross-section) we see multiple parallel thin plates

    // Radial gill layout emanating from stipe to cap margin
    // Map uv.y (0=stipe, 1=margin) and uv.x (relative to stipe centre)
    vec2  stipeTop = vec2(0.5, 0.28);
    float angle    = atan(uv.y - stipeTop.y, uv.x - stipeTop.x);
    float dist     = length(uv - stipeTop);

    // Gill "spokes": multiple angular plates
    float gillCount = 24.0;
    float gillAngle = fract(angle / (TAU / gillCount) + 0.5) - 0.5;
    float gillPlate = smoothstep(0.018, 0.003, abs(gillAngle) * (TAU / gillCount));

    // Basidia on gill face: fine texture perpendicular to trama
    float basidiaTexture = vnoise(uv * vec2(200.0, 30.0)) * 0.6;

    return vec2(gillPlate, basidiaTexture);
}

// ── Stipe ──────────────────────────────────────────────────────────────────────

float stipeMask(vec2 uv) {
    float halfW = 0.025;
    float distX = abs(uv.x - 0.5);
    float yFrac = smoothstep(0.05, 0.25, uv.y) * (1.0 - smoothstep(0.25, 0.30, uv.y));
    return smoothstep(halfW, halfW * 0.4, distX) * step(0.05, uv.y) * step(uv.y, 0.30);
}

// ── Autodigestion front ────────────────────────────────────────────────────────

// Front moves from margin (outer/bottom of gills) inward toward stipe
float autodigFront(vec2 uv) {
    vec2  stipeTop  = vec2(0.5, 0.28);
    float dist      = length(uv - stipeTop);

    // Front radius: starts large (at margin ~0.38), contracts inward
    float maxR     = 0.40;
    float frontR   = mix(maxR, 0.0, u_deliquescence);

    // Irregular front: autodigestion not perfectly uniform
    float angle    = atan(uv.y - stipeTop.y, uv.x - stipeTop.x);
    float irregularity = fbm4(vec2(angle * 3.0, u_time * 0.15)) * 0.05
                       + fbm4(vec2(angle * 7.0, u_time * 0.08 + 2.0)) * 0.025;

    float effectiveR = frontR + irregularity;
    return dist - effectiveR;
}

// ── Drip simulation ───────────────────────────────────────────────────────────

float inkDrips(vec2 uv) {
    float drip = 0.0;
    float deliq = u_deliquescence;

    for (float i = 0.0; i < 9.0; i++) {
        // Drip origin: along bottom margin of cap
        float xOrig = 0.5 + (hash1(i * 1.618) - 0.5) * 0.55;
        float yOrig = 0.22 + hash1(i * 2.718) * 0.08;

        // Drip falls; rate and length proportional to deliquescence
        float dropLen  = deliq * (0.12 + hash1(i * 3.14) * 0.15);
        float dropSpeed = 0.08 + hash1(i * 4.0) * 0.05;
        float phase    = fract(u_time * dropSpeed + hash1(i * 5.0));
        float yDrop    = yOrig - phase * dropLen;

        // Drip column: narrow, slightly wavy
        float waveX  = sin(uv.y * 30.0 + i * 2.1 + u_time * 0.3) * 0.004;
        float distX  = abs(uv.x - xOrig - waveX);
        float distY  = abs(uv.y - yDrop);
        float bulge  = exp(-distY * distY * 600.0) * 0.008; // droplet bulge

        float col  = smoothstep(0.0025 + bulge, 0.0, distX);
        float inDrop = smoothstep(yOrig, yOrig - dropLen, uv.y);
        drip += col * inDrop * deliq;

        // Drip head: teardrop shape
        float headR = 0.007 * deliq;
        drip += smoothstep(headR, headR * 0.3, length(uv - vec2(xOrig + waveX, yDrop))) * deliq;
    }

    return clamp(drip, 0.0, 1.0);
}

// ── Ink puddle at base ────────────────────────────────────────────────────────

float inkPuddle(vec2 uv) {
    float puddle = u_deliquescence;
    // Puddle grows at base of stipe
    vec2  pudC = vec2(0.5, 0.07);
    float pudR = 0.06 + u_deliquescence * 0.14;
    float d    = length((uv - pudC) * vec2(1.0, 2.0)); // elliptical
    float warp = fbm4(uv * 12.0) * 0.02;
    return smoothstep(pudR + warp, pudR * 0.5, d) * puddle;
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2  uv     = gl_FragCoord.xy / u_resolution.xy;
    float dFront = autodigFront(uv);

    // Background: dark studio / forest floor
    vec3 bgColor = mix(vec3(0.08, 0.06, 0.04), vec3(0.14, 0.11, 0.07),
                       fbm4(uv * 5.0) * 0.5);
    vec3 color   = bgColor;

    // Cap body
    float cap   = capMask(uv);
    float stipe = stipeMask(uv);

    if (cap + stipe > 0.01) {
        // Base gill tissue: white
        vec2  gill     = gillStructure(uv);
        vec3  freshCol = mix(vec3(0.93, 0.92, 0.89), vec3(0.85, 0.84, 0.80),
                             gill.y * 0.5);
        freshCol += vec3(gill.x) * 0.04; // gill plate highlights

        // Autodigestion zone: above front = already digested (darker)
        float digested = smoothstep(0.02, -0.06, dFront); // inside digested zone
        float fresh    = smoothstep(-0.02, 0.06, dFront); // outside = still fresh

        // Digested tissue: dark brown → black, liquid
        vec3 digestedCol = mix(
            vec3(0.32, 0.22, 0.14),   // early brown liquefaction
            vec3(0.04, 0.02, 0.01),   // black ink
            clamp(digested * 1.5 - 0.3, 0.0, 1.0)
        );
        // Slight spore shimmer in black ink
        float sporeGlint = vnoise(uv * 120.0 + u_time * 0.1) * 0.12;
        digestedCol += vec3(sporeGlint) * digested * 0.3;

        // Autodigestion front: darkening wave
        float frontGlow = smoothstep(0.03, 0.0, abs(dFront));
        vec3  frontCol  = mix(vec3(0.25, 0.18, 0.10), vec3(0.06, 0.03, 0.01), u_deliquescence);

        vec3 gillColor = mix(freshCol, digestedCol, digested * 0.95);
        gillColor = mix(gillColor, frontCol, frontGlow * 0.8);

        // Stipe remains white longest
        vec3 stipeCol = mix(vec3(0.90, 0.89, 0.86), vec3(0.55, 0.40, 0.28),
                            u_deliquescence * 0.6);

        color = mix(color, gillColor, cap * 0.95);
        color = mix(color, stipeCol, stipe * 0.95);
    }

    // Drips: black ink running down
    float drips  = inkDrips(uv);
    color = mix(color, vec3(0.02, 0.01, 0.005), drips * 0.96);

    // Puddle at base
    float puddle = inkPuddle(uv);
    vec3  puddleCol = mix(vec3(0.04, 0.02, 0.01), vec3(0.08, 0.04, 0.02),
                          fbm4(uv * 15.0) * 0.3);
    color = mix(color, puddleCol, puddle * 0.95);

    // Vignette
    float vig = 1.0 - smoothstep(0.43, 0.85, length(uv - vec2(0.5)));
    color *= vig;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
