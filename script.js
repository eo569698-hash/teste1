const menuToggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");
const header = document.querySelector("[data-header]");
const backToTop = document.querySelector("[data-back-to-top]");
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCaption = document.querySelector("[data-lightbox-caption]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const galleryItems = document.querySelectorAll("[data-lightbox-src]");
const forms = document.querySelectorAll(".js-ajax-form");
const revealItems = document.querySelectorAll(".reveal");

function setMenuState(isOpen) {
    if (!menuToggle || !menu) {
        return;
    }

    menuToggle.classList.toggle("is-open", isOpen);
    menu.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
}

if (menuToggle && menu) {
    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        setMenuState(!isOpen);
    });

    menu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMenuState(false));
    });

    document.addEventListener("click", (event) => {
        if (!menu.contains(event.target) && !menuToggle.contains(event.target)) {
            setMenuState(false);
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 860) {
            setMenuState(false);
        }
    });
}

function handleScrollState() {
    const y = window.scrollY;

    if (header) {
        header.classList.toggle("is-scrolled", y > 12);
    }

    if (backToTop) {
        backToTop.classList.toggle("is-visible", y > 400);
    }
}

window.addEventListener("scroll", handleScrollState, { passive: true });
handleScrollState();

if (backToTop) {
    backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

function openLightbox(src, caption, alt) {
    if (!lightbox || !lightboxImage || !lightboxCaption) {
        return;
    }

    lightboxImage.src = src;
    lightboxImage.alt = alt || caption || "Imagem ampliada da galeria";
    lightboxCaption.textContent = caption || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
}

function closeLightbox() {
    if (!lightbox || !lightboxImage || !lightboxCaption) {
        return;
    }

    lightbox.hidden = true;
    lightboxImage.src = "";
    lightboxCaption.textContent = "";
    document.body.style.overflow = "";
}

galleryItems.forEach((item) => {
    item.addEventListener("click", () => {
        const image = item.querySelector("img");
        openLightbox(
            item.getAttribute("data-lightbox-src"),
            item.getAttribute("data-lightbox-caption"),
            image ? image.alt : ""
        );
    });
});

if (lightbox) {
    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox || event.target === lightboxClose) {
            closeLightbox();
        }
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeLightbox();
        setMenuState(false);
    }
});

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.14 });

    revealItems.forEach((item) => observer.observe(item));
} else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
}

forms.forEach((form) => {
    const submitButton = form.querySelector('button[type="submit"]');
    const buttonText = submitButton ? submitButton.querySelector(".button-text") : null;
    const defaultButtonText = buttonText ? buttonText.textContent : "";
    const messageBox = form.querySelector(".form-message");
    const ajaxEndpoint = form.getAttribute("data-ajax-endpoint");
    const successMessage = form.getAttribute("data-success-message") || "Enviado com sucesso.";
    const activationMessage = form.getAttribute("data-activation-message") || "O primeiro envio pode precisar de ativacao.";
    const errorMessage = form.getAttribute("data-error-message") || "Nao foi possivel enviar agora.";

    function showMessage(type, text) {
        if (!messageBox) {
            return;
        }

        messageBox.textContent = text;
        messageBox.className = `form-message ${type}`;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!ajaxEndpoint) {
            showMessage("is-error", errorMessage);
            return;
        }

        try {
            if (submitButton) {
                submitButton.disabled = true;
            }

            if (buttonText) {
                buttonText.textContent = "Enviando...";
            }

            showMessage("", "");

            const response = await fetch(ajaxEndpoint, {
                method: "POST",
                body: new FormData(form),
                headers: {
                    Accept: "application/json"
                }
            });

            const contentType = response.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
                const data = await response.json();

                if (!data || (data.success !== true && data.success !== "true")) {
                    throw new Error("submit_failed");
                }

                form.reset();
                showMessage("is-success", successMessage);
                return;
            }

            if (response.ok) {
                form.reset();
                showMessage("is-success", activationMessage);
                return;
            }

            throw new Error("submit_failed");
        } catch (error) {
            showMessage("is-error", errorMessage);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }

            if (buttonText) {
                buttonText.textContent = defaultButtonText;
            }
        }
    });
});
