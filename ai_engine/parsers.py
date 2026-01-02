import re

class LogParser:
    def __init__(self):
        # Regex for IPv4 addresses
        self.ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
        
        # Weighted keywords for heuristic feature engineering
        self.risk_indicators = {
            'failed': 10,
            'error': 10,
            'denied': 20,
            'unauthorized': 50,
            'sudo': 30,
            'root': 40,
            'password': 20,
            'delete': 30,
            'attack': 100,
            'malware': 100
        }

    def calculate_risk_score(self, line):
        """
        Calculates a numerical risk score based on keyword presence.
        This serves as a 'feature' for the ML model.
        """
        score = 0
        line_lower = line.lower()
        for keyword, weight in self.risk_indicators.items():
            if keyword in line_lower:
                score += weight
        return score

    def parse_content(self, file_content):
        """
        Transforms raw bytes into a structured list of dictionaries.
        """
        try:
            text = file_content.decode('utf-8', errors='ignore')
        except Exception as e:
            print(f"Decoding error: {e}")
            return []

        logs = []
        lines = text.split('\n')

        for line in lines:
            if not line.strip():
                continue

            # Extract Features
            ips = re.findall(self.ip_pattern, line)
            risk_score = self.calculate_risk_score(line)
            
            # Feature Vector for formatting
            logs.append({
                'raw': line.strip()[:1000], # Truncate for DB health
                'ips': ips,
                'risk_score': risk_score,
                'length': len(line)
            })
            
        return logs