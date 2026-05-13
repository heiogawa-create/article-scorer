const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';

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

async function callAnthropic(messages, system, apiKey, maxTokens = 4096) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
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
  if (!text) throw new Error('AIから空の応答が返されました。');
  return text;
}

export async function scoreArticle(article, apiKey) {
  const system = 'あなたはnote.com向け日本語長文記事の編集者です。採点基準に厳密に従い、必ず有効なJSONのみを返してください。';
  const prompt = `以下の記事を、各項目20点満点・合計120点満点で採点してください。

採点項目:
- hook: タイトル・冒頭フック力（読者を引き込むか）
- depth: 情報の深さ・専門性（独自性・具体性）
- readability: 読みやすさ・構成（見出し・流れ）
- seo: SEO・検索意図との一致
- empathy: 感情的共鳴・共感度
- cta: CTA・購買促進力

返答は次のJSON形式のみ、markdownや補足文は不要です。
{
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
}

記事:
${article}`;

  const text = await callAnthropic([{ role: 'user', content: prompt }], system, apiKey);
  const parsed = parseJsonResponse(text);
  return {
    ...parsed,
    total: Number(parsed.total) || Object.values(parsed.scores ?? {}).reduce((sum, s) => sum + Number(s || 0), 0),
  };
}

export async function improveArticle(article, scoringResult, apiKey) {
  const system = 'あなたはnote.comで成果を出す日本語記事のプロ編集者です。採点の観点を踏まえながら、読者の共感と購買促進を高めてください。';
  const prompt = `以下の採点結果とフィードバックを踏まえて、記事本文を修正してください。

要件:
- タイトル、冒頭フック、見出し、本文、CTAまで必要に応じて修正する
- note.com向けの自然な日本語にする
- 読者の共感に響き、具体性と専門性を高める
- SEOを意識しつつ不自然なキーワード詰め込みは避ける
- 修正後の記事本文のみを返す

採点結果:
${JSON.stringify(scoringResult, null, 2)}

修正前の記事:
${article}`;

  return callAnthropic([{ role: 'user', content: prompt }], system, apiKey, 8192);
}

export function generatePrompt(article, scoringResult) {
  const feedbackText = Object.entries(scoringResult.feedback || {})
    .map(([key, val]) => `・${key}: ${val}`)
    .join('\n');

  return `以下の記事を改善してください。

【採点結果】合計${scoringResult.total}点／120点満点

【各項目のフィードバック】
${feedbackText}

【総合コメント】
${scoringResult.summary || ''}

【改善の要件】
- タイトル、冒頭フック、見出し、本文、CTAを上記フィードバックに従って修正
- note.com向けの自然な日本語で
- 読者の共感に響き、具体性と専門性を高める
- 修正後の記事本文のみを返す

【元の記事】
${article}`;
}
