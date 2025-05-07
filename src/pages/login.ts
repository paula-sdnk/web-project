const Url = "http://localhost:3000";

export function setupPasswordToggle(inputId: string) {
  const eyeButton = document.getElementById(`${inputId}-eye-button`);
  const closedEye = document.getElementById(`${inputId}-closed-eye`);
  const openedEye = document.getElementById(`${inputId}-opened-eye`);
  const passwordInput = document.getElementById(inputId) as HTMLInputElement;

  if (!eyeButton || !closedEye || !openedEye || !passwordInput) {
    console.error("One or more elements not found for password toggle");
    return;
  }

  eyeButton.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      closedEye.classList.add("hidden");
      openedEye.classList.remove("hidden");
    } else {
      passwordInput.type = "password";
      closedEye.classList.remove("hidden");
      openedEye.classList.add("hidden");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#login") as HTMLFormElement;

  if (!form) {
    console.log("Log in form not found!");
    return;
  }

  setupPasswordToggle("password");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    const setError = (elementId: string, message: string) => {
      const errorElement = document.getElementById(elementId);
      if (errorElement) {
        errorElement.textContent = message;
      }
    };

    const user = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    if (!user) {
      console.log("No user data found!");
    }

    try {
      const response = await fetch(`${Url}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message.includes("Invalid credentials")) {
          setError("email-error", "Cannot find the user with this email.");
        } else if (errorData.message.includes("Incorrect password")) {
          setError("password-error", "Incorrect password. Try again.");
        }
        return;
      }

      window.location.href = "./dashboard.html";
    } catch (error) {
      console.error("Error during login:", error);
    }
  });
});
