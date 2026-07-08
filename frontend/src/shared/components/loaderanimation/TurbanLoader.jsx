// import React, { useEffect, useRef } from "react";
// import gsap from "gsap";
// import "./TurbanLoader.css";

// // Path to custom asset
// import turbanIcon from "../../../assets/turban-icon.svg";

// export default function TurbanLoader() {
//   const containerRef = useRef(null);

//   useEffect(() => {
//     const turbans = containerRef.current.querySelectorAll(".turban-particle");
    
//     // Create an overall timeline that loops continuously
//     const tl = gsap.timeline({ repeat: -1 });

//     // 1. Instantly randomize initial layout positioning below the viewport
//     gsap.set(turbans, {
//       y: "120vh",
//       x: () => gsap.utils.random(0, 50) + "vw", // Starts from left half/center
//       scale: () => gsap.utils.random(0.5, 1.4),   // Creates layered depth
//       opacity: 0,
//       rotation: () => gsap.utils.random(-45, 45),
//     });

//     // 2. Animate the staggered upward movement pattern
//     tl.to(turbans, {
//       y: "-20vh", // Rises completely out of frame at the top
//       x: "+=40vw", // Drifts toward the right as it rises to create a wave curve
//       rotation: () => gsap.utils.random(180, 450), // Organic spinning
//       duration: () => gsap.utils.random(2.2, 3.4), // Desynchronized particle speeds
//       ease: "power1.out",
//       stagger: {
//         each: 0.15,       // Interval spacing between each turban's launch
//         from: "random",   // Prevents rigid line-ups
//       },
//       // Inner keyframes to manage fading visibility cleanly
//       keyframes: [
//         { opacity: 1, duration: 0.4, ease: "none", delay: 0 },
//         { opacity: 0, duration: 0.7, ease: "power1.out", delay: 1.4 }
//       ]
//     });

//     // Garbage collection: clear active GSAP timelines on component destruction
//     return () => {
//       tl.kill();
//     };
//   }, []);

//   // Increase or decrease this number depending on how dense you want the wave to look
//   const totalTurbans = 18;

//   return (
//     <div className="turban-loader-overlay" ref={containerRef}>
//       <div className="loader-stage">
//         {/* Render particle stream */}
//         {[...Array(totalTurbans)].map((_, index) => (
//           <div key={index} className="turban-particle">
//             <img src={turbanIcon} alt="Loading..." className="turban-svg" />
//           </div>
//         ))}
        
//         {/* Central UI focal point */}
//         <div className="loading-branding">
//           <h2 className="loading-text">Loading Turban Collection</h2>
//           <div className="loading-bar-subtle"></div>
//         </div>
//       </div>
//     </div>
//   );
// }


// import React, { useEffect, useRef } from "react";
// import gsap from "gsap";
// // We must import the specific plugin for path animation
// import { MotionPathPlugin } from "gsap/MotionPathPlugin";
// import "./TurbanLoader.css";
// import turbanIcon from "../../../assets/turban-icon.svg";

// // We register the plugin once
// gsap.registerPlugin(MotionPathPlugin);

// export default function TurbanFloodLoader({ onComplete }) {
//   const overlayRef = useRef(null);
//   const containerRef = useRef(null);
//   const totalParticles = 25; // Increase for denser flood

//   useEffect(() => {
//     const turbans = containerRef.current.querySelectorAll(".flood-particle");
    
//     // 1. Create a Master Timeline that does NOT repeat
//     // We want this to run once and then notify the main app.
//     const tl = gsap.timeline({
//       onComplete: () => {
//         // Optional callback to notify app when full animation is done
//         if (onComplete) onComplete();
//       }
//     });

//     // 2. Define the exact path (W-top curve shape)
//     // We define this curve relative to the viewport (vw, vh)
//     const curvePath = [
//       { x: "-20vw", y: "50vh" },   // Start: Hidden Left
//       { x: "20vw", y: "80vh" },    // Low Point 1 (W base)
//       { x: "50vw", y: "15vh" },    // Center Peak (W top)
//       { x: "80vw", y: "85vh" },    // Low Point 2 (W base)
//       { x: "120vw", y: "45vh" },   // End: Hidden Right
//     ];

//     // 3. Orchestrate the "Turban Flood" motion
//     tl.to(turbans, {
//       motionPath: {
//         path: curvePath,
//         curviness: 1.5,     // Makes the path very smooth and organic
//         autoRotate: true,   // Keeps the turban oriented to the direction of travel
//       },
//       duration: 3,         // How long each particle takes
//       ease: "power1.inOut",
//       stagger: {
//         each: 0.08,         // The precise delay between particle launches
//         from: "start",
//       },
//       // Inner keyframes for scaling/opacity logic as they travel
//       keyframes: [
//         { opacity: 1, scale: () => gsap.utils.random(1.2, 1.8), duration: 0.3 }, // Scale up in center peak
//         { scale: () => gsap.utils.random(0.5, 0.8), duration: 2.2, delay: 0.5 }, // Scale down towards exit
//         { opacity: 0, duration: 0.3, ease: "power2.in" }                           // Fade out on exit
//       ]
//     }, "+=0.3"); // Starts slightly delayed after mount

//     // 4. Smooth Page Reveal Logic
//     // We start fading the loader backdrop *while* the flood is still happening, 
//     // creating a seamless transition.
//     tl.to(overlayRef.current, {
//       opacity: 0,
//       duration: 1.2,
//       ease: "power2.inOut",
//       // We start this fade when the 70% mark of the total turban staggering timeline is reached
//       pointerEvents: "none", // Makes background clickable during fade
//     }, "-=1.5"); // Offset this animation by 1.5s (meaning it triggers halfway through)

//     // Cleanup animations on destruction
//     return () => {
//       tl.kill();
//     };
//   }, [onComplete]);

//   return (
//     <div className="flood-loader-overlay" ref={overlayRef}>
//       <div className="flood-stage" ref={containerRef}>
//         {/* Render particle flood */}
//         {[...Array(totalParticles)].map((_, index) => (
//           <div key={index} className="flood-particle">
//             <img src={turbanIcon} alt="..." className="turban-svg" />
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import "./TurbanLoader.css";
import turbanIcon from "../../../assets/turban-icon.svg";

export default function TurbanFloodLoader({ onComplete }) {
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const totalParticles = 12; // Fewer particles needed since they stack in the center

  useEffect(() => {
    const turbans = containerRef.current.querySelectorAll(".flood-particle");
    
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });

    // 1. Set initial state: Hidden off-screen to the LEFT, scaled down
    gsap.set(turbans, {
      x: "-60vw",
      y: "0vh", // Centered vertically via flex/CSS
      scale: 0.2,
      opacity: 0,
      rotation: 0
    });

    // 2. The Animation Sequence
    tl.to(turbans, {
      // PHASE 1: Rush from Left to Center
      x: "0vw", 
      scale: () => gsap.utils.random(1.2, 1.8), // Scale up as they hit center
      opacity: 1,
      duration: 1,
      ease: "back.out(1.2)",
      stagger: 0.08,
    })
    .to(turbans, {
      // PHASE 2: Rotate on own axis in the Center
      rotation: "+=360",
      duration: 1.2,
      ease: "power2.inOut",
      stagger: {
        each: 0.05,
        from: "center"
      }
    }, "+=0.1") // Small pause in the center before spinning
    .to(turbans, {
      // PHASE 3: Snap back to the LEFT
      x: "-60vw",
      scale: 0.4,
      opacity: 0,
      duration: 0.8,
      ease: "power3.in",
      stagger: 0.04
    }, "+=0.2"); // Pause slightly after the spin before exiting

    // PHASE 4: Fade out the entire overlay background right as they start exiting
    tl.to(overlayRef.current, {
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut"
    }, "-=0.6"); // Overlaps with the exit phase

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div className="flood-loader-overlay" ref={overlayRef}>
      <div className="flood-stage" ref={containerRef}>
        {[...Array(totalParticles)].map((_, index) => (
          <div key={index} className="flood-particle">
            <img src={turbanIcon} alt="Loading..." className="turban-svg" />
          </div>
        ))}
      </div>
    </div>
  );
}