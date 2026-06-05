precision highp float;

uniform vec2 u_resolution;
uniform float u_depth;
uniform float u_mycorrhizal_zone;

float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    float n = dot(p, p + vec2(74.7));
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

float pebbleField(vec2 uv) {
    vec2 g = floor(uv);
    vec2 f = fract(uv);
    float minDist = 10.0;
    for (float y = -1.0; y <= 1.0; y++) {
        for (float x = -1.0; x <= 1.0; x++) {
            vec2 cell = vec2(x, y);
            vec2 point = vec2(hash(g + cell), hash(g + cell + vec2(5.3)));
            vec2 diff = cell + point - f;
            minDist = min(minDist, dot(diff, diff));
        }
    }
    return minDist;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float depth = clamp(u_depth, 0.0, 1.0);
    float myco = clamp(u_mycorrhizal_zone, 0.0, 1.0);

    vec3 oColor = hexColor(vec3(34.0, 24.0, 18.0));
    vec3 aColor = hexColor(vec3(72.0, 49.0, 30.0));
    vec3 bColor = hexColor(vec3(128.0, 96.0, 62.0));
    vec3 cColor = hexColor(vec3(186.0, 168.0, 140.0));

    vec3 color;
    if (uv.y > 0.95) {
        float litter = noise(uv * vec2(60.0, 18.0));
        color = oColor + litter * vec3(0.08, 0.05, 0.03);
    } else if (uv.y > 0.65) {
        float organic = noise(uv * vec2(24.0, 16.0));
        color = aColor + organic * vec3(0.1, 0.08, 0.05);
    } else if (uv.y > 0.25) {
        float clay = noise(uv * vec2(20.0, 10.0));
        color = bColor + clay * vec3(0.08, 0.06, 0.03);
    } else {
        float mineral = noise(uv * vec2(12.0, 12.0));
        color = cColor + mineral * vec3(0.06, 0.05, 0.04);
    }

    float pebble = pebbleField(uv * vec2(14.0, 6.0));
    float rocks = 1.0 - smoothstep(0.04, 0.12, pebble);
    float cMask = 1.0 - smoothstep(0.22, 0.3, uv.y);
    color = mix(color, vec3(0.55, 0.55, 0.56), rocks * cMask * 0.9);

    float boundary = exp(-pow((uv.y - 0.65) / 0.03, 2.0));
    vec3 mycoColor = hexColor(vec3(220.0, 205.0, 120.0));
    color += mycoColor * boundary * myco * 0.35;

    float compaction = mix(1.0, 0.72, depth * (1.0 - uv.y));
    color *= compaction;

    gl_FragColor = vec4(color, 1.0);
}
