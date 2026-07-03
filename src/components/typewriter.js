export function startTypewriter(element, text, speed = 15) {
  return new Promise((resolve) => {
    let i = 0;
    element.textContent = "";
    const interval = setInterval(() => {
      if (i < text.length) {
        element.innerHTML += text.charAt(i);
        element.scrollTop = element.scrollHeight;
        i++;
      } else {
        clearInterval(interval);
        resolve();
      }
    }, speed);
    return () => clearInterval(interval);
  });
}
