import gsap from "gsap";

let intervalId = null;

export function startFloatingHearts() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    const isPetal = Math.random() < 0.45;
    const el = document.createElement("div");
    el.classList.add(isPetal ? "petal" : "heart");
    document.body.appendChild(el);

    const size = isPetal
      ? Math.random() * 16 + 18
      : Math.random() * 20 + 18;
    const leftPos = Math.random() * window.innerWidth;
    const duration = Math.random() * 4 + 5;
    const drift = Math.random() * 120 - 60;
    const rotEnd = Math.random() * 420 - 120;
    const brightness = Math.random() * 0.4 + 0.85;
    const hue = isPetal ? Math.random() * 18 - 8 : 0;

    gsap.set(el, {
      width: size,
      height: size,
      left: leftPos,
      bottom: -50,
      opacity: 0,
      rotation: Math.random() * 60,
      filter: `brightness(${brightness}) hue-rotate(${hue}deg)`,
    });

    gsap.to(el, {
      opacity: 0.85,
      duration: 0.6,
    });

    gsap.to(el, {
      y: -window.innerHeight - 120,
      x: `+=${drift}`,
      rotation: rotEnd,
      duration,
      ease: "sine.inOut",
      opacity: 0,
      delay: 0.6,
      onComplete: () => el.remove(),
    });
  }, 320);
}

export function stopFloatingHearts() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}