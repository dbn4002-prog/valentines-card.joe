import React, { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const VALENTINE_NAME = import.meta.env.VITE_VALENTINE_NAME || 'Beautiful'
const LANGUAGE = import.meta.env.VITE_LANGUAGE || 'EN'

// Fixed the translations object structure
const translations = {
  EN: {
    willYouBeMyValentine: (name: string) => `${name}, will you be my Valentine?`,
    areYouSure: "Are you sure you want to say no? 🥺",
    prettyPlease: "Please? Pretty please? 💕",
    wontGiveUp: "I won't give up on you! 💖",
    tooShy: "That button is too shy to be clicked! 😜",
    justSayYes: "Just say YES already! 💘",
    yes: "Yes! 💕",
    no: "No",
    yay: "YAY!",
    knewYoudSayYes: (name: string) => `I knew you'd say yes, ${name}!`,
    happiestPerson: "You've made me the happiest person ever! 💕",
  },
  DA: {
    willYouBeMyValentine: (name: string) => `${name}, vil du være min Valentine?`,
    areYouSure: "Er du sikker på du vil sige nej? 🥺",
    prettyPlease: "Please? Søde dig? 💕",
    wontGiveUp: "Jeg giver ikke op! 💖",
    tooShy: "Den knap er for genert til at blive trykket på! 😜",
    justSayYes: "Sig bare JA! 💘",
    yes: "Ja! 💕",
    no: "Nej",
    yay: "JUBII!",
    knewYoudSayYes: (_name: string) => `Jeg vidste du ville sige ja!`,
    happiestPerson: "TIHI! 💕",
  },
}

const t = translations[LANGUAGE as keyof typeof translations] || translations.EN

interface Heart {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  opacity: number
}

interface Sparkle {
  id: number
  x: number
  y: number
  size: number
}

export default function App() {
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 })
  const [initialized, setInitialized] = useState(false)
  const [hearts, setHearts] = useState<Heart[]>([])
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const [yesClicked, setYesClicked] = useState(false)
  const [noAttempts, setNoAttempts] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  const yesButtonRef = useRef<HTMLButtonElement>(null)
  const noButtonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sparkleId = useRef(0)
  const lastMoveTime = useRef(0)

  const FLEE_DISTANCE = 120

  useEffect(() => {
    const newHearts: Heart[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 15 + Math.random() * 35,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 5,
      opacity: 0.3 + Math.random() * 0.4,
    }))
    setHearts(newHearts)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.7) {
        const newSparkle: Sparkle = {
          id: sparkleId.current++,
          x: e.clientX,
          y: e.clientY,
          size: 5 + Math.random() * 15,
        }
        setSparkles(prev => [...prev.slice(-20), newSparkle])
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles(prev => prev.slice(1))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!initialized) {
      const timer = setTimeout(() => {
        if (yesButtonRef.current && containerRef.current) {
          const container = containerRef.current.getBoundingClientRect()
          const yesRect = yesButtonRef.current.getBoundingClientRect()
          setNoButtonPos({
            x: yesRect.right - container.left + 20,
            y: yesRect.top - container.top,
          })
          setInitialized(true)
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [initialized])

  const getRandomPosition = useCallback((currentMouseX?: number, currentMouseY?: number) => {
    if (!containerRef.current || !yesButtonRef.current || !noButtonRef.current) {
      return noButtonPos
    }

    const container = containerRef.current.getBoundingClientRect()
    const yesRect = yesButtonRef.current.getBoundingClientRect()
    const noRect = noButtonRef.current.getBoundingClientRect()

    const padding = 60
    const noWidth = noRect.width || 100
    const noHeight = noRect.height || 50

    const minX = padding
    const minY = padding
    const maxX = container.width - noWidth - padding
    const maxY = container.height - noHeight - padding

    let attempts = 0
    let newX = noButtonPos.x
    let newY = noButtonPos.y

    while (attempts < 100) {
      newX = minX + Math.random() * (maxX - minX)
      newY = minY + Math.random() * (maxY - minY)
      attempts++

      const yesLeft = yesRect.left - container.left - 30
      const yesRight = yesRect.right - container.left + 30
      const yesTop = yesRect.top - container.top - 30
      const yesBottom = yesRect.bottom - container.top + 30

      const overlapsYes = !(newX + noWidth < yesLeft || newX > yesRight || newY + noHeight < yesTop || newY > yesBottom)

      let tooCloseToMouse = false
      if (currentMouseX !== undefined && currentMouseY !== undefined) {
        const mouseRelX = currentMouseX - container.left
        const mouseRelY = currentMouseY - container.top
        const distToMouse = Math.sqrt(Math.pow((newX + noWidth / 2) - mouseRelX, 2) + Math.pow((newY + noHeight / 2) - mouseRelY, 2))
        tooCloseToMouse = distToMouse < FLEE_DISTANCE + 50
      }

      if (!overlapsYes && !tooCloseToMouse) break
    }

    return { x: newX, y: newY }
  }, [noButtonPos, FLEE_DISTANCE])

  useEffect(() => {
    if (yesClicked) return
    const handleMouseMove = (e: MouseEvent) => {
      if (!noButtonRef.current || !containerRef.current) return
      const now = Date.now()
      if (now - lastMoveTime.current < 50) return

      const noRect = noButtonRef.current.getBoundingClientRect()
      const distance = Math.sqrt(
        Math.pow(e.clientX - (noRect.left + noRect.width / 2), 2) + 
        Math.pow(e.clientY - (noRect.top + noRect.height / 2), 2)
      )

      if (distance < FLEE_DISTANCE) {
        lastMoveTime.current = now
        setNoAttempts(prev => prev + 1)
        setNoButtonPos(getRandomPosition(e.clientX, e.clientY))
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [yesClicked, getRandomPosition, FLEE_DISTANCE])

  const handleYesClick = () => {
    setYesClicked(true)
    setShowConfetti(true)
  }

  const getMessage = () => {
    if (noAttempts === 0) return t.willYouBeMyValentine(VALENTINE_NAME)
    if (noAttempts < 3) return t.areYouSure
    if (noAttempts < 6) return t.prettyPlease
    if (noAttempts < 10) return t.wontGiveUp
    if (noAttempts < 15) return t.tooShy
    return t.justSayYes
  }

  if (yesClicked) {
    return (
      <div className="celebration-container" ref={containerRef}>
        {showConfetti && (
          <div className="confetti-container">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: ['#ff4d6d', '#ff8fa3', '#ffb3c1', '#ffd700', '#ff69b4', '#ff1493'][Math.floor(Math.random() * 6)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            ))}
          </div>
        )}
        <div className="celebration-content">
          <div className="big-heart">💖</div>
          <h1 className="celebration-title">{t.yay}</h1>
          <p className="celebration-text">{t.knewYoudSayYes(VALENTINE_NAME)}</p>
          <p className="celebration-subtext">{t.happiestPerson}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" ref={containerRef}>
      {hearts.map(heart => (
        <div key={heart.id} className="floating-heart" style={{ left: `${heart.x}%`, top: `${heart.y}%`, fontSize: `${heart.size}px`, animationDuration: `${heart.duration}s`, animationDelay: `${heart.delay}s`, opacity: heart.opacity }}>
          {['💕', '💗', '💖', '💘', '❤️'][heart.id % 5]}
        </div>
      ))}
      {sparkles.map(sparkle => (
        <div key={sparkle.id} className="sparkle" style={{ left: sparkle.x, top: sparkle.y, width: sparkle.size, height: sparkle.size }} />
      ))}
      <div className="content">
        <div className="envelope">
          <div className="letter">
            <h1 className="title">
              <span className="name">{VALENTINE_NAME}</span><br />
              <span className="question">{getMessage()}</span>
            </h1>
            <div className="buttons-container">
              <button ref={yesButtonRef} className="btn btn-yes" onClick={handleYesClick}>{t.yes}</button>
            </div>
          </div>
        </div>
        <button
          ref={noButtonRef}
          className="btn btn-no"
          style={{
            position: 'absolute',
            left: noButtonPos.x,
            top: noButtonPos.y,
            transition: 'all 0.25s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            opacity: initialized ? 1 : 0,
          }}
        >
          {t.no} {noAttempts > 5 ? '😈' : '😢'}
        </button>
      </div>
    </div>
  )
}
