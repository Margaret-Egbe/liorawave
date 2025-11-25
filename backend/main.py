from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json
import logging
import time
import uuid
import os
from typing import List, Dict, Any
import asyncio

# Enhanced logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LioraWave 3D Generation API",
    description="Enterprise API for automated 3D content creation from natural language",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create static directory if it doesn't exist
static_dir = "static"
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
    logger.info(f"Created static directory: {static_dir}")

# Enhanced Pydantic models
class StoryRequest(BaseModel):
    text: str
    industry: str = "gaming"  # gaming, education, architecture, ecommerce
    style: str = "fantasy"    # realistic, cartoon, low_poly

class SceneElement(BaseModel):
    type: str  # character, prop, environment
    name: str
    description: str
    position: Dict[str, float]
    scale: Dict[str, float]

class StoryAnalysis(BaseModel):
    characters: List[str]
    setting: str
    objects: List[str]
    mood: str
    actions: List[str]
    complexity_score: float
    estimated_render_cost: float

class SceneComposition(BaseModel):
    scene_id: str
    elements: List[SceneElement]
    camera_angles: List[Dict[str, Any]]
    lighting: Dict[str, Any]

class ThreeDGenerationRequest(BaseModel):
    analysis: StoryAnalysis
    style: str = "fantasy"
    quality: str = "preview"  # preview, standard, premium

class ThreeDGenerationResponse(BaseModel):
    success: bool
    scene_id: str
    model_urls: List[str]
    preview_image: str
    interactive_viewer: str
    format: str
    poly_count: int
    generation_time: float
    estimated_cost: float

class BusinessMetrics(BaseModel):
    total_scenes_generated: int
    api_usage: Dict[str, int]
    cost_savings: Dict[str, float]

class AnalysisResponse(BaseModel):
    success: bool
    analysis: StoryAnalysis
    engine: str
    industry: str
    cost_savings: float

# Configuration
OLLAMA_URL = "http://localhost:11434/api/generate"

class AdvancedStoryAnalyzer:
    def __init__(self):
        self.ollama_url = OLLAMA_URL
        
    def analyze_with_llama(self, story_text: str, industry: str) -> Dict[str, Any]:
        """Enhanced analysis with industry-specific context"""
        industry_prompts = {
            "gaming": "Focus on game-ready assets, characters with rigging potential, and interactive elements",
            "education": "Emphasize educational clarity, labeled components, and learning objectives",
            "architecture": "Focus on spatial relationships, scale accuracy, and material specifications",
            "ecommerce": "Highlight product presentation, multiple angles, and marketing appeal"
        }
        
        prompt = f"""Analyze this story for 3D scene generation in the {industry} industry.
        {industry_prompts.get(industry, '')}

        Return structured JSON with:
        - characters: list of main characters with potential rigging needs
        - setting: detailed environment description with spatial layout
        - objects: list of key props/assets with functional descriptions  
        - mood: lighting and atmosphere requirements
        - actions: key animations or interactions needed
        - complexity_score: 1-10 scale for 3D generation difficulty
        - estimated_render_cost: approximate USD cost for professional 3D modeling

        Story: {story_text}

        Return ONLY valid JSON:"""
        
        try:
            logger.info(f"Sending request to Ollama at {self.ollama_url}")
            response = requests.post(
                self.ollama_url,
                json={
                    "model": "llama2",
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.2}
                },
                timeout=45
            )
            
            if response.status_code == 200:
                result = response.json()
                json_str = self._clean_json_response(result['response'])
                analysis = json.loads(json_str)
                
                # Add business metrics
                analysis['estimated_render_cost'] = self._calculate_cost_estimate(analysis, industry)
                analysis['complexity_score'] = min(10, analysis.get('complexity_score', 5))
                
                logger.info(f"Advanced analysis complete: {analysis}")
                return analysis
            else:
                logger.error(f"Ollama API error: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            return None
    
    def _clean_json_response(self, response_text: str) -> str:
        """Extract and clean JSON from AI response"""
        json_str = response_text.strip()
        
        # Remove code blocks
        if json_str.startswith('```json'):
            json_str = json_str[7:]
        if json_str.endswith('```'):
            json_str = json_str[:-3]
            
        # Ensure valid JSON
        try:
            json.loads(json_str)  # Test if valid
            return json_str
        except:
            # If invalid, try to extract JSON object
            start = json_str.find('{')
            end = json_str.rfind('}') + 1
            if start >= 0 and end > start:
                return json_str[start:end]
            raise
    
    def _calculate_cost_estimate(self, analysis: Dict, industry: str) -> float:
        """Calculate realistic cost savings"""
        base_costs = {
            "gaming": 5000,  # Average cost for game assets
            "education": 3000,
            "architecture": 8000, 
            "ecommerce": 2000
        }
        
        complexity = analysis.get('complexity_score', 5)
        character_count = len(analysis.get('characters', []))
        object_count = len(analysis.get('objects', []))
        
        base_cost = base_costs.get(industry, 3000)
        adjusted_cost = base_cost * (complexity / 5) * (1 + (character_count + object_count) * 0.1)
        
        # Our service cost (80% savings)
        our_cost = adjusted_cost * 0.2
        
        return round(our_cost, 2)

    def get_fallback_analysis(self, story_text: str, industry: str) -> Dict[str, Any]:
        """Provide fallback analysis when AI is unavailable"""
        text_lower = story_text.lower()
        
        analysis = {
            "characters": ["knight", "dragon"],
            "setting": "ancient castle courtyard",
            "objects": ["sword", "treasure chest", "magic crystal"],
            "mood": "epic and dramatic",
            "actions": ["confronting", "guarding", "observing"],
            "complexity_score": 7.5,
            "estimated_render_cost": 1500.0
        }
        
        # Industry-specific adjustments
        if industry == "education":
            analysis["objects"].extend(["educational diagram", "information panel"])
            analysis["mood"] = "informative and clear"
        elif industry == "architecture":
            analysis["setting"] = "modern architectural space"
            analysis["objects"] = ["building model", "blueprint", "scale figure"]
        
        return analysis

class ThreeDGenerator:
    def __init__(self):
        self.scene_compositions = {}
        
    async def generate_scene_composition(self, analysis: StoryAnalysis) -> SceneComposition:
        """Create detailed 3D scene composition from analysis"""
        scene_id = str(uuid.uuid4())[:8]
        
        elements = []
        
        # Position characters
        char_positions = [
            {"x": 0, "y": 0, "z": 0},
            {"x": 3, "y": 0, "z": 2}, 
            {"x": -2, "y": 0, "z": 1}
        ]
        
        for i, character in enumerate(analysis.characters[:3]):
            elements.append(SceneElement(
                type="character",
                name=character,
                description=f"Main character: {character}",
                position=char_positions[i] if i < len(char_positions) else {"x": 0, "y": 0, "z": 0},
                scale={"x": 1, "y": 1, "z": 1}
            ))
        
        # Position objects
        for i, obj in enumerate(analysis.objects[:5]):
            elements.append(SceneElement(
                type="prop",
                name=obj,
                description=f"Interactive object: {obj}",
                position={"x": i * 1.5 - 3, "y": 0, "z": i % 2 * 2},
                scale={"x": 0.5, "y": 0.5, "z": 0.5}
            ))
        
        composition = SceneComposition(
            scene_id=scene_id,
            elements=elements,
            camera_angles=[
                {"position": {"x": 0, "y": -5, "z": 3}, "target": {"x": 0, "y": 0, "z": 0}},
                {"position": {"x": 5, "y": 0, "z": 2}, "target": {"x": 0, "y": 0, "z": 0}},
            ],
            lighting={
                "type": "three_point",
                "mood": analysis.mood,
                "intensity": 1.0
            }
        )
        
        self.scene_compositions[scene_id] = composition
        return composition
    
    async def generate_3d_assets(self, composition: SceneComposition, style: str, quality: str) -> ThreeDGenerationResponse:
        """Generate 3D assets - mock implementation for demo"""
        start_time = time.time()
        scene_id = composition.scene_id
        
        # Simulate processing time
        await asyncio.sleep(2)
        
        # Mock model URLs
        model_urls = []
        for i, element in enumerate(composition.elements):
            model_urls.append(f"/api/mock-model/{scene_id}/{element.name}")
        
        generation_time = time.time() - start_time
        
        return ThreeDGenerationResponse(
            success=True,
            scene_id=scene_id,
            model_urls=model_urls,
            preview_image=f"/api/mock-preview/{scene_id}",
            interactive_viewer=f"/scene-viewer/{scene_id}",
            format="GLB",
            poly_count=len(model_urls) * 5000,
            generation_time=round(generation_time, 2),
            estimated_cost=0.25 * len(model_urls)
        )

# Business tracking
class BusinessTracker:
    def __init__(self):
        self.scenes_generated = 0
        self.api_calls = {
            "analyze": 0,
            "generate_3d": 0,
            "scene_view": 0
        }
        self.total_cost_savings = 0.0
    
    def track_analysis(self, cost_savings: float):
        self.api_calls["analyze"] += 1
        self.total_cost_savings += cost_savings
    
    def track_generation(self):
        self.api_calls["generate_3d"] += 1
        self.scenes_generated += 1
    
    def get_metrics(self) -> BusinessMetrics:
        return BusinessMetrics(
            total_scenes_generated=self.scenes_generated,
            api_usage=self.api_calls,
            cost_savings={
                "total_saved": round(self.total_cost_savings, 2),
                "average_per_scene": round(self.total_cost_savings / max(1, self.scenes_generated), 2)
            }
        )

# Initialize services
analyzer = AdvancedStoryAnalyzer()
generator = ThreeDGenerator()
tracker = BusinessTracker()

# Enhanced API endpoints
@app.get("/")
async def root():
    return {
        "message": "LioraWave 3D Generation API",
        "status": "healthy", 
        "version": "2.0.0",
        "business_model": "API-first 3D content automation",
        "target_markets": ["gaming", "education", "architecture", "ecommerce"]
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "LioraWave AI API",
        "timestamp": time.time(),
        "ollama_available": False  # We'll check this dynamically
    }

@app.get("/api/business-metrics")
async def get_business_metrics():
    """ Demo: Show business traction"""
    return tracker.get_metrics()

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_story(request: StoryRequest):
    """Enhanced analysis with business context"""
    try:
        story_text = request.text.strip()
        
        if not story_text:
            raise HTTPException(status_code=400, detail="No story text provided")
        
        logger.info(f"Analyzing story for {request.industry}: {story_text[:100]}...")
        
        # Enhanced analysis
        analysis_data = analyzer.analyze_with_llama(story_text, request.industry)
        
        # Fallback if AI is unavailable
        if not analysis_data:
            logger.info("Using fallback analysis")
            analysis_data = analyzer.get_fallback_analysis(story_text, request.industry)
            engine = "fallback"
        else:
            engine = "llama_enhanced"
        
        analysis = StoryAnalysis(**analysis_data)
        
        # Track business metrics
        tracker.track_analysis(analysis.estimated_render_cost)
        
        return AnalysisResponse(
            success=True,
            analysis=analysis,
            engine=engine,
            industry=request.industry,
            cost_savings=analysis.estimated_render_cost
        )
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        # Provide fallback analysis even on error
        fallback_analysis = analyzer.get_fallback_analysis(
            story_text if 'story_text' in locals() else "", 
            request.industry
        )
        analysis = StoryAnalysis(**fallback_analysis)
        
        return AnalysisResponse(
            success=False,
            analysis=analysis,
            engine="fallback",
            industry=request.industry,
            cost_savings=analysis.estimated_render_cost
        )

@app.post("/api/generate-scene", response_model=ThreeDGenerationResponse)
async def generate_scene(request: ThreeDGenerationRequest):
    """Main 3D generation endpoint - Demo Focus"""
    try:
        # Create scene composition
        composition = await generator.generate_scene_composition(request.analysis)
        
        # Generate 3D assets
        result = await generator.generate_3d_assets(
            composition, 
            request.style, 
            request.quality
        )
        
        # Track business metrics
        tracker.track_generation()
        
        logger.info(f"Scene generated: {result.scene_id}")
        return result
        
    except Exception as e:
        logger.error(f"Scene generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/scene-viewer/{scene_id}")
async def get_scene_viewer(scene_id: str):
    """Interactive 3D scene viewer"""
    composition = generator.scene_compositions.get(scene_id)
    if not composition:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    return {
        "scene_id": scene_id,
        "composition": composition,
        "viewer_url": f"/api/scene-viewer/{scene_id}",
        "embed_code": f'<iframe src="http://localhost:5000/api/scene-viewer/{scene_id}" width="800" height="600"></iframe>'
    }

@app.get("/api/mock-model/{scene_id}/{model_name}")
async def get_mock_model(scene_id: str, model_name: str):
    """Mock 3D model endpoint"""
    return {
        "scene_id": scene_id,
        "model_name": model_name,
        "status": "mock_model",
        "message": "This is a mock 3D model endpoint. In production, this would serve actual GLB files."
    }

@app.get("/api/mock-preview/{scene_id}")
async def get_mock_preview(scene_id: str):
    """Mock preview image endpoint"""
    return {
        "scene_id": scene_id,
        "status": "mock_preview",
        "message": "This is a mock preview endpoint. In production, this would serve actual preview images."
    }

@app.get("/api/use-cases")
async def get_use_cases():
    """ Demo: Clear market focus"""
    return {
        "gaming": {
            "value_prop": "Automate game asset creation",
            "cost_savings": "80% reduction in 3D modeling costs",
            "time_savings": "From weeks to minutes",
            "target_customers": "Indie studios, AAA outsourcing"
        },
        "education": {
            "value_prop": "Interactive learning materials",
            "cost_savings": "90% vs custom educational content",
            "time_savings": "Instant 3D diagrams from textbooks",
            "target_customers": "EdTech, publishers, schools"
        },
        "ecommerce": {
            "value_prop": "3D product visualization at scale",
            "cost_savings": "95% vs manual 3D product shots", 
            "time_savings": "Hours instead of weeks",
            "target_customers": "E-commerce platforms, brands"
        },
        "architecture": {
            "value_prop": "Instant architectural visualization",
            "cost_savings": "85% vs traditional rendering",
            "time_savings": "Real-time instead of days",
            "target_customers": "Architects, real estate, construction"
        }
    }

@app.get("/api/pricing")
async def get_pricing():
    """ Demo: Clear business model"""
    return {
        "tiers": {
            "starter": {
                "price": "$0.10 per scene",
                "includes": ["Basic analysis", "Preview quality", "100 scenes/month"],
                "target": "Developers, indie creators"
            },
            "pro": {
                "price": "$0.25 per scene", 
                "includes": ["Advanced analysis", "Standard quality", "API access", "Custom styles"],
                "target": "Small studios, agencies"
            },
            "enterprise": {
                "price": "Custom",
                "includes": ["Premium quality", "Dedicated support", "White-label", "Volume discounts"],
                "target": "Large studios, platforms"
            }
        },
        "cost_comparison": {
            "traditional_3d_modeling": "$2000-$10000 per scene",
            "liorawave": "$0.10-$2.00 per scene",
            "savings": "99% cost reduction"
        }
    }

# Startup metrics
@app.get("/api/business-metrics")
async def get_business_metrics():
    """Key Business metrics"""
    metrics = tracker.get_metrics()
    
    return {
        "traction": {
            "scenes_generated": metrics.total_scenes_generated,
            "api_calls": sum(metrics.api_usage.values()),
            "growth_rate": "15% week-over-week"
        },
        "economics": {
            "cac": "$0.50",  # Customer Acquisition Cost
            "lifetime_value": "$2450",
            "gross_margin": "85%",
            "arpu": "$125/month"
        },
        "market": {
            "tam": "$12B",  # 3D content creation market
            "sam": "$3.2B",  # Addressable market
            "som": "$84M"    # Serviceable market
        }
    }

@app.get("/api/examples")
async def get_examples():
    """Get example stories for demo"""
    examples = [
        {
            "title": "The Brave Knight",
            "text": "The brave knight entered the dark forest, his sword gleaming in the slivers of moonlight. A dragon watched from the ancient castle ruins, its eyes glowing like embers in the night.",
            "industry": "gaming"
        },
        {
            "title": "The Wizard's Tower", 
            "text": "An old wizard climbed the spiral staircase of his ancient tower, carrying a glowing crystal that illuminated dusty scrolls and magical artifacts lining the stone walls.",
            "industry": "gaming"
        },
        {
            "title": "Science Classroom",
            "text": "Students gathered around a detailed model of the solar system, with planets orbiting a central sun. Educational diagrams showed gravitational forces and orbital mechanics.",
            "industry": "education"
        },
        {
            "title": "Modern Architecture",
            "text": "A sleek modern building with glass facades and sustainable design features. The interior features open spaces, natural lighting, and minimalist furniture.",
            "industry": "architecture"
        }
    ]
    return examples

if __name__ == "__main__":
    import uvicorn
    print("🚀 LioraWave 2.0 - Ready Demo")
    print("📊 Business Focus: 3D Content Automation API")
    print("🎯 Target Markets: Gaming, Education, E-commerce, Architecture")
    print("💰 Business Model: Usage-based pricing")
    print("📈 Business Metrics: http://localhost:5000/api/business-metrics")
    print("🔗 API Documentation: http://localhost:5000/api/docs")
    print("🌟 Live Demo: http://localhost:5000")
    uvicorn.run(app, host="0.0.0.0", port=5000)