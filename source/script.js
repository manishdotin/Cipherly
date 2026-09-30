
const passwordOutput = document.getElementById("passwordOutput");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const lengthInput = document.getElementById("length");
const lengthValue = document.getElementById("lengthValue");
const includeNumbers = document.getElementById("includeNumbers");
const includeSymbols = document.getElementById("includeSymbols");
const levelCards = document.querySelectorAll(".level-card");
const levelDescription = document.getElementById("levelDescription");
const charCount = document.getElementById("charCount");
const strengthText = document.getElementById("strengthText");
const strengthBars = document.querySelectorAll("#strengthBars span");
const feedback = document.getElementById("feedback");

let currentLevel = "medium";

const characters = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{};:,.?"
};

const levelDescriptions = {
    easy: "Simple & memorable",
    medium: "Balanced & versatile",
    hard: "Maximum character variety"
};

// Generate an unbiased random integer using the Web Crypto API.
function randomInt(max) {
    const range = 0x100000000;
    const limit = Math.floor(range / max) * max;
    const array = new Uint32Array(1);

    do {
        crypto.getRandomValues(array);
    } while (array[0] >= limit);

    return array[0] % max;
}

// Shuffle characters using Fisher-Yates.
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function getCharacterGroups() {
    const groups = [characters.lowercase];

    if (currentLevel !== "easy") {
        groups.push(characters.uppercase);
    }

    if (includeNumbers.checked) {
        groups.push(characters.numbers);
    }

    if (includeSymbols.checked) {
        groups.push(characters.symbols);
    }

    return groups;
}

function generatePassword() {
    const length = Number(lengthInput.value);
    const groups = getCharacterGroups();
    const allCharacters = groups.join("");
    const passwordCharacters = [];

    // Hard mode guarantees one character from every
    // enabled group when the requested length permits it.
    if (currentLevel === "hard" && length >= groups.length) {
        groups.forEach(group => {
            passwordCharacters.push(
                group[randomInt(group.length)]
            );
        });
    }

    // Fill the remaining positions from the combined pool.
    while (passwordCharacters.length < length) {
        passwordCharacters.push(
            allCharacters[randomInt(allCharacters.length)]
        );
    }

    shuffle(passwordCharacters);

    passwordOutput.value = passwordCharacters.join("");
    charCount.textContent =
        `${length} character${length === 1 ? "" : "s"}`;

    updateStrength(length, allCharacters.length);
    feedback.textContent = "";
    copyBtn.innerHTML = copyIcon();
    copyBtn.setAttribute("aria-label", "Copy password");
}

function updateStrength(length, poolSize) {
    // An approximate indicator based on length and character variety.
    // It is not a guarantee of real-world password security.
    let score = 0;

    if (length >= 8) score++;
    if (length >= 12) score++;
    if (poolSize >= 52) score++;
    if (poolSize >= 70) score++;

    const labels = ["Low", "Fair", "Good", "Strong", "Very strong"];

    strengthText.textContent = labels[score];

    strengthBars.forEach((bar, index) => {
        bar.classList.toggle("filled", index < score);
    });
}

function copyIcon() {
    return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="8" y="8" width="12" height="12" rx="2"></rect>
            <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"></path>
        </svg>
    `;
}

function copiedIcon() {
    return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m5 12 4 4L19 6"></path>
        </svg>
    `;
}

async function copyPassword() {
    const password = passwordOutput.value;

    if (!password) return;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(password);
        } else {
            // Fallback for browsers that block clipboard access.
            passwordOutput.select();
            passwordOutput.setSelectionRange(0, password.length);

            const copied = document.execCommand("copy");

            if (!copied) {
                throw new Error("Copy command failed");
            }

            passwordOutput.setSelectionRange(0, 0);
        }

        copyBtn.innerHTML = copiedIcon();
        copyBtn.setAttribute("aria-label", "Password copied");
        feedback.textContent = "Password copied to clipboard.";
    } catch (error) {
        feedback.textContent = "Copy unavailable. Select and copy the password.";
        passwordOutput.focus();
        passwordOutput.select();
    }
}

// Difficulty selection.
levelCards.forEach(card => {
    card.addEventListener("click", () => {
        currentLevel = card.dataset.level;

        levelCards.forEach(item => {
            const selected = item === card;

            item.classList.toggle("active", selected);
            item.setAttribute("aria-pressed", String(selected));
        });

        levelDescription.textContent =
            levelDescriptions[currentLevel];

        generatePassword();
    });

    card.setAttribute(
        "aria-pressed",
        String(card.dataset.level === currentLevel)
    );
});

// Keep the displayed length synchronized with the slider.
lengthInput.addEventListener("input", () => {
    lengthValue.textContent = lengthInput.value;
    generatePassword();
});

// Update the password when options change.
includeNumbers.addEventListener("change", generatePassword);
includeSymbols.addEventListener("change", generatePassword);

generateBtn.addEventListener("click", generatePassword);
copyBtn.addEventListener("click", copyPassword);

// Initial password.
generatePassword();