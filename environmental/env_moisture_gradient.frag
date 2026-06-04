// env_moisture_gradient.frag
// Visualizes matric water potential around a water source and heterogeneous soil pore structure.
// Blue zones indicate high water availability, green marks the optimal fungal window, and red marks drought stress.

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_source_pos;
uniform float u_evaporation;

float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

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

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (float i = 0.0; i < 5.0; i++) {
        v += a * noise(p);
        p *= 2.03;
        a *= 0.52;
    }
    return v;
}

float band(float x, float a, float b, float blur) {
    return smoothstep(a - blur, a + blur, x) * (1.0 - smoothstep(b - blur, b + blur, x));
}

vec3 palette(float t) {
    vec3 wet = vec3(0.11, 0.36, 0.76);
    vec3 damp = vec3(0.32, 0.63, 0.88);
    vec3 cream = vec3(0.93, 0.86, 0.72);
    vec3 dry = vec3(0.72, 0.58, 0.39);
    vec3 c = mix(wet, damp, smoothstep(0.0, 0.35, t));
    c = mix(c, cream, smoothstep(0.28, 0.72, t));
    c = mix(c, dry, smoothstep(0.72, 1.0, t));
    return c;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv;
    p.x *= u_resolution.x / u_resolution.y;

    vec2 source = u_source_pos;
    vec2 sourceP = source;
    sourceP.x *= u_resolution.x / u_resolution.y;

    float distSource = length(p - sourceP);
    float radialWet = exp(-distSource * (3.0 + 3.0 * u_evaporation));

    float poreField = fbm(uv * vec2(5.0, 7.5) + vec2(0.0, u_time * 0.01));
    float clay = 1.0 - smoothstep(0.42, 0.72, poreField);
    float sand = smoothstep(0.45, 0.82, poreField);

    float seepMask = smoothstep(source.y - 0.06, source.y + 0.02, uv.y);
    float seepCore = exp(-abs(uv.x - source.x) * (12.0 + sand * 18.0));
    float seepPulse = 0.5 + 0.5 * sin((uv.y - source.y) * 34.0 - u_time * 2.2 + poreField * 4.0);
    float upwardSeep = seepMask * seepCore * seepPulse * (0.35 + 0.65 * clay);

    float smoothStorage = fbm(uv * 2.4 + vec2(0.0, u_time * 0.015));
    float patchStorage = fbm(uv * 10.0 + vec2(u_time * 0.05, -u_time * 0.02));
    float heterogeneity = mix(smoothStorage, patchStorage, sand);

    float wetness = radialWet + upwardSeep * 0.45 + heterogeneity * 0.22;
    wetness -= u_evaporation * (0.28 + 0.35 * uv.y);
    wetness = clamp(wetness, 0.0, 1.0);

    float waterPotential = -3.4 + wetness * 3.3;
    float normalized = clamp((-0.1 - waterPotential) / 3.3, 0.0, 1.0);

    vec3 color = palette(normalized);

    float capillaryThreads = band(fract((uv.y - u_time * 0.08 + poreField * 0.08) * 18.0), 0.48, 0.52, 0.12);
    color += vec3(0.08, 0.12, 0.10) * capillaryThreads * upwardSeep;

    float optimal = band(waterPotential, -1.5, -0.5, 0.08);
    color += vec3(0.12, 0.42, 0.15) * optimal * (0.45 + 0.55 * sin(u_time * 0.8 + poreField * 6.0) * 0.5 + 0.5);

    float drought = 1.0 - smoothstep(-3.25, -3.0, waterPotential);
    color = mix(color, color + vec3(0.35, 0.05, 0.02), drought * 0.7);

    float sourceBloom = exp(-distSource * 10.0) * (0.8 + 0.2 * sin(u_time * 1.6));
    color += vec3(0.12, 0.25, 0.35) * sourceBloom;

    float surfaceDry = smoothstep(0.72, 1.0, uv.y) * u_evaporation;
    color *= 1.0 - surfaceDry * 0.18;

    float vignette = 1.0 - smoothstep(0.25, 1.15, length(uv - 0.5));
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}
