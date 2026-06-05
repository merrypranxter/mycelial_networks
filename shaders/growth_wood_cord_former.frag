// growth_wood_cord_former.frag
// Species: Armillaria mellea (honey fungus / bootlace fungus)
// Biology: Forms rhizomorphs — pressurised, melanised hyphal bundles that act as
//   resource superhighways. Outer rind: densely melanised, near-black, impermeable.
//   Inner medulla: pale, loosely packed hyphae with interstitial fluid under
//   hydraulic pressure (~0.1 MPa). Flow direction: source (food base) → sink (growing tip).
//   Fan-like hyphal fans spread laterally from cord nodes to colonise substrate.
//   Exploratory hyphae: fine, branching threads that prospect ahead of main cords.
//   Pathogenic: rhizomorphs grow through soil and under bark to infect new trees.
// Reference: Rayner & Boddy (1988), Jennings (1987), Watkinson (1984)

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec2  u_source_pos;  // food-base (inoculum) UV position
uniform vec2  u_sink_pos;    // growing front / target UV position
uniform float u_pressure;    // 0–1 hydraulic pressure driving flow

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

// ── Wood substrate (under-bark view) ─────────────────────────────────────────

vec3 barkSubstrate(vec2 uv) {
    // Dark, compressed bark texture
    float grain = fbm4(uv * vec2(3.0, 12.0));
    float micro = vnoise(uv * 80.0) * 0.5 + vnoise(uv * 160.0) * 0.3;
    vec3 dark   = vec3(0.10, 0.07, 0.04);
    vec3 mid    = vec3(0.20, 0.14, 0.08);
    return mix(dark, mid, grain * 0.5 + micro * 0.3);
}

// ── Closest-point-on-segment utilities ───────────────────────────────────────

vec2 closestOnSeg(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / (dot(ba, ba) + 1e-6), 0.0, 1.0);
    return vec2(length(pa - ba * h), h);
}

// ── Rhizomorph cord (thick melanised bundle) ──────────────────────────────────

// Draws a curved rhizomorph from A→B with perturbed path
// Returns vec4(outerRind, medulla, flowSpot, h_param)
vec4 rhizomorphCord(vec2 uv, vec2 A, vec2 B, float seedOff, float thick) {
    // Curve the path slightly with noise
    vec2  mid    = mix(A, B, 0.5);
    float curve  = hash1(seedOff * 3.7) * 0.12 - 0.06;
    vec2  perp   = normalize(vec2(-(B-A).y, (B-A).x));
    vec2  ctrl   = mid + perp * curve;

    // Sample cord at multiple points for curved appearance
    float minDist = 100.0;
    float bestH   = 0.0;
    for (float s = 0.0; s < 18.0; s++) {
        float t  = s / 17.0;
        // Quadratic Bezier
        vec2 segPt = (1.0 - t)*(1.0 - t)*A + 2.0*(1.0 - t)*t*ctrl + t*t*B;
        float d    = length(uv - segPt);
        if (d < minDist) { minDist = d; bestH = t; }
    }

    float rind   = smoothstep(thick,         thick * 0.4,  minDist);
    float medulla = smoothstep(thick * 0.38, thick * 0.05, minDist);

    // Flow particle: bright spots traveling from A to B
    float flowSpot = 0.0;
    for (float p = 0.0; p < 5.0; p++) {
        float phase = fract(p * 0.2 + u_time * 0.25 * (0.6 + u_pressure * 0.4));
        float ph    = abs(bestH - phase);
        ph = min(ph, 1.0 - ph);
        flowSpot += exp(-ph * ph * 280.0) * exp(-minDist * minDist * 4500.0);
    }

    return vec4(rind, medulla, flowSpot, bestH);
}

// ── Fan-like hyphal fans from cord nodes ──────────────────────────────────────

float hyphalFan(vec2 uv, vec2 nodePos, float fanAngle, float seed) {
    float fan = 0.0;
    for (float i = 0.0; i < 7.0; i++) {
        float ang  = fanAngle + (i - 3.0) * 0.25 + hash1(seed + i) * 0.15;
        vec2  dir  = vec2(cos(ang), sin(ang));
        vec2  pos  = nodePos;
        float stepSz = 0.014;
        for (float j = 0.0; j < 22.0; j++) {
            float d   = length(uv - pos);
            float growT = clamp(u_time * 0.12 - 0.1, 0.0, 1.0);
            float tr  = j * stepSz;
            if (tr < growT * 0.3) {
                fan += smoothstep(0.0025, 0.0, d) * (1.0 - j / 22.0) * 0.5;
            }
            float w = (vnoise(pos * 30.0 + seed) - 0.5) * 0.6;
            dir = normalize(rot2(dir, w * 0.5));
            pos += dir * stepSz;
        }
    }
    return clamp(fan, 0.0, 1.0);
}

// ── Exploratory hyphae off cord sides ─────────────────────────────────────────

float exploratoryHyphae(vec2 uv, vec2 A, vec2 B, float seed) {
    float acc = 0.0;
    for (float i = 0.0; i < 8.0; i++) {
        float t      = (i + 0.5) / 8.0;
        vec2  onCord = mix(A, B, t);
        float ang    = atan(B.y - A.y, B.x - A.x)
                     + (hash1(seed + i) - 0.5) * PI * 0.9;
        vec2  dir    = vec2(cos(ang), sin(ang));
        float growT  = clamp(u_time * 0.1 - t * 0.3, 0.0, 1.0);

        vec2 pos = onCord;
        for (float j = 0.0; j < 15.0; j++) {
            float tr = j * 0.013;
            if (tr < growT * 0.25) {
                float d = length(uv - pos);
                acc += smoothstep(0.0018, 0.0, d) * (1.0 - j / 15.0) * 0.45;
                float w = (vnoise(pos * 40.0 + seed + i) - 0.5);
                dir = normalize(rot2(dir, w * 0.7));
                pos += dir * 0.013;
            }
        }
    }
    return clamp(acc, 0.0, 1.0);
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2 uv  = gl_FragCoord.xy / u_resolution.xy;
    vec2 src = u_source_pos;
    vec2 snk = u_sink_pos;

    vec3 color = barkSubstrate(uv);

    // Primary rhizomorph: source → sink
    vec4 main_cord = rhizomorphCord(uv, src, snk, 0.0, 0.018);

    // Two subsidiary cords branching from mid-point
    vec2 mid   = mix(src, snk, 0.5);
    vec2 perp  = normalize(vec2(-(snk-src).y, (snk-src).x));
    vec4 cord2 = rhizomorphCord(uv, mid, mid + perp * 0.22 + (snk - src) * 0.2, 1.0, 0.011);
    vec4 cord3 = rhizomorphCord(uv, mid, mid - perp * 0.18 + (snk - src) * 0.15, 2.0, 0.011);

    // Rind: near-black melanised exterior
    float rind = clamp(main_cord.x + cord2.x + cord3.x, 0.0, 1.0);
    color = mix(color, vec3(0.06, 0.04, 0.02), rind * 0.95);

    // Medulla: pale ivory interior (pressurised, water-filled)
    float med = clamp(main_cord.y + cord2.y * 0.7 + cord3.y * 0.7, 0.0, 1.0);
    color = mix(color, vec3(0.78, 0.72, 0.60), med * 0.88);

    // Flow particles: bright cream-white spots traveling along medulla
    float flow = clamp(main_cord.z + cord2.z * 0.7 + cord3.z * 0.6, 0.0, 1.5);
    color += vec3(0.95, 0.90, 0.72) * flow * u_pressure * 0.85;

    // Hyphal fans at source and sink nodes
    float mainAngle = atan(snk.y - src.y, snk.x - src.x);
    float fanSrc = hyphalFan(uv, src,  mainAngle + PI, 10.0);
    float fanSnk = hyphalFan(uv, snk,  mainAngle,      20.0);
    color = mix(color, vec3(0.45, 0.35, 0.22), (fanSrc + fanSnk) * 0.55);

    // Exploratory hyphae off the main cord
    float expl = exploratoryHyphae(uv, src, snk, 99.0);
    color = mix(color, vec3(0.40, 0.30, 0.18), expl * 0.55);

    // Source node pulse: food base inoculation point glow
    float srcGlow = exp(-length(uv - src) * length(uv - src) * 400.0)
                  * (0.7 + 0.3 * sin(u_time * 1.5)) * u_pressure;
    color += vec3(0.60, 0.42, 0.18) * srcGlow * 0.6;

    // Sink node: active growing tip glow
    float snkGlow = exp(-length(uv - snk) * length(uv - snk) * 600.0)
                  * (0.5 + 0.5 * sin(u_time * 2.2 + 1.0));
    color += vec3(0.30, 0.55, 0.20) * snkGlow * 0.5;

    // Vignette
    float vig = 1.0 - smoothstep(0.42, 0.85, length(uv - vec2(0.5)));
    color *= vig;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
