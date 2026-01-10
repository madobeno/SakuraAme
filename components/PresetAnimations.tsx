import React, { useEffect, useState } from 'react';

interface Petal {
  id: string;
  x: number;
  y: number;
  rotation: number;
  rotationSpeed: number;
  speedX: number;
  speedY: number;
  opacity: number;
  size: number;
}

interface Cloud {
  id: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface Lightning {
  id: string;
  x: number;
  y: number;
  opacity: number;
  duration: number;
}

interface RainDrop {
  id: string;
  x: number;
  y: number;
  speed: number;
  opacity: number;
}

interface PresetAnimationsProps {
  presetKey: string | null;
  width: number;
  height: number;
}

const PresetAnimations: React.FC<PresetAnimationsProps> = ({ presetKey, width, height }) => {
  const [petals, setPetals] = useState<Petal[]>([]);
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [lightnings, setLightnings] = useState<Lightning[]>([]);
  const [rainDrops, setRainDrops] = useState<RainDrop[]>([]);
  const [isRaining, setIsRaining] = useState(true);
  const [sunOpacity, setSunOpacity] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!presetKey) {
      setIsActive(false);
      setPetals([]);
      setClouds([]);
      setLightnings([]);
      return;
    }

    setIsActive(true);

    // 花散らし - 花吹雪アニメーション
    if (presetKey === 'scatter') {
      const newPetals: Petal[] = [];
      for (let i = 0; i < 50; i++) {
        newPetals.push({
          id: `petal-${i}`,
          x: Math.random() * width,
          y: -20 - Math.random() * 100,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          speedX: (Math.random() - 0.5) * 2,
          speedY: 1 + Math.random() * 2,
          opacity: 0.6 + Math.random() * 0.4,
          size: 8 + Math.random() * 12,
        });
      }
      setPetals(newPetals);

      // アニメーションループ（requestAnimationFrameで最適化）
      let animationFrame: number;
      const animate = () => {
        setPetals(prev => prev.map(petal => {
          let newX = petal.x + petal.speedX;
          let newY = petal.y + petal.speedY;
          let newRotation = petal.rotation + petal.rotationSpeed;

          // 画面外に出たら上から再生成
          if (newY > height + 20) {
            newY = -20;
            newX = Math.random() * width;
          }
          if (newX < -20) newX = width + 20;
          if (newX > width + 20) newX = -20;

          return {
            ...petal,
            x: newX,
            y: newY,
            rotation: newRotation,
          };
        }));
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);

      return () => cancelAnimationFrame(animationFrame);
    }

    // 狐の嫁入り - 雲と太陽のアニメーション
    if (presetKey === 'fox') {
      const newClouds: Cloud[] = [];
      for (let i = 0; i < 8; i++) {
        newClouds.push({
          id: `cloud-${i}`,
          x: Math.random() * width,
          y: 50 + Math.random() * 200,
          size: 60 + Math.random() * 80,
          speed: 0.2 + Math.random() * 0.3,
          opacity: 0.3 + Math.random() * 0.3,
        });
      }
      setClouds(newClouds);

      let animationFrame: number;
      const animate = () => {
        setClouds(prev => prev.map(cloud => {
          let newX = cloud.x + cloud.speed;
          if (newX > width + cloud.size) {
            newX = -cloud.size;
          }
          return { ...cloud, x: newX };
        }));
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);

      return () => cancelAnimationFrame(animationFrame);
    }

    // 花時雨 - 雨が降ったり晴れたりのアニメーション
    if (presetKey === 'shower') {
      setIsActive(true);
      setIsRaining(true);
      setSunOpacity(0);

      // 雨のドロップを生成
      const newRainDrops: RainDrop[] = [];
      for (let i = 0; i < 30; i++) {
        newRainDrops.push({
          id: `raindrop-${i}`,
          x: Math.random() * width,
          y: -10 - Math.random() * 200,
          speed: 2 + Math.random() * 3,
          opacity: 0.4 + Math.random() * 0.4,
        });
      }
      setRainDrops(newRainDrops);

      // 雲のアニメーション
      const newClouds: Cloud[] = [];
      for (let i = 0; i < 5; i++) {
        newClouds.push({
          id: `cloud-shower-${i}`,
          x: Math.random() * width,
          y: 50 + Math.random() * 150,
          size: 50 + Math.random() * 60,
          speed: 0.15 + Math.random() * 0.2,
          opacity: 0.5,
        });
      }
      setClouds(newClouds);

      let currentRaining = true;
      let rainToggleTimeoutRef: number | null = null;
      let sunTimeoutRef: number | null = null;

      // 雨と晴れの切り替えタイマー（ランダムに3-7秒の間で切り替え）
      const scheduleNextToggle = () => {
        const randomDelay = 3000 + Math.random() * 4000; // 3-7秒のランダム
        rainToggleTimeoutRef = window.setTimeout(() => {
          currentRaining = !currentRaining;
          setIsRaining(currentRaining);
          if (!currentRaining) {
            // 晴れの時は太陽を表示
            setSunOpacity(1);
            const sunDisplayTime = 2000 + Math.random() * 2000; // 2-4秒表示
            sunTimeoutRef = window.setTimeout(() => setSunOpacity(0), sunDisplayTime);
            setRainDrops([]);
          } else {
            // 雨の時は雨を再生成
            const newDrops: RainDrop[] = [];
            for (let i = 0; i < 30; i++) {
              newDrops.push({
                id: `raindrop-${i}-${Date.now()}`,
                x: Math.random() * width,
                y: -10 - Math.random() * 200,
                speed: 2 + Math.random() * 3,
                opacity: 0.4 + Math.random() * 0.4,
              });
            }
            setRainDrops(newDrops);
          }
          scheduleNextToggle(); // 次の切り替えをスケジュール
        }, randomDelay);
      };
      scheduleNextToggle(); // 最初の切り替えを開始

      // 雨のアニメーション
      let animationFrame: number;
      const animate = () => {
        setRainDrops(prev => {
          if (!currentRaining || prev.length === 0) return prev;
          return prev.map(drop => {
            let newY = drop.y + drop.speed;
            if (newY > height + 20) {
              newY = -20;
              return { ...drop, y: newY, x: Math.random() * width };
            }
            return { ...drop, y: newY };
          });
        });
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);

      // 雲のアニメーション
      let cloudAnimationFrame: number;
      const animateClouds = () => {
        setClouds(prev => prev.map(cloud => {
          let newX = cloud.x + cloud.speed;
          if (newX > width + cloud.size) {
            newX = -cloud.size;
          }
          return { 
            ...cloud, 
            x: newX,
            opacity: currentRaining ? 0.5 : 0.2
          };
        }));
        cloudAnimationFrame = requestAnimationFrame(animateClouds);
      };
      cloudAnimationFrame = requestAnimationFrame(animateClouds);

      return () => {
        if (rainToggleTimeoutRef !== null) clearTimeout(rainToggleTimeoutRef);
        if (sunTimeoutRef !== null) clearTimeout(sunTimeoutRef);
        cancelAnimationFrame(animationFrame);
        cancelAnimationFrame(cloudAnimationFrame);
      };
    }

    // 春の嵐 - 雷のアニメーション
    if (presetKey === 'storm') {
      const spawnLightning = () => {
        const lightning: Lightning = {
          id: `lightning-${Date.now()}`,
          x: Math.random() * width,
          y: 50 + Math.random() * 300,
          opacity: 1,
          duration: 0,
        };
        setLightnings(prev => [...prev, lightning]);
      };

      // 最初の雷
      spawnLightning();

      // ランダムに雷を発生
      const lightningInterval = setInterval(() => {
        if (Math.random() < 0.3) {
          spawnLightning();
        }
      }, 2000);

      // 雷のアニメーション（requestAnimationFrameで最適化）
      let animationFrame: number;
      const animate = () => {
        setLightnings(prev => prev.map(lightning => ({
          ...lightning,
          duration: lightning.duration + 16,
          opacity: Math.max(0, 1 - lightning.duration / 200),
        })).filter(l => l.duration < 200));
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);

      return () => {
        clearInterval(lightningInterval);
        cancelAnimationFrame(animationFrame);
      };
    }
  }, [presetKey, width, height]);

  if (!isActive && presetKey !== 'storm' && presetKey !== 'shower') return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden">
      {/* 花散らし - 花吹雪 */}
      {presetKey === 'scatter' && (
        <svg className="absolute inset-0 w-full h-full">
          {petals.map(petal => (
            <g
              key={petal.id}
              transform={`translate(${petal.x}, ${petal.y}) rotate(${petal.rotation * (180 / Math.PI)})`}
              opacity={petal.opacity}
            >
              <path
                d="M0 0 C 5 -8, 10 -8, 0 -15 C -10 -8, -5 -8, 0 0"
                fill="#fbcfe8"
                stroke="#f9a8d4"
                strokeWidth="0.5"
              />
            </g>
          ))}
        </svg>
      )}

      {/* 狐の嫁入り - 雲 */}
      {presetKey === 'fox' && (
        <svg className="absolute inset-0 w-full h-full">
          {clouds.map(cloud => (
            <g key={cloud.id} opacity={cloud.opacity}>
              <ellipse
                cx={cloud.x}
                cy={cloud.y}
                rx={cloud.size * 0.6}
                ry={cloud.size * 0.4}
                fill="rgba(255, 255, 255, 0.4)"
              />
              <ellipse
                cx={cloud.x - cloud.size * 0.3}
                cy={cloud.y}
                rx={cloud.size * 0.5}
                ry={cloud.size * 0.35}
                fill="rgba(255, 255, 255, 0.4)"
              />
              <ellipse
                cx={cloud.x + cloud.size * 0.3}
                cy={cloud.y}
                rx={cloud.size * 0.5}
                ry={cloud.size * 0.35}
                fill="rgba(255, 255, 255, 0.4)"
              />
            </g>
          ))}
          {/* 太陽 */}
          <circle
            cx={width * 0.85}
            cy={height * 0.15}
            r={40}
            fill="rgba(255, 220, 100, 0.3)"
            className="animate-pulse"
          />
          <circle
            cx={width * 0.85}
            cy={height * 0.15}
            r={30}
            fill="rgba(255, 240, 150, 0.4)"
          />
        </svg>
      )}

      {/* 花時雨 - 雨と晴れ */}
      {presetKey === 'shower' && (
        <svg className="absolute inset-0 w-full h-full">
          {/* 雲 */}
          {clouds.map(cloud => (
            <g key={cloud.id} opacity={cloud.opacity}>
              <ellipse
                cx={cloud.x}
                cy={cloud.y}
                rx={cloud.size * 0.6}
                ry={cloud.size * 0.4}
                fill="rgba(200, 200, 220, 0.5)"
              />
              <ellipse
                cx={cloud.x - cloud.size * 0.3}
                cy={cloud.y}
                rx={cloud.size * 0.5}
                ry={cloud.size * 0.35}
                fill="rgba(200, 200, 220, 0.5)"
              />
              <ellipse
                cx={cloud.x + cloud.size * 0.3}
                cy={cloud.y}
                rx={cloud.size * 0.5}
                ry={cloud.size * 0.35}
                fill="rgba(200, 200, 220, 0.5)"
              />
            </g>
          ))}
          
          {/* 雨のドロップ */}
          {isRaining && rainDrops.map(drop => (
            <line
              key={drop.id}
              x1={drop.x}
              y1={drop.y}
              x2={drop.x}
              y2={drop.y + 8}
              stroke="rgba(200, 220, 255, 0.6)"
              strokeWidth="1.5"
              opacity={drop.opacity}
            />
          ))}
          
          {/* 太陽（晴れの時） */}
          {!isRaining && sunOpacity > 0 && (
            <g opacity={sunOpacity}>
              <circle
                cx={width * 0.85}
                cy={height * 0.2}
                r={35}
                fill="rgba(255, 220, 100, 0.4)"
                className="animate-pulse"
              />
              <circle
                cx={width * 0.85}
                cy={height * 0.2}
                r={25}
                fill="rgba(255, 240, 150, 0.5)"
              />
            </g>
          )}
        </svg>
      )}

      {/* 春の嵐 - 雷 */}
      {presetKey === 'storm' && (
        <svg className="absolute inset-0 w-full h-full">
          {lightnings.map(lightning => (
            <g key={lightning.id} opacity={lightning.opacity}>
              <path
                d={`M ${lightning.x} ${lightning.y} L ${lightning.x + 20} ${lightning.y + 100} L ${lightning.x - 15} ${lightning.y + 150} L ${lightning.x + 10} ${lightning.y + 200}`}
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="3"
                fill="none"
                filter="url(#glow)"
              />
              <path
                d={`M ${lightning.x} ${lightning.y} L ${lightning.x + 20} ${lightning.y + 100} L ${lightning.x - 15} ${lightning.y + 150} L ${lightning.x + 10} ${lightning.y + 200}`}
                stroke="rgba(200, 220, 255, 0.6)"
                strokeWidth="5"
                fill="none"
              />
            </g>
          ))}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      )}
    </div>
  );
};

export default PresetAnimations;
