// anastomosis_loop_formation.frag
// Compatible hyphae close loops by anastomosis, creating redundant pathways in a transport network.
// Newly fused nodes flash gold and then settle into amber circulation as the loop ages and flow redistributes.

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_loop_age;

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

float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

float loopBand(vec2 p, vec2 c, vec2 radius, float width) {
    vec2 q = (p - c) / radius;
    float d = abs(length(q) - 1.0) * min(radius.x, radius.y);
    return 1.0 - smoothstep(width, width + 0.01, d);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float stage = fract(u_time * 0.10);
    float pre = 1.0 - smoothstep(0.34, 0.52, stage);
    float formed = smoothstep(0.40, 0.58, stage);
    float flash = smoothstep(0.44, 0.50, stage) * (1.0 - smoothstep(0.50, 0.58, stage));

    vec2 a0 = vec2(-0.34, -0.04);
    vec2 a1 = vec2(-0.06 + pre * -0.08, 0.14);
    vec2 b0 = vec2(0.34, 0.04);
    vec2 b1 = vec2(0.06 + pre * 0.08, -0.14);

    float approachA = 1.0 - smoothstep(0.0, 0.018, sdSegment(p, a0, a1));
    float approachB = 1.0 - smoothstep(0.0, 0.018, sdSegment(p, b0, b1));
    float bridge = 1.0 - smoothstep(0.0, 0.020, sdSegment(p, vec2(-0.06, 0.14), vec2(0.06, -0.14)));
    bridge *= formed;

    float mainLoop = loopBand(p, vec2(0.0, 0.0), vec2(0.22, 0.18), 0.015) * formed;
    float oldLoop1 = loopBand(p, vec2(-0.36, 0.18), vec2(0.12, 0.09), 0.010) * (0.35 + 0.65 * u_loop_age);
    float oldLoop2 = loopBand(p, vec2(0.34, -0.22), vec2(0.15, 0.10), 0.010) * (0.45 + 0.55 * u_loop_age);

    vec3 wood = mix(vec3(0.08, 0.05, 0.03), vec3(0.19, 0.12, 0.07), noise((uv + vec2(0.0, u_time * 0.004)) * vec2(10.0, 55.0)));
    vec3 color = wood;

    float network = max(max(approachA, approachB), max(mainLoop, max(oldLoop1, oldLoop2)));
    network = max(network, bridge);
    color = mix(color, vec3(0.90, 0.86, 0.78), clamp(network, 0.0, 1.0));

    float node = exp(-length(p) * 30.0) * formed;
    color += vec3(1.0, 0.83, 0.35) * (node * (0.6 + 1.4 * flash));

    float angle = atan(p.y, p.x);
    float radius = length(vec2(p.x / 0.22, p.y / 0.18));
    float loopFlow = mainLoop * (1.0 - smoothstep(0.88, 1.12, radius)) * (0.5 + 0.5 * sin(angle * 8.0 - u_time * (4.0 + 4.0 * u_loop_age)));
    float oldFlow1 = oldLoop1 * (0.5 + 0.5 * sin(atan(p.y - 0.18, p.x + 0.36) * 6.0 - u_time * 3.0));
    float oldFlow2 = oldLoop2 * (0.5 + 0.5 * sin(atan(p.y + 0.22, p.x - 0.34) * 7.0 - u_time * 3.6));
    color += vec3(0.95, 0.62, 0.22) * (loopFlow + oldFlow1 * 0.6 + oldFlow2 * 0.7);

    float particles = smoothstep(0.92, 0.985, noise(uv * 60.0 + vec2(u_time * 2.0, -u_time * 1.5)));
    color += vec3(1.0, 0.88, 0.56) * particles * network * 0.4;

    float vignette = 1.0 - smoothstep(0.25, 0.95, length(uv - 0.5));
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}
