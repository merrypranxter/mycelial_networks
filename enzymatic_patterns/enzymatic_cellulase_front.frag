// enzymatic_cellulase_front.frag
// Brown rot cellulose removal travels through pores, hollows cell walls, and leaves a lignin-rich brown residue.
// As the carbohydrate scaffold is lost, stress concentrates and dark cracks begin to propagate through the weakened wood.

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_decay_stage;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float lattice(vec2 uv, float scale) {
    vec2 g = fract(uv * scale) - 0.5;
    float cell = max(abs(g.x), abs(g.y));
    return cell;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv;
    p.x *= u_resolution.x / u_resolution.y;

    vec3 baseWood = mix(vec3(0.22, 0.13, 0.07), vec3(0.46, 0.29, 0.16), noise((uv + vec2(0.0, u_time * 0.002)) * vec2(11.0, 52.0)));

    float poreNet = noise(uv * vec2(18.0, 30.0) + vec2(u_time * 0.01, 0.0));
    float front = uv.x + (noise(uv * vec2(4.0, 10.0) + u_time * 0.05) - 0.5) * 0.16;
    float decay = smoothstep(front - 0.18, front + 0.10, u_decay_stage);
    float constrained = decay * smoothstep(0.35, 0.90, poreNet);

    float wall = lattice(uv + vec2(0.0, sin(uv.x * 10.0) * 0.02), 16.0);
    float wallThickness = mix(0.12, 0.03, constrained * (0.6 + 0.4 * sin(u_time * 0.8 + uv.y * 5.0)));
    float cellWalls = 1.0 - smoothstep(wallThickness, wallThickness + 0.02, wall);

    vec3 residue = vec3(0.62, 0.40, 0.18);
    vec3 stripped = vec3(0.86, 0.78, 0.62);
    vec3 color = baseWood;
    color = mix(color, stripped, constrained * 0.45);
    color = mix(color, residue, constrained * 0.55);

    float collapse = constrained * (1.0 - cellWalls);
    color *= 1.0 - collapse * 0.28;
    color += vec3(0.10, 0.06, 0.02) * cellWalls * (1.0 - constrained * 0.6);

    float stress = constrained * smoothstep(0.55, 0.95, noise(uv * vec2(22.0, 8.0) + vec2(u_time * 0.03, -u_time * 0.01)));
    float crackLines = 1.0 - smoothstep(0.0, 0.04, abs(sin(uv.y * 35.0 + noise(uv * 5.0) * 6.0 + u_time * 0.3)));
    crackLines *= smoothstep(0.45, 0.95, u_decay_stage);
    float cracks = stress * crackLines;
    color = mix(color, vec3(0.07, 0.04, 0.02), cracks * 0.95);

    float dust = smoothstep(0.92, 0.985, noise(uv * 70.0 + vec2(u_time * 0.8, u_time * 0.5)));
    color += vec3(0.95, 0.82, 0.58) * dust * constrained * 0.18;

    float vignette = 1.0 - smoothstep(0.24, 1.15, length(uv - 0.5));
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}
