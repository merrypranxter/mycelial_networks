// env_nutrient_gradient.frag
// Shows overlapping carbon, nitrogen, phosphorus, and glucose fields diffusing through substrate.
// White zones approach a balanced C:N state, while amber and blue-green bias toward carbon-rich or nitrogen-rich conditions.

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_carbon_source;
uniform vec2 u_nitrogen_source;

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
        p *= 2.04;
        a *= 0.52;
    }
    return v;
}

float gaussian(vec2 p, vec2 c, float r) {
    float d = length(p - c);
    return exp(-d * d / (r * r));
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv;
    p.x *= u_resolution.x / u_resolution.y;

    vec2 carbon = u_carbon_source;
    carbon.x *= u_resolution.x / u_resolution.y;
    vec2 nitrogen = u_nitrogen_source;
    nitrogen.x *= u_resolution.x / u_resolution.y;

    float diffusion = 0.10 + 0.04 * sin(u_time * 0.08);
    float carbonField = gaussian(p, carbon, 0.12 + diffusion) + 0.45 * fbm(uv * 3.0 + vec2(u_time * 0.02, 0.0));
    float nitrogenField = gaussian(p, nitrogen, 0.10 + diffusion * 0.8) + 0.35 * fbm(uv * 3.8 - vec2(0.0, u_time * 0.018));

    carbonField = clamp(carbonField, 0.0, 1.0);
    nitrogenField = clamp(nitrogenField, 0.0, 1.0);

    vec2 g1 = vec2(0.25, 0.28);
    vec2 g2 = vec2(0.68, 0.63);
    vec2 g3 = vec2(0.52, 0.35);
    g1.x *= u_resolution.x / u_resolution.y;
    g2.x *= u_resolution.x / u_resolution.y;
    g3.x *= u_resolution.x / u_resolution.y;
    float glucose = gaussian(p, g1, 0.025) + gaussian(p, g2, 0.020) + gaussian(p, g3, 0.018);
    glucose *= 0.75 + 0.25 * sin(u_time * 1.1 + fbm(uv * 14.0) * 6.0);

    vec2 ph1 = vec2(0.18, 0.70);
    vec2 ph2 = vec2(0.78, 0.22);
    ph1.x *= u_resolution.x / u_resolution.y;
    ph2.x *= u_resolution.x / u_resolution.y;
    float phosphorus = gaussian(p, ph1, 0.18) + gaussian(p, ph2, 0.14);
    phosphorus *= 0.55 + 0.25 * fbm(uv * 2.0 + 5.0);

    float cnRatio = carbonField * 40.0 / max(nitrogenField * 1.4 + 0.05, 0.05);
    float balanced = 1.0 - smoothstep(0.0, 10.0, abs(cnRatio - 25.0));
    float carbonBias = smoothstep(27.0, 45.0, cnRatio);
    float nitrogenBias = 1.0 - smoothstep(8.0, 25.0, cnRatio);

    vec3 soil = mix(vec3(0.11, 0.08, 0.05), vec3(0.24, 0.17, 0.10), fbm(uv * 6.0));
    vec3 carbonCol = vec3(0.92, 0.64, 0.24) * carbonField;
    vec3 nitrogenCol = vec3(0.28, 0.76, 0.46) * nitrogenField;
    vec3 ratioCol = vec3(0.95) * balanced + vec3(0.86, 0.60, 0.20) * carbonBias + vec3(0.18, 0.62, 0.70) * nitrogenBias;

    vec3 color = soil;
    color += carbonCol * 0.65;
    color += nitrogenCol * 0.55;
    color = mix(color, ratioCol, clamp((carbonField + nitrogenField) * 0.45, 0.0, 0.75));
    color += vec3(0.85, 0.80, 1.0) * phosphorus * 0.28;
    color += vec3(1.0) * glucose * 0.85;

    float diffusionFlow = fbm(uv * 8.0 + vec2(u_time * 0.025, -u_time * 0.015));
    color += vec3(0.10, 0.06, 0.02) * diffusionFlow * (carbonField + nitrogenField) * 0.25;

    float halos = exp(-length(p - carbon) * 9.0) + exp(-length(p - nitrogen) * 10.0);
    color += vec3(0.12, 0.10, 0.08) * halos;

    float vignette = 1.0 - smoothstep(0.25, 1.18, length(uv - 0.5));
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}
