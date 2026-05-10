const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

const scoreSchema = `{
  "scores": {
    "hook": 数値,
    "depth": 数値,
    "readability": 数値,
    "seo": 数値,
    "empathy": 数値,
    "cta": 数値
  },
  "total": 数値,
  "feedback": {
    "hook": "改善コメント",
    "depth": "改善コメント",
    "readability": "改善コメント",
    "seo": "改善コメント",
    "empathy": "改善コメント",
    "cta": "改善コメント"
  },
  "summary": "総合コメント"
}`;

function getApiKey() {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY が設定されていません。.env ファイルを確認してください。');
  }

  return apiKey;
}

function extractTextContent(data) {
  return data.content
    ?.filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function parseJsonResponse(text) {
  const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fencedJson?.[1] ?? text;
  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('AIの応答からJSONを読み取れませんでした。もう一度お試しください。');
  }

  return JSON.parse(jsonText.slice(firstBrace, lastBrace + 1));
}

async function callAnthropic(messages, system, maxTokens = 4096) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.2,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API エラー (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = extractTextContent(data);

  if (!text) {
    throw new Error('AIから空の応答が返されました。');
  }

  return text;
}

export async function scoreArticle(article) {
  const system = 'あなたはnote.com向け日本語長文記事の編集長です。採点基準に厳密に従い、必ず有効なJSONのみを返してください。';
  const prompt = `以下の記事を、各項目20点満点・合計120点満点で採点してください。\n\n採点項目:\n- hook: タイトル・冒頭フック力（読者を引き込むか）\n- depth: 情報の深さ・専門性（独自性・具体性）\n- readability: 読みやすさ・構成（見出し・流れ）\n- seo: SEO・検索意図との一致\n- empathy: 感情的共鳴・共感度\n- cta: CTA・購買促進力\n\n返答は次のJSON形式のみ。Markdownや説明文は不要です。\n${scoreSchema}\n\n記事:\n${article}`;

  const text = await callAnthropic([{ role: 'user', content: prompt }], system);
  const parsed = parseJsonResponse(text);

  return {
    ...parsed,
    total: Number(parsed.total) || Object.values(parsed.scores ?? {}).reduce((sum, score) => sum + Number(score || 0), 0),
  };
}

export async function improveArticle(article, scoringResult) {
  const system = 'あなたはnote.comで成果を出す日本語記事のプロ編集者です。原稿の意図を保ちながら、読者体験と購買促進力を高めてください。';
  const prompt = `以下の採点結果と改善コメントを踏まえて、記事全文を改善してください。\n\n要件:\n- タイトル、冒頭フック、見出し、本文、CTAまで必要に応じて改善する\n- note.com向けの自然な日本語にする\n- 読者の悩みに共感し、具体例と専門性を増やす\n- SEOを意識しつつ不自然なキーワード詰め込みは避ける\n- 修正後の記事本文のみを返す\n\n採点結果:\n${JSON.stringify(scoringResult, null, 2)}\n\n修正前の記事:\n${article}`;

  return callAnthropic([{ role: 'user', content: prompt }], system, 8192);
}
