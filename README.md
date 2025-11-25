# 🚀 LioraWave - AI-Powered 3D Content Automation

Transform natural language into interactive 3D scenes instantly. LioraWave automates 3D content creation using AI, reducing production costs by **99%** and delivery time from **weeks to minutes**.  

---

## ✨ Features

- **AI-Powered Analysis:** Convert story descriptions into structured 3D scenes  
- **Multi-Industry Support:** Gaming, Education, E-commerce, Architecture  
- **Automated 3D Generation:** Scene composition with character/object placement  
- **Business Analytics:** Real-time cost tracking and savings metrics  
- **API-First Architecture:** Scalable enterprise-ready REST API  

---

## 🛠️ Quick Start

### Prerequisites

- Python 3.11+  
- Ollama (optional, for local AI processing)  

### Installation & Run

```bash
# Clone the repo
git clone https://github.com/your-username/liorawave.git
cd liorawave/backend

# Install dependencies
pip install fastapi uvicorn requests pydantic

# Start the API server
python main.py
```
The API will start at http://localhost:5000 with interactive docs at http://localhost:5000/api/docs.


📡 API Usage

``` python
import requests

response = requests.post(
    "http://localhost:5000/api/analyze",
    json={
        "text": "A brave knight confronts a dragon in ancient castle ruins",
        "industry": "gaming",
        "style": "fantasy"
    }
)

print(response.json())
```

Generate 3D Scene
``` python
scene = requests.post(
    "http://localhost:5000/api/generate-scene",
    json={
        "analysis": analysis_data,
        "style": "fantasy",
        "quality": "preview"
    }
)
```
🎯 Key Endpoints

| Endpoint                | Method | Description                           |
| ----------------------- | ------ | ------------------------------------- |
| `/api/analyze`          | POST   | Analyze story and extract 3D elements |
| `/api/generate-scene`   | POST   | Generate 3D scene from analysis       |
| `/api/business-metrics` | GET    | Platform analytics and cost savings   |
| `/api/use-cases`        | GET    | Industry-specific use cases           |
| `/api/pricing`          | GET    | Pricing tiers and business model      |

💰 Business Model

Pricing Tiers:

Starter: $0.10/scene (Basic analysis, Preview quality)

Pro: $0.25/scene (Advanced AI, Standard quality)

Enterprise: Custom (Premium quality, White-label)

Market Opportunity:

TAM: $12B (3D content creation market)

Cost Savings: 99% reduction vs traditional 3D modeling

🏗️ Architecture
Frontend (React) → FastAPI Backend → AI Analysis → 3D Generation
      ↓               ↓                  ↓             ↓
  3D Viewer      Business Analytics   Ollama LLM   Scene Composition

🚀 Deployment

Render YAML Example:
```
# render.yaml
services:
  - type: web
    name: liorawave-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```
Requirements.txt
```
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
requests==2.31.0
```
🎮 Try It Live

Start the server: python main.py

Visit: http://localhost:5000/api/docs

Example Stories:

Gaming: "A knight battles a dragon in a dark forest"

Education: "Solar system with orbiting planets"

Architecture: "Modern glass building with sustainable features"

📊 Demo 

This demo showcases:

✅ Technical Feasibility: AI-powered 3D content pipeline
✅ Business Model: Clear pricing and 99% cost savings
✅ Market Fit: Gaming, education, e-commerce, architecture
✅ Scalability: API-first architecture ready for enterprise

• Built with FastAPI
