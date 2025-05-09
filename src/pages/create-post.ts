const Url = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const postForm = document.querySelector("#post-form") as HTMLFormElement;
  const postTitle = document.querySelector("#post-title") as HTMLFormElement;
  const postContent = document.querySelector(
    "#post-content"
  ) as HTMLFormElement;
  const publishButton = document.querySelector(
    "#publish-button"
  ) as HTMLFormElement;
  const saveDraftButton = document.querySelector(
    "#save-draft-button"
  ) as HTMLFormElement;
  const createPostStatus = document.querySelector(
    "#create-post-status"
  ) as HTMLFormElement;

  if (
    !postForm ||
    !postTitle ||
    !postContent ||
    !publishButton ||
    !saveDraftButton
  ) {
    console.error(
      "Error: One or more form elements are missing from the page."
    );
    return;
  }

  postForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitter = event.submitter as HTMLButtonElement;
    const action = submitter?.value;

    if (!action) {
      console.error("Could not determine submit action (draft or publish).");
      return;
    }

    const isPublished = action === "publish";

    const title = postTitle.value.trim();
    const content = postContent.value.trim();

    if (!title || !content) {
      console.log("Post's title or content is empty.");
      return;
    }

    if (title.length < 3 || content.length < 10) {
      console.log(
        "Post's title cannot be less than 3 characters and content cannot be less than 10 charaacters."
      );
      return;
    }

    const formData = new FormData(postForm);
    try {
      const response = await fetch(`${Url}/posts/createPost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          content: content,
          isPublished: isPublished,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Post creation successful:", result);
        createPostStatus.textContent =
          result.message || `Post ${isPublished ? "published" : "saved"}!`;
        createPostStatus.className =
          "mt-4 text-sm h-5 text-gray-600 font-medium";

        setTimeout(() => {
          window.location.href = "./dashboard.html";
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        let errorMessage = `Failed to ${
          isPublished ? "publish" : "save draft"
        }.`;
        createPostStatus.textContent = errorMessage;
        createPostStatus.className =
          "mt-4 text-sm h-5 text-red-500 font-medium";
      }
    } catch (error) {
      console.error("Error during post creation:", error);
    }
  });
});
