import { setupPasswordToggle } from "./login.ts";

const Url = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#registration") as HTMLFormElement;

  if (!form) {
    console.log("Registration form not found!");
    return;
  }

  setupPasswordToggle("password");
  setupPasswordToggle("confirmPassword");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    const setError = (elementId: string, message: string) => {
      const errorElement = document.getElementById(elementId);
      if (errorElement) {
        errorElement.textContent = message;
      }
    };

    const userData = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    let isValid = true;

    if ((userData.password || "").length < 8) {
      setError("password-error", "Password must be at least 8 characters.");
      isValid = false;
    }

    if (userData.password !== userData.confirmPassword) {
      setError("confirm-error", "Passwords don't match!");
      isValid = false;
    }

    if (!isValid) return;

    try {
      const response = await fetch(`${Url}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          password: userData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Error response from server:", errorData);
        if (errorData.message.includes("Email is a duplicate")) {
          setError(
            "email-error",
            "Email already exists. Please use a different email."
          );
        }
        return;
      }

      window.location.href = "./login.html";
    } catch (error) {
      console.error("Error during registration:", error);
      setError("confirm-error", "Registration failed. Please try again.");
    }
  });
});
