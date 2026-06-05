// anastomosis_sector_boundaries.frag
// Distinct genetic sectors expand through the same substrate but create melanized confrontation lines at incompatible borders.
// Interior growth stays pale and exploratory, while sector boundaries thicken, darken, and spark under antagonistic contact.

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_sector_count;

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

vec3 sectorColor(float i) {
    if (i < 0.5) return vec3(0.72, 0.66, 0.56);
    if (i < 1.5) return vec3(0.63, 0.57, 0.47);
    if (i < 2.5) return vec3(0.57, 0.51, 0.43);
    if (i < 3.5) return vec3(0.68, 0.60, 0.52);
    return vec3(0.60, 0.55, 0.48);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float count = clamp(floor(u_sector_count + 0.5), 2.0, 5.0);
    float angle = atan(p.y, p.x) + PI;
    float wedge = 2.0 * PI / count;
    float rawIndex = floor(angle / wedge);
    float idx = clamp(rawIndex, 0.0, 4.0);
    float local = fract(angle / wedge);

    float radial = length(p);
    float growthBias = 0.28 + 0.05 * sin(idx * 1.9 + u_time * (0.28 + idx * 0.04));
    float sectorFront = 0.34 + growthBias + 0.03 * noise(vec2(angle * 2.0, idx * 4.0));

    vec3 substrate = mix(vec3(0.18, 0.12, 0.08), vec3(0.27, 0.19, 0.12), noise((uv + vec2(0.0, u_time * 0.004)) * vec2(8.0, 40.0)));
    vec3 color = substrate;

    float interior = 1.0 - smoothstep(sectorFront, sectorFront + 0.018, radial);
    float alignedHyphae = 0.5 + 0.5 * sin(cos(idx * 1.2) * p.x * 42.0 + sin(idx * 1.2) * p.y * 42.0 + u_time * 0.6);
    vec3 tint = sectorColor(idx);
    color = mix(color, tint, interior * (0.42 + 0.18 * alignedHyphae));

    float angularBoundary = 1.0 - smoothstep(0.0, 0.08, min(local, 1.0 - local));
    float melanized = angularBoundary * interior;
    color *= 1.0 - melanized * 0.82;

    float thickBorder = angularBoundary * smoothstep(sectorFront - 0.03, sectorFront + 0.02, radial);
    color *= 1.0 - thickBorder * 0.35;

    float sparks = smoothstep(0.94, 0.988, noise(uv * 65.0 + vec2(u_time * 3.0, -u_time * 2.0)));
    color += vec3(0.92, 0.66, 0.18) * melanized * sparks * (0.55 + 0.45 * sin(u_time * 4.0));

    float interiorThreads = interior * smoothstep(0.54, 0.80, noise(uv * 24.0 + idx * 5.0));
    color += vec3(0.10, 0.08, 0.05) * interiorThreads * 0.25;

    float vignette = 1.0 - smoothstep(0.25, 0.98, length(uv - 0.5));
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}
