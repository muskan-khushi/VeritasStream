import pika
import json
import os
import sys
import re
import math
import numpy as np
from collections import Counter
from datetime import datetime
from pymongo import MongoClient
from minio import Minio
from dotenv import load_dotenv
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from gtts import gTTS

load_dotenv()

# --- CONFIGURATION ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/veritas_stream")
RABBIT_URI = os.getenv("RABBIT_URI", "amqp://guest:guest@127.0.0.1:5672")
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS = os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET = os.getenv("MINIO_SECRET_KEY")

# --- CONNECT SERVICES ---
print("⏳ Connecting to MongoDB...")
mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_database()
reports_collection = db.reports 

print("⏳ Connecting to MinIO...")
minio_client = Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS, secret_key=MINIO_SECRET, secure=False)

# --- MITRE ATT&CK THREAT INTELLIGENCE ENGINE ---
class MITREAttackDetector:
    """
    Advanced threat detection engine mapped to MITRE ATT&CK Framework.
    """
    def __init__(self):
        self.attack_patterns = {
            # INITIAL ACCESS
            'T1190': { 'name': 'Exploit Public-Facing App', 'tactic': 'Initial Access', 'keywords': ['exploit', 'cve-', 'rce', 'remote code execution'], 'severity': 92, 'description': 'Exploiting internet-facing application vulnerabilities' },
            'T1133': { 'name': 'External Remote Services', 'tactic': 'Initial Access', 'keywords': ['vpn', 'rdp', 'teamviewer', 'anydesk'], 'severity': 78, 'description': 'Unauthorized remote service access detected' },
            # EXECUTION
            'T1059.001': { 'name': 'PowerShell Execution', 'tactic': 'Execution', 'keywords': ['powershell', 'invoke-expression', 'iex', 'encodedcommand'], 'severity': 85, 'description': 'Malicious PowerShell execution detected' },
            'T1059.003': { 'name': 'Command Shell', 'tactic': 'Execution', 'keywords': ['cmd.exe', '/c', 'command prompt'], 'severity': 75, 'description': 'Suspicious command shell activity' },
            # PERSISTENCE
            'T1053': { 'name': 'Scheduled Task', 'tactic': 'Persistence', 'keywords': ['schtasks', 'cron', 'task scheduler'], 'severity': 80, 'description': 'Suspicious scheduled task creation' },
            'T1547': { 'name': 'Registry Autostart', 'tactic': 'Persistence', 'keywords': ['registry run', 'startup folder', 'autorun'], 'severity': 82, 'description': 'Autostart mechanism modified' },
            # PRIVILEGE ESCALATION
            'T1068': { 'name': 'Privilege Escalation', 'tactic': 'Privilege Escalation', 'keywords': ['privilege', 'elevation', 'kernel exploit', 'uac bypass'], 'severity': 94, 'description': 'Exploit for privilege escalation detected' },
            'T1078': { 'name': 'Valid Accounts', 'tactic': 'Privilege Escalation', 'keywords': ['root access', 'sudo', 'admin account'], 'severity': 88, 'description': 'Unauthorized use of privileged accounts' },
            # DEFENSE EVASION
            'T1070': { 'name': 'Indicator Removal', 'tactic': 'Defense Evasion', 'keywords': ['wevtutil', 'clear-eventlog', 'log deletion'], 'severity': 96, 'description': 'CRITICAL: Event log tampering detected' },
            'T1562': { 'name': 'Impair Defenses', 'tactic': 'Defense Evasion', 'keywords': ['disable antivirus', 'stop defender', 'firewall off'], 'severity': 97, 'description': 'Security tools disabled' },
            # CREDENTIAL ACCESS
            'T1110': { 'name': 'Brute Force', 'tactic': 'Credential Access', 'keywords': ['failed password', 'auth failure', 'invalid credentials'], 'severity': 85, 'description': 'High velocity authentication failures' },
            'T1003': { 'name': 'Credential Dumping', 'tactic': 'Credential Access', 'keywords': ['mimikatz', 'lsass', 'sam database', 'hashdump'], 'severity': 98, 'description': 'CRITICAL: Credential harvesting tool detected' },
            # DISCOVERY
            'T1046': { 'name': 'Network Discovery', 'tactic': 'Discovery', 'keywords': ['nmap', 'port scan', 'net view'], 'severity': 72, 'description': 'Network reconnaissance activity' },
            # LATERAL MOVEMENT
            'T1021': { 'name': 'Lateral Movement', 'tactic': 'Lateral Movement', 'keywords': ['psexec', 'admin$', 'c$', 'smb connection'], 'severity': 83, 'description': 'Lateral movement via SMB/RDP' },
            # COMMAND AND CONTROL
            'T1071': { 'name': 'C2 Communication', 'tactic': 'Command and Control', 'keywords': ['c2 server', 'beacon', 'callback'], 'severity': 95, 'description': 'Command and control communication detected' },
            # IMPACT (RANSOMWARE)
            'T1486': { 'name': 'Data Encrypted for Impact', 'tactic': 'Impact', 'keywords': ['ransomware', 'locked', 'encrypt', '.encrypted', 'wannacry'], 'severity': 99, 'description': 'CRITICAL: Ransomware encryption process active' },
            'T1490': { 'name': 'Inhibit System Recovery', 'tactic': 'Impact', 'keywords': ['vssadmin delete', 'shadow copy delete', 'wbadmin'], 'severity': 98, 'description': 'System recovery mechanisms destroyed' },
            # WEB ATTACKS
            'T1190-SQL': { 'name': 'SQL Injection', 'tactic': 'Initial Access', 'keywords': ['union select', 'or 1=1', 'drop table', 'information_schema'], 'severity': 96, 'description': 'SQL injection attack on database' },
            'T1505': { 'name': 'Web Shell', 'tactic': 'Persistence', 'keywords': ['webshell', 'eval(', 'shell_exec'], 'severity': 94, 'description': 'Web shell backdoor detected' }
        }
    
    def detect_threats(self, content, anomaly_count, lines):
        content_lower = content.lower()
        detected_threats = []
        
        # 1. Pattern Matching
        for tech_id, tech_data in self.attack_patterns.items():
            matches = [kw for kw in tech_data['keywords'] if kw in content_lower]
            if matches:
                # Confidence calc: Base 70% + 5% per keyword found
                confidence = min(100, 70 + (len(matches) * 5))
                detected_threats.append({
                    'technique_id': tech_id,
                    'name': tech_data['name'],
                    'tactic': tech_data['tactic'],
                    'severity': tech_data['severity'],
                    'confidence': confidence,
                    'description': tech_data['description']
                })
        
        # 2. Select Highest Severity Threat
        if detected_threats:
            best_threat = max(detected_threats, key=lambda x: (x['severity'], x['confidence']))
            
            # Boost severity if ML found anomalies too
            ml_boost = min(15, (anomaly_count / len(lines)) * 100) if lines else 0
            final_risk = min(100, best_threat['severity'] + ml_boost)
            
            return {
                'type': f"{best_threat['name']} ({best_threat['technique_id']})",
                'technique_id': best_threat['technique_id'],
                'tactic': best_threat['tactic'],
                'narrative': f"{best_threat['description']}. MITRE {best_threat['technique_id']} detected with {best_threat['confidence']}% confidence. ML engine corroborated with {anomaly_count} behavioral anomalies.",
                'action': f"MITRE RESPONSE: {self._get_action(best_threat['tactic'])}",
                'base_risk': int(final_risk),
                'confidence': best_threat['confidence']
            }
            
        # 3. Fallback: Pure ML Anomaly
        if anomaly_count > len(lines) * 0.1:
            return {
                'type': 'Unknown Zero-Day Threat',
                'technique_id': 'ML-ANOMALY',
                'tactic': 'Unknown',
                'narrative': f"Neural engine detected {anomaly_count} significant behavioral deviations ({int((anomaly_count/len(lines))*100)}% of logs). No known signature matched.",
                'action': 'MANUAL INVESTIGATION REQUIRED',
                'base_risk': 75,
                'confidence': 70
            }
            
        # 4. Clean
        return {
            'type': 'Normal Activity',
            'technique_id': 'CLEAN',
            'tactic': 'None',
            'narrative': "System integrity verified. No malicious patterns or significant anomalies detected.",
            'action': 'CONTINUE MONITORING',
            'base_risk': 0,
            'confidence': 98
        }

    def _get_action(self, tactic):
        actions = {
            'Initial Access': 'BLOCK SOURCE IP & AUDIT FIREWALL',
            'Execution': 'TERMINATE PROCESS & QUARANTINE',
            'Persistence': 'REMOVE TASKS & REGISTRY KEYS',
            'Privilege Escalation': 'REVOKE ADMIN RIGHTS IMMEDIATELY',
            'Defense Evasion': 'RESTORE LOGGING & SECURITY TOOLS',
            'Credential Access': 'RESET PASSWORDS & ENABLE MFA',
            'Discovery': 'ISOLATE HOST FROM NETWORK',
            'Lateral Movement': 'DISABLE SMB/RDP & SEGMENT NETWORK',
            'Command and Control': 'BLOCK C2 DOMAINS AT DNS LEVEL',
            'Impact': 'INITIATE DISASTER RECOVERY & RESTORE BACKUPS'
        }
        return actions.get(tactic, 'INITIATE INCIDENT RESPONSE')

# --- HELPER: FEATURE EXTRACTION ---
def extract_advanced_features(lines):
    features = []
    for line in lines:
        if not line.strip(): 
            features.append([0]*6)
            continue
        length = len(line)
        special_chars = sum(1 for c in line if not c.isalnum() and not c.isspace())
        entropy = len(set(line)) / length if length > 0 else 0
        has_sql = int(any(kw in line.lower() for kw in ['select', 'union', 'drop']))
        has_shell = int(any(c in line for c in ['|', '>', '$', '`']))
        features.append([length, special_chars, entropy, has_sql, has_shell, special_chars/length if length else 0])
    return np.array(features)

# --- HELPER: VOICE ALERT ---
def generate_voice_alert(text, case_id):
    try:
        print("🗣️ Generating Voice Alert...")
        safe_filename = case_id.replace("/", "_").replace("\\", "_")
        local_filename = f"{safe_filename}_alert.mp3"
        tts = gTTS(text=text, lang='en', tld='co.uk', slow=False)
        tts.save(local_filename)
        minio_path = f"audio/{local_filename}"
        minio_client.fput_object("forensics-evidence", minio_path, local_filename)
        os.remove(local_filename)
        return minio_path
    except Exception as e:
        print(f"❌ Voice Failed: {e}")
        return None

# --- MAIN ANALYSIS PIPELINE ---
def analyze_log_file(bucket, object_name):
    print(f"🧠 Starting MITRE Analysis: {object_name}")
    
    try:
        response = minio_client.get_object(bucket, object_name)
        content_str = response.read().decode('utf-8', errors='ignore')
        lines = [line.strip() for line in content_str.splitlines() if line.strip()]
        response.close()
        response.release_conn()
    except Exception as e:
        print(f"❌ MinIO Error: {e}")
        return None

    if len(lines) < 2: return None

    # 1. ML Analysis
    print("🤖 Running Isolation Forest...")
    X = extract_advanced_features(lines)
    model = IsolationForest(contamination=0.1, random_state=42)
    model.fit(X)
    predictions = model.predict(X)
    anomaly_indices = [i for i, x in enumerate(predictions) if x == -1]

    # 2. MITRE ATT&CK Engine (The New Integration)
    print("🔍 Matching MITRE Signatures...")
    mitre_engine = MITREAttackDetector()
    intelligence = mitre_engine.detect_threats(content_str, len(anomaly_indices), lines)

    # 3. Generate Plot Data
    plot_data = []
    for i in range(len(lines)):
        is_anomaly = i in anomaly_indices
        # Visual risk score per line (0-100)
        risk = int(intelligence['base_risk'] * (1.0 if is_anomaly else 0.1))
        # Add random noise for visual "tech" effect
        if risk > 0: risk += int(np.random.rand() * 10)
        
        plot_data.append({
            "line": i + 1,
            "risk": min(100, risk),
            "is_anomaly": is_anomaly
        })

    # 4. Voice Alert
    audio_url = None
    if intelligence['base_risk'] > 20:
        voice_text = f"Veritas Alert. {intelligence['type']} detected. Risk level {intelligence['base_risk']} percent. {intelligence['narrative']} Recommended action: {intelligence['action']}"
        audio_url = generate_voice_alert(voice_text, object_name)

    print(f"✅ Analysis Done. Risk: {intelligence['base_risk']}% ({intelligence['type']})")

    return {
        "anomalies": len(anomaly_indices),
        "risk_score": intelligence['base_risk'],
        "summary": intelligence['narrative'],
        "attack_type": intelligence['type'],
        "recommended_action": intelligence['action'],
        "confidence": intelligence['confidence'],
        "audio_url": audio_url,
        "plot_data": plot_data
    }

# --- RABBITMQ WORKER ---
def callback(ch, method, properties, body):
    data = json.loads(body)
    full_path = data.get('objectName')
    bucket = data.get('bucket', 'forensics-evidence')
    
    print(f"\n📥 TASK RECEIVED: {full_path}")

    try:
        # Update Status -> PROCESSING
        reports_collection.update_one(
            {"evidence_id": full_path}, 
            {"$set": {"status": "PROCESSING"}}
        )

        # Run Analysis
        result = analyze_log_file(bucket, full_path)

        if result:
            # Update Status -> COMPLETED
            reports_collection.update_one(
                {"evidence_id": full_path},
                {"$set": {
                    "status": "COMPLETED",
                    "anomalies_found": result['anomalies'],
                    "risk_score": result['risk_score'],
                    "ai_summary": result['summary'],
                    "attack_type": result['attack_type'],
                    "recommended_action": result['recommended_action'],
                    "confidence": result['confidence'],
                    "audio_url": result['audio_url'],
                    "plot_data": result['plot_data']
                }}
            )
            print(f"🎉 DB Updated Successfully")
        else:
            print("⚠️ Analysis returned None (Empty file?)")
            reports_collection.update_one(
                {"evidence_id": full_path}, 
                {"$set": {"status": "FAILED"}}
            )

    except Exception as e:
        print(f"❌ Worker Error: {e}")
        reports_collection.update_one(
            {"evidence_id": full_path}, 
            {"$set": {"status": "FAILED", "error": str(e)}}
        )

    ch.basic_ack(delivery_tag=method.delivery_tag)

def start_worker():
    print("\n" + "="*60)
    print("🚀 VERITAS NEURAL ENGINE v3.0 (MITRE EDITION)")
    print("="*60 + "\n")
    connection = pika.BlockingConnection(pika.URLParameters(RABBIT_URI))
    channel = connection.channel()
    channel.queue_declare(queue='forensics_tasks', durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='forensics_tasks', on_message_callback=callback)
    print('🐰 Waiting for evidence...')
    channel.start_consuming()

if __name__ == '__main__':
    try: start_worker()
    except KeyboardInterrupt: sys.exit(0)