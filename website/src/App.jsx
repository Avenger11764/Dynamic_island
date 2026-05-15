import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, MonitorPlay, Activity, Timer, Settings2, ShieldCheck, ChevronRight, ChevronLeft, BatteryCharging, Layers, Sun, Palette, Power } from 'lucide-react';

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
      description: 'A compact notch state featuring live battery rings, network blips, CPU spikes, and hardware metrics at a glance.'
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
      description: 'A premium, snappy spring-physics animation system mimicking native hardware filleting and seamless expansions.'
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
    <div className="min-h-screen bg-[#030712] font-sans selection:bg-blue-500/30 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/10 rounded-none bg-[#030712]/50 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <img src="/favicon.png" alt="Smart Notch Logo" className="w-10 h-10 rounded-xl drop-shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:scale-105 transition-transform" />
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">Smart Notch</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/Avenger11764/Dynamic_island" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              GitHub
            </a>
            <a href="/Dynamic_Island_Setup.exe" download className="bg-white text-black px-5 py-2.5 rounded-full font-medium text-sm hover:bg-gray-100 transition-all active:scale-95 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Ambient background glows */}
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
          className="absolute top-1/2 left-1/2 w-[800px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" 
        />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight leading-tight pb-4 mb-4">
              The notch experience, <br /> reimagined for Windows.
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              A sleek, butter-smooth, and highly functional Smart Notch utility built natively for Windows. Control media, track time, and monitor your system in elegance.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <ms-store-badge
                productid="9N1D46F5X565"
                productname="Smart Notch"
                window-mode="direct"
                theme="dark"
                size="large"
                language="en-us"
                animation="on">
              </ms-store-badge>
              <a href="https://github.com/Avenger11764/Dynamic_island" target="_blank" rel="noreferrer" className="glass px-8 py-4 rounded-full font-semibold text-white text-base hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2 border border-white/10">
                View Source <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </motion.div>

          {/* Hero Image Showcase */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 relative mx-auto max-w-3xl"
          >
            <div className="glass-card p-4 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
              <img 
                src="/assets/media_player_v2.png" 
                alt="Media Player Island" 
                className="w-full rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Infinite Marquee */}
      <section className="py-24 border-t border-white/5 bg-white/[0.02] overflow-hidden flex flex-col relative group">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="text-left mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Premium functionality.</h2>
            <p className="text-gray-400 text-lg max-w-2xl">Everything you need, right at the top of your screen. Continuously advancing capabilities.</p>
          </div>
        </div>

        {/* Carousel Wrapper */}
        <div className="relative w-full flex items-center">
          {/* Navigation Arrows */}
          <button 
            onClick={() => scrollByAmount(-350)}
            className="absolute left-2 md:left-6 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center backdrop-blur-md transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          
          <button 
            onClick={() => scrollByAmount(350)}
            className="absolute right-2 md:right-6 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center backdrop-blur-md transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Gradient fades for edge smoothing */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#030712] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#030712] to-transparent z-10 pointer-events-none" />

          <div 
            className="flex w-full overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-4"
            ref={carouselRef}
          >
            <div className="flex gap-6 px-6 w-max">
            {[...features, ...features].map((feature, i) => (
              <div 
                key={i}
                className="glass-card p-8 rounded-3xl transition-colors border border-white/10 bg-white/[0.03] w-[300px] md:w-[360px] shrink-0"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 hover:scale-110 hover:bg-white/10 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </section>

      {/* Showcase Gallery */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Seamless Modes</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Featuring gravity-based physics: watch the liquid light drop from the top to the bottom as you switch into music mode.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }} 
              className="glass-card p-8 rounded-3xl group bg-white/[0.03] border border-white/10"
            >
              <h4 className="text-gray-300 font-medium mb-6 flex items-center gap-2 text-xl">
                <Activity className="w-6 h-6 text-green-400"/> Network Speed
              </h4>
              <img src="/assets/network_stats_v2.png" alt="Network Stats" className="w-full rounded-2xl border border-white/5 shadow-lg group-hover:shadow-green-500/20 transition-all duration-500" />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -5 }} 
              className="glass-card p-8 rounded-3xl group bg-white/[0.03] border border-white/10"
            >
              <h4 className="text-gray-300 font-medium mb-6 flex items-center gap-2 text-xl">
                <Settings2 className="w-6 h-6 text-blue-400"/> Hardware Monitor
              </h4>
              <img src="/assets/hardware_stats_v2.png" alt="Hardware Stats" className="w-full rounded-2xl border border-white/5 shadow-lg group-hover:shadow-blue-500/20 transition-all duration-500" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -5 }} 
              className="glass-card p-8 rounded-3xl group bg-white/[0.03] border border-white/10"
            >
              <h4 className="text-gray-300 font-medium mb-6 flex items-center gap-2 text-xl">
                <ShieldCheck className="w-6 h-6 text-gray-400"/> Compact Idle
              </h4>
              <img src="/assets/compact_mode_v2.png" alt="Compact Mode" className="w-full rounded-2xl border border-white/5 shadow-lg group-hover:shadow-white/10 transition-all duration-500" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ scale: 1.02, y: -5 }} 
              className="glass-card p-8 rounded-3xl group bg-white/[0.03] border border-white/10"
            >
              <h4 className="text-gray-300 font-medium mb-6 flex items-center gap-2 text-xl">
                <Palette className="w-6 h-6 text-fuchsia-400"/> Settings & Customization
              </h4>
              <img src="/assets/settings_mode_v2.png" alt="Settings Mode" className="w-full rounded-2xl border border-white/5 shadow-lg group-hover:shadow-fuchsia-500/20 transition-all duration-500" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How to Install Section */}
      <section className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
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
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" 
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Up and running in seconds.</h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">We built Smart Notch to be entirely frictionless. No complex setups, no bloatware. Just a single installer that sets everything up automatically.</p>
              
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0 border border-blue-500/30">1</div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Download Installer</h4>
                    <p className="text-gray-400 text-sm">Download the lightweight `Smart_Notch_Setup.exe` directly.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0 border border-blue-500/30">2</div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">Run Setup</h4>
                    <p className="text-gray-400 text-sm">Simply double-click the `.exe` file to seamlessly install the app.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0 border border-blue-500/30">3</div>
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">You're Done!</h4>
                    <p className="text-gray-400 text-sm">The Island will launch automatically and gracefully appear at the top center of your screen.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="glass-card p-2 rounded-3xl border border-white/10 bg-black/40 max-w-md mx-auto md:ml-auto"
              >
                <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-white/5 p-8 text-center flex flex-col items-center justify-center relative group">
                  <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-500">
                    <img src="/favicon.png" alt="Smart Notch App Logo" className="w-28 h-28 rounded-3xl drop-shadow-[0_0_40px_rgba(56,189,248,0.5)]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Smart Notch for Windows</h3>
                  <p className="text-gray-400 mb-8">Latest Version for Windows (64-bit)</p>
                  
                  <div className="flex justify-center mt-4 relative z-10">
                    <ms-store-badge
                      productid="9N1D46F5X565"
                      productname="Smart Notch"
                      window-mode="direct"
                      theme="dark"
                      size="large"
                      language="en-us"
                      animation="on">
                    </ms-store-badge>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-24 px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Powered by Modern Tech</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-16">Built entirely on web technologies, optimized to run natively as a lightweight desktop application.</p>
          
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70">
            <div className="flex flex-col items-center gap-3 grayscale hover:grayscale-0 transition-all hover:scale-110">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Electron_Software_Framework_Logo.svg" alt="Electron" className="w-16 h-16" />
              <span className="text-sm font-medium">Electron</span>
            </div>
            <div className="flex flex-col items-center gap-3 grayscale hover:grayscale-0 transition-all hover:scale-110">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React" className="w-16 h-16" />
              <span className="text-sm font-medium">React</span>
            </div>
            <div className="flex flex-col items-center gap-3 grayscale hover:grayscale-0 transition-all hover:scale-110">
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" alt="Tailwind" className="w-16 h-16" />
              <span className="text-sm font-medium">Tailwind CSS</span>
            </div>
            <div className="flex flex-col items-center gap-3 grayscale hover:grayscale-0 transition-all hover:scale-110">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center font-bold text-black text-2xl">V</div>
              <span className="text-sm font-medium">Vite</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {[
              { q: "Does this drain battery or use a lot of RAM?", a: "No! We've optimized the application using Context Isolation and smart polling mechanisms. It intelligently sleeps background workers when not in view, keeping resource usage extremely minimal." },
              { q: "Is Smart Notch open source?", a: "Yes, it is 100% open source. You can view the code, contribute, or build it yourself directly from our GitHub repository." },
              { q: "Can I connect my own Spotify account?", a: "Absolutely. The media player integrates directly with Spotify to pull live track data and beautifully ambient album art." },
              { q: "Does it work on Windows 10?", a: "While optimized for the aesthetic of Windows 11, Smart Notch runs flawlessly on Windows 10 as well." }
            ].map((faq, i) => (
              <div key={i} className="glass-card p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {faq.q}
                </h4>
                <p className="text-gray-400 text-sm pl-3.5 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
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
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">Ready to elevate your desktop?</h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">Download the free installer today and join thousands of users experiencing the next level of Windows productivity.</p>
          <div className="flex justify-center mt-8">
            <ms-store-badge
              productid="9N1D46F5X565"
              productname="Smart Notch"
              window-mode="direct"
              theme="dark"
              size="large"
              language="en-us"
              animation="on">
            </ms-store-badge>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 bg-[#030712]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-500">
          <p>© 2026 Smart Notch for Windows. Built natively with Electron.</p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/Avenger11764/Dynamic_island" className="hover:text-white transition-colors">GitHub Repository</a>
            <a href="#" className="hover:text-white transition-colors">Download Installer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
