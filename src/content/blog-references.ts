/**
 * 블로그 글별 1차 출처(논문) — 본문 밖 '참고 문헌' 블록과 BlogPosting.citation 에 쓴다.
 * 2026-11-09: 본문이 소개하는 논문을 Crossref/OpenAlex 로 찾고, 별도 검증에서 저널·연도·연구 내용이
 * 본문과 일치한 것만 넣었다. 특정 논문이 없는 해설 글은 넣지 않는다(출처를 지어내지 않는다).
 * 본문 HTML(데이터)은 건드리지 않는다.
 */
export interface BlogReference {
  doi: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
}

export const BLOG_REFERENCES: Record<string, BlogReference[]> = {
  'sejong-sillok-agarwood-records': [
    { doi: "10.1039/d5ra08081a", title: "Unraveling the science of \"sinking and dark-colored\" superior agarwood through density, color, and metabolomics", authors: "Yuan Y 외", journal: "RSC Advances", year: 2026 },
  ],
  'agarwood-resin-content-determines-quality': [
    { doi: "10.3389/fpls.2019.00122", title: "Agarwood Induction: Current Developments and Future Perspectives", authors: "Tan CS 외", journal: "Frontiers in Plant Science", year: 2019 },
    { doi: "10.1104/pp.110.161828", title: "Characterization of δ-Guaiene Synthases from Cultured Cells of Aquilaria, Responsible for the Formation of the Sesquiterpenes in Agarwood", authors: "Kumeta Y 외", journal: "Plant Physiology", year: 2010 },
    { doi: "10.1002/ffj.2034", title: "The volatile and semi-volatile constituents of agarwood, the infected heartwood of Aquilaria species: a review", authors: "Naef R", journal: "Flavour and Fragrance Journal", year: 2011 },
    { doi: "10.3390/molecules16064884", title: "Comparison of Compositions and Antimicrobial Activities of Essential Oils from Chemically Stimulated Agarwood, Wild Agarwood and Healthy Aquilaria sinensis (Lour.) Gilg Trees", authors: "Chen H 외", journal: "Molecules", year: 2011 },
  ],
  'agarwood-origin-vietnam-trade-history': [
    { doi: "10.6116/kjh.2011.26.4.163", title: "A Research on the origin of Aquilariae Lignum based on its production area and trading status in history", authors: "Kim K 외", journal: "The Korea Journal of Herbology", year: 2011 },
  ],
  'indonesian-agarwood-microscope-not-aquilaria': [
    { doi: "10.6116/kjh.2011.26.1.097", title: "A Study on the Actual Origin Species of Aquilaria malaccensis Imported from Indonesia", authors: "Kim IR 외", journal: "The Korea Journal of Herbology", year: 2011 },
  ],
  'agarwood-fungi-secret': [
    { doi: "10.1080/21501203.2025.2602352", title: "Metabolites associated with endophytic fungi in agarwood: fungal compounds and host metabolites triggered by fungi", authors: "Ma T-J 외", journal: "Mycology", year: 2026 },
  ],
  'agarwood-oil-hypoxia-gut-study': [
    { doi: "10.1186/s13568-025-01928-z", title: "Agarwood essential oils alleviate hypoxia-induced gastric and small intestinal injury", authors: "Wang X 외", journal: "AMB Express", year: 2025 },
  ],
  'agarwood-anxiety-depression-insomnia': [
    { doi: "10.3390/molecules27144528", title: "Chemical Composition and Potential Properties in Mental Illness (Anxiety, Depression and Insomnia) of Agarwood Essential Oil: A Review", authors: "Chen X 외", journal: "Molecules", year: 2022 },
  ],
  'agarwood-nanoemulsion-anti-inflammatory-macrophages-lps': [
    { doi: "10.1016/j.prp.2023.154895", title: "Agarwood oil nanoemulsion counteracts LPS-induced inflammation and oxidative stress in RAW264.7 mouse macrophages", authors: "Malik R 외", journal: "Pathology - Research and Practice", year: 2023 },
    { doi: "10.3390/nu15041019", title: "Agarwood Oil Nanoemulsion Attenuates Cigarette Smoke-Induced Inflammation and Oxidative Stress Markers in BCi-NS1.1 Airway Epithelial Cells", authors: "De Rubis G 외", journal: "Nutrients", year: 2023 },
  ],
  'agarwood-nanoemulsion-protects-airway-cells-smoking': [
    { doi: "10.3390/nu15041019", title: "Agarwood Oil Nanoemulsion Attenuates Cigarette Smoke-Induced Inflammation and Oxidative Stress Markers in BCi-NS1.1 Airway Epithelial Cells", authors: "De Rubis G 외", journal: "Nutrients", year: 2023 },
  ],
  'agarwood-traditional-medicine-functional-dyspepsia-relief-2': [
    { doi: "10.1016/j.jep.2025.121100", title: "Multi-platform analysis reveals the material basis and therapeutic mechanism of Chen Xiang Qu decoction piece in ameliorating functional dyspepsia in rats", authors: "Zhou H 외", journal: "Journal of Ethnopharmacology", year: 2026 },
  ],
  'agarwood-extract-diabetes-metabolic-health-review': [
    { doi: "10.3390/ph17111548", title: "The Potential Therapeutic Use of Agarwood for Diabetes: A Scoping Review", authors: "Fadzil MAM 외", journal: "Pharmaceuticals", year: 2024 },
  ],
  'agarwood-oil-nanoemulsion-inflammation': [
    { doi: "10.1016/j.prp.2023.154895", title: "Agarwood oil nanoemulsion counteracts LPS-induced inflammation and oxidative stress in RAW264.7 mouse macrophages", authors: "Malik R 외", journal: "Pathology - Research and Practice", year: 2023 },
  ],
  'agarwood-oil-mental-health': [
    { doi: "10.3390/molecules27144528", title: "Chemical Composition and Potential Properties in Mental Illness (Anxiety, Depression and Insomnia) of Agarwood Essential Oil: A Review", authors: "Chen X 외", journal: "Molecules", year: 2022 },
  ],
  'agarwood-agalloch': [
    { doi: "10.1016/j.phytochem.2021.112920", title: "Eudesmane-type and agarospirane-type sesquiterpenes from agarwood of Aquilaria agallocha", authors: "Xie Y 외", journal: "Phytochemistry", year: 2021 },
  ],
  'agarwood-extract-obesity-antioxidant': [
    { doi: "10.11002/kjfp.2015.22.3.437", title: "Evaluation of free radical scavenging and pancreatic lipase inhibitory effects of Aquilaria agallocha extracts", authors: "Lee HY 외", journal: "Korean Journal of Food Preservation", year: 2015 },
  ],
  'agarwood-cyp': [
    { doi: "10.1016/j.ijbiomac.2023.123758", title: "Genome-wide investigation of Cytochrome P450 superfamily of Aquilaria agallocha: Association with terpenoids and phenylpropanoids biosynthesis", authors: "Das A 외", journal: "International Journal of Biological Macromolecules", year: 2023 },
  ],
  'stress-brain': [
    { doi: "10.1016/j.phytochem.2025.114527", title: "Eremophilane sesquiterpenes from agarwood of Aquilaria agallocha with neuroprotective effect", authors: "Xie Y 외", journal: "Phytochemistry", year: 2025 },
  ],
  'new-agarwood-sesquiterpenes-protect-brain-neurons': [
    { doi: "10.1016/j.phytochem.2025.114527", title: "Eremophilane sesquiterpenes from agarwood of Aquilaria agallocha with neuroprotective effect", authors: "Xie Y 외", journal: "Phytochemistry", year: 2025 },
  ],
};
