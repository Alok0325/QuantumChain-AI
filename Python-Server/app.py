from flask import Flask, jsonify, request
from model_trainer import CryptoModelTrainer
import os

app = Flask(__name__)

# Initialize the model trainer with your Binance API credentials
api_key = "YOUR_API_KEY"
api_secret = "YOUR_API_SECRET"
trainer = CryptoModelTrainer(api_key, api_secret)

@app.route('/predict', methods=['GET'])
def predict():
    # Get coin symbol from query parameter
    symbol = request.args.get('symbol', '').upper()
    
    if not symbol:
        return jsonify({
            'error': 'Symbol parameter is required'
        }), 400
    
    # Check if model exists
    model_path = f"models/{symbol.lower()}/model.h5"
    if not os.path.exists(model_path):
        return jsonify({
            'error': f'Model not found for {symbol}'
        }), 404
    
    # Get prediction
    prediction = trainer.predict_next_candlestick(symbol)
    
    if prediction is None:
        return jsonify({
            'error': 'Failed to generate prediction'
        }), 500
    
    # Format prediction
    result = {
        'symbol': symbol,
        'prediction': {
            'open': float(prediction[0]),
            'high': float(prediction[1]),
            'low': float(prediction[2]),
            'close': float(prediction[3])
        }
    }
    
    return jsonify(result)

@app.route('/train', methods=['POST'])
def train():
    # Get coin symbol from request body
    data = request.get_json()
    symbol = data.get('symbol', '').upper()
    
    if not symbol:
        return jsonify({
            'error': 'Symbol parameter is required'
        }), 400
    
    try:
        trainer.train_and_save_model(symbol)
        return jsonify({
            'message': f'Model trained successfully for {symbol}'
        })
    except Exception as e:
        return jsonify({
            'error': f'Failed to train model: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 