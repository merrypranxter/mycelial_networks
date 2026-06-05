# Fungal Biology Reference

A biologically grounded reference for the `mycelial_networks` shaders. It focuses on the structures, biochemical systems, and ecological strategies that make fungal networks visually distinctive and scientifically interesting.

## 1. Fungal Cell Biology

### Hyphae anatomy
- **Hyphae** are tubular fungal filaments, usually 2-10 um in diameter, bounded by a wall rich in **chitin** and **beta-glucans**.
- The wall is softest near the tip and progressively cross-linked behind it, which is why fungal colonies extend from the margin rather than expanding uniformly.
- Cytoplasm contains nuclei, mitochondria, vacuoles, actin cables, microtubules, and vesicles carrying wall-building enzymes.

### Tip growth
- Fungal growth is **polarized**: new wall material is inserted at the apex.
- Secretory vesicles deliver chitin synthases and glucan synthases to the extending tip.
- Turgor pressure pushes the membrane outward while the wall remodels locally.
- Tip extension rates vary by species and substrate; fast saprotrophs can extend several millimeters per hour under favorable conditions.

### Spitzenkorper
- The **Spitzenkorper** is a vesicle supply center just behind the apex.
- Its position predicts the next direction of growth, making it a useful biological analogue for a steering point in shader-based tip agents.
- When the Spitzenkorper shifts laterally, the hypha curves; when it splits, branches can emerge.

### Septa
- Many fungi divide hyphae into compartments using **septa**, perforated cross-walls that preserve continuity.
- Septal pores permit cytoplasmic streaming, organelle movement, and nutrient redistribution.
- In ascomycetes, **Woronin bodies** can plug damaged septa and isolate injured compartments.

### Clamp connections
- Many dikaryotic basidiomycetes form **clamp connections**, bridge-like loops that maintain paired nuclei during cell division.
- Clamp formation is common in mushroom-forming fungi and reflects highly ordered cell polarity, branching, and septation.
- In visual terms, clamp connections suggest periodic loop-like side structures rather than random branching noise.

## 2. Mycelial Network Architecture

### Branching rules
- New tips arise by **apical branching** or **subapical lateral branching**.
- Branching probability depends on nutrient availability, hyphal age, geometry, local crowding, and colony developmental stage.
- Fine exploratory fronts usually branch more frequently than transport cords.

### Apical dominance
- Strong leading tips suppress nearby branch initiation, a fungal analogue of **apical dominance**.
- This yields forward-biased exploration rather than isotropic fuzz.
- In simulation terms, recently active tips should inhibit branching in a short trailing zone.

### Resource allocation
- Mycelia are not only geometric networks; they are transport systems.
- Carbon, nitrogen, phosphorus, amino acids, lipids, and water move through the colony by diffusion, pressure-driven mass flow, and cytoplasmic streaming.
- Resource-rich regions are reinforced, whereas poorly performing branches are recycled.

### Architectural hierarchy
- Real colonies often differentiate into:
  1. **Exploratory hyphae**: thin, fast, highly branched
  2. **Exploitation zones**: dense local foraging near nutrients
  3. **Cords/rhizomorphs**: thick transport conduits linking patches
- This hierarchy is central to the repo's growth, flow, and cord-forming shader families.

## 3. Anastomosis

### Self-recognition
- **Anastomosis** is hyphal fusion between genetically compatible filaments.
- Compatible tips recognize one another through short-range signaling, reorient, adhere, dissolve the intervening wall, and fuse.
- Fusion creates loops, bypass routes, and more even resource distribution.

### HET loci and vegetative incompatibility
- Fungal self/non-self recognition is strongly influenced by **heterokaryon incompatibility (het)** loci.
- When incompatibility alleles differ, the contact may trigger compartmental death or a barrier reaction instead of fusion.
- This is why not every intersection should become a loop in a biologically informed shader.

### Loop formation
- Anastomosis produces cycles that improve resilience to damage and local blockage.
- Loop-rich networks can reroute flow after grazing, desiccation, or substrate collapse.
- Shader implication: high-density regions should have a greater fusion probability, but fusion should still be probabilistic and compatibility-gated.

## 4. Nutritional Strategies

### Saprotrophic fungi
- **Saprotrophs** decompose dead organic matter.
- Wood decayers such as *Phanerochaete chrysosporium*, *Trametes versicolor*, *Gloeophyllum trabeum*, and *Serpula lacrymans* are especially relevant here.

### Mycorrhizal fungi
- **Mycorrhizal fungi** exchange mineral nutrients and water for plant-derived carbon.
- Ectomycorrhizal examples include *Laccaria bicolor* and *Pisolithus tinctorius*.
- Arbuscular mycorrhizal fungi such as *Rhizophagus irregularis* grow intracellular arbuscules rather than a mantle.

### Parasitic fungi
- **Parasitic** and **necrotrophic** fungi colonize living tissue and often secrete toxins, oxalic acid, and cell-wall degrading enzymes.
- Examples include *Armillaria mellea*, *Botrytis cinerea*, and *Sclerotinia sclerotiorum*.

### Endophytic fungi
- **Endophytes** live inside plant tissues without immediately causing disease.
- They can switch among latent, mutualistic, and pathogenic behavior depending on host stress and environment.
- For shaders, endophytic behavior suggests low-contrast, embedded growth rather than surface-dominant colonization.

## 5. Wood Decay Biology

Wood is a composite material called **lignocellulose**:
- **Cellulose**: crystalline beta-1,4-glucan microfibrils, formula `(C6H10O5)n`
- **Hemicellulose**: branched matrix polysaccharides such as xylans and glucomannans
- **Lignin**: a cross-linked aromatic polymer built from phenylpropanoid monolignols

### Three-dimensional structure
- Cellulose microfibrils form the tensile scaffold.
- Hemicelluloses tether adjacent fibrils.
- Lignin fills spaces and creates a hydrophobic, compression-resistant matrix.
- Because lignin contains many **C-C** and **C-O** linkages in a heterogeneous aromatic network, it is much harder to depolymerize than a regular sugar polymer.

## 6. White Rot Fungi

### White rot strategy
- White-rot fungi can mineralize lignin as well as cellulose and hemicellulose.
- Decay may be **simultaneous** (all wall polymers removed together) or **selective** (lignin removed faster than cellulose).
- Result: bleached, fibrous, pale wood with reduced structural integrity.

### Key species
- *Phanerochaete chrysosporium*
- *Trametes versicolor*
- *Pleurotus ostreatus*
- *Bjerkandera adusta*

### Enzyme system
- **LiP**: lignin peroxidase
- **MnP**: manganese peroxidase
- **VP**: versatile peroxidase
- **Laccase**: multicopper oxidase
- Auxiliary oxidases generate **H2O2**, including aryl-alcohol oxidase and glyoxal oxidase.

### Important chemistry
- LiP and MnP are oxidative enzymes, not simple hydrolases.
- **MnP** oxidizes `Mn2+` to `Mn3+`; the chelated `Mn3+` diffuses into the wall and oxidizes phenolic lignin.
- **LiP** oxidizes non-phenolic lignin structures, often using **veratryl alcohol** as a mediator.
- The reaction system depends on oxygen and hydrogen peroxide rather than direct physical chewing of lignin.

## 7. Brown Rot Fungi

### Brown rot strategy
- Brown-rot fungi rapidly depolymerize cellulose and hemicellulose while modifying, but largely leaving behind, lignin.
- The residual lignin-rich matrix produces the classic brown, crumbly, cubically cracked wood.

### Key species
- *Gloeophyllum trabeum*
- *Serpula lacrymans*
- *Postia placenta*
- *Fomitopsis pinicola*

### Fenton chemistry
- Brown rot relies on chelator-mediated **Fenton chemistry**:

`Fe2+ + H2O2 -> Fe3+ + OH- + OH.`

- The hydroxyl radical (`OH.`) is extremely reactive and small enough to penetrate wall micropores inaccessible to bulky enzymes.
- Brown-rot fungi use low-molecular-weight metabolites, hydroquinones, iron reducers, and **oxalic acid** to drive the redox cycle.

### Residual lignin skeleton
- Lignin is modified and oxidized, but not extensively mineralized.
- What remains is a fragile aromatic scaffold that shrinks, cracks, and darkens into a cubical residue.

## 8. Mycorrhizal Symbiosis

### Ectomycorrhizae
- Ectomycorrhizal fungi form a **mantle** around roots and a **Hartig net** between root cortical cells.
- Carbon moves from plant to fungus, while phosphorus, nitrogen, and water move from fungus to plant.
- Carbon costs can be substantial: forests may allocate roughly **20% of photosynthate** belowground to symbionts, with the exact share varying by species and season.

### Endomycorrhizae / arbuscular mycorrhizae
- Endomycorrhizal fungi enter root cortical cells and produce **arbuscules**, highly branched exchange structures.
- They lack the thick external mantle typical of ectomycorrhizal roots.

### Exchange ratios
- There is no single fixed exchange ratio, but ecophysiological studies often frame the trade as carbon for limiting nutrients, especially phosphate.
- Shader implication: mycorrhizal flow is bidirectional rather than purely outward colonization.

## 9. Cord Formation and Rhizomorphs

### Cords
- Fungal **cords** are bundled transport structures made of many aligned hyphae.
- They reduce hydraulic resistance, protect inner transport hyphae, and allow long-distance translocation.
- Cords are common in foraging woodland fungi such as *Phanerochaete velutina* and *Hypholoma fasciculare*.

### Rhizomorphs
- **Rhizomorphs** are highly organized, root-like organs, especially famous in *Armillaria* species.
- They may include a dark rind, a medulla of conducting hyphae, and an actively extending apical region sometimes compared to a cord meristem.
- Their hydraulic conductance is high because many parallel hyphae behave as a pressurized bundle rather than as isolated filaments.

## 10. Bioluminescence in Fungi

- More than **80 species** of fungi are bioluminescent; current counts usually fall near 90-100 depending on taxonomy.
- Emission is typically green, around **520 nm**.
- The known pathway uses a **hispidin-derived luciferin** and an **FMNH2-dependent luciferase-like oxidative system** in broader descriptive terms, though the modern fungal pathway is usually described specifically as the hispidin / 3-hydroxyhispidin system.
- Candidate or confirmed luminous species include *Panellus stipticus*, *Mycena chlorophos*, *Neonothopanus gardneri*, and *Omphalotus olearius*.
- Light output can follow a **circadian rhythm**, as shown in *Neonothopanus gardneri*, where emission peaks align with nightly ecological signaling.

## 11. Fruiting Body Formation

### Environmental triggers
- Typical triggers include substrate exhaustion, temperature shifts, humidity increase, fresh-air exchange, and light cues.
- Blue-light receptors are important in many mushroom-forming fungi.

### Developmental stages
1. Vegetative mycelium builds biomass and storage reserves.
2. Hyphal knots or aggregates form.
3. **Primordia** initiate.
4. Stipe and cap tissues differentiate.
5. Gills, pores, or spines mature.
6. Nutrients are mobilized into the fruiting body and spores are produced.

### Nutrient mobilization
- Fruiting bodies are expensive structures.
- Glycogen, lipids, nitrogen compounds, and imported carbon are redirected from the mycelium to the developing basidiocarp.
- That mobilization is a good model for temporary depletion halos around active reproductive zones.

## 12. Network Optimization

- Fungal networks are constrained by the same design problem as human transport systems: move resources efficiently without overspending on infrastructure.
- **Bebber et al. (2007)** showed that fungal cord networks can approach efficient tradeoffs among transport efficiency, cost, and robustness.
- Real mycelia do not optimize a single variable; they balance:
  - **Efficiency**: short effective paths
  - **Resilience**: redundancy through loops
  - **Cost**: limited biomass investment
  - **Adaptability**: rapid local reconfiguration
- That efficiency-versus-resilience tension is why fungal networks are such strong inspirations for shader-based emergent graphics.

## Selected References
- Bebber, D. P. et al. (2007). *Biological solutions to transport network design*.
- Boddy, L. (1999). *Saprotrophic cord-forming fungi*.
- Cairney, J. W. G. (2005). *Basidiomycete mycelia in forest soils*.
- Floudas, D. et al. (2012). *The paleozoic origin of enzymatic lignin decomposition*.
- Watkinson, S. C., Boddy, L., & Money, N. P. (2016). *The Fungi*.
