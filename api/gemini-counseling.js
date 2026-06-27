export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST 요청만 허용됩니다.' });
  }

  const { studentAlias, gradeSummary, learningTraits, teacherConcern } = req.body;

  // 필수 값 검증
  if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
    return res.status(400).json({ success: false, error: '필수 데이터가 누락되었습니다.' });
  }

  // API 키 확인 (Vercel 환경 변수)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' });
  }

  // Gemini API 요청 URL
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

  // 프롬프트 구성
  const prompt = `당신은 교사를 돕는 "AI 학생 상담 전략 도우미"입니다.
다음 학생 데이터와 교사의 고민을 바탕으로 상담 전략을 제안해주세요.

원칙:
1. 학생을 단정적으로 판단하거나 진단하지 마세요. (예: "의지가 부족하다", "주의력 문제가 있다", "심리적 문제가 있다" 등 단정적 표현 금지)
2. 교사가 학생을 이해하고 대화할 수 있도록 돕는 방향으로 응답하세요.

[학생 데이터]
- 학생 익명 이름: ${studentAlias}
- 성적 요약: ${gradeSummary}
- 학습 특성 요약: ${learningTraits}
- 교사 고민: ${teacherConcern}

반드시 다음 형식으로만 응답을 작성하세요:
1. 현재 상황 요약
2. 학생 데이터 기반 해석
3. 상담 접근 전략
4. 교사가 던질 수 있는 질문 3개
5. 피해야 할 말 또는 주의점
6. 다음 수업에서 해볼 수 있는 작은 지원`;

  try {
    // 내장 fetch를 사용해 Gemini REST API 호출
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return res.status(response.status).json({ success: false, error: 'Gemini API 호출에 실패했습니다.' });
    }

    // Gemini 응답 추출
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return res.status(200).json({ success: true, result: resultText });
  } catch (error) {
    console.error('Fetch Error:', error);
    return res.status(500).json({ success: false, error: '서버 내부 오류가 발생했습니다.' });
  }
}
