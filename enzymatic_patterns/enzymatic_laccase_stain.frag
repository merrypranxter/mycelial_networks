// enzymatic_laccase_stain.frag
// Laccase oxidizes phenolic compounds, producing blue-gray staining that spreads away from active hyphae.
// On wood the stain follows grain and vessels, while in soil it diffuses through patchy organic microsites.

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_substrate_type;

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
        a *= 0.52;
    }
    return v;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float woodMode = 1.0 - step(0.5, u_substrate_type);
    float soilMode = 1.0 - woodMode;

    vec3 wood = mix(vec3(0.24, 0.16, 0.09), vec3(0.40, 0.28, 0.16), noise((uv + vec2(0.0, u_time * 0.002)) * vec2(12.0, 62.0)));
    vec3 soil = mix(vec3(0.12, 0.10, 0.08), vec3(0.24, 0.20, 0.16), fbm(uv * 8.0 + vec2(u_time * 0.01, -u_time * 0.01)));
    vec3 base = wood * woodMode + soil * soilMode;

    float hypha = 0.0;
    hypha = max(hypha, 1.0 - smoothstep(0.0, 0.016, sdSegment(p, vec2(-0.42, 0.08), vec2(-0.08, 0.02))));
    hypha = max(hypha, 1.0 - smoothstep(0.0, 0.013, sdSegment(p, vec2(-0.10, 0.00), vec2(0.22, -0.16))));
    hypha = max(hypha, 1.0 - smoothstep(0.0, 0.010, sdSegment(p, vec2(0.00, 0.04), vec2(0.16, 0.22))));

    float stain = exp(-abs(hypha - 0.18) * 8.5) + hypha * 0.75;
    stain *= 0.65 + 0.35 * sin(u_time * 0.7 + fbm(uv * 10.0) * 6.0);

    float grainFollow = smoothstep(0.45, 0.82, noise(uv * vec2(18.0, 68.0)));
    float vessel = 1.0 - smoothstep(0.0, 0.10, abs(sin(uv.y * 55.0 + noise(uv * 8.0) * 4.0)));
    float organicZones = smoothstep(0.40, 0.78, fbm(uv * 4.0 + 7.0));

    float woodPattern = stain * (0.45 + 0.55 * max(grainFollow, vessel));
    float soilPattern = stain * (0.35 + 0.65 * organicZones);
    float pattern = woodPattern * woodMode + soilPattern * soilMode;

    vec3 blueCore = vec3(0.22, 0.38, 0.62);
    vec3 grayFade = vec3(0.56, 0.60, 0.66);
    vec3 stainColor = mix(grayFade, blueCore, hypha);

    vec3 color = base;
    color = mix(color, stainColor, clamp(pattern, 0.0, 0.85));
    color += vec3(0.12, 0.16, 0.24) * hypha * 0.45;

    float patches = smoothstep(0.85, 0.96, fbm(uv * 22.0 + vec2(u_time * 0.06, -u_time * 0.04)));
    color += vec3(0.10, 0.12, 0.18) * patches * pattern * 0.25;

    float vignette = 1.0 - smoothstep(0.22, 0.98, length(uv - 0.5));
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}
