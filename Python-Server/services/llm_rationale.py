from __future__ import annotations

import json
import logging
import os
from typing import Optional

from schemas import RationaleRequest, RationaleResponse
from .news_feed import fetch_news
from .market_pressure import fetch_taker_pressure

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior quantitative crypto trading analyst.
Given a machine-learning model's next-hour OHLC forecast, recent headlines,
and aggregate taker buy/sell pressure, you produce a concise, professional
trade rationale.

Hard rules:
- 2-3 sentences of plain English.
- State the directional bias (bullish, bearish, or neutral) and the primary
  driver. Cite a headline by source name when one is clearly relevant.
- Surface ONE concrete risk factor a trader should monitor (volatility,
  liquidity, news-driven reversal, regulatory, etc.).
- If headlines, flow, and forecast disagree, lower the `confidence_label`.
  Agreement across all three is required for "high".
- Never recommend leverage or specific position sizes.
- Never claim certainty. Use hedged verbs: "suggests", "favors", "may".

Return STRICT JSON with exactly these keys and no others:
{
  "rationale": "<2-3 sentence plain-English rationale>",
  "confidence_label": "low" | "medium" | "high",
  "risk_factors": ["<short risk 1>", "<short risk 2>"]
}

Do not wrap the JSON in markdown fences or any prose. Output JSON only.
"""


class RationaleService:
    """Claude-backed trade-rationale generator. No-ops cleanly when
    ANTHROPIC_API_KEY is not set so the rest of the service still works."""

    def __init__(self) -> None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        self.enabled = bool(api_key)
        self.model = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")
        self.client = None
        if self.enabled:
            try:
                from anthropic import AsyncAnthropic
                self.client = AsyncAnthropic(api_key=api_key)
            except Exception as e:
                log.warning("Anthropic SDK unavailable: %s", e)
                self.enabled = False

    async def generate(self, req: RationaleRequest) -> RationaleResponse:
        if not self.enabled or self.client is None:
            return self._offline_fallback(req)

        try:
            news = await fetch_news(req.symbol, max_items=5)
        except Exception as e:
            log.warning("rationale: news fetch failed (%s) — proceeding without", e)
            news = []
        try:
            pressure = await fetch_taker_pressure(req.symbol)
        except Exception as e:
            log.warning("rationale: pressure fetch failed (%s) — proceeding without", e)
            pressure = None
        user_msg = self._format_user(req, news, pressure)
        try:
            resp = await self.client.messages.create(
                model=self.model,
                max_tokens=400,
                system=[
                    {
                        "type": "text",
                        "text": SYSTEM_PROMPT,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=[{"role": "user", "content": user_msg}],
            )
        except Exception as e:
            log.exception("Claude call failed")
            return RationaleResponse(
                rationale=f"LLM unavailable ({type(e).__name__}). Falling back to model-only output.",
                confidence_label="low",
                risk_factors=["LLM rationale failed to generate."],
            )

        text = "".join(block.text for block in resp.content if getattr(block, "type", "") == "text").strip()
        return self._parse(text)

    @staticmethod
    def _parse(text: str) -> RationaleResponse:
        try:
            data = json.loads(text)
            return RationaleResponse(**data)
        except (json.JSONDecodeError, TypeError, ValueError):
            log.warning("Failed to parse LLM JSON; returning raw text. payload=%r", text[:200])
            return RationaleResponse(
                rationale=text or "Rationale unavailable.",
                confidence_label="medium",
                risk_factors=[],
            )

    @staticmethod
    def _format_user(
        req: RationaleRequest,
        news: Optional[list[dict]] = None,
        pressure: Optional[dict] = None,
    ) -> str:
        p = req.predicted
        pct: Optional[float] = None
        if req.current_price:
            pct = ((p.close - req.current_price) / req.current_price) * 100.0
        sentiment = req.market_sentiment or "no external sentiment provided"
        pct_line = f"Implied close-vs-spot move: {pct:+.2f}%" if pct is not None else "Implied move: n/a"

        news_block = "(no recent headlines)"
        if news:
            lines = []
            for it in news[:5]:
                src = it.get("source") or "unknown"
                sentiment_tag = it.get("sentiment") or "neutral"
                lines.append(f"- [{src} / {sentiment_tag}] {it.get('title', '').strip()}")
            news_block = "\n".join(lines)

        if pressure:
            flow_block = (
                f"  24h taker buy ratio: {pressure['buy_ratio_24h']:.2%}\n"
                f"  4h  taker buy ratio: {pressure['buy_ratio_4h']:.2%}\n"
                f"  Interpretation: {pressure['interpretation']}"
            )
        else:
            flow_block = "  (pressure feed unavailable)"

        return (
            f"Symbol: {req.symbol}\n"
            f"Current spot price: ${req.current_price:,.2f}\n"
            f"Next-hour ML forecast:\n"
            f"  open  = ${p.open:,.2f}\n"
            f"  high  = ${p.high:,.2f}\n"
            f"  low   = ${p.low:,.2f}\n"
            f"  close = ${p.close:,.2f}\n"
            f"{pct_line}\n"
            f"External sentiment hint: {sentiment}\n"
            f"\nMarket flow (Binance):\n{flow_block}\n"
            f"\nRecent headlines:\n{news_block}\n\n"
            f"Produce the JSON rationale per the system instructions."
        )

    @staticmethod
    def _offline_fallback(req: RationaleRequest) -> RationaleResponse:
        p = req.predicted
        bias = "bullish" if p.close > p.open else "bearish" if p.close < p.open else "neutral"
        return RationaleResponse(
            rationale=(
                f"LLM rationale disabled (set ANTHROPIC_API_KEY to enable). "
                f"Model forecast is {bias}: predicted close ${p.close:,.2f} vs open ${p.open:,.2f}."
            ),
            confidence_label="low",
            risk_factors=["No qualitative analysis available — numeric forecast only."],
        )
