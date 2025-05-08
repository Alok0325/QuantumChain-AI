import numpy as np
import pandas as pd
import os
from binance.client import Client
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
from datetime import datetime, timedelta
from tensorflow.keras.callbacks import EarlyStopping
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class CryptoModelTrainer:
    def __init__(self):
        # Get API credentials from environment variables
        api_key = os.getenv('BINANCE_API_KEY')
        api_secret = os.getenv('BINANCE_API_SECRET')
        
        if not api_key or not api_secret:
            raise ValueError("Binance API credentials not found in environment variables")
            
        self.client = Client(api_key, api_secret)
        self.scaler = MinMaxScaler()
        self.hours_range = 4
        
    def get_historical_data(self, symbol, days=360):
        end_time = datetime.now()
        start_time = end_time - timedelta(days=days)
        
        candlesticks = self.client.get_historical_klines(
            f"{symbol}USDT",
            Client.KLINE_INTERVAL_1HOUR,
            start_time.strftime("%Y-%m-%d %H:%M:%S"),
            end_time.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        columns = [
            "Open Time", "Open", "High", "Low", "Close", "Volume",
            "Close Time", "Quote Asset Volume", "Number of Trades",
            "Taker Buy Base Asset Volume", "Taker Buy Quote Asset Volume", "Ignore"
        ]
        
        df = pd.DataFrame(candlesticks, columns=columns)
        df["Open"] = df["Open"].astype(float)
        df["High"] = df["High"].astype(float)
        df["Low"] = df["Low"].astype(float)
        df["Close"] = df["Close"].astype(float)
        df["Volume"] = df["Volume"].astype(float)
        
        return df[["Open Time", "Open", "High", "Low", "Close", "Volume"]].iloc[:-1]
    
    def prepare_data(self, df):
        scaled_data = self.scaler.fit_transform(df[['Open', 'High', 'Low', 'Close']])
        
        X, y = [], []
        for i in range(self.hours_range, len(scaled_data)):
            X.append(scaled_data[i-self.hours_range:i])
            y.append(scaled_data[i])
            
        X, y = np.array(X), np.array(y)
        
        split = int(len(X) * 0.8)
        return X[:split], X[split:], y[:split], y[split:]
    
    def build_model(self, input_shape):
        model = Sequential([
            LSTM(100, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25, activation='relu'),
            Dense(4)
        ])
        model.compile(optimizer='adam', loss='huber', metrics=['mae', 'accuracy'])
        return model
    
    def train_and_save_model(self, symbol):
        # Create directory for the coin if it doesn't exist
        model_dir = f"models/{symbol.lower()}"
        os.makedirs(model_dir, exist_ok=True)
        
        # Check if model already exists
        model_path = f"{model_dir}/model.h5"
        if os.path.exists(model_path):
            print(f"Model for {symbol} already exists. Skipping training.")
            return
        
        # Get and prepare data
        df = self.get_historical_data(symbol)
        X_train, X_test, y_train, y_test = self.prepare_data(df)
        
        # Build and train model
        model = self.build_model((X_train.shape[1], X_train.shape[2]))
        early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
        
        model.fit(
            X_train, y_train,
            batch_size=32,
            epochs=5,
            validation_split=0.2,
            callbacks=[early_stopping]
        )
        
        # Save model and scaler
        model.save(model_path)
        np.save(f"{model_dir}/scaler.npy", self.scaler)
        
        print(f"Model for {symbol} trained and saved successfully.")
    
    def predict_next_candlestick(self, symbol):
        model_dir = f"models/{symbol.lower()}"
        model_path = f"{model_dir}/model.h5"
        
        if not os.path.exists(model_path):
            return None
        
        # Load model and scaler
        model = load_model(model_path)
        self.scaler = np.load(f"{model_dir}/scaler.npy", allow_pickle=True).item()
        
        # Get latest data
        df = self.get_historical_data(symbol, days=5)  # Get just enough data for prediction
        scaled_data = self.scaler.transform(df[['Open', 'High', 'Low', 'Close']])
        
        # Prepare last hours for prediction
        last_hours = scaled_data[-self.hours_range:]
        last_hours = np.expand_dims(last_hours, axis=0)
        
        # Make prediction
        scaled_prediction = model.predict(last_hours)
        prediction = self.scaler.inverse_transform(scaled_prediction)
        
        return prediction[0]  # Return first prediction

if __name__ == "__main__":
    trainer = CryptoModelTrainer()
    trainer.train_and_save_model("ATOM") 