precision highp float;

uniform vec2 u_resolution;
uniform float u_cut_angle;
uniform float u_ring_count;

float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    float n = dot(p, p + vec2(34.23));
    p += vec2(n);
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

vec3 hexColor(vec3 c) {
    return c / 255.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 p = uv - 0.5;
    p.x *= aspect;

    float cut = clamp(u_cut_angle, 0.0, 1.0);
    float rings = clamp(u_ring_count, 5.0, 20.0);

    float transverse = length(p * vec2(1.0, 1.2)) + noise(p * 6.0) * 0.015;
    float radial = uv.x + noise(vec2(uv.y * 8.0, uv.x * 2.0)) * 0.03;
    float tangential = uv.y + noise(vec2(uv.x * 5.0, uv.y * 9.0)) * 0.035;

    float radialMix = 1.0 - min(abs(cut - 0.5) * 2.0, 1.0);
    float tangentialMix = smoothstep(0.5, 1.0, cut);
    float transverseMix = 1.0 - smoothstep(0.0, 0.5, cut);
    float totalMix = max(transverseMix + radialMix + tangentialMix, 0.0001);

    float ringAxis = (
        transverse * transverseMix +
        radial * radialMix +
        tangential * tangentialMix
    ) / totalMix;

    float annual = fract(ringAxis * rings);
    float lateWood = smoothstep(0.58, 0.92, annual + noise(uv * 12.0) * 0.06);

    vec3 earlyColor = hexColor(vec3(200.0, 160.0, 107.0));
    vec3 lateColor = hexColor(vec3(122.0, 82.0, 48.0));
    vec3 color = mix(earlyColor, lateColor, lateWood);

    float angle = atan(p.y, p.x);
    float rayTransverse = 1.0 - smoothstep(0.0, 0.03, abs(sin(angle * 22.0)));
    float rayLongitudinal = 1.0 - smoothstep(0.0, 0.05, abs(fract(uv.x * 18.0) - 0.5));
    float rays = mix(rayTransverse, rayLongitudinal, smoothstep(0.25, 0.85, cut));
    color += vec3(0.09, 0.06, 0.03) * rays * 0.25;

    vec2 poreCell = floor(uv * vec2(22.0, rings * 3.0 + 8.0));
    vec2 poreUV = fract(uv * vec2(22.0, rings * 3.0 + 8.0)) - 0.5;
    vec2 poreOffset = vec2(hash(poreCell), hash(poreCell + vec2(4.1))) - 0.5;
    float poreRadius = mix(0.06, 0.18, hash(poreCell + vec2(2.7)));
    float pore = 1.0 - smoothstep(poreRadius, poreRadius + 0.025, length(poreUV - poreOffset * 0.35));
    float poreMask = (1.0 - lateWood) * (1.0 - smoothstep(0.35, 0.9, cut));
    color = mix(color, color * 0.45, pore * poreMask * 0.8);

    float grain = noise(vec2(uv.x * 80.0, uv.y * 10.0)) * 0.08 + noise(uv * 40.0) * 0.05;
    color += vec3(grain);

    gl_FragColor = vec4(color, 1.0);
}
