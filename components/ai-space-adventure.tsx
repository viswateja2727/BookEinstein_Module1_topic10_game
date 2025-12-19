"use client"

import { useState, useEffect, useRef } from "react"
import { Trophy, RotateCcw, Play, Star, Heart } from "lucide-react"

const AISpaceAdventure = () => {
  const [gameState, setGameState] = useState("menu")
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [spaceshipPos, setSpaceshipPos] = useState(50)
  const [spaceshipDirection, setSpaceshipDirection] = useState("up")
  const [fallingObjects, setFallingObjects] = useState<any[]>([])
  const [powerUps, setPowerUps] = useState<any[]>([])
  const [shields, setShields] = useState(0)
  const [lasers, setLasers] = useState<any[]>([])
  const [particles, setParticles] = useState<any[]>([])
  const [combo, setCombo] = useState(0)
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null)
  const [bossFight, setBossFight] = useState(false)
  const [bossHealth, setBossHealth] = useState(100)
  const [magnetActive, setMagnetActive] = useState(false)
  const [laserPowerActive, setLaserPowerActive] = useState(false)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const keysPressed = useRef<Record<string, boolean>>({})

  const aiTech = [
    { type: "ai", emoji: "💬", name: "Chatbot", points: 20, color: "from-blue-400 to-blue-600" },
    { type: "ai", emoji: "🤖", name: "Robot", points: 25, color: "from-purple-400 to-purple-600" },
    { type: "ai", emoji: "🖥️", name: "Computer Vision", points: 25, color: "from-cyan-400 to-cyan-600" },
    { type: "ai", emoji: "📧", name: "Spam Detection", points: 20, color: "from-pink-400 to-pink-600" },
  ]

  const nonAITech = [
    { type: "nonai", emoji: "💡", name: "Bulb", damage: 1, color: "from-gray-500 to-gray-700" },
    { type: "nonai", emoji: "⏰", name: "Clock", damage: 1, color: "from-gray-500 to-gray-700" },
    { type: "nonai", emoji: "🛏️", name: "Bed", damage: 1, color: "from-gray-500 to-gray-700" },
    { type: "nonai", emoji: "🪑", name: "Chair", damage: 1, color: "from-gray-500 to-gray-700" },
    { type: "nonai", emoji: "📋", name: "Paper", damage: 1, color: "from-gray-500 to-gray-700" },
  ]

  const powerUpTypes = [
    { type: "shield", emoji: "🛡️", effect: "Shield +1", color: "from-blue-300 to-blue-500" },
    { type: "laser", emoji: "⚡", effect: "Laser Power!", color: "from-yellow-300 to-yellow-500" },
    { type: "slowmo", emoji: "⏱️", effect: "Slow Motion!", color: "from-purple-300 to-purple-500" },
    { type: "magnet", emoji: "🧲", effect: "AI Magnet!", color: "from-pink-300 to-pink-500" },
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "Space", " ", "a", "d"].includes(e.key)) {
        e.preventDefault()
        keysPressed.current[e.key] = true
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = setInterval(gameLoop, 50)
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState, spaceshipPos, fallingObjects, powerUps, lasers, level, shields])

  const gameLoop = () => {
    // Move spaceship
    if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"]) {
      setSpaceshipPos((prev) => Math.max(5, prev - 3))
      setSpaceshipDirection("left")
    } else if (keysPressed.current["ArrowRight"] || keysPressed.current["d"]) {
      setSpaceshipPos((prev) => Math.min(95, prev + 3))
      setSpaceshipDirection("right")
    } else {
      setSpaceshipDirection("up")
    }
    if ((keysPressed.current["Space"] || keysPressed.current[" "]) && lasers.length < (laserPowerActive ? 5 : 3)) {
      shootLaser()
      keysPressed.current["Space"] = false
      keysPressed.current[" "] = false
    }

    // Spawn objects
    if (Math.random() < 0.02 + level * 0.005) {
      spawnObject()
    }

    // Spawn power-ups
    if (Math.random() < 0.005) {
      spawnPowerUp()
    }

    // Update falling objects
    setFallingObjects((prev) => {
      return prev
        .map((obj) => {
          const newObj = { ...obj, y: obj.y + (1.5 + level * 0.2) }

          // Magnet effect for AI items
          if (magnetActive && obj.type === "ai" && obj.y > 20 && obj.y < 80) {
            const distanceToShip = spaceshipPos - obj.x
            newObj.x = obj.x + distanceToShip * 0.15
          }

          return newObj
        })
        .filter((obj) => {
          if (obj.y > 85) {
            if (obj.type === "ai") {
              // Missed AI
              setCombo(0)
            }
            return false
          }

          // Check collision with spaceship
          if (obj.y > 70 && obj.y < 85 && Math.abs(obj.x - spaceshipPos) < 10) {
            handleCollision(obj)
            return false
          }

          return true
        })
    })

    // Update power-ups
    setPowerUps((prev) => {
      return prev
        .map((pu) => ({ ...pu, y: pu.y + 2 }))
        .filter((pu) => {
          if (pu.y > 90) return false

          if (pu.y > 70 && pu.y < 85 && Math.abs(pu.x - spaceshipPos) < 10) {
            activatePowerUp(pu)
            return false
          }

          return true
        })
    })

    // Update lasers
    setLasers((prev) => {
      return prev
        .map((laser) => ({ ...laser, y: laser.y - 5 }))
        .filter((laser) => {
          if (laser.y < 0) return false

          // Check laser collision with objects
          const hitIndex = fallingObjects.findIndex(
            (obj) => Math.abs(obj.x - laser.x) < 8 && Math.abs(obj.y - laser.y) < 8,
          )

          if (hitIndex !== -1) {
            handleLaserHit(fallingObjects[hitIndex])
            setFallingObjects((prev) => prev.filter((_, i) => i !== hitIndex))
            return false
          }

          return true
        })
    })

    // Update particles
    setParticles((prev) =>
      prev
        .filter((p) => p.life > 0)
        .map((p) => ({
          ...p,
          y: p.y + p.vy,
          x: p.x + p.vx,
          life: p.life - 1,
        })),
    )

    // Check level up
    if (score > level * 100) {
      setLevel((prev) => prev + 1)
      showMessage(`Level ${level + 1}! 🚀`, "level")
    }

    // Boss fight trigger
    if (score > 300 && !bossFight && level > 3) {
      triggerBossFight()
    }
  }

  const spawnObject = () => {
    const allTech = [...aiTech, ...nonAITech]
    const tech = allTech[Math.floor(Math.random() * allTech.length)]
    const newObj = {
      ...tech,
      id: Date.now() + Math.random(),
      x: Math.random() * 90 + 5,
      y: -10,
    }
    setFallingObjects((prev) => [...prev, newObj])
  }

  const spawnPowerUp = () => {
    const pu = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
    setPowerUps((prev) => [
      ...prev,
      {
        ...pu,
        id: Date.now() + Math.random(),
        x: Math.random() * 90 + 5,
        y: -10,
      },
    ])
  }

  const shootLaser = () => {
    setLasers((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: spaceshipPos + 3,
        y: 70,
      },
    ])
  }

  const handleCollision = (obj: any) => {
    if (obj.type === "ai") {
      const newCombo = combo + 1
      const bonusPoints = Math.floor(newCombo / 5) * 10
      setScore((prev) => prev + obj.points + bonusPoints)
      setCombo(newCombo)
      showMessage(`+${obj.points + bonusPoints}! ${obj.name}`, "success")
      createParticles(obj.x, obj.y, obj.color)
    } else {
      if (shields > 0) {
        setShields((prev) => prev - 1)
        showMessage("Shield Absorbed!", "shield")
      } else {
        setLives((prev) => {
          const newLives = prev - obj.damage
          if (newLives <= 0) {
            endGame()
          }
          return newLives
        })
        showMessage(`-1 Life! ${obj.name}`, "danger")
        setCombo(0)
      }
    }
  }

  const handleLaserHit = (obj: any) => {
    if (obj.type === "nonai") {
      setScore((prev) => prev + 15)
      showMessage(`Zapped! +15`, "laser")
      createParticles(obj.x, obj.y, "from-yellow-400 to-orange-500")
    }
  }

  const activatePowerUp = (pu: any) => {
    showMessage(pu.effect, "powerup")

    switch (pu.type) {
      case "shield":
        setShields((prev) => prev + 1)
        break
      case "laser":
        setLaserPowerActive(true)
        setTimeout(() => setLaserPowerActive(false), 5000)
        break
      case "slowmo":
        // Already handled by level speed
        break
      case "magnet":
        setMagnetActive(true)
        setTimeout(() => setMagnetActive(false), 5000)
        break
    }
  }

  const triggerBossFight = () => {
    setBossFight(true)
    setBossHealth(100)
    showMessage("BOSS FIGHT! 👾", "boss")
    setFallingObjects([])
  }

  const createParticles = (x: number, y: number, color: string) => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      vx: Math.cos((i * Math.PI) / 4) * 2,
      vy: Math.sin((i * Math.PI) / 4) * 2,
      life: 20,
      color,
    }))
    setParticles((prev) => [...prev, ...newParticles])
  }

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 1500)
  }

  const startGame = () => {
    setGameState("playing")
    setScore(0)
    setLives(3)
    setLevel(1)
    setSpaceshipPos(50)
    setFallingObjects([])
    setPowerUps([])
    setLasers([])
    setParticles([])
    setCombo(0)
    setShields(0)
    setBossFight(false)
    setMagnetActive(false)
    setLaserPowerActive(false)
    setSpaceshipDirection("up")
  }

  const endGame = () => {
    setGameState("gameover")
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
  }

  if (gameState === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-cyan-200 to-blue-300 p-6 flex items-center justify-center overflow-hidden relative">
        {/* Animated clouds and elements */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`cloud-${i}`}
              className="absolute bg-white/60 rounded-full opacity-70"
              style={{
                width: Math.random() * 200 + 150 + "px",
                height: Math.random() * 80 + 60 + "px",
                left: Math.random() * 100 + "%",
                top: Math.random() * 80 + "%",
                animation: `float ${Math.random() * 20 + 15}s linear infinite`,
                animationDelay: Math.random() * 5 + "s",
              }}
            >
              <div className="absolute bg-white/60 rounded-full w-20 h-20 -top-8 left-10 opacity-90" />
              <div className="absolute bg-white/60 rounded-full w-24 h-24 -top-10 left-24 opacity-90" />
            </div>
          ))}

          {/* Floating AI icons with glow */}
          <div
            className="absolute top-20 left-10 text-8xl animate-bounce drop-shadow-2xl"
            style={{ animationDuration: "3s", filter: "drop-shadow(0 0 20px rgba(6,182,212,0.5))" }}
          >
            🤖
          </div>
          <div
            className="absolute top-32 right-20 text-7xl animate-bounce drop-shadow-2xl"
            style={{
              animationDuration: "2.5s",
              animationDelay: "0.5s",
              filter: "drop-shadow(0 0 20px rgba(6,182,212,0.5))",
            }}
          >
            💬
          </div>
          <div
            className="absolute bottom-1/3 left-1/4 text-7xl animate-bounce drop-shadow-2xl"
            style={{
              animationDuration: "2.8s",
              animationDelay: "1s",
              filter: "drop-shadow(0 0 20px rgba(6,182,212,0.5))",
            }}
          >
            👁️
          </div>
          <div
            className="absolute bottom-1/2 right-1/3 text-7xl animate-bounce drop-shadow-2xl"
            style={{
              animationDuration: "3.2s",
              animationDelay: "0.3s",
              filter: "drop-shadow(0 0 20px rgba(6,182,212,0.5))",
            }}
          >
            🎯
          </div>
        </div>

        <style>{`
          @keyframes float {
            from { transform: translateX(-100%); }
            to { transform: translateX(100vw); }
          }
        `}</style>

        <div className="max-w-3xl bg-white rounded-3xl shadow-2xl p-8 text-center relative z-10">
          <div className="text-8xl mb-6 animate-bounce">🚀</div>

          <h1 className="text-6xl font-bold mb-4">
            <span className="text-gray-900">AI </span>
            <span className="text-cyan-500">SPACE</span>
            <span className="text-gray-900"> QUEST</span>
          </h1>

          <p className="text-xl text-gray-700 mb-8">
            Navigate your spaceship through the cosmos! Collect AI technologies and avoid non-AI debris!
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-teal-400 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="text-4xl mb-2">🤖</div>
              <h3 className="font-bold mb-2">Collect AI Tech</h3>
              <p className="text-sm text-white/90">Chatbots, Robots, Vision & More!</p>
            </div>

            <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="text-4xl mb-2">💥</div>
              <h3 className="font-bold mb-2">Avoid Objects</h3>
              <p className="text-sm text-white/90">Dodge everyday items or lose lives!</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="text-4xl mb-2">⚡</div>
              <h3 className="font-bold mb-2">Shoot Lasers</h3>
              <p className="text-sm text-white/90">Destroy objects with SPACE!</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">🎮 Controls</h3>
            <div className="text-gray-700 space-y-2">
              <p>← → or A/D: Move Spaceship</p>
              <p>SPACEBAR: Fire Laser</p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-12 py-5 rounded-full text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-3 mx-auto"
          >
            <Play className="w-8 h-8" />
            LAUNCH MISSION
          </button>
        </div>
      </div>
    )
  }

  if (gameState === "playing") {
    return (
      <div className="h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 overflow-hidden relative">
        {/* Animated space background with stars */}
        <div className="absolute inset-0">
          {/* Twinkling stars */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: Math.random() * 3 + 1 + "px",
                height: Math.random() * 3 + 1 + "px",
                left: Math.random() * 100 + "%",
                top: Math.random() * 100 + "%",
                animationDuration: Math.random() * 3 + 2 + "s",
                animationDelay: Math.random() * 2 + "s",
                opacity: Math.random() * 0.7 + 0.3,
              }}
            />
          ))}

          {/* Nebula effects */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 30%, rgba(100, 60, 200, 0.1) 0%, transparent 50%),
                               radial-gradient(circle at 80% 70%, rgba(200, 50, 120, 0.1) 0%, transparent 50%),
                               radial-gradient(circle at 50% 50%, rgba(30, 80, 180, 0.08) 0%, transparent 60%)`,
            }}
          />
        </div>

        <style>{`
          @keyframes float {
            from { transform: translateX(0); }
            to { transform: translateX(120vw); }
          }
          @keyframes magnetPulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.15); opacity: 0.9; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
          }
          @keyframes attractToShip {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(var(--attract-x), var(--attract-y)) scale(0.8); }
          }
        `}</style>

        {/* HUD */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50">
          <div className="space-y-2">
            <div className="bg-black/70 backdrop-blur px-6 py-3 rounded-full border-2 border-yellow-400 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-xl">{score}</span>
            </div>
            <div className="bg-black/70 backdrop-blur px-6 py-3 rounded-full border-2 border-purple-400 flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-400" />
              <span className="text-purple-400 font-bold">Level {level}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="bg-black/70 backdrop-blur px-6 py-3 rounded-full border-2 border-red-400 flex items-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart key={i} className={`w-5 h-5 ${i < lives ? "text-red-500 fill-red-500" : "text-gray-600"}`} />
              ))}
            </div>
            {shields > 0 && (
              <div className="bg-black/70 backdrop-blur px-6 py-3 rounded-full border-2 border-blue-400 flex items-center gap-2">
                <span className="text-blue-400">🛡️ x{shields}</span>
              </div>
            )}
            {magnetActive && (
              <div className="bg-black/70 backdrop-blur px-6 py-3 rounded-full border-2 border-pink-400 animate-pulse">
                <span className="text-pink-400 font-bold">🧲 MAGNET ACTIVE</span>
              </div>
            )}
            {laserPowerActive && (
              <div className="bg-black/70 backdrop-blur px-6 py-3 rounded-full border-2 border-yellow-400 animate-pulse">
                <span className="text-yellow-400 font-bold">⚡ LASER BOOST</span>
              </div>
            )}
            {combo > 0 && (
              <div className="bg-black/70 backdrop-blur px-6 py-3 rounded-full border-2 border-orange-400 animate-pulse">
                <span className="text-orange-400 font-bold">🔥 {combo}x</span>
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 px-8 py-4 rounded-full text-2xl font-bold border-4 ${
              message.type === "success"
                ? "bg-green-500 border-green-300 text-white"
                : message.type === "danger"
                  ? "bg-red-500 border-red-300 text-white"
                  : message.type === "powerup"
                    ? "bg-purple-500 border-purple-300 text-white"
                    : message.type === "level"
                      ? "bg-blue-500 border-blue-300 text-white"
                      : message.type === "laser"
                        ? "bg-yellow-500 border-yellow-300 text-black"
                        : "bg-cyan-500 border-cyan-300 text-white"
            } animate-pulse`}
          >
            {message.text}
          </div>
        )}

        {/* Game area */}
        <div className="relative h-full">
          {/* Falling objects */}
          {fallingObjects.map((obj) => (
            <div
              key={obj.id}
              className="absolute"
              style={{ left: `${obj.x}%`, top: `${obj.y}%`, transform: "translateX(-50%)" }}
            >
              {/* Magnet attraction visual effect */}
              {magnetActive && obj.type === "ai" && (
                <>
                  <svg
                    className="absolute pointer-events-none"
                    style={{
                      left: "50%",
                      top: "50%",
                      width: "400px",
                      height: "400px",
                      transform: "translate(-50%, -50%)",
                      overflow: "visible",
                    }}
                  >
                    <line
                      x1="200"
                      y1="200"
                      x2={200 + (spaceshipPos - obj.x) * 8}
                      y2="350"
                      stroke="rgba(236, 72, 153, 0.6)"
                      strokeWidth="3"
                      strokeDasharray="6,6"
                      style={{
                        filter: "drop-shadow(0 0 8px rgba(236, 72, 153, 0.8))",
                      }}
                    >
                      <animate attributeName="stroke-dashoffset" from="0" to="12" dur="0.5s" repeatCount="indefinite" />
                    </line>
                  </svg>
                </>
              )}

              {/* Removed square background boxes around icons, made items float with labels */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="text-center"
                  style={{
                    fontSize: "50px",
                    filter:
                      obj.type === "ai"
                        ? "drop-shadow(0 0 15px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 30px rgba(147, 51, 234, 0.6))"
                        : "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))",
                    transform: `rotate(${obj.y * 0.5}deg)`,
                    animation: obj.type === "ai" ? "pulse 2s infinite" : "none",
                  }}
                >
                  {obj.emoji}
                </div>
                <div
                  className={`text-center font-bold px-3 py-1 rounded-full ${
                    obj.type === "ai" ? "bg-white text-purple-700" : "bg-gray-700 text-white"
                  }`}
                  style={{
                    fontSize: "16px",
                    boxShadow:
                      obj.type === "ai" ? "0 4px 15px rgba(147, 51, 234, 0.5)" : "0 4px 10px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {obj.name}
                </div>
              </div>
            </div>
          ))}

          {/* Power-ups */}
          {powerUps.map((pu) => (
            <div
              key={pu.id}
              className="absolute flex items-center justify-center animate-pulse"
              style={{
                left: `${pu.x}%`,
                top: `${pu.y}%`,
                width: "60px",
                height: "60px",
                transform: "translateX(-50%)",
                filter: "drop-shadow(0 0 30px rgba(255, 215, 0, 0.8))",
              }}
            >
              <div className="text-4xl">{pu.emoji}</div>
            </div>
          ))}

          {/* Lasers */}
          {lasers.map((laser) => (
            <div
              key={laser.id}
              className="absolute"
              style={{ left: `${laser.x}%`, top: `${laser.y}%`, transform: "translateX(-50%)" }}
            >
              <div className="w-2 h-8 bg-gradient-to-t from-yellow-400 to-red-500 rounded-full shadow-lg shadow-yellow-500/50" />
            </div>
          ))}

          {/* Particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className={`absolute w-2 h-2 rounded-full bg-gradient-to-br ${p.color}`}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                opacity: p.life / 20,
              }}
            />
          ))}

          {/* Spaceship */}
          <div
            className="absolute bottom-8 transition-all duration-100"
            style={{
              left: `${spaceshipPos}%`,
              transform:
                spaceshipDirection === "left"
                  ? "rotate(-15deg)"
                  : spaceshipDirection === "right"
                    ? "rotate(15deg)"
                    : "rotate(0deg)",
            }}
          >
            <div className="relative">
              {shields > 0 && (
                <div
                  className="absolute -inset-8 rounded-full border-4 border-blue-400 animate-pulse"
                  style={{ boxShadow: "0 0 40px rgba(59, 130, 246, 0.9)" }}
                />
              )}
              {magnetActive && (
                <div
                  className="absolute -inset-10 rounded-full border-4 border-pink-400"
                  style={{
                    boxShadow: "0 0 60px rgba(236, 72, 153, 1)",
                    animation: "magnetPulse 1s infinite",
                  }}
                />
              )}
              {laserPowerActive && (
                <div className="absolute -inset-8 rounded-full border-4 border-yellow-400 animate-ping" />
              )}

              {/* Colorful gradient rocket with rotation */}
              <div
                className="relative transition-transform duration-150"
                style={{
                  transform:
                    spaceshipDirection === "left"
                      ? "rotate(-15deg)"
                      : spaceshipDirection === "right"
                        ? "rotate(15deg)"
                        : "rotate(0deg)",
                }}
              >
                <svg width="80" height="100" viewBox="0 0 80 100" className="drop-shadow-2xl">
                  <defs>
                    <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: "#ef4444", stopOpacity: 1 }} />
                      <stop offset="25%" style={{ stopColor: "#dc2626", stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: "#f87171", stopOpacity: 1 }} />
                      <stop offset="75%" style={{ stopColor: "#ffffff", stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: "#fecaca", stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="windowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: "#dbeafe", stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: "#93c5fd", stopOpacity: 1 }} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Rocket body */}
                  <ellipse cx="40" cy="60" rx="18" ry="30" fill="url(#rocketGradient)" filter="url(#glow)" />

                  {/* Rocket nose cone */}
                  <path d="M 40 10 L 25 40 L 55 40 Z" fill="url(#rocketGradient)" filter="url(#glow)" />

                  {/* Window */}
                  <circle cx="40" cy="45" r="8" fill="url(#windowGradient)" />
                  <circle cx="40" cy="45" r="6" fill="#bfdbfe" opacity="0.9" />

                  {/* Left fin */}
                  <path d="M 22 70 L 10 90 L 22 85 Z" fill="url(#rocketGradient)" filter="url(#glow)" />

                  {/* Right fin */}
                  <path d="M 58 70 L 70 90 L 58 85 Z" fill="url(#rocketGradient)" filter="url(#glow)" />

                  {/* Flame */}
                  <ellipse cx="40" cy="92" rx="12" ry="8" fill="#fbbf24" opacity="0.9">
                    <animate attributeName="ry" values="8;12;8" dur="0.3s" repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx="40" cy="95" rx="8" ry="6" fill="#f59e0b" opacity="0.8">
                    <animate attributeName="ry" values="6;10;6" dur="0.3s" repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx="40" cy="97" rx="5" ry="4" fill="#ef4444" opacity="0.7">
                    <animate attributeName="ry" values="4;7;4" dur="0.3s" repeatCount="indefinite" />
                  </ellipse>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Game Over Screen
  const rank =
    score > 500
      ? "🌟 LEGENDARY!"
      : score > 300
        ? "🥇 MASTER!"
        : score > 150
          ? "🥈 EXPERT!"
          : score > 50
            ? "🥉 GOOD!"
            : "🎮 NICE TRY!"

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black p-6 flex items-center justify-center">
      <div className="max-w-2xl bg-gradient-to-br from-purple-900/90 to-black/90 backdrop-blur rounded-3xl shadow-2xl p-8 text-center border-4 border-purple-500">
        <div className="text-7xl mb-6">🎮</div>

        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4">
          MISSION COMPLETE
        </h1>

        <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 rounded-2xl p-8 mb-6 border-2 border-purple-400">
          <div className="text-2xl text-purple-200 mb-2">{rank}</div>
          <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
            {score}
          </div>
          <p className="text-xl text-purple-200">Level {level} Reached</p>
        </div>

        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-4 text-xl">🌟 Reflection Time</h3>
          <ul className="text-left text-gray-700 space-y-3">
            <li>💭 How do chatbots understand what we say?</li>
            <li>🎯 Where have you seen recommendation AI in apps?</li>
            <li>🤖 What tasks can AI robots do that humans find difficult?</li>
            <li>👁️ How does computer vision help self-driving cars?</li>
            <li>🚀 Can you think of new ways to use these AI technologies?</li>
          </ul>
        </div>

        <button
          onClick={startGame}
          className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white px-10 py-4 rounded-full text-xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all flex items-center gap-3 mx-auto border-4 border-white/30"
        >
          <RotateCcw className="w-6 h-6" />
          PLAY AGAIN
        </button>
      </div>
    </div>
  )
}

export default AISpaceAdventure
