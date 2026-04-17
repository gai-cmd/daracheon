import express from "express";
import path from "path";
import fs from "fs";

const CONTENT_FILE = path.join(process.cwd(), "data", "content.json");

// Ensure data directory exists
if (!fs.existsSync(path.dirname(CONTENT_FILE))) {
  fs.mkdirSync(path.dirname(CONTENT_FILE), { recursive: true });
}
if (!fs.existsSync(CONTENT_FILE)) {
  fs.writeFileSync(CONTENT_FILE, JSON.stringify({
    home: {
      heroTitle: "자연의 진실된 가치",
      heroSubtitle: "베트남 직영 농장에서 25년 연구 끝에 탄생한 명품 침향",
      heroButtonText: "브랜드 스토리 보기",
      section1Title: "219,000시간의 기다림",
      section1Text: "최소 26년, 자연이 허락한 시간만이 진정한 침향을 완성합니다.",
      heroVideo: "",
      heroImages: [],
      sectionImages: []
    }
  }, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Contact form route
  app.post("/api/contact", async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "모든 필드를 입력해주세요." });
    }

    // Email sending is currently disabled.
    console.log("Contact form submission received:", { name, email, subject, message });
    res.json({ success: true, message: "문의가 성공적으로 접수되었습니다. 담당자가 확인 후 연락드리겠습니다." });
  });

  // Production process route
  app.get("/api/process", (req, res) => {
    const steps = [
      {
        id: 1,
        title: "원목 선별",
        description: "베트남 직영 농장에서 최상급 침향나무 원목을 엄선합니다.",
        icon: "TreeDeciduous"
      },
      {
        id: 2,
        title: "자연 숙성",
        description: "25년간 축적된 노하우로 자연 환경에서 침향을 숙성시킵니다.",
        icon: "Wind"
      },
      {
        id: 3,
        title: "수확 및 분류",
        description: "숙성된 침향을 수확하고 등급별로 정밀 분류합니다.",
        icon: "Layers"
      },
      {
        id: 4,
        title: "세척 및 건조",
        description: "불순물을 제거하고 전통 방식으로 자연 건조합니다.",
        icon: "Droplets"
      },
      {
        id: 5,
        title: "특허 추출",
        description: "특허받은 독자적 기술로 침향의 유효성분을 추출합니다.",
        icon: "FlaskConical"
      },
      {
        id: 6,
        title: "품질 검사",
        description: "HACCP, Organic 인증 기준에 따라 엄격한 품질 검사를 실시합니다.",
        icon: "ShieldCheck"
      },
      {
        id: 7,
        title: "제품화",
        description: "최종 가공 후 프리미엄 패키지로 제품을 완성합니다.",
        icon: "Package"
      },
      {
        id: 8,
        title: "출하",
        description: "CITES 국제인증을 받고 전 세계로 출하합니다.",
        icon: "Globe"
      }
    ];
    res.json(steps);
  });

  // Company data
  app.get("/api/company", (req, res) => {
    const companyData = {
      headline: "두 기업의 시너지, 하나의 프리미엄 브랜드",
      subheadline: "베트남 현지 생산부터 글로벌 유통까지, 완벽한 가치사슬을 구축합니다",
      partners: [
        {
          name: "ZOEL LIFE 주식회사 (영문: ZOEL LIFE Co., Ltd)",
          role: "프리미엄 침향 브랜드 운영 및 글로벌 유통",
          location: "서울특별시 금천구 벚꽃로36길 30, 1511호",
          established: "사업자등록번호: 749-86-03668",
          description: "ZOEL LIFE(ZOEL LIFE)는 베트남 직영 농장에서 생산된 최상급 침향의 한국 및 글로벌 시장 유통을 담당합니다. 브랜드 전략 수립, 마케팅, 온·오프라인 유통 채널 관리부터 고객 서비스까지 소비자 접점의 모든 과정을 책임지는 프리미엄 라이프스타일 기업입니다.",
          strengths: ["글로벌 유통 네트워크 구축", "브랜드 전략 및 마케팅", "온·오프라인 유통 채널 관리", "고객 서비스 및 CS 운영", "품질 보증 및 사후 관리"],
          icon: "globe",
          ceo: "대표: 박병주",
          contact: { phone: "070-4140-4086", email: "bj0202@gmail.com" }
        }
      ],
      partnership: {
        title: "완벽한 파트너십",
        description: "생산에서 소비자까지, 끊김 없는 가치사슬",
        flow: ["원료 생산 (ZOEL LIFE)", "품질 검증", "글로벌 유통 (ZOEL LIFE)", "고객 전달"]
      },
      vision: "자연의 진실된 가치를 전 세계에 전하는 것"
    };
    res.json(companyData);
  });

  // Brand Story data
  app.get("/api/brandStory", (req, res) => {
    const brandStoryData = {
      tabs: [
        {
          id: "field",
          label: "대라천 침향 현장",
          title: "대라천 침향 현장",
          subtitle: "100% 베트남산, 아갈로차 침향나무만!\n200ha 규모, 400만 그루의 침향나무가 자라는 생명의 터전",
          content: "1998년 캄보디아에서 시작된 ZOEL LIFE의 여정은 2000년 베트남 5개 성(하띤, 동나이, 냐짱, 푸국, 람동)으로 확장되었습니다. 현재 베트남 전역의 직영 농장에서 침향나무를 직접 관리하며, 원료 재배부터 가공, 유통까지 전 과정을 수직계열화하여 품질을 보증합니다.",
          locations: [
            { name: "하띤 (Ha Tinh)", desc: "메인 대규모 농장" },
            { name: "동나이 (Dong Nai)", desc: "전략 재배 거점" },
            { name: "냐짱 (Nha Trang)", desc: "고품질 원료 산지" },
            { name: "푸국 (Phu Quoc)", desc: "해양성 기후 재배지" },
            { name: "람동 (Lam Dong)", desc: "고산지대 특화 농장" }
          ]
        },
        {
          id: "history",
          label: "대라천 침향 역사",
          title: "대라천 침향 역사",
          subtitle: "25년, 시간으로 증명하는 침향의 깊이",
          timeline: [
            { year: "1998", event: "캄보디아 침향 사업 시작" },
            { year: "2000", event: "베트남 5개 성 농장 확장" },
            { year: "2014", event: "노니 발효 기술 개발 및 적용" },
            { year: "2018", event: "NTV 통합법인 출범 / Organic, HACCP 인증 / 수지유도제재 개발" },
            { year: "2019", event: "베트남 OCOP 인증 획득" },
            { year: "2023", event: "18개 품목 재인증 및 라인업 확대" },
            { year: "2024", event: "한국 시장 본격 수출 시작" },
            { year: "2025", event: "아시아 10대 브랜드 선정" }
          ]
        },
        {
          id: "original",
          label: "오리지널",
          title: "자연의 진실된 가치",
          subtitle: "타협하지 않는 ZOEL LIFE의 경영철학",
          philosophy: [
            { title: "세계 최고 수준", desc: "25년 연구의 결실로 탄생한 세계적 품질의 제품" },
            { title: "투명한 공정", desc: "누구에게나 공개할 수 있는 개방형 생산 시스템" },
            { title: "국제 기준 준수", desc: "HACCP 등 엄격한 국제 품질 관리 기준 적용" },
            { title: "100% 베트남 침향", desc: "순수 베트남산 자연 침향만을 고집합니다" }
          ]
        },
        {
          id: "certification",
          label: "인증",
          title: "신뢰의 지표",
          subtitle: "국제가 인정하는 ZOEL LIFE의 품질",
          certs: [
            { name: "CITES", code: "IIA-DNI-007", desc: "멸종위기 야생동식물 국제거래 협약 인증" },
            { name: "Organic", code: "Certified", desc: "유기농 재배 및 생산 인증" },
            { name: "HACCP", code: "International", desc: "식품안전관리인증기준 통과" },
            { name: "Patent", code: "제12835호", desc: "수지유도 기술 특허 (2014~2031)" },
            { name: "OCOP", code: "Vietnam", desc: "베트남 우수 지역 특산물 인증" },
            { name: "Asia Top 10", code: "2025", desc: "아시아 10대 선도 브랜드 선정" }
          ]
        },
        {
          id: "quality",
          label: "검증된 품질",
          title: "과학으로 입증된 안전",
          subtitle: "최소 26년의 시간이 만드는 한 방울의 가치",
          testResults: [
            { name: "TSL 안전성 시험", result: "중금속 8종 불검출", status: "Pass" },
            { name: "생산 공정", result: "14단계 정밀 프로세스", status: "Verified" },
            { name: "숙성 기간", result: "최소 26년 (식목~출고)", status: "Premium" }
          ],
          message: "우리는 단순한 제품이 아닌, 자연이 허락한 시간을 판매합니다."
        }
      ]
    };
    res.json(brandStoryData);
  });

  // CMS Content Routes
  app.get("/api/content", (req, res) => {
    try {
      const data = fs.readFileSync(CONTENT_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read content" });
    }
  });

  app.post("/api/content", (req, res) => {
    try {
      fs.writeFileSync(CONTENT_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save content" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files
    const distPath = path.join(process.cwd(), 'dist/public');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
