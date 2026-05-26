from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class Candle(BaseModel):
    open: float
    high: float
    low: float
    close: float


class PredictionResponse(BaseModel):
    symbol: str
    prediction: Candle
    horizon_hours: int = 1
    model_version: str = "lstm-1h-v1"


class TrainRequest(BaseModel):
    symbol: str = Field(min_length=1, max_length=12)


class TrainResponse(BaseModel):
    symbol: str
    status: str


class RationaleRequest(BaseModel):
    symbol: str
    current_price: float
    predicted: Candle
    market_sentiment: Optional[str] = None


class RationaleResponse(BaseModel):
    rationale: str
    confidence_label: str = Field(default="medium")
    risk_factors: list[str] = Field(default_factory=list)


class AccuracyResponse(BaseModel):
    symbol: str
    accuracy_pct: Optional[float] = None
    samples: int = 0


class HealthResponse(BaseModel):
    status: str
    predictor_available: bool
    llm_enabled: bool


class NewsItem(BaseModel):
    title: str
    source: str
    url: str
    published_on: int  # unix seconds
    categories: str = ""
    sentiment: str = "neutral"


class NewsResponse(BaseModel):
    symbol: str
    items: list[NewsItem]


class PressureResponse(BaseModel):
    symbol: str
    buy_ratio_24h: Optional[float] = None
    buy_ratio_4h: Optional[float] = None
    interpretation: Optional[str] = None
