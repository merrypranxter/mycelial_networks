precision highp float;

uniform vec2 u_resolution;
uniform float u_decomposition;

float hash(vec2 p) {
    p = fract(p * vec2(173.31, 291.17));
    float n = dot(p, p + vec2(27.41));
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

float leafEllipse(vec2 uv, vec2 center, vec2 size, float rotation) {
    float cs = cos(rotation);
    float sn = sin(rotation);
    vec2 p = uv - center;
    p = mat2(cs, -sn, sn, cs) * p;
    return 1.0 - smoothstep(0.9, 1.0, dot(p / size, p / size));
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float decay = clamp(u_decomposition, 0.0, 1.0);

    vec3 topColor = mix(hexColor(vec3(190.0, 220.0, 70.0)), hexColor(vec3(160.0, 140.0, 75.0)), decay);
    vec3 midColor = mix(hexColor(vec3(125.0, 82.0, 45.0)), hexColor(vec3(90.0, 62.0, 35.0)), decay);
    vec3 humusColor = mix(hexColor(vec3(38.0, 28.0, 20.0)), hexColor(vec3(12.0, 10.0, 9.0)), decay);

    vec3 color = mix(humusColor, midColor, smoothstep(0.12, 0.45, uv.y));
    color = mix(color, topColor, smoothstep(0.58, 0.88, uv.y));

    float topLeaves = 0.0;
    float topVeins = 0.0;
    for (float i = 0.0; i < 6.0; i++) {
        vec2 center = vec2(0.12 + i * 0.15, 0.7 + hash(vec2(i, 1.3)) * 0.22);
        float rotation = hash(vec2(i, 4.4)) * 2.2 - 1.1;
        float leaf = leafEllipse(uv, center, vec2(0.1, 0.035), rotation);
        topLeaves = max(topLeaves, leaf);

        float cs = cos(rotation);
        float sn = sin(rotation);
        vec2 p = uv - center;
        p = mat2(cs, -sn, sn, cs) * p;
        float midrib = 1.0 - smoothstep(0.0, 0.01, abs(p.y));
        float secondary = 1.0 - smoothstep(0.0, 0.008, abs(p.y - sin(p.x * 45.0) * 0.012));
        topVeins = max(topVeins, (midrib * 0.8 + secondary * 0.4) * leaf);
    }

    vec3 leafTint = mix(topColor, midColor, decay * 0.6);
    color = mix(color, leafTint, topLeaves * (1.0 - decay) * smoothstep(0.45, 1.0, uv.y));
    color += vec3(0.12, 0.1, 0.05) * topVeins * (1.0 - decay);

    vec2 fragmentCell = floor(uv * vec2(14.0, 10.0));
    vec2 fragmentUV = fract(uv * vec2(14.0, 10.0)) - 0.5;
    vec2 fragmentOffset = vec2(hash(fragmentCell), hash(fragmentCell + vec2(2.5))) - 0.5;
    float fragmentShape = 1.0 - smoothstep(0.12, 0.18, length(fragmentUV - fragmentOffset * 0.25));
    float fragmentMask = smoothstep(0.28, 0.68, uv.y) * (0.45 + 0.55 * decay);
    color = mix(color, midColor * 0.85, fragmentShape * fragmentMask * step(0.55, hash(fragmentCell + vec2(8.2))));

    float humus = noise(uv * vec2(35.0, 18.0)) * noise(uv * vec2(12.0, 24.0));
    color = mix(color, humusColor, smoothstep(0.0, 0.28, uv.y) * (0.35 + decay * 0.5) * humus);

    float stain = smoothstep(0.58, 0.86, noise(uv * 9.0 + vec2(2.0, 5.0))) * (0.15 + decay * 0.1);
    color = mix(color, vec3(0.78, 0.78, 0.75), stain * 0.25);

    gl_FragColor = vec4(color, 1.0);
}
