from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    AccuracyResponse,
    HealthResponse,
    NewsItem,
    NewsResponse,
    PredictionResponse,
    PressureResponse,
    RationaleRequest,
    RationaleResponse,
    TrainRequest,
    TrainResponse,
)
from services.llm_rationale import RationaleService
from services.market_pressure import fetch_taker_pressure
from services.news_feed import fetch_news
from services.predictor import Predictor
from services import scheduler

load_dotenv()
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

predictor: Predictor | None = None
rationale: RationaleService | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global predictor, rationale
    predictor = Predictor()
    rationale = RationaleService()
    scheduler.start(predictor)
    yield
    await scheduler.stop()


app = FastAPI(
    title="QuantumChain AI ML Service",
    version="2.0.0",
    description="LSTM forecasts + Claude-powered trade rationale",
    lifespan=lifespan,
)

origins = [o.strip() for o in os.getenv("CLIENT_ORIGIN", "http://localhost:3000").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        predictor_available=bool(predictor and predictor.available),
        llm_enabled=bool(rationale and rationale.enabled),
    )


@app.get("/predict", response_model=PredictionResponse)
async def predict(symbol: str) -> PredictionResponse:
    if not symbol:
        raise HTTPException(400, "symbol query parameter is required")
    if predictor is None or not predictor.available:
        reason = predictor.error if predictor else "predictor not initialised"
        raise HTTPException(503, f"Predictor unavailable: {reason}")
    result = predictor.predict(symbol.upper())
    if result is None:
        raise HTTPException(404, f"No trained model for {symbol.upper()}")
    return result


@app.post("/train", response_model=TrainResponse)
async def train(req: TrainRequest) -> TrainResponse:
    if predictor is None or not predictor.available:
        reason = predictor.error if predictor else "predictor not initialised"
        raise HTTPException(503, f"Predictor unavailable: {reason}")
    try:
        predictor.train(req.symbol.upper())
    except Exception as e:
        raise HTTPException(500, f"Training failed: {e}")
    return TrainResponse(symbol=req.symbol.upper(), status="trained")


@app.post("/rationale", response_model=RationaleResponse)
async def get_rationale(req: RationaleRequest) -> RationaleResponse:
    if rationale is None:
        raise HTTPException(503, "Rationale service not initialised")
    return await rationale.generate(req)


@app.get("/news", response_model=NewsResponse)
async def news(symbol: str, max_items: int = 5) -> NewsResponse:
    items = await fetch_news(symbol.upper(), max_items=max_items)
    return NewsResponse(
        symbol=symbol.upper(),
        items=[NewsItem(**it) for it in items],
    )


@app.get("/scheduler")
async def scheduler_status():
    return scheduler.status()


@app.get("/pressure", response_model=PressureResponse)
async def pressure(symbol: str) -> PressureResponse:
    result = await fetch_taker_pressure(symbol)
    if result is None:
        return PressureResponse(symbol=symbol.upper())
    return PressureResponse(**result)


@app.get("/accuracy", response_model=AccuracyResponse)
async def accuracy(symbol: str, lookback_days: int = 14) -> AccuracyResponse:
    if predictor is None or not predictor.available:
        return AccuracyResponse(symbol=symbol.upper(), accuracy_pct=None, samples=0)
    result = predictor.accuracy(symbol.upper(), lookback_days=lookback_days)
    if not result:
        return AccuracyResponse(symbol=symbol.upper(), accuracy_pct=None, samples=0)
    return AccuracyResponse(
        symbol=result["symbol"],
        accuracy_pct=result.get("accuracy_pct"),
        samples=int(result.get("samples", 0)),
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        reload=os.getenv("RELOAD", "true").lower() == "true",
    )
