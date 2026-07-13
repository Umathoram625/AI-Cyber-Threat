import json
import logging
import random
from datetime import datetime
from openai import AsyncOpenAI
from app.config import settings
from app.database import db_instance

logger = logging.getLogger(__name__)

# Fallback structures for Threat Analysis
FALLBACK_THREAT_RULES = [
    {
        "keywords": ["ransomware", "encrypt", "lockbit", "clop", "blackcat"],
        "attack_type": "Ransomware",
        "severity": "Critical",
        "risk_score_range": (85, 98),
        "mitre_mapping": "T1486 (Data Encrypted for Impact), T1490 (Inhibit System Recovery)",
        "preventive_actions": [
            "Maintain offline, immutable backups of all critical data and test restores regularly.",
            "Enforce strict Multi-Factor Authentication (MFA) across all remote access vectors.",
            "Deploy Endpoint Detection and Response (EDR) agents to detect encryption behaviors.",
            "Restrict access to Remote Desktop Protocol (RDP) and close unnecessary public-facing ports."
        ],
        "summary_template": "An active ransomware threat has been identified targeting systems with data encryption. Organizations are advised to verify backup configurations and enforce access control policies immediately."
    },
    {
        "keywords": ["phishing", "email", "credential harvesting", "spear", "bec"],
        "attack_type": "Phishing",
        "severity": "High",
        "risk_score_range": (70, 85),
        "mitre_mapping": "T1566 (Phishing), T1566.001 (Spearphishing Attachment)",
        "preventive_actions": [
            "Implement email authentication protocols (SPF, DKIM, and DMARC) to block spoofing.",
            "Run continuous cybersecurity awareness training and phishing simulations for employees.",
            "Implement browser-level URL filtering to block known malicious credential harvesting sites.",
            "Enforce MFA with FIDO2/WebAuthn keys to mitigate credential theft impact."
        ],
        "summary_template": "A widespread phishing and credential-harvesting campaign has been detected. Attackers use social engineering emails with malicious links or attachments to compromise user accounts."
    },
    {
        "keywords": ["vulnerability", "cve-", "exploit", "zero-day", "rce", "remote code"],
        "attack_type": "Vulnerability Exploit",
        "severity": "Critical",
        "risk_score_range": (88, 100),
        "mitre_mapping": "T1190 (Exploit Public-Facing Application), T1203 (Exploitation for Client Execution)",
        "preventive_actions": [
            "Scan internal and external networks to identify vulnerable assets and apply patches immediately.",
            "Deploy Web Application Firewalls (WAF) and Intrusion Prevention Systems (IPS) with signatures.",
            "Implement network segmentation to contain lateral movement if the application is compromised.",
            "Disable unnecessary services and minimize the attack surface of public-facing endpoints."
        ],
        "summary_template": "A critical vulnerability exploit vector (RCE/Zero-day) has been reported in active use. Immediate patching or network-level mitigations are recommended to prevent unauthorized remote compromise."
    },
    {
        "keywords": ["sql injection", "sqli", "cross-site scripting", "xss", "owasp", "injection"],
        "attack_type": "Web Application Attack",
        "severity": "High",
        "risk_score_range": (70, 82),
        "mitre_mapping": "T1190 (Exploit Public-Facing Application)",
        "preventive_actions": [
            "Use parameterized queries or prepared statements in database interactions.",
            "Implement robust input validation and context-aware output encoding.",
            "Conduct regular web application security scans and static application security testing (SAST).",
            "Follow secure coding standards such as the OWASP Top 10 guidelines."
        ],
        "summary_template": "A web application vulnerability exploit attempt, such as SQL Injection or Cross-Site Scripting, has been detected. Developers should audit codebases for parameterized queries and sanitize user inputs."
    },
    {
        "keywords": ["ddos", "denial of service", "botnet", "mirai", "flooding"],
        "attack_type": "DDoS",
        "severity": "Medium",
        "risk_score_range": (50, 70),
        "mitre_mapping": "T1498 (Network Denial of Service)",
        "preventive_actions": [
            "Deploy a cloud-based DDoS mitigation service to absorb and filter traffic spikes.",
            "Configure rate-limiting policies on web servers, load balancers, and reverse proxies.",
            "Work with Internet Service Providers (ISPs) to configure upstream blackhole routing.",
            "Implement auto-scaling infrastructure to handle temporary spikes in bandwidth demand."
        ],
        "summary_template": "A Distributed Denial of Service (DDoS) incident or active botnet propagation has been detected, causing high traffic spikes and potential service disruption."
    },
    {
        "keywords": ["breach", "leak", "compromise", "stolen", "exfiltrate", "dump"],
        "attack_type": "Data Exfiltration",
        "severity": "High",
        "risk_score_range": (75, 90),
        "mitre_mapping": "T1048 (Exfiltration Over Alternative Protocol), T1114 (Email Collection)",
        "preventive_actions": [
            "Implement strict Data Loss Prevention (DLP) policies to monitor outward traffic.",
            "Encrypt sensitive database tables and files at rest using AES-256 standard.",
            "Review access logs for unauthorized file transfers or high-volume API requests.",
            "Restrict outbound communication ports and block unauthorized file-sharing sites."
        ],
        "summary_template": "A major security breach has resulted in data leakage and potential exposure of customer or corporate records. Organizations must audit access credentials and secure exfiltration routes."
    }
]

DEFAULT_THREAT_RULE = {
    "attack_type": "Cyber Intrusion",
    "severity": "Medium",
    "risk_score_range": (45, 65),
    "mitre_mapping": "T1059 (Command and Scripting Interpreter)",
    "preventive_actions": [
        "Audit system and access logs for unusual administrative activities.",
        "Implement network segmentation to contain potential threats.",
        "Ensure all operating systems and software versions are kept up to date."
    ],
    "summary_template": "An anomalous cyber incident has been logged. Security operations teams are advised to monitor core network assets and audit endpoint configurations."
}

INDUSTRIES = ["Finance", "Healthcare", "Government", "Energy", "Technology", "Retail", "Education", "Critical Infrastructure"]

class AIService:
    @staticmethod
    def _get_fallback_analysis(title: str, description: str) -> dict:
        text = (title + " " + description).lower()
        matched_rule = DEFAULT_THREAT_RULE
        
        for rule in FALLBACK_THREAT_RULES:
            if any(keyword in text for keyword in rule["keywords"]):
                matched_rule = rule
                break
                
        risk_score = random.randint(*matched_rule["risk_score_range"])
        
        # Industry Target assignment
        target_industry = "General"
        for ind in INDUSTRIES:
            if ind.lower() in text:
                target_industry = ind
                break
        if target_industry == "General":
            target_industry = random.choice(INDUSTRIES)
            
        # Summary generator
        summary = matched_rule["summary_template"]
        if "cve-" in text:
            # Extract CVEs
            import re
            cves = re.findall(r"cve-\d{4}-\d{4,7}", text)
            if cves:
                summary = f"Analysis of {', '.join(cves).upper()}: " + summary

        return {
            "ai_summary": f"{summary}\n\nThis incident highlights risk to {target_industry} targets.",
            "severity": matched_rule["severity"],
            "attack_type": matched_rule["attack_type"],
            "industry_target": target_industry,
            "risk_score": risk_score,
            "preventive_actions": matched_rule["preventive_actions"],
            "mitre_attack_mapping": matched_rule["mitre_mapping"]
        }

    @classmethod
    async def analyze_threat(cls, title: str, description: str) -> dict:
        if not settings.OPENAI_API_KEY:
            logger.info("OpenAI API key missing. Falling back to Local Rule-Based NLP analyzer.")
            return cls._get_fallback_analysis(title, description)
            
        try:
            client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url="https://openrouter.ai/api/v1"
            )
            prompt = f"""
            Analyze the following cyber threat intel item and generate a structured JSON object.
            
            Title: {title}
            Description: {description}
            
            JSON format required:
            {{
                "ai_summary": "detailed summary explaining what the threat is, its mechanics, and potential impact",
                "severity": "Critical" or "High" or "Medium" or "Low",
                "attack_type": "Ransomware" or "Phishing" or "Vulnerability Exploit" or "DDoS" or "Data Exfiltration" or "Web Application Attack" etc,
                "industry_target": "Finance" or "Healthcare" or "Government" or "Energy" or "Technology" or "General" etc.,
                "risk_score": Integer between 0 and 100 representing overall threat risk,
                "preventive_actions": [
                    "action item 1",
                    "action item 2",
                    "action item 3",
                    "action item 4"
                ],
                "mitre_attack_mapping": "MITRE ATT&CK technique reference like T1486 (Data Encrypted for Impact)"
            }}
            Return ONLY the valid JSON block.
            """
            
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                timeout=15.0
            )

            content = response.choices[0].message.content
            # Strip markdown code fences if present
            content = content.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            result = json.loads(content)
            return result
        except Exception as e:
            logger.error(f"OpenAI Threat Analysis failed: {e}. Utilizing local rule-based fallback.")
            return cls._get_fallback_analysis(title, description)

    @classmethod
    async def get_chatbot_response(cls, user_query: str, session_history: list = None) -> str:
        # 1. Search DB for relevant context (only titles + short summaries)
        context_items = []
        if db_instance.threats is not None:
            try:
                cursor = db_instance.threats.find(
                    {"$text": {"$search": user_query}},
                    {"score": {"$meta": "textScore"}}
                ).sort([("score", {"$meta": "textScore"})]).limit(3)

                async for document in cursor:
                    context_items.append(
                        f"- {document['title']} (Severity: {document['severity']}, Type: {document['threat_type']})"
                    )
            except Exception as ex:
                logger.warning(f"Error reading context from DB: {ex}")

        context_str = "\n".join(context_items) if context_items else None

        # 2. Call OpenAI or Fallback
        if not settings.OPENAI_API_KEY:
            return cls._generate_mock_chat_response(user_query, context_str)

        try:
            client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url="https://openrouter.ai/api/v1"
            )

            system_prompt = (
                "You are a concise AI Cyber Threat Intelligence Assistant. "
                "Answer ONLY what the user specifically asks about. "
                "Use the conversation history to understand follow-up questions and references to previous topics. "
                "Do not mention unrelated attack types or topics. "
                "Keep responses focused, clear, and under 150 words unless more detail is explicitly requested."
            )
            if context_str:
                system_prompt += f"\n\nRelevant threats from the database:\n{context_str}"

            messages = [{"role": "system", "content": system_prompt}]

            # Append full prior conversation history
            if session_history:
                for msg in session_history[-20:]:
                    messages.append({"role": msg["role"], "content": msg["content"]})

            # Current user query goes last
            messages.append({"role": "user", "content": user_query})

            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                timeout=20.0
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI Chatbot failed: {e}. Reverting to local rule-based responses.")
            return cls._generate_mock_chat_response(user_query, context_str)

    @classmethod
    def _generate_mock_chat_response(cls, query: str, context_str: str) -> str:
        q = query.lower()
        db_note = f"**Related threats found:**\n{context_str}\n\n" if context_str else ""

        if "ransomware" in q or "lockbit" in q or "clop" in q:
            return db_note + (
                "**Ransomware** encrypts victim files and demands payment for decryption. "
                "Modern variants use double extortion — stealing data before encrypting it.\n\n"
                "**Key mitigations:** Maintain offline backups, enforce MFA, deploy EDR, restrict RDP access."
            )
        elif "phishing" in q or "spear" in q:
            return db_note + (
                "**Phishing** tricks users into revealing credentials or installing malware via fake emails or messages.\n\n"
                "**Key mitigations:** Enable SPF/DKIM/DMARC, train employees, enforce MFA."
            )
        elif "sql injection" in q or "sqli" in q:
            return db_note + (
                "**SQL Injection** inserts malicious SQL into input fields to manipulate databases.\n\n"
                "**Key mitigations:** Use parameterized queries, validate inputs, deploy a WAF."
            )
        elif "zero-day" in q or "zero day" in q:
            return db_note + (
                "**Zero-day** exploits target unknown vulnerabilities before a patch exists.\n\n"
                "**Key mitigations:** Use behavioral EDR, apply virtual patching via WAF/IPS, enforce least privilege."
            )
        elif "ddos" in q or "denial of service" in q:
            return db_note + (
                "**DDoS** floods a target with traffic to cause service disruption.\n\n"
                "**Key mitigations:** Use a DDoS mitigation service, configure rate limiting, enable auto-scaling."
            )
        elif "cve" in q:
            return db_note + (
                "A **CVE** (Common Vulnerabilities and Exposures) is a publicly disclosed security flaw. "
                "Check NVD (nvd.nist.gov) for details and apply vendor patches immediately."
            )
        else:
            return (
                "I can help with specific cybersecurity topics such as ransomware, phishing, CVEs, "
                "zero-days, DDoS, or SQL injection. Please ask about a specific threat or attack type."
            )
