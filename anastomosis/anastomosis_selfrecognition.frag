// anastomosis_selfrecognition.frag
// Two hyphal tips evaluate compatibility through self/non-self recognition before fusion.
// Compatible tips merge and exchange cytoplasm, whereas incompatible tips flash, vacuolate, and seal off.

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_het_alleles;

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

float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

float tipGlow(vec2 p, vec2 c, float r) {
    return exp(-length(p - c) * r);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv - 0.5;
    p.x *= u_resolution.x / u_resolution.y;

    float cycle = fract(u_time * 0.12);
    float approach = smoothstep(0.0, 0.72, cycle);
    float compatible = smoothstep(0.55, 0.75, u_het_alleles);
    float reject = 1.0 - compatible;

    vec2 leftTip = vec2(mix(-0.40, -0.06, approach), 0.05 * sin(u_time * 0.7));
    vec2 rightTip = vec2(mix(0.40, 0.06, approach), -0.05 * sin(u_time * 0.7 + 1.5));

    float leftHypha = 1.0 - smoothstep(0.0, 0.018, sdSegment(p, vec2(-0.62, 0.10), leftTip));
    float rightHypha = 1.0 - smoothstep(0.0, 0.018, sdSegment(p, vec2(0.62, -0.10), rightTip));
    float contact = exp(-length(p) * 24.0) * smoothstep(0.48, 0.78, approach);

    float fusionBridge = 1.0 - smoothstep(0.0, 0.020, sdSegment(p, leftTip, rightTip));
    fusionBridge *= compatible * smoothstep(0.52, 0.82, approach);

    float rejectionZone = contact * reject * (0.7 + 0.3 * sin(u_time * 8.0));
    float dissolve = reject * smoothstep(0.55, 0.90, approach) * (1.0 - smoothstep(0.58, 0.82, length(p)));
    dissolve *= smoothstep(0.45, 0.82, noise((p + 0.5) * 16.0 + vec2(u_time * 0.8, -u_time * 0.6)));

    vec3 bg = mix(vec3(0.06, 0.04, 0.03), vec3(0.12, 0.08, 0.06), noise((uv + vec2(0.0, u_time * 0.01)) * vec2(6.0, 32.0)));
    vec3 hyphaCol = vec3(0.82, 0.77, 0.70);
    vec3 color = bg;

    color = mix(color, hyphaCol, clamp(leftHypha + rightHypha, 0.0, 1.0));
    color += vec3(0.98, 0.78, 0.30) * fusionBridge * 1.2;
    color += vec3(0.98, 0.76, 0.35) * tipGlow(p, leftTip, 16.0) * compatible * 0.6;
    color += vec3(0.98, 0.76, 0.35) * tipGlow(p, rightTip, 16.0) * compatible * 0.6;

    float flow = fusionBridge * (0.5 + 0.5 * sin((p.x + 0.5) * 30.0 - u_time * 6.0));
    color += vec3(1.0, 0.88, 0.48) * flow * 0.65;

    color += vec3(0.85, 0.12, 0.30) * rejectionZone;
    color += vec3(0.42, 0.08, 0.48) * rejectionZone * 0.8;
    color *= 1.0 - contact * reject * 0.55;
    color *= 1.0 - dissolve * 0.45;

    float organelleLoss = reject * smoothstep(0.60, 0.92, approach) * (1.0 - smoothstep(0.0, 0.18, abs(sin((p.y + 0.04) * 45.0 + u_time * 5.0))));
    organelleLoss *= exp(-length(p) * 14.0);
    color += vec3(0.24, 0.05, 0.22) * organelleLoss;

    float vignette = 1.0 - smoothstep(0.28, 0.92, length(uv - 0.5));
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}
