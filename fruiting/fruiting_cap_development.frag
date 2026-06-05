// fruiting_cap_development.frag
// Fungal fruiting bodies progress from pin to button to expanding cap as tissues differentiate.
// Species type changes whether the mature structure resembles an agaric, bolete, or polypore bracket.

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_development_stage;
uniform float u_species_type;

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

float ellipse(vec2 p, vec2 c, vec2 r) {
    vec2 q = (p - c) / r;
    return 1.0 - smoothstep(0.96, 1.04, dot(q, q));
}

float box(vec2 p, vec2 c, vec2 b) {
    vec2 d = abs(p - c) - b;
    return 1.0 - smoothstep(0.0, 0.015, length(max(d, 0.0)) + min(max(d.x, d.y), 0.0));
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv;
    p.x *= u_resolution.x / u_resolution.y;
    float aspect = u_resolution.x / u_resolution.y;

    float stage = clamp(u_development_stage, 0.0, 1.0);
    float agaric = 1.0 - step(0.5, u_species_type);
    float bolete = step(0.5, u_species_type) * (1.0 - step(1.5, u_species_type));
    float polypore = step(1.5, u_species_type);

    vec3 ground = mix(vec3(0.07, 0.05, 0.04), vec3(0.16, 0.10, 0.07), noise((uv + vec2(0.0, u_time * 0.002)) * vec2(10.0, 40.0)));
    vec3 color = ground;

    vec2 base = vec2(0.50 * aspect, 0.26);
    float stipeHeight = mix(0.06, 0.34, smoothstep(0.15, 0.85, stage));
    float stipeWidth = mix(0.018, 0.042, smoothstep(0.20, 0.60, stage));
    float capWidth = mix(0.035, 0.24, stage);
    float capHeight = mix(0.05, 0.13, smoothstep(0.10, 0.75, stage));

    float stipe = box(p, vec2(base.x, base.y + stipeHeight * 0.5), vec2(stipeWidth, stipeHeight * 0.5));

    vec2 capCenterA = vec2(base.x, base.y + stipeHeight + capHeight * 0.15);
    float agaricCap = ellipse(p, capCenterA, vec2(capWidth, capHeight));
    float boleteCap = ellipse(p, capCenterA + vec2(0.0, 0.015), vec2(capWidth * 1.05, capHeight * 1.35));

    vec2 shelfCenter = vec2(base.x + 0.08 * aspect, 0.48);
    float polyporeCap = box(p, shelfCenter, vec2(capWidth * 0.85, capHeight * 0.65));
    polyporeCap *= smoothstep(base.x - 0.02 * aspect, base.x + 0.22 * aspect, p.x);

    float fruit = agaricCap * agaric + boleteCap * bolete + polyporeCap * polypore;
    fruit = max(fruit, stipe * (agaric + bolete));

    vec3 capCol = vec3(0.91, 0.88, 0.82) * agaric + vec3(0.66, 0.48, 0.26) * bolete + vec3(0.72, 0.66, 0.56) * polypore;
    vec3 stipeCol = vec3(1.0, 0.98, 0.96) * (agaric + bolete) + vec3(0.24, 0.16, 0.10) * polypore;
    color = mix(color, capCol, clamp(fruit, 0.0, 1.0) * 0.82);
    color = mix(color, stipeCol, stipe * 0.85);

    float veil = ellipse(p, vec2(base.x, base.y + stipeHeight * 0.78), vec2(capWidth * 0.65, capHeight * 0.55));
    veil *= smoothstep(0.12, 0.40, stage) * (1.0 - smoothstep(0.45, 0.70, stage));
    color += vec3(0.12, 0.10, 0.08) * veil * 0.35;

    float ring = box(p, vec2(base.x, base.y + stipeHeight * 0.55), vec2(stipeWidth * 1.7, 0.010));
    ring *= smoothstep(0.48, 0.70, stage) * agaric;
    color += vec3(0.08, 0.08, 0.06) * ring;

    float gills = 1.0 - smoothstep(0.0, 0.06, abs(sin((p.x - base.x) * 120.0)));
    float gillBand = smoothstep(capCenterA.y - 0.10, capCenterA.y - 0.06, p.y) * (1.0 - smoothstep(capCenterA.y - 0.01, capCenterA.y + 0.01, p.y));
    gills *= gillBand;
    gills *= agaric * smoothstep(0.58, 0.92, stage) * agaricCap;
    color = mix(color, vec3(0.94, 0.91, 0.76), gills * 0.65);

    float pores = smoothstep(0.70, 0.92, noise((p - capCenterA) * 38.0 + 8.0));
    pores *= bolete * smoothstep(0.58, 0.92, stage) * boleteCap;
    color = mix(color, vec3(0.84, 0.76, 0.42), pores * 0.35);

    float spores = smoothstep(0.90, 0.985, noise(uv * 80.0 + vec2(0.0, -u_time * 0.8)));
    spores *= smoothstep(0.78, 1.0, stage) * agaricCap * agaric * smoothstep(capCenterA.y - 0.20, capCenterA.y + 0.02, uv.y);
    color += vec3(0.96, 0.94, 0.84) * spores * 0.35;

    float pinGlow = (1.0 - smoothstep(0.0, 0.16, stage)) * ellipse(p, vec2(base.x, 0.34), vec2(0.035, 0.06));
    color += vec3(0.16, 0.16, 0.14) * pinGlow;

    float vignette = 1.0 - smoothstep(0.22, 1.10, length(uv - 0.5));
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}
