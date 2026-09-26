// Typewriter cancelable
// start() cancela lo que estuviera escribiendo antes de comenzar, así
// que cerrar y reabrir el sobre no deja dos intervalos peleándose por
// el mismo nodo. Cada carácter entra como nodo de texto: sin HTML que
// reinterpretar en cada tick, y sin forma de inyectar marcado.

export function createTypewriter(element) {
  let timer = null;

  function cancel() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function start(text, speed = 15) {
    cancel();
    element.textContent = "";

    return new Promise((resolve) => {
      let i = 0;
      timer = setInterval(() => {
        if (i >= text.length) {
          cancel();
          resolve();
          return;
        }
        element.append(document.createTextNode(text.charAt(i)));
        element.scrollTop = element.scrollHeight;
        i++;
      }, speed);
    });
  }

  return { start, cancel };
}
