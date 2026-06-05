precision highp float;

uniform vec2 u_resolution;
uniform float u_resin_content;

float hash(vec2 p) {
    p = fract(p * vec2(143.13, 371.97));
    float n = dot(p, p + vec2(19.19));
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

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float resin = clamp(u_resin_content, 0.0, 1.0);

    float ringAxis = uv.y + noise(vec2(uv.x * 4.0, uv.y * 18.0)) * 0.03;
    float ring = fract(ringAxis * 12.0);
    float lateWood = smoothstep(0.62, 0.95, ring);

    vec3 earlyColor = hexColor(vec3(240.0, 223.0, 160.0));
    vec3 lateColor = hexColor(vec3(200.0, 168.0, 122.0));
    vec3 color = mix(earlyColor, lateColor, lateWood);

    float tracheids = noise(vec2(uv.x * 180.0, uv.y * 16.0));
    float tracheidBands = smoothstep(0.45, 0.9, tracheids) * 0.12;
    color -= vec3(tracheidBands * 0.7, tracheidBands * 0.5, tracheidBands * 0.3);

    vec2 verticalCell = floor(uv * vec2(18.0, 8.0));
    vec2 verticalUV = fract(uv * vec2(18.0, 8.0)) - 0.5;
    vec2 verticalCenter = vec2(hash(verticalCell), hash(verticalCell + vec2(3.7))) - 0.5;
    float verticalDuct = 1.0 - smoothstep(0.08, 0.12, length(verticalUV - verticalCenter * 0.35));

    vec2 horizontalCell = floor(uv.yx * vec2(12.0, 6.0));
    vec2 horizontalUV = fract(uv.yx * vec2(12.0, 6.0)) - 0.5;
    vec2 horizontalCenter = vec2(hash(horizontalCell), hash(horizontalCell + vec2(8.4))) - 0.5;
    float horizontalDuct = 1.0 - smoothstep(0.05, 0.1, length(horizontalUV - horizontalCenter * 0.3));

    float ducts = max(verticalDuct * step(0.72, hash(verticalCell + vec2(1.4))), horizontalDuct * step(0.8, hash(horizontalCell + vec2(2.8))));
    vec3 resinColor = hexColor(vec3(230.0, 160.0, 70.0));
    color = mix(color, resinColor, ducts * resin * 0.9);

    float longitudinal = noise(vec2(uv.x * 10.0, uv.y * 140.0)) * 0.08;
    color += vec3(longitudinal * 0.4, longitudinal * 0.35, longitudinal * 0.2);

    gl_FragColor = vec4(color, 1.0);
}
