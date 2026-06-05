// env_competition_field.frag
// Renders competing fungal territories, barrage lines, volatile halos, and aggressive mycoparasitic invasion.
// Distinct hues represent different species, while dark inhibition bands mark secreted antibiosis at contested fronts.

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_competitor_count;

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
        p *= 2.01;
        a *= 0.52;
    }
    return v;
}

vec2 site(float i) {
    if (i < 0.5) return vec2(0.18, 0.24);
    if (i < 1.5) return vec2(0.76, 0.20);
    if (i < 2.5) return vec2(0.50, 0.38);
    if (i < 3.5) return vec2(0.24, 0.74);
    if (i < 4.5) return vec2(0.70, 0.70);
    return vec2(0.50, 0.84);
}

vec3 speciesColor(float i) {
    if (i < 0.5) return vec3(0.69, 0.58, 0.43);
    if (i < 1.5) return vec3(0.45, 0.63, 0.49);
    if (i < 2.5) return vec3(0.74, 0.45, 0.34);
    if (i < 3.5) return vec3(0.58, 0.50, 0.70);
    if (i < 4.5) return vec3(0.78, 0.70, 0.48);
    return vec3(0.38, 0.62, 0.68);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv;
    p.x *= u_resolution.x / u_resolution.y;
    float aspect = u_resolution.x / u_resolution.y;

    float count = clamp(floor(u_competitor_count + 0.5), 1.0, 6.0);
    float nearest = 100.0;
    float second = 100.0;
    float winner = 0.0;

    for (float i = 0.0; i < 6.0; i++) {
        float active = step(i + 0.5, count);
        vec2 s = site(i);
        vec2 sp = s;
        sp.x *= aspect;
        float growthPhase = 0.04 * sin(u_time * (0.35 + i * 0.07) + i * 1.7);
        float d = length(p - sp) - active * growthPhase;
        d = mix(100.0, d, active);
        if (d < nearest) {
            second = nearest;
            nearest = d;
            winner = i;
        } else if (d < second) {
            second = d;
        }
    }

    vec3 wood = mix(vec3(0.17, 0.11, 0.07), vec3(0.29, 0.20, 0.13), fbm(uv * vec2(10.0, 45.0)));
    vec3 terr = speciesColor(winner);

    float mycelialTexture = fbm(uv * (6.0 + winner) + vec2(winner * 4.0, -u_time * 0.04));
    vec3 color = wood + terr * (0.30 + 0.25 * mycelialTexture);

    float boundary = 1.0 - smoothstep(0.0, 0.030, second - nearest);
    color *= 1.0 - boundary * 0.72;

    float volatileField = fbm(uv * 12.0 + vec2(u_time * 0.12, -u_time * 0.08));
    float wisps = boundary * smoothstep(0.58, 0.82, volatileField);
    color += vec3(0.10, 0.18, 0.10) * wisps * 0.45;

    vec2 s0 = site(0.0);
    vec2 s1 = site(min(1.0, count - 1.0));
    vec2 front = mix(s1, s0, 0.5 + 0.5 * sin(u_time * 0.22));
    front.x *= aspect;
    float invasion = exp(-length(p - front) * 25.0) * boundary;
    float sparks = smoothstep(0.93, 0.985, fbm(uv * 40.0 + vec2(u_time * 2.5, u_time * 1.4)));
    color += vec3(1.0, 0.82, 0.35) * invasion * sparks * 1.5;

    float inhibitionGlow = boundary * (0.5 + 0.5 * sin(u_time * 3.0 + fbm(uv * 15.0) * 6.0));
    color += vec3(0.14, 0.10, 0.04) * inhibitionGlow;

    float ring = sin((nearest * 35.0) - u_time * 0.8 + winner * 1.6) * 0.5 + 0.5;
    color += terr * ring * 0.08;

    float vignette = 1.0 - smoothstep(0.22, 1.18, length(uv - 0.5));
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}
