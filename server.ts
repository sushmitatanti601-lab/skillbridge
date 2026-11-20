import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { PRODUCTS } from './src/data/products.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getCatalogSummary() {
  return PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    priceInr: p.price,
    mrpInr: p.mrp,
    rating: p.rating,
    reviewCount: p.reviewCount,
    valueScore: p.valueScore,
    bestFor: p.bestFor,
    specs: p.specs,
    features: p.features,
    pros: p.pros,
    cons: p.cons,
    verifiedOffers: p.verifiedOffers.map((o) => o.label),
  }));
}

function formatErrorResponse(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : 'AI request failed.';
  if (rawMessage.includes('GEMINI_API_KEY')) {
    return { status: 503, message: rawMessage };
  }
  if (rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'AI quota temporarily reached. Please wait a moment or check your billing quota in Settings > Secrets.',
    };
  }
  if (
    rawMessage.includes('403') ||
    rawMessage.includes('400') ||
    rawMessage.includes('API_KEY_INVALID') ||
    rawMessage.includes('PERMISSION_DENIED')
  ) {
    return {
      status: 403,
      message:
        'Gemini API key permission error. Please verify your API key in Settings > Secrets.',
    };
  }
  return { status: 500, message: rawMessage };
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post('/api/ai/search', async (req: Request, res: Response) => {
  try {
    const query = String(req.body?.query ?? '').trim();
    if (!query) {
      res.status(400).json({ error: 'Search query is required.' });
      return;
    }

    const ai = getGeminiClient();
    const catalog = getCatalogSummary();

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `User search query: "${query}"\n\nProduct Catalog JSON:\n${JSON.stringify(catalog)}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'You are SkillBridge Smart Search. Analyze the user query (which may include category, budget in INR like ₹20,000 or ₹500, brand, or student/professional use case). Match only real product IDs from the provided catalog. Rank matchedProductIds from best fit to next best fit (between 1 and 8 matches). Keep explanation concise, practical, and tailored to Indian college students and young professionals.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            interpretedIntent: { type: Type.STRING },
            suggestedCategory: {
              type: Type.STRING,
              description:
                'One of: All, Smartphones, Laptops, Fashion, Beauty & Skincare, Electronics, Home Appliances',
            },
            maxBudgetInr: {
              type: Type.NUMBER,
              nullable: true,
            },
            matchedProductIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            explanation: { type: Type.STRING },
          },
          required: [
            'interpretedIntent',
            'suggestedCategory',
            'matchedProductIds',
            'explanation',
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const validIds = new Set(PRODUCTS.map((p) => p.id));
    const filteredIds = Array.isArray(parsed.matchedProductIds)
      ? parsed.matchedProductIds.filter((id: string) => validIds.has(id))
      : [];

    res.json({
      interpretedIntent: parsed.interpretedIntent || query,
      suggestedCategory: parsed.suggestedCategory || 'All',
      maxBudgetInr:
        typeof parsed.maxBudgetInr === 'number' ? parsed.maxBudgetInr : null,
      matchedProductIds: filteredIds,
      explanation: parsed.explanation || '',
    });
  } catch (err) {
    const { status, message } = formatErrorResponse(err);
    res.status(status).json({ error: message });
  }
});

app.post('/api/ai/recommend', async (req: Request, res: Response) => {
  try {
    const {
      productNeed = '',
      budget = '',
      mustHaveFeatures = '',
      primaryUseCase = '',
      freeformQuery = '',
    } = req.body ?? {};

    if (!productNeed && !freeformQuery) {
      res.status(400).json({
        error: 'Please describe what product you are looking for.',
      });
      return;
    }

    const ai = getGeminiClient();
    const catalog = getCatalogSummary();

    const prompt = `
User Request Details:
- Product needed: ${productNeed || 'Inferred from query'}
- Budget: ${budget || 'Not specified'}
- Features that matter most: ${mustHaveFeatures || 'Balanced quality and reliability'}
- Primary use case: ${primaryUseCase || 'Everyday student / professional use'}
- Direct user prompt: ${freeformQuery || 'N/A'}

Available SkillBridge Catalog:
${JSON.stringify(catalog)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'You are SkillBridge AI, an objective shopping advisor for college students, young professionals, and online shoppers. Recommend products ONLY using exact product IDs from the provided catalog. Return up to 5 tailored recommendation roles: "Best Overall", "Best Budget Option", "Best Value for Money", "Best Features", and "Best Alternative" (pick relevant products from the matching category; if fewer than 5 products exist in that category, select the best distinct fits or close cross-category alternatives and explain clearly). Explain WHY each product fits the user’s budget, performance, battery/durability, and everyday requirements in plain, trustworthy prose without hype.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advisorSummary: { type: Type.STRING },
            parsedCriteria: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                maxBudgetInr: { type: Type.NUMBER, nullable: true },
                priorities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['category', 'priorities'],
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: {
                    type: Type.STRING,
                    description:
                      'Must be one of: Best Overall, Best Budget Option, Best Value for Money, Best Features, Best Alternative',
                  },
                  productId: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['role', 'productId', 'reason'],
              },
            },
          },
          required: ['advisorSummary', 'parsedCriteria', 'recommendations'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const validIds = new Set(PRODUCTS.map((p) => p.id));
    const safeRecs = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter((r: { productId: string }) =>
          validIds.has(r.productId)
        )
      : [];

    res.json({
      advisorSummary: parsed.advisorSummary ?? '',
      parsedCriteria: parsed.parsedCriteria ?? {
        category: 'All',
        maxBudgetInr: null,
        priorities: [],
      },
      recommendations: safeRecs,
    });
  } catch (err) {
    const { status, message } = formatErrorResponse(err);
    res.status(status).json({ error: message });
  }
});

app.post('/api/ai/compare-verdict', async (req: Request, res: Response) => {
  try {
    const productIds: string[] = Array.isArray(req.body?.productIds)
      ? req.body.productIds
      : [];
    const userPriorities: string = String(req.body?.userPriorities ?? '');

    const selected = PRODUCTS.filter((p) => productIds.includes(p.id));
    if (selected.length < 2) {
      res.status(400).json({
        error: 'Select at least 2 products to generate an AI comparison verdict.',
      });
      return;
    }

    const ai = getGeminiClient();
    const compactProducts = selected.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      priceInr: p.price,
      rating: p.rating,
      reviewCount: p.reviewCount,
      valueScore: p.valueScore,
      specs: p.specs,
      pros: p.pros,
      cons: p.cons,
      verifiedOffers: p.verifiedOffers.map((o) => o.label),
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Products being compared side-by-side:\n${JSON.stringify(compactProducts)}\n\nUser priority context: ${userPriorities || 'Balanced value, reliability, and everyday practicality'}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'You are SkillBridge Comparison Engine. Compare the provided 2 to 4 products fairly and objectively. Use only the provided product IDs. Identify concrete category winners (e.g., Price & Affordability, Core Specs / Performance, Customer Satisfaction, Value for Money, Verified Offers) and assign recommendation slots ("Best Overall", "Best Budget Option", "Best Value for Money", "Best Features", "Best Alternative" — choose the most relevant slots for the number of products compared). Conclude with a crisp, jargon-free finalVerdict telling the shopper which one to buy based on their priorities.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            summary: { type: Type.STRING },
            categoryWinners: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criterion: { type: Type.STRING },
                  winnerProductId: { type: Type.STRING },
                  note: { type: Type.STRING },
                },
                required: ['criterion', 'winnerProductId', 'note'],
              },
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  productId: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['role', 'productId', 'reason'],
              },
            },
            finalVerdict: { type: Type.STRING },
          },
          required: [
            'headline',
            'summary',
            'categoryWinners',
            'recommendations',
            'finalVerdict',
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const validIds = new Set(selected.map((p) => p.id));

    res.json({
      headline: parsed.headline ?? 'Side-by-Side AI Analysis',
      summary: parsed.summary ?? '',
      categoryWinners: Array.isArray(parsed.categoryWinners)
        ? parsed.categoryWinners.filter((w: { winnerProductId: string }) =>
            validIds.has(w.winnerProductId)
          )
        : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.filter((r: { productId: string }) =>
            validIds.has(r.productId)
          )
        : [],
      finalVerdict: parsed.finalVerdict ?? '',
    });
  } catch (err) {
    const { status, message } = formatErrorResponse(err);
    res.status(status).json({ error: message });
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillBridge server listening on http://localhost:${PORT}`);
  });
}

startServer();
