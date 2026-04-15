// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", () => {
    // Referencias a los elementos del DOM
    const envelopeWrapper = document.getElementById("envelope-wrapper");
    const flap = document.getElementById("flap");
    const letter = document.getElementById("letter");
    const bgMusic = document.getElementById("bg-music");
    const typewriterElement = document.getElementById("typewriter-text");
    const clickIndicator = document.getElementById("click-indicator");
    
    const textToType = typewriterElement.getAttribute("data-text");
    typewriterElement.textContent = ""; // Limpiar texto inicial
    
    let isOpened = false;
    let typeInterval;
    let typeTimeout;

    /**
     * Cierra el sobre si está abierto.
     */
    function closeEnvelope() {
        if (!isOpened) return;
        isOpened = false;
        envelopeWrapper.classList.remove("open");

        // Mostrar indicador de nuevo gradualmente
        gsap.to(clickIndicator, { opacity: 0.8, duration: 0.5 });

        // Detener y limpiar texto de la máquina de escribir
        clearTimeout(typeTimeout);
        clearInterval(typeInterval);

        // Darle tiempo a la carta para que baje (0.6s) antes de borrar el texto para que no se vea feo
        setTimeout(() => {
            if (!isOpened) typewriterElement.textContent = "";
        }, 600);
    }

    // Event listener para el clic en el sobre principal
    envelopeWrapper.addEventListener("click", (event) => {
        event.stopPropagation();

        if (isOpened) {
            closeEnvelope();
        } else {
            // --- ABRIR EL SOBRE ---
            isOpened = true;
            envelopeWrapper.classList.add("open");

            // Ocultar el indicador de clic
            gsap.to(clickIndicator, { opacity: 0, duration: 0.5 });
            
            // Intentar reproducir la música romántica de fondo
            if (bgMusic.paused) {
                bgMusic.volume = 0.5; 
                bgMusic.play().catch(error => console.log("Audio playback was prevented:", error));
            }

            // Iniciar la creación de corazones flotantes dinámicamente si no está andando
            if (!window.heartsStarted) {
                startFloatingHearts();
                window.heartsStarted = true;
            }

            // Iniciar el texto de máquina de escribir tras la animación de apertura (1300ms)
            clearTimeout(typeTimeout);
            typewriterElement.textContent = "";
            typeTimeout = setTimeout(startTypewriter, 1300);
        }
    });

    document.addEventListener("click", (event) => {
        if (isOpened && !event.target.closest("#envelope-wrapper")) {
            closeEnvelope();
        }
    });

    /**
     * Función que ejecuta el efecto de "Máquina de escribir" letra por letra.
     */
    function startTypewriter() {
        let i = 0;
        clearInterval(typeInterval); // Asegurar que no haya múltiples intervalos
        typeInterval = setInterval(() => {
            if (i < textToType.length) {
                typewriterElement.innerHTML += textToType.charAt(i);
                // Si la carta tiene scroll, bajamos el scroll automáticamente al escribir
                typewriterElement.scrollTop = typewriterElement.scrollHeight;
                i++;
            } else {
                clearInterval(typeInterval); // Detener el intervalo al finalizar
            }
        }, 15); // Disminuido a 15ms porque el texto de la carta es muy largo
    }

    /**
     * Función que crea y anima corazones esparcidos por la pantalla para el toque romántico final.
     */
    function startFloatingHearts() {
        // Crear un corazón nuevo cada 300 milisegundos
        setInterval(() => {
            const heart = document.createElement("div");
            heart.classList.add("heart");
            document.body.appendChild(heart);

            // Valores aleatorios para que sea dinámico
            const size = Math.random() * 20 + 20; // Entre 20px y 40px
            const leftPos = Math.random() * window.innerWidth;
            const duration = Math.random() * 4 + 4; // Entre 4s y 8s animando
            // Modificamos el brillo o rotamos la tonalidad MÍNIMAMENTE para que siga siendo 100% rosa.
            const brightness = Math.random() * 0.5 + 0.8; // Variación entre 0.8x a 1.3x de brillo de rosa

            // Aplicar estilos base
            gsap.set(heart, {
                width: size,
                height: size,
                left: leftPos,
                bottom: -50,
                opacity: 0.8,
                filter: `brightness(${brightness})`
            });

            // Animar el corazón subiendo con leve movimiento lateral y desvaneciendo al final
            gsap.to(heart, {
                y: -window.innerHeight - 100, // Sube más allá de la pantalla
                x: `+=${Math.random() * 100 - 50}`, // Zig Zag aleatorio
                rotation: Math.random() * 360,     // Rotación
                duration: duration,
                ease: "power1.out",
                opacity: 0,
                onComplete: () => {
                    heart.remove(); // Eliminar del DOM cuando no se ve
                }
            });
        }, 300);
    }
});
