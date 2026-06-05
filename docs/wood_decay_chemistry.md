# Wood Decay Chemistry

A chemistry-focused guide to lignocellulose, fungal decay strategies, and the visual signatures that matter for the shaders in this repository.

## 1. Lignocellulose Structure

Plant secondary cell walls are composite materials built from three main polymers:
- **Cellulose**: typically ~40-50%
- **Hemicellulose**: typically ~20-35%
- **Lignin**: typically ~15-35%

Exact proportions depend on taxon:
- **Hardwoods** often contain more syringyl-rich lignin and xylans.
- **Softwoods** often contain more guaiacyl lignin and glucomannans.

### Three-dimensional arrangement
- Cellulose microfibrils form strong, aligned load-bearing bundles.
- Hemicellulose occupies the interfibrillar matrix and tethers fibrils together.
- Lignin fills spaces, waterproofs the wall, and creates a rigid aromatic network around the polysaccharides.

That architecture is why wood behaves like a fiber-reinforced composite rather than a simple carbohydrate block.

## 2. Cellulose

- Cellulose is a linear polymer of **beta-1,4-linked D-glucose**.
- Empirical repeat unit: `(C6H10O5)n`.
- Chains assemble into **microfibrils** stabilized by dense hydrogen-bond networks.

### Crystalline vs. amorphous regions
- **Crystalline cellulose** is highly ordered, tightly packed, and comparatively enzyme-resistant.
- **Amorphous cellulose** is less ordered and attacked more easily.

### Why it matters
- White rot eventually consumes cellulose after or alongside lignin attack.
- Brown rot depolymerizes cellulose rapidly, causing catastrophic strength loss early in decay.

## 3. Lignin

Lignin is a heterogeneous **phenylpropanoid polymer** assembled mainly from three monolignols:
- **G**: coniferyl alcohol -> guaiacyl lignin
- **S**: sinapyl alcohol -> syringyl lignin
- **H**: p-coumaryl alcohol -> p-hydroxyphenyl lignin

### Bonds and recalcitrance
Lignin contains many different linkage types, including:
- **beta-O-4** aryl ether bonds
- **beta-5** phenylcoumaran bonds
- **5-5** biphenyl C-C bonds
- other **C-O** and **C-C** linkages

It is recalcitrant because:
- it is irregular rather than repetitive,
- it is aromatic and hydrophobic,
- it cross-links wall components,
- hydrolytic enzymes alone cannot efficiently dismantle it.

## 4. Hemicellulose

Hemicellulose is the flexible matrix connecting cellulose to lignin.

### Typical components
- **Xylan** backbone in many hardwoods
- **Glucomannan** in many softwoods
- Side groups may include **acetyl groups**, arabinose, glucuronic acid, and other decorations.

### Role in decay
- Hemicellulose is easier to hydrolyze than cellulose.
- Both white- and brown-rot fungi attack it early, but brown rot especially benefits from loosening the wall matrix before deeper cellulose depolymerization.

## 5. White Rot Chemistry

White-rot fungi perform oxidative attack on lignin and can fully mineralize the major wall polymers.

### H2O2 generation
Key oxidative enzymes require **hydrogen peroxide (H2O2)**. White-rot fungi generate it with auxiliary oxidases such as:
- aryl-alcohol oxidase,
- glyoxal oxidase,
- glucose oxidase in some systems.

### Lignin peroxidase mechanism
- **Lignin peroxidase (LiP)** oxidizes high-redox-potential non-phenolic lignin structures.
- **Veratryl alcohol** often acts as a diffusible redox mediator and stabilizer.
- LiP can drive cleavage of side-chain and aromatic structures that ordinary hydrolases cannot touch.

### Manganese peroxidase chemistry
- **MnP** oxidizes `Mn2+` to `Mn3+`.
- The resulting `Mn3+` is stabilized by organic acids such as oxalate or malate.
- Chelated `Mn3+` diffuses through the wall and oxidizes phenolic lignin components at a distance.

### Laccase
- **Laccase** is a multicopper oxidase that reduces `O2` to `H2O` while oxidizing phenolic substrates.
- Laccase often acts with mediators such as ABTS or syringaldehyde.

### Laccase lacuna
Not all white-rot fungi use the same cocktail. Some are strongly laccase-dominant, some peroxidase-dominant, and some show surprisingly weak laccase expression despite strong delignification.

### Simultaneous vs. selective white rot
- **Simultaneous white rot** removes lignin, cellulose, and hemicellulose together.
- **Selective white rot** removes lignin faster, temporarily leaving a cellulose-rich, pale residue.

## 6. Brown Rot Chemistry

Brown-rot fungi modify lignin but focus their main assault on cellulose and hemicellulose.

### Fenton reaction
The signature reaction is:

`Fe2+ + H2O2 -> Fe3+ + OH- + OH.`

The hydroxyl radical is extremely reactive and can cleave polysaccharides non-specifically.

### Why lignin survives better
- Hydroxyl radicals do attack lignin, but brown rot generally does not achieve the extensive enzymatic lignin mineralization typical of white rot.
- The result is a chemically altered but persistent lignin-rich skeleton.

### Oxalic acid role
- **Oxalic acid** acidifies the microenvironment, chelates metals, and helps control iron availability.
- It supports the low-pH conditions favorable for chelator-mediated Fenton systems.

### Brown color
The brown appearance reflects a lignin-rich residue plus oxidized aromatic products, often described in terms of **quinone-like oxidation products** and condensed lignin chemistry.

## 7. Visual Signatures

### White rot
**Macroscopic:**
- bleached white to cream wood
- fibrous or stringy texture
- sheet-like or pocketed delignification

**Microscopic:**
- cell walls thin progressively
- lignified regions lose staining intensity
- voids and soft channels appear across multiple wall layers

**Shader mapping:**
- higher luminance
- lace-like porosity
- soft halos and pale depletion fields
- open mesh geometries with translucent voids

### Brown rot
**Macroscopic:**
- dark brown residue
- brittle, crumbly texture
- classic **cubical cracking**

**Microscopic:**
- rapid depolymerization of carbohydrates
- middle lamella and lignin-rich structures persist longer
- strength loss precedes obvious mass loss

**Shader mapping:**
- warm brown / umber palette
- sharper fracture lines
- blocky contraction patterns
- denser cores with dark crack boundaries

## 8. Economic and Ecological Importance

### Ecological importance
- Wood-decay fungi are central to **carbon cycling** and nutrient turnover.
- White rot is one reason lignin does not accumulate indefinitely in forests.
- Brown rot strongly influences conifer forest soil formation because modified lignin residues contribute to persistent organic matter.

### Economic importance
- Brown rot and dry rot are major drivers of **building decay**.
- White-rot enzymes are valuable in **biopulping**, **bioremediation**, and **biofuel pretreatment** research.
- Understanding decay chemistry helps with timber durability, conservation science, and fungal-inspired materials processing.

## 9. Key Enzymes Table

| Enzyme | Rot type | Main substrate / target | Mechanism | Typical optimal pH / temp |
|---|---|---|---|---|
| Lignin peroxidase (LiP) | White rot | Non-phenolic lignin | H2O2-dependent high-redox oxidation; mediator-assisted | pH ~3-4.5; often 30-40 C |
| Manganese peroxidase (MnP) | White rot | Phenolic lignin via Mn3+ | Oxidizes Mn2+ to diffusible Mn3+ chelates | pH ~4-5; often 25-40 C |
| Versatile peroxidase (VP) | White rot | Mn2+ plus lignin aromatics | Hybrid LiP/MnP behavior | pH ~3-5; often 25-40 C |
| Laccase | Mostly white rot, some other fungi | Phenolics, lignin-derived aromatics | Multicopper oxidation coupled to O2 reduction | pH often 3-6 depending on substrate; 25-50 C |
| Endoglucanase | White rot and soft-rot systems | Amorphous cellulose | Internal hydrolysis of beta-1,4-glucan | pH ~4.5-6; 40-60 C |
| Cellobiohydrolase | White rot and cellulose degraders | Cellulose chain ends | Processive release of cellobiose | pH ~4-6; 40-60 C |
| Beta-glucosidase | White rot and cellulose degraders | Cellobiose | Hydrolysis to glucose | pH ~4-6; 35-60 C |
| Xylanase | White rot and brown rot | Hemicellulose / xylan | Hydrolysis of xylan backbone | pH ~4-6; 35-60 C |
| Aryl-alcohol oxidase | White rot auxiliary | Aryl alcohols | Generates H2O2 for peroxidases | pH ~4-6; 25-40 C |
| Chelator-mediated Fenton system | Brown rot | Cell wall polysaccharides | Fe cycling + hydroxyl radicals | acidic microenvironment, often pH ~2.5-4.5 |

## Notes for This Repository
- `decay_hardwood_white_rot.frag` should emphasize delignification, bleaching, and diffuse oxidative halos.
- `decay_softwood_brown_rot.frag` should emphasize carbohydrate loss, shrinkage, and cubical crack geometry.
- The growth shaders become more convincing when their color and branching logic are tied to these underlying chemistries.
