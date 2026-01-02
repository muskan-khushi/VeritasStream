import numpy as np
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self, contamination=0.05):
        # contamination = expected percentage of anomalies (5%)
        self.model = IsolationForest(
            n_estimators=100, 
            contamination=contamination, 
            random_state=42,
            n_jobs=-1 # Use all CPU cores
        )

    def analyze(self, logs):
        if not logs:
            return [], 0

        # 1. Feature Engineering
        # We use 'risk_score' and 'length' as features
        features = []
        for log in logs:
            features.append([log['risk_score'], log['length']])
        
        X = np.array(features)

        # 2. Train Model (Unsupervised)
        # The model learns "normal" vs "outlier" distribution
        self.model.fit(X)

        # 3. Predict (-1 = Anomaly, 1 = Normal)
        predictions = self.model.predict(X)
        scores = self.model.decision_function(X) # Confidence score

        # 4. Annotate Logs
        anomaly_count = 0
        for i, log in enumerate(logs):
            is_anomaly = True if predictions[i] == -1 else False
            log['is_anomaly'] = is_anomaly
            log['anomaly_score'] = float(scores[i]) # Lower is more anomalous
            
            if is_anomaly:
                anomaly_count += 1

        return logs, anomaly_count