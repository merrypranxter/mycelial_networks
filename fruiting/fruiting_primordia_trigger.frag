// fruiting_primordia_trigger.frag
// Environmental signals combine to trigger or abort mushroom primordia within a dense mycelial mat.
// Cooling, short photoperiod, and a moisture pulse raise developmental commitment above a threshold for pin formation.

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_temperature_drop;
uniform float u_day_length;
uniform float u_moisture_pulse;

const float PI = 3.14159265359;

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

float circle(vec2 p, vec2 c, float r, float w) {
    float d = abs(length(p - c) - r);
    return 1.0 - smoothstep(w, w + 0.01, d);
}

float gaugeFill(vec2 p, vec2 c, float value) {
    vec2 q = p - c;
    float ang = atan(q.y, q.x);
    ang = ang < 0.0 ? ang + 2.0 * PI : ang;
    float target = mix(PI * 1.25, PI * 2.75, value) + PI * 0.5;
    float mask = step(ang, target);
    float ring = circle(p, c, 0.11, 0.02);
    return ring * mask * step(q.y, 0.12);
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv;
    p.x *= u_resolution.x / u_resolution.y;
    float aspect = u_resolution.x / u_resolution.y;

    float tempVal = clamp(u_temperature_drop + 0.10 * sin(u_time * 0.7), 0.0, 1.0);
    float photoVal = clamp((1.0 - u_day_length) + 0.08 * sin(u_time * 0.45 + 1.2), 0.0, 1.0);
    float moistureVal = clamp(u_moisture_pulse + 0.12 * sin(u_time * 0.9 + 2.4), 0.0, 1.0);
    float trigger = tempVal * photoVal * moistureVal;
    float commit = smoothstep(0.18, 0.42, trigger);

    vec3 soil = mix(vec3(0.08, 0.06, 0.04), vec3(0.16, 0.11, 0.08), fbm(uv * 8.0));
    vec3 color = soil;

    float mat = 0.0;
    mat = max(mat, 1.0 - smoothstep(0.0, 0.010, sdSegment(p, vec2(0.18 * aspect, 0.18), vec2(0.82 * aspect, 0.26))));
    mat = max(mat, 1.0 - smoothstep(0.0, 0.010, sdSegment(p, vec2(0.10 * aspect, 0.10), vec2(0.90 * aspect, 0.16))));
    mat = max(mat, 1.0 - smoothstep(0.0, 0.008, sdSegment(p, vec2(0.22 * aspect, 0.08), vec2(0.72 * aspect, 0.12))));
    mat += smoothstep(0.72, 0.92, fbm(uv * 26.0 + vec2(u_time * 0.05, -u_time * 0.03))) * 0.35;
    color = mix(color, vec3(0.74, 0.72, 0.68), clamp(mat, 0.0, 0.75));

    vec2 c0 = vec2(0.22 * aspect, 0.78);
    vec2 c1 = vec2(0.50 * aspect, 0.78);
    vec2 c2 = vec2(0.78 * aspect, 0.78);

    float g0 = circle(p, c0, 0.11, 0.02) + gaugeFill(p, c0, tempVal);
    float g1 = circle(p, c1, 0.11, 0.02) + gaugeFill(p, c1, photoVal);
    float g2 = circle(p, c2, 0.11, 0.02) + gaugeFill(p, c2, moistureVal);

    color += vec3(0.28, 0.35, 0.44) * circle(p, c0, 0.11, 0.02);
    color += vec3(0.36, 0.32, 0.44) * circle(p, c1, 0.11, 0.02);
    color += vec3(0.26, 0.40, 0.34) * circle(p, c2, 0.11, 0.02);
    color += vec3(0.70, 0.84, 0.96) * gaugeFill(p, c0, tempVal) * 0.8;
    color += vec3(0.80, 0.74, 0.94) * gaugeFill(p, c1, photoVal) * 0.8;
    color += vec3(0.78, 0.96, 0.86) * gaugeFill(p, c2, moistureVal) * 0.8;

    float thresholdHalo = exp(-length(vec2(uv.x - 0.5, uv.y - 0.50)) * 6.0) * commit;
    color += vec3(0.18, 0.22, 0.12) * thresholdHalo;

    float pins = smoothstep(0.84, 0.96, fbm(uv * 38.0 + vec2(0.0, u_time * 0.10)));
    pins *= smoothstep(0.05, 0.48, uv.y) * (0.35 + 0.65 * commit);
    float flash = commit * (0.6 + 0.4 * sin(u_time * 7.0));
    color += vec3(1.0, 1.0, 0.98) * pins * flash;

    float abort = (1.0 - commit) * pins * (0.4 + 0.6 * sin(u_time * 5.0 + fbm(uv * 12.0) * 8.0));
    color -= vec3(0.14, 0.10, 0.10) * abort * 0.35;

    float vignette = 1.0 - smoothstep(0.22, 1.12, length(uv - 0.5));
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}
