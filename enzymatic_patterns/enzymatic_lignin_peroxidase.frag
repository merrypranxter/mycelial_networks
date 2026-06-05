// enzymatic_lignin_peroxidase.frag
// Visualizes lignin peroxidase diffusing from active hyphae into dark wood during white rot decay.
// Oxidative attack bleaches lignified tissue, produces a blue-white halo, and sparks at reactive lignin sites.

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_enzyme_concentration;

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
        p *= 2.05;
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

    vec3 oak = mix(vec3(0.16, 0.10, 0.06), vec3(0.32, 0.22, 0.12), noise((uv + vec2(0.0, u_time * 0.003)) * vec2(12.0, 58.0)));
    oak *= 0.85 + 0.15 * fbm(uv * vec2(8.0, 42.0));

    float h1 = 1.0 - smoothstep(0.0, 0.018, sdSegment(p, vec2(-0.42, 0.12), vec2(-0.05, 0.02)));
    float h2 = 1.0 - smoothstep(0.0, 0.015, sdSegment(p, vec2(-0.10, 0.00), vec2(0.30, -0.14)));
    float h3 = 1.0 - smoothstep(0.0, 0.012, sdSegment(p, vec2(-0.02, 0.04), vec2(0.14, 0.22)));
    float h4 = 1.0 - smoothstep(0.0, 0.010, sdSegment(p, vec2(0.18, -0.10), vec2(0.42, 0.04)));
    float hyphae = max(max(h1, h2), max(h3, h4));

    float frontNoise = fbm((uv + vec2(u_time * 0.015, -u_time * 0.010)) * 8.0);
    float diffusionFront = smoothstep(0.10, 0.70, hyphae + u_enzyme_concentration * 0.55 + frontNoise * 0.32);
    float active = diffusionFront * (0.45 + 0.55 * u_enzyme_concentration);

    vec3 bleached = vec3(0.82, 0.79, 0.70);
    vec3 color = mix(oak, bleached, active * 0.72);
    color += vec3(0.48, 0.62, 0.72) * active * 0.20;
    color = mix(color, vec3(0.92, 0.94, 0.98), hyphae * 0.70);

    float halo = exp(-abs(hyphae - 0.18) * 8.0) * u_enzyme_concentration;
    color += vec3(0.56, 0.72, 0.92) * halo * 0.14;

    float sparks = smoothstep(0.95, 0.990, noise(uv * 85.0 + vec2(u_time * 2.8, -u_time * 1.6)));
    sparks *= active * smoothstep(0.45, 0.75, fbm(uv * 20.0));
    color += vec3(1.0, 0.96, 0.90) * sparks * 0.9;

    float paleEdge = smoothstep(0.40, 0.72, active) * (0.5 + 0.5 * sin(u_time * 1.4 + fbm(uv * 12.0) * 8.0));
    color += vec3(0.12, 0.14, 0.16) * paleEdge * 0.2;

    float vignette = 1.0 - smoothstep(0.22, 0.98, length(uv - 0.5));
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}
