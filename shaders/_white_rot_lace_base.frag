// _white_rot_lace_base.frag
// Mycelial network: fungal hyphal growth on wood substrate
// Tip growth, branching, and anastomosis approximation

precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

// Pseudo-random
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

// Wood grain substrate
float woodGrain(vec2 uv) {
    float grain = noise(uv * vec2(50.0, 200.0));
    grain += noise(uv * vec2(20.0, 100.0)) * 0.5;
    grain += noise(uv * vec2(5.0, 40.0)) * 0.25;
    return grain;
}

// Hyphal growth path: branching, tip-directed random walk
float hyphalNetwork(vec2 uv, float t) {
    float network = 0.0;
    
    // Main trunk lines (resource superhighways / cords)
    for (float i = 0.0; i < 5.0; i++) {
        float angle = i * 2.39996; // golden angle
        vec2 dir = vec2(cos(angle), sin(angle));
        
        // Wandering trunk
        vec2 pos = vec2(0.5);
        float travel = 0.0;
        float step = 0.02;
        
        for (float j = 0.0; j < 50.0; j++) {
            if (travel > 0.8) break;
            
            float d = length(uv - pos);
            float thickness = 0.003 * (1.0 + 0.5 * sin(i * 3.0));
            network += smoothstep(thickness, 0.0, d) * 0.5;
            
            // Advance tip with slight wandering
            float wander = noise(pos * 30.0 + t * 0.1) * 0.5;
            vec2 wanderDir = normalize(dir + vec2(cos(wander * 6.28), sin(wander * 6.28)) * 0.3);
            pos += wanderDir * step;
            travel += step;
            
            // Branching
            if (hash(pos * 100.0) < 0.15 && travel > 0.1) {
                // Create a branch
                float branchAngle = wander * 3.14;
                vec2 branchDir = vec2(cos(branchAngle), sin(branchAngle));
                vec2 branchPos = pos;
                for (float k = 0.0; k < 20.0; k++) {
                    float bd = length(uv - branchPos);
                    float bt = 0.0015;
                    network += smoothstep(bt, 0.0, bd) * 0.3;
                    
                    float bw = noise(branchPos * 50.0 + t * 0.2);
                    branchPos += branchDir * 0.01 + vec2(cos(bw * 6.28), sin(bw * 6.28)) * 0.005;
                }
            }
        }
    }
    
    return network;
}

// Anastomosis: loop formation (visualized as brighter intersections)
float anastomosisPoints(vec2 uv, float t) {
    float glow = 0.0;
    for (float i = 0.0; i < 20.0; i++) {
        vec2 pos = vec2(
            hash(i * 1.1) * 0.8 + 0.1,
            hash(i * 1.7) * 0.8 + 0.1
        );
        float d = length(uv - pos);
        glow += exp(-d * d * 2000.0) * 0.3;
    }
    return glow;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    
    // Wood substrate
    float grain = woodGrain(uv);
    vec3 woodColor = mix(
        vec3(0.35, 0.25, 0.15),
        vec3(0.55, 0.40, 0.25),
        grain
    );
    
    // Hyphal network
    float network = hyphalNetwork(uv, u_time);
    float glow = anastomosisPoints(uv, u_time);
    
    // Mycelium color: delicate white/lace with slight blue bioluminescence hint
    vec3 hyphaColor = vec3(0.85, 0.85, 0.9);
    vec3 glowColor = vec3(0.4, 0.6, 0.8);
    
    vec3 color = woodColor;
    color = mix(color, hyphaColor, clamp(network, 0.0, 0.8));
    color += glowColor * glow;
    
    // Decay halo: slightly darkened wood around active hyphae
    float decayHalo = network * 0.3;
    color *= (1.0 - decayHalo * 0.2);
    
    gl_FragColor = vec4(color, 1.0);
}
