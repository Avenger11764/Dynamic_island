import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, MonitorPlay, Activity, Timer, Settings2, ShieldCheck, ChevronRight, ChevronLeft, BatteryCharging, Layers, Sun, Palette, Power } from 'lucide-react';
import MoltenMetal from './MoltenMetal';
import SpecularButton from './SpecularButton';
import BounceCards from './BounceCards';

function App() {
  const carouselRef = useRef(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    let animationFrameId;
    const el = carouselRef.current;
    
    const scroll = () => {
      if (el && !isNavigating) {
        el.scrollLeft += 1;
        // Infinite loop: jump back to start when halfway through (the duplicate set)
        if (el.scrollLeft >= el.scrollWidth / 2) {
           el.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };
    
    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isNavigating]);

  const scrollByAmount = (amount) => {
    setIsNavigating(true);
    const el = carouselRef.current;
    if (el) {
       el.scrollBy({ left: amount, behavior: 'smooth' });
    }
    // Resume auto-scroll after the smooth scroll finishes
    setTimeout(() => {
       setIsNavigating(false);
    }, 600);
  };
  
  const features = [
    {
      icon: <MonitorPlay className="w-6 h-6 text-blue-400" />,
      title: 'Media Controls',
      description: 'Native Spotify integration with a dynamic audio waveform and liquid ambient glow that pulses with the beat.'
    },
    {
      icon: <BatteryCharging className="w-6 h-6 text-green-400" />,
      title: 'Intelligent Indicators',
      description: 'Intelligent notch and bar states featuring live battery rings, network speed counters, CPU/RAM stats, and hardware metrics.'
    },
    {
      icon: <Timer className="w-6 h-6 text-orange-400" />,
      title: 'Active Timers',
      description: 'Live Pomodoro and Stopwatch counters that seamlessly replace the clock in the collapsed state when running.'
    },
    {
      icon: <Activity className="w-6 h-6 text-cyan-400" />,
      title: 'Hardware & Network',
      description: 'Live CPU, RAM, and internet speeds tracked in real-time via beautifully designed expanded UI panels.'
    },
    {
      icon: <Settings2 className="w-6 h-6 text-purple-400" />,
      title: 'System Controls',
      description: 'Change global Volume and Brightness seamlessly using quick mouse-wheel scroll gestures over the island.'
    },
    {
      icon: <Layers className="w-6 h-6 text-yellow-400" />,
      title: 'Flawless Layering',
      description: 'Custom engine strictly enforcing highest z-index, keeping the island flawlessly above all full-screen apps and games.'
    },
    {
      icon: <Sun className="w-6 h-6 text-pink-400" />,
      title: 'Smart Greetings',
      description: 'A personalized, time-aware greeting that smoothly expands to welcome you upon waking or starting your machine.'
    },
    {
      icon: <Activity className="w-6 h-6 text-red-400" />,
      title: 'Liquid Physics',
      description: 'A premium spring-physics system with instant-response drag-and-drop, smart snapping boundaries, and seamless fluid expansions.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: 'Secure & Efficient',
      description: 'Built safely with fully isolated Electron contexts, utilizing smart background polling to ensure near-zero resource drain.'
    },
    {
      icon: <Palette className="w-6 h-6 text-fuchsia-400" />,
      title: 'Customization',
      description: 'Cosmic Minimalist Theme with a full-spectrum color picker for notch accents and smart UI contrast based on your background.'
    },
    {
      icon: <Power className="w-6 h-6 text-teal-400" />,
      title: 'Auto-Start & Reliability',
      description: 'Seamlessly boots with Windows and uses a strict process lock to prevent duplicate islands from cluttering your screen.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] font-sans selection:bg-blue-500/30 text-white relative">
      {/* Full-Website Interactive Molten Metal Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <MoltenMetal
          color1="#8c8c8c"
          color2="#FF9FFC"
          color3="#FFFFFF"
          speed={0.35}
          scale={4}
          detail={3}
          glow={1.6}
          coreSize={0.1}
          swirl={1}
          fold={-0.2}
          blackPoint={0.05}
          brightness={1.3}
          colorMode="molten"
          grain={true}
          grainIntensity={0.05}
          mouseInteraction={true}
          mouseStrength={0.3}
          opacity={0.8}
        />
        <div className="absolute inset-0 bg-[#030712]/35 pointer-events-none" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/10 rounded-none bg-[#030712]/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex items-center justify-center">
              <img src="/favicon.png" alt="Smart Notch Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl drop-shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:scale-105 transition-transform" />
            </div>
            <span className="text-white font-semibold text-lg sm:text-xl tracking-tight">Smart Notch</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <a href="https://github.com/Avenger11764/Dynamic_island" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <a href="/Smart_Notch_Setup_1.0.4.exe" download className="bg-white text-black px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-medium text-xs sm:text-sm hover:bg-gray-100 transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Download
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 sm:pt-40 sm:pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Ambient background glows */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: ['-50%', '-45%', '-55%', '-50%'],
            y: ['-50%', '-55%', '-45%', '-50%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 w-[340px] sm:w-[600px] md:w-[800px] h-[250px] sm:h-[400px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" 
        />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight leading-tight pb-3 sm:pb-4 mb-3 sm:mb-4">
              The notch experience, <br /> reimagined for Windows.
            </h1>
            <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2">
              A sleek, butter-smooth, and highly functional Smart Notch utility built natively for Windows. Control media, track time, and monitor your system in elegance.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-xs sm:max-w-none mx-auto">
              <a href="https://apps.microsoft.com/store/detail/9N1D46F5X565?cid=DevShareMCLPCS" target="_blank" rel="noreferrer" className="hover:scale-105 transition-transform active:scale-95 w-full sm:w-auto flex justify-center">
                <img src="https://get.microsoft.com/images/en-us%20dark.svg" alt="Get it from Microsoft" className="h-[48px] sm:h-[52px]" />
              </a>
              <a href="/Smart_Notch_Setup_1.0.4.exe" download className="bg-white text-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-sm sm:text-base hover:bg-gray-100 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-95 flex items-center justify-center gap-2 h-[48px] sm:h-[52px] w-full sm:w-auto">
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                Download Setup
              </a>
              <a href="https://github.com/Avenger11764/Dynamic_island" target="_blank" rel="noreferrer" className="glass px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-semibold text-white text-sm sm:text-base hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2 border border-white/10 h-[48px] sm:h-[52px] w-full sm:w-auto">
                View Source <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          </motion.div>

          {/* Hero Image Showcase */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-12 sm:mt-20 relative mx-auto max-w-3xl"
          >
            <div className="glass-card p-2 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
              <img 
                src="/assets/media_player_v2.png" 
                alt="Media Player Island" 
                className="w-full rounded-xl sm:rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Infinite Marquee */}
      <section className="py-16 sm:py-24 border-t border-white/5 bg-white/[0.02] overflow-hidden flex flex-col relative group">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="text-left mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3 sm:mb-6">Premium functionality.</h2>
            <p className="text-gray-400 text-sm sm:text-lg max-w-2xl">Everything you need, right at the top of your screen. Continuously advancing capabilities.</p>
          </div>
        </div>

        {/* Carousel Wrapper */}
        <div className="relative w-full flex items-center">
          {/* Navigation Arrows */}
          <button 
            onClick={() => scrollByAmount(-320)}
            className="absolute left-1 sm:left-4 md:left-6 z-20 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center backdrop-blur-md transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
          
          <button 
            onClick={() => scrollByAmount(320)}
            className="absolute right-1 sm:right-4 md:right-6 z-20 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center backdrop-blur-md transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>

          {/* Gradient fades for edge smoothing */}
          <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 md:w-32 bg-gradient-to-r from-[#030712] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 md:w-32 bg-gradient-to-l from-[#030712] to-transparent z-10 pointer-events-none" />

          <div 
            className="flex w-full overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-4"
            ref={carouselRef}
          >
            <div className="flex gap-4 sm:gap-6 px-4 sm:px-6 w-max">
            {[...features, ...features].map((feature, i) => (
              <SpecularButton 
                key={i}
                as="div"
                size="card"
                radius={24}
                tint="#0b1329"
                tintOpacity={0.65}
                blur={12}
                textColor="#f5f5f5"
                lineColor="#ffffff"
                baseColor="#334155"
                intensity={1.2}
                shineSize={14}
                shineFade={40}
                thickness={1.5}
                speed={0.35}
                followMouse={true}
                proximity={250}
                className="w-[270px] sm:w-[320px] md:w-[360px] min-h-[280px] sm:min-h-[310px] p-5 sm:p-7 md:p-8 shrink-0 rounded-2xl sm:rounded-3xl transition-all duration-300 hover:scale-[1.02] border border-white/10 group cursor-default flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center mb-4 sm:mb-5 border border-white/10 group-hover:scale-110 hover:scale-110 hover:bg-white/10 transition-all duration-300 shrink-0">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-2.5 tracking-tight">{feature.title}</h3>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mt-2">
                  {feature.description}
                </p>
              </SpecularButton>
            ))}
          </div>
        </div>
      </div>
      </section>

      {/* Showcase Gallery */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3 sm:mb-4">Seamless Modes</h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto px-2">Tap or hover over any card in the interactive deck to inspect each Smart Notch mode — from live telemetries to ambient settings.</p>
          </motion.div>
          
          {/* Interactive BounceCards Stack */}
          <div className="flex justify-center items-center py-8 sm:py-14 w-full overflow-visible">
            <BounceCards
              className="mx-auto"
              images={[
                "/assets/network_stats_v2.png",
                "/assets/hardware_stats_v2.png",
                "/assets/compact_mode_v2.png",
                "/assets/settings_mode_v2.png",
                "/assets/bar_mode_v2.png"
              ]}
              containerWidth={920}
              containerHeight={430}
              animationDelay={0.3}
              animationStagger={0.08}
              easeType="elastic.out(1, 0.6)"
              transformStyles={[
                "rotate(7deg) translate(-250px, 12px)",
                "rotate(3deg) translate(-125px, -8px)",
                "rotate(-2deg) translate(0px, 0px)",
                "rotate(-6deg) translate(125px, -10px)",
                "rotate(5deg) translate(250px, 12px)"
              ]}
              enableHover={true}
            />
          </div>

          {/* Mode Highlights Underneath */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 mt-6 sm:mt-8 max-w-5xl mx-auto">
            <div className="glass-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.02] text-center hover:bg-white/[0.05] transition-all">
              <span className="text-xs sm:text-sm font-semibold text-white block mb-0.5 sm:mb-1">Network Speed</span>
              <span className="text-[11px] sm:text-xs text-green-400">Live MB/s Monitor</span>
            </div>
            <div className="glass-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.02] text-center hover:bg-white/[0.05] transition-all">
              <span className="text-xs sm:text-sm font-semibold text-white block mb-0.5 sm:mb-1">Hardware Monitor</span>
              <span className="text-[11px] sm:text-xs text-blue-400">Real-Time CPU & RAM</span>
            </div>
            <div className="glass-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.02] text-center hover:bg-white/[0.05] transition-all">
              <span className="text-xs sm:text-sm font-semibold text-white block mb-0.5 sm:mb-1">Compact Idle</span>
              <span className="text-[11px] sm:text-xs text-gray-400">Smart Battery Ring</span>
            </div>
            <div className="glass-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.02] text-center hover:bg-white/[0.05] transition-all">
              <span className="text-xs sm:text-sm font-semibold text-white block mb-0.5 sm:mb-1">Customization</span>
              <span className="text-[11px] sm:text-xs text-fuchsia-400">Colors, Accents & Glow</span>
            </div>
            <div className="glass-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.02] text-center hover:bg-white/[0.05] transition-all col-span-2 sm:col-span-1">
              <span className="text-xs sm:text-sm font-semibold text-white block mb-0.5 sm:mb-1">Docking Bar</span>
              <span className="text-[11px] sm:text-xs text-cyan-400">Top & Side Shelf Mode</span>
            </div>
          </div>
        </div>
      </section>

      {/* How to Install Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5 relative overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -30, 20, 0],
            y: [0, 40, -20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" 
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="flex-1 w-full">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 sm:mb-6">Up and running in seconds.</h2>
              <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed">We built Smart Notch to be entirely frictionless. No complex setups, no bloatware. Just a single installer that sets everything up automatically.</p>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0 border border-blue-500/30 text-sm sm:text-base">1</div>
                  <div>
                    <h4 className="text-white font-semibold text-base sm:text-lg mb-0.5 sm:mb-1">Download Installer</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">Download the lightweight `Smart_Notch_Setup.exe` directly.</p>
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0 border border-blue-500/30 text-sm sm:text-base">2</div>
                  <div>
                    <h4 className="text-white font-semibold text-base sm:text-lg mb-0.5 sm:mb-1">Run Setup</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">Simply double-click the `.exe` file to seamlessly install the app.</p>
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0 border border-blue-500/30 text-sm sm:text-base">3</div>
                  <div>
                    <h4 className="text-white font-semibold text-base sm:text-lg mb-0.5 sm:mb-1">You're Done!</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">The Island will launch automatically and gracefully appear at the top center of your screen.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="glass-card p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl border border-white/10 bg-black/40 max-w-md mx-auto md:ml-auto"
              >
                <div className="bg-[#0f172a] rounded-xl sm:rounded-2xl overflow-hidden border border-white/5 p-6 sm:p-8 text-center flex flex-col items-center justify-center relative group">
                  <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-500">
                    <img src="/favicon.png" alt="Smart Notch App Logo" className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl drop-shadow-[0_0_40px_rgba(56,189,248,0.5)]" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Smart Notch for Windows</h3>
                  <p className="text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8">Latest Version for Windows (64-bit)</p>
                  
                  <a href="/Smart_Notch_Setup_1.0.4.exe" download className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3.5 sm:py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 flex items-center justify-center gap-2 relative z-10 text-sm sm:text-base">
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    Download Now
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3 sm:mb-6">Powered by Modern Tech</h2>
          <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto mb-10 sm:mb-16 px-2">Built entirely on web technologies, optimized to run natively as a lightweight desktop application.</p>
          
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 md:gap-16 opacity-75">
            <div className="flex flex-col items-center gap-2 sm:gap-3 grayscale hover:grayscale-0 transition-all hover:scale-110">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Electron_Software_Framework_Logo.svg" alt="Electron" className="w-12 h-12 sm:w-16 sm:h-16" />
              <span className="text-xs sm:text-sm font-medium">Electron</span>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3 grayscale hover:grayscale-0 transition-all hover:scale-110">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React" className="w-12 h-12 sm:w-16 sm:h-16" />
              <span className="text-xs sm:text-sm font-medium">React</span>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3 grayscale hover:grayscale-0 transition-all hover:scale-110">
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" alt="Tailwind" className="w-12 h-12 sm:w-16 sm:h-16" />
              <span className="text-xs sm:text-sm font-medium">Tailwind CSS</span>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3 grayscale hover:grayscale-0 transition-all hover:scale-110">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl flex items-center justify-center font-bold text-black text-xl sm:text-2xl">V</div>
              <span className="text-xs sm:text-sm font-medium">Vite</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-8 sm:mb-12 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-3 sm:space-y-4">
            {[
              { q: "Does this drain battery or use a lot of RAM?", a: "No! We've optimized the application using Context Isolation and smart polling mechanisms. It intelligently sleeps background workers when not in view, keeping resource usage extremely minimal." },
              { q: "Is Smart Notch open source?", a: "Yes, it is 100% open source. You can view the code, contribute, or build it yourself directly from our GitHub repository." },
              { q: "Can I connect my own Spotify account?", a: "Absolutely. The media player integrates directly with Spotify to pull live track data and beautifully ambient album art." },
              { q: "Does it work on Windows 10?", a: "While optimized for the aesthetic of Windows 11, Smart Notch runs flawlessly on Windows 10 as well." }
            ].map((faq, i) => (
              <div key={i} className="glass-card p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-gray-400 text-xs sm:text-sm pl-3.5 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
            x: ['-50%', '-48%', '-52%', '-50%'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-y-1/2 w-full h-[300px] bg-blue-500/20 blur-[150px] rounded-full pointer-events-none" 
        />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-8 tracking-tight">Ready to elevate your desktop?</h2>
          <p className="text-base sm:text-xl text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto px-2">Download the free installer today and join thousands of users experiencing the next level of Windows productivity.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-6 sm:mt-8 relative z-10 max-w-xs sm:max-w-none mx-auto">
            <a href="https://apps.microsoft.com/store/detail/9N1D46F5X565?cid=DevShareMCLPCS" target="_blank" rel="noreferrer" className="hover:scale-105 transition-transform active:scale-95 w-full sm:w-auto flex justify-center">
              <img src="https://get.microsoft.com/images/en-us%20dark.svg" alt="Get it from Microsoft" className="h-[48px] sm:h-[60px]" />
            </a>
            <a href="/Smart_Notch_Setup_1.0.4.exe" download className="w-full sm:w-auto bg-white text-black px-7 sm:px-10 py-3.5 sm:py-5 rounded-full font-semibold text-base sm:text-lg hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              <Download className="w-5 h-5 sm:w-6 sm:h-6" />
              Download for Windows
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 sm:py-12 px-4 sm:px-6 bg-[#030712]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500 text-center md:text-left">
          <p>© 2026 Smart Notch for Windows. Built natively with Electron.</p>
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="https://github.com/Avenger11764/Dynamic_island" className="hover:text-white transition-colors">GitHub Repository</a>
            <a href="/Smart_Notch_Setup_1.0.4.exe" download className="hover:text-white transition-colors">Download Installer</a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}

export default App;
