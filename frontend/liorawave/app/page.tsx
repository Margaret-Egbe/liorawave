"use client"

import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'


// Enhanced interfaces
interface StoryAnalysis {
  characters: string[]
  setting: string
  objects: string[]
  mood: string
  actions: string[]
  complexity_score: number
  estimated_render_cost: number
}

interface ThreeDGenerationResponse {
  success: boolean
  scene_id: string
  model_urls: string[]
  preview_image: string
  interactive_viewer: string
  format: string
  poly_count: number
  generation_time: number
  estimated_cost: number
}

interface BusinessMetrics {
  total_scenes_generated: number
  api_usage: Record<string, number>
  cost_savings: Record<string, number>
}

interface UseCase {
  value_prop: string
  cost_savings: string
  time_savings: string
  target_customers: string
}

export default function LioraWaveDemo() {
  const [storyText, setStoryText] = useState('')
  const [industry, setIndustry] = useState('gaming')
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null)
  const [generationResult, setGenerationResult] = useState<ThreeDGenerationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null)
  const [useCases, setUseCases] = useState<Record<string, UseCase>>({})
  const [activeTab, setActiveTab] = useState('demo')
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)

  useEffect(() => {
    fetchBusinessMetrics()
    fetchUseCases()
    // Load default example
    setStoryText("A brave knight confronts a dragon in an ancient castle courtyard. The dragon guards a magical treasure chest while dark storm clouds gather overhead.")
  }, [])

  useEffect(() => {
    if (generationResult && canvasRef.current) {
      initThreeJSScene()
    }
  }, [generationResult])

  const fetchBusinessMetrics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/business-metrics')
      const data = await response.json()
      setBusinessMetrics(data)
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    }
  }

  const fetchUseCases = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/use-cases')
      const data = await response.json()
      setUseCases(data)
    } catch (err) {
      console.error('Failed to fetch use cases:', err)
    }
  }

  const analyzeAndGenerate = async () => {
    if (!storyText.trim()) {
      setError('Please enter a story')
      return
    }

    setLoading(true)
    setError('')
    setAnalysis(null)
    setGenerationResult(null)

    try {
      // Step 1: Analyze story
      const analysisResponse = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: storyText,
          industry: industry
        }),
      })

      if (!analysisResponse.ok) throw new Error('Analysis failed')
      const analysisData = await analysisResponse.json()
      setAnalysis(analysisData.analysis)

      // Step 2: Generate 3D scene
      const generationResponse = await fetch('http://localhost:5000/api/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: analysisData.analysis,
          style: 'fantasy',
          quality: 'preview'
        }),
      })

      if (!generationResponse.ok) throw new Error('3D generation failed')
      const generationData = await generationResponse.json()
      setGenerationResult(generationData)

      // Refresh business metrics
      fetchBusinessMetrics()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const initThreeJSScene = () => {
    if (!canvasRef.current) return

    // Clear existing scene
   if (sceneRef.current) {
  sceneRef.current.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      if (object.geometry) object.geometry.dispose()
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose())
        } else {
          object.material.dispose()
        }
      }
    }
  })
}


    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight)
    renderer.setClearColor(0x000000, 0)
    canvasRef.current.innerHTML = ''
    canvasRef.current.appendChild(renderer.domElement)

    // Add lights based on mood
    const ambientLight = new THREE.AmbientLight(0xffffff, analysis?.mood.includes('dark') ? 0.4 : 0.8)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Add simple geometry representing scene elements
    if (analysis) {
      // Add characters as colored spheres
      analysis.characters.forEach((char, index) => {
        const geometry = new THREE.SphereGeometry(0.5, 32, 32)
        const material = new THREE.MeshPhongMaterial({ 
          color: index === 0 ? 0x4CAF50 : 0xF44336 
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(index * 2 - 2, 0, 0)
        scene.add(mesh)
      })

      // Add objects as cubes
      analysis.objects.forEach((obj, index) => {
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3)
        const material = new THREE.MeshPhongMaterial({ color: 0x2196F3 })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(index * 1 - 1, 0.5, 1)
        scene.add(mesh)
      })

      // Add environment plane
      const planeGeometry = new THREE.PlaneGeometry(10, 10)
      const planeMaterial = new THREE.MeshPhongMaterial({ 
        color: analysis.setting.includes('forest') ? 0x388E3C : 0x795548,
        side: THREE.DoubleSide
      })
      const plane = new THREE.Mesh(planeGeometry, planeMaterial)
      plane.rotation.x = Math.PI / 2
      scene.add(plane)
    }

    camera.position.z = 5
    camera.position.y = 2

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    sceneRef.current = scene
  }

  const BusinessDashboard = () => (
    <div className="bg-gray-800 rounded-2xl p-6 border border-green-900/30">
      <h3 className="text-xl font-bold mb-4 text-green-400">🚀 Business Traction</h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-white">{businessMetrics?.total_scenes_generated || 0}</div>
          <div className="text-gray-400 text-sm">Scenes Generated</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-white">${businessMetrics?.cost_savings?.total_saved || 0}</div>
          <div className="text-gray-400 text-sm">Client Savings</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-white">99%</div>
          <div className="text-gray-400 text-sm">Cost Reduction</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-white">4</div>
          <div className="text-gray-400 text-sm">Target Industries</div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-lg">📈 Market Opportunity</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(useCases).map(([industry, useCase]) => (
            <div key={industry} className="bg-gray-700 p-4 rounded-lg">
              <h5 className="font-semibold text-purple-300 capitalize">{industry}</h5>
              <p className="text-sm text-gray-300 mt-2">{useCase.value_prop}</p>
              <div className="mt-2 text-xs text-green-400">
                💰 {useCase.cost_savings} • ⏱️ {useCase.time_savings}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const TechnicalPipeline = () => (
    <div className="bg-gray-800 rounded-2xl p-6 border border-blue-900/30">
      <h3 className="text-lg font-semibold mb-4">🔧 Production Pipeline</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-4 p-3 bg-green-900/20 rounded-lg">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">✅</div>
          <div>
            <h4 className="font-medium">AI Narrative Analysis</h4>
            <p className="text-sm text-gray-400">Production-ready with cost estimation</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 p-3 bg-blue-900/20 rounded-lg">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            {generationResult ? '✅' : '⚡'}
          </div>
          <div>
            <h4 className="font-medium">Automated 3D Generation</h4>
            <p className="text-sm text-gray-400">
              {generationResult 
                ? `Generated ${generationResult.model_urls.length} models in ${generationResult.generation_time}s`
                : 'Blender API + AI texture generation'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 p-3 bg-purple-900/20 rounded-lg">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">🚀</div>
          <div>
            <h4 className="font-medium">Enterprise Delivery</h4>
            <p className="text-sm text-gray-400">
              API-first • GLB/USDZ formats • Cloud deployment
            </p>
          </div>
        </div>
      </div>

      {generationResult && (
        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <h4 className="font-semibold mb-2">📊 Generation Metrics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Scene ID:</span>
              <div className="font-mono">{generationResult.scene_id}</div>
            </div>
            <div>
              <span className="text-gray-400">Cost:</span>
              <div className="text-green-400">${generationResult.estimated_cost}</div>
            </div>
            <div>
              <span className="text-gray-400">Poly Count:</span>
              <div>{generationResult.poly_count.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-400">Time:</span>
              <div>{generationResult.generation_time}s</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Enhanced Header */}
      <header className="border-b border-green-900/50 bg-linear-to-r from-gray-900 to-green-900/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-linear-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">LioraWave</h1>
                <p className="text-gray-300">3D Content Automation API</p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button 
                onClick={() => setActiveTab('demo')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'demo' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Live Demo
              </button>
              <button 
                onClick={() => setActiveTab('business')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'business' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Business Model
              </button>
            </div>
          </div>
        </div>
      </header>

<header className="border-b border-green-900/50 bg-linear-to-r from-gray-900 to-green-900/20">
  <div className="container mx-auto px-4 py-4 sm:py-6">
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Logo and title section */}
      <div className="flex items-center space-x-4 w-full sm:w-auto justify-center sm:justify-start">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
          <span className="text-lg sm:text-xl">⚡</span>
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-3xl font-bold">LioraWave</h1>
          <p className="text-gray-300 text-sm sm:text-base">3D Content Automation API</p>
        </div>
      </div>
      
      {/* Buttons section */}
      <div className="flex space-x-2 sm:space-x-4 w-full sm:w-auto justify-center">
        <button 
          onClick={() => setActiveTab('demo')}
          className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
            activeTab === 'demo' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Live Demo
        </button>
        <button 
          onClick={() => setActiveTab('business')}
          className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm sm:text-base ${
            activeTab === 'business' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Business Model
        </button>
      </div>
    </div>
  </div>
</header>
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'demo' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-2xl p-6 border border-green-900/30">
                <h2 className="text-xl font-semibold mb-4">🎮 Live Demo</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Industry:
                  </label>
                  <select 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="gaming">🎮 Game Development</option>
                    <option value="education">📚 Education</option>
                    <option value="architecture">🏛️ Architecture</option>
                    <option value="ecommerce">🛒 E-commerce</option>
                  </select>
                </div>

                <textarea
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder="Describe your scene... The AI will generate 3D models automatically!"
                  className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 resize-none"
                />

                <button
                  onClick={analyzeAndGenerate}
                  disabled={loading}
                  className="w-full bg-linear-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all mt-4"
                >
                  {loading ? '🔄 Generating 3D Scene...' : '⚡ Generate 3D Scene'}
                </button>

                {error && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-300">
                    {error}
                  </div>
                )}
              </div>

              {/* Analysis Results */}
              {analysis && (
                <div className="bg-gray-800 rounded-2xl p-6 border border-blue-900/30">
                  <h3 className="text-lg font-semibold mb-4">📊 AI Analysis</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-blue-300">Business Impact</h4>
                      <div className="text-green-400 font-bold">
                        Save ${analysis.estimated_render_cost} vs traditional
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-purple-300 mb-2">Characters</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.characters.map((char, index) => (
                            <span key={index} className="bg-purple-900/30 px-3 py-1 rounded-full text-sm">
                              🧍 {char}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-purple-300 mb-2">Objects</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.objects.map((obj, index) => (
                            <span key={index} className="bg-blue-900/30 px-3 py-1 rounded-full text-sm">
                              ⚔️ {obj}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-purple-300 mb-2">Technical Complexity</h4>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full transition-all"
                          style={{ width: `${analysis.complexity_score * 10}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Score: {analysis.complexity_score}/10
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <TechnicalPipeline />
            </div>

            {/* 3D Visualization */}
            <div className="bg-linear-to-br from-green-900/20 to-blue-900/20 rounded-2xl p-6 border border-green-900/30">
              <h2 className="text-xl font-semibold mb-4">🎭 3D Scene Output</h2>
              
              <div 
                ref={canvasRef}
                className="relative h-96 bg-linear-to-br from-green-900/10 to-blue-900/10 rounded-xl border-2 border-green-900/30 flex items-center justify-center"
              >
                {loading ? (
                  <div className="text-center">
                    <div className="text-4xl mb-4 animate-pulse">⚡</div>
                    <p className="text-gray-300">AI is generating your 3D scene...</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Analyzing story</span>
                        <span>✅</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Generating 3D models</span>
                        <span>🔄</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Composing scene</span>
                        <span>⏳</span>
                      </div>
                    </div>
                  </div>
                ) : generationResult ? (
                  <div className="absolute inset-0">
                    {/* Three.js canvas will be inserted here */}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">🎮</div>
                    <p>Enter a story to generate 3D models</p>
                    <p className="text-sm mt-2">Live 3D preview powered by Three.js</p>
                  </div>
                )}
              </div>

              {generationResult && (
                <div className="mt-6 bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">📦 Generated Assets</h4>
                  <div className="space-y-2">
                    {generationResult.model_urls.map((url, index) => (
                      <div key={index} className="flex items-center space-x-3 text-sm">
                        <span className="text-green-400">✓</span>
                        <span>Model {index + 1}</span>
                        <span className="text-gray-400 text-xs">GLB format</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex space-x-4 text-sm">
                    <a href={generationResult.preview_image} className="text-blue-400 hover:text-blue-300">
                      📸 View Preview
                    </a>
                    <a href={generationResult.interactive_viewer} className="text-blue-400 hover:text-blue-300">
                      🎮 Interactive Viewer
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Business Model Tab */
          <div className="space-y-8">
            <BusinessDashboard />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pricing */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-purple-900/30">
                <h3 className="text-xl font-bold mb-4 text-purple-400">💰 Pricing</h3>
                <div className="space-y-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-400">Starter</h4>
                    <div className="text-2xl font-bold my-2">$0.10/scene</div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>✓ Basic 3D generation</li>
                      <li>✓ Preview quality</li>
                      <li>✓ 100 scenes/month</li>
                    </ul>
                  </div>
                  
                  <div className="bg-linear-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500">
                    <h4 className="font-semibold text-blue-400">Pro</h4>
                    <div className="text-2xl font-bold my-2">$0.25/scene</div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>✓ Advanced AI analysis</li>
                      <li>✓ Standard quality</li>
                      <li>✓ API access</li>
                      <li>✓ Custom styles</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Business Metrics */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-yellow-900/30">
                <h3 className="text-xl font-bold mb-4 text-yellow-400">📈 Business Metrics</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold">$12B</div>
                      <div className="text-xs text-gray-400">Total Addressable Market</div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold">85%</div>
                      <div className="text-xs text-gray-400">Gross Margin</div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold">$0.50</div>
                      <div className="text-xs text-gray-400">Customer CAC</div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold">$2,450</div>
                      <div className="text-xs text-gray-400">Lifetime Value</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradlinearient-to-r from-yellow-900/20 to-red-900/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">🎯 Differentiator</h4>
                    <p className="text-sm text-gray-300">
                      We automate the $12B 3D content creation market with AI, 
                      reducing costs by 99% and delivery time from weeks to minutes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}