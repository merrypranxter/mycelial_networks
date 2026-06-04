// network_flow_visualization.frag
// Biological network graph: weighted hyphal edge flow
// Models the Bebber et al. (2007) principle that mycelial networks self-optimise
//   to minimise path length while maintaining fault tolerance (loop redundancy).
// Nodes represent anastomosis junctions or branching points.
// Edge thickness: proportional to hydraulic conductance (flow weight).
// Flow colour scale: blue (low flux) → amber (medium) → white (saturated / max).
// Animated flow particles travel along each edge at rate ∝ flow weight.
// Nodes pulse at frequency proportional to their degree (number of connections).
// Reference: Bebber et al. (2007 Science), Boddy (1999), Ritz & Crawford (1990)

precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_node_count;   // 4–10, number of network nodes
uniform float u_flow_speed;   // overall particle travel speed

#define PI     3.14159265359
#define TAU    6.28318530718
#define MAX_NODES 10.0
#define EDGE_CONNECT_DIST 0.38  // max distance to create an edge

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

// ── Node positions (deterministic from seed) ──────────────────────────────────

vec2 getNode(float i) {
    // Poisson-ish layout: golden angle spiral with jitter
    float ang = i * 2.39996;
    float r   = 0.12 + (i / MAX_NODES) * 0.30;
    return vec2(0.5, 0.5)
         + vec2(cos(ang), sin(ang)) * r
         + vec2(hash1(i * 3.1) - 0.5, hash1(i * 5.7) - 0.5) * 0.12;
}

// Flow weight for an edge (seed-determined)
float edgeWeight(float i, float j) {
    return 0.25 + hash1(i * 7.3 + j * 3.1) * 0.75;
}

// ── Closest point on segment ──────────────────────────────────────────────────

vec2 closestOnSeg(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / (dot(ba, ba) + 1e-6), 0.0, 1.0);
    return vec2(length(pa - ba * h), h);
}

// ── Flow colour ramp ──────────────────────────────────────────────────────────

vec3 flowColor(float intensity) {
    // Blue (0) → amber (0.5) → white (1)
    vec3 blue  = vec3(0.10, 0.28, 0.85);
    vec3 amber = vec3(0.92, 0.62, 0.12);
    vec3 white = vec3(1.00, 0.97, 0.90);
    if (intensity < 0.5) {
        return mix(blue, amber, intensity * 2.0);
    } else {
        return mix(amber, white, (intensity - 0.5) * 2.0);
    }
}

// ── Edge rendering + flow particles ──────────────────────────────────────────

// Returns vec3: accumulated edge glow (rgb)
vec3 renderEdge(vec2 uv, vec2 A, vec2 B, float weight) {
    vec2  cs     = closestOnSeg(uv, A, B);
    float dist   = cs.x;
    float h      = cs.y;  // parameter along edge (0=A, 1=B)

    float thick  = 0.0015 + weight * 0.004;
    float edgeMask = smoothstep(thick, thick * 0.2, dist);

    if (edgeMask < 0.005) return vec3(0.0);

    // Base edge colour: dim version of flow colour
    vec3 baseCol = flowColor(weight) * 0.25;

    // Flow particles: 4 per edge traveling from A→B
    float flowAcc = 0.0;
    float speed   = u_flow_speed * weight * 0.4;
    for (float p = 0.0; p < 4.0; p++) {
        float phase = fract(p * 0.25 + u_time * speed);
        float dp    = abs(h - phase);
        dp = min(dp, 1.0 - dp);  // wrap
        flowAcc += exp(-dp * dp * 350.0);
    }
    flowAcc = clamp(flowAcc, 0.0, 1.0);

    vec3 particleCol = flowColor(weight) * flowAcc * weight;

    return (baseCol + particleCol) * edgeMask;
}

// ── Node rendering ────────────────────────────────────────────────────────────

// Returns glow intensity at uv for a node with given degree
float renderNode(vec2 uv, vec2 pos, float degree) {
    float d     = length(uv - pos);
    float baseR = 0.008 + degree * 0.003;
    float pulse = 0.7 + 0.3 * sin(u_time * (1.0 + degree * 0.4));
    return smoothstep(baseR, baseR * 0.2, d) * pulse
         + exp(-d * d * 1500.0) * 0.3 * pulse;  // soft halo
}

// ── Node degree counting ──────────────────────────────────────────────────────

float nodeDegree(float i, float nodeCount) {
    float deg = 0.0;
    vec2  A   = getNode(i);
    for (float j = 0.0; j < MAX_NODES; j++) {
        if (j < nodeCount && j != i) {
            vec2  B    = getNode(j);
            float dist = length(A - B);
            if (dist < EDGE_CONNECT_DIST) deg += 1.0;
        }
    }
    return deg;
}

// ── Background: dark substrate with faint hyphal ghost ────────────────────────

vec3 networkBackground(vec2 uv) {
    float grain = fbm4(uv * 5.0) * 0.3;
    return mix(vec3(0.04, 0.03, 0.05), vec3(0.08, 0.07, 0.10), grain);
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
    vec2  uv        = gl_FragCoord.xy / u_resolution.xy;
    float nodeCount = clamp(u_node_count, 4.0, MAX_NODES);

    vec3  color = networkBackground(uv);

    // Render all edges
    for (float i = 0.0; i < MAX_NODES; i++) {
        if (i < nodeCount) {
            vec2 A = getNode(i);
            for (float j = 0.0; j < MAX_NODES; j++) {
                if (j < nodeCount && j > i) {
                    vec2  B    = getNode(j);
                    float dist = length(A - B);
                    if (dist < EDGE_CONNECT_DIST) {
                        float w = edgeWeight(i, j);
                        color += renderEdge(uv, A, B, w);
                    }
                }
            }
        }
    }

    // Render nodes (drawn on top)
    for (float i = 0.0; i < MAX_NODES; i++) {
        if (i < nodeCount) {
            vec2  pos  = getNode(i);
            float deg  = nodeDegree(i, nodeCount);
            float glow = renderNode(uv, pos, deg);
            float norm = clamp(deg / 4.0, 0.0, 1.0);
            color += flowColor(norm) * glow * 1.2;
        }
    }

    // Vignette
    float vig = 1.0 - smoothstep(0.44, 0.88, length(uv - vec2(0.5)));
    color *= vig;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
