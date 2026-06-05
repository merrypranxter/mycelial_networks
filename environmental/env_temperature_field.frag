// env_temperature_field.frag
// Maps fungal thermal conditions as ambient temperature, solar warming, and decomposition heat interact.
// Green marks an approximate mesophilic growth optimum, while blue and red indicate cold limitation and heat lethality.

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_ambient_temp;
uniform vec2 u_heat_source;

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
        p *= 2.02;
        a *= 0.53;
    }
    return v;
}

float contour(float value, float spacing, float width) {
    float cell = fract(value / spacing);
    float ring = min(cell, 1.0 - cell);
    return 1.0 - smoothstep(0.0, width, ring);
}

vec3 temperatureRamp(float temp) {
    vec3 cold = vec3(0.07, 0.15, 0.52);
    vec3 cool = vec3(0.18, 0.54, 0.84);
    vec3 optimal = vec3(0.34, 0.80, 0.30);
    vec3 warm = vec3(0.95, 0.68, 0.18);
    vec3 lethal = vec3(0.90, 0.13, 0.10);

    vec3 c = mix(cold, cool, smoothstep(0.0, 10.0, temp));
    c = mix(c, optimal, smoothstep(10.0, 22.0, temp));
    c = mix(c, warm, smoothstep(22.0, 32.0, temp));
    c = mix(c, lethal, smoothstep(32.0, 40.0, temp));
    return c;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv;
    p.x *= u_resolution.x / u_resolution.y;

    vec2 heat = u_heat_source;
    vec2 heatP = heat;
    heatP.x *= u_resolution.x / u_resolution.y;

    float diurnal = sin(u_time * 0.35) * 4.5;
    float solar = uv.y * 8.5 + 1.5 * sin(u_time * 0.17 + uv.x * 3.5);
    float heatDist = length(p - heatP);
    float decomposition = exp(-heatDist * 5.0) * (8.0 + 2.5 * sin(u_time * 0.9));
    float micro = (fbm(uv * 4.5 + vec2(u_time * 0.03, -u_time * 0.02)) - 0.5) * 3.0;

    float temp = clamp(u_ambient_temp + diurnal + solar + decomposition + micro, 0.0, 45.0);
    vec3 color = temperatureRamp(temp);

    float optimum = smoothstep(15.0, 18.0, temp) * (1.0 - smoothstep(25.0, 28.0, temp));
    color += vec3(0.10, 0.18, 0.04) * optimum;

    float lethal = smoothstep(35.0, 39.5, temp);
    color += vec3(0.18, 0.02, 0.02) * lethal;

    float iso5 = contour(temp + fbm(uv * 6.0) * 0.8, 5.0, 0.06);
    color += vec3(0.20, 0.20, 0.18) * iso5 * 0.55;

    float surfaceBand = smoothstep(0.82, 1.0, uv.y) * (0.5 + 0.5 * sin(u_time * 0.4 + uv.x * 4.0));
    color += vec3(0.08, 0.04, 0.01) * surfaceBand;

    float hotspot = exp(-heatDist * 14.0);
    color += vec3(0.22, 0.08, 0.03) * hotspot;

    float chillShadow = smoothstep(0.0, 0.18, uv.y) * (1.0 - smoothstep(2.0, 10.0, temp));
    color *= 1.0 - chillShadow * 0.22;

    float vignette = 1.0 - smoothstep(0.22, 1.2, length(uv - 0.5));
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}
